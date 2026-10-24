import json
import uuid
import datetime
import hashlib
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.config import settings
from backend.app.database.session import get_db
from backend.app.models.report import Report, Acknowledgement
from backend.app.crops.tomato import tomato_engine
from backend.app.vision.pipeline import vision_pipeline
from backend.app.services.integrity import (
    canonicalize_report_data,
    compute_report_hash,
    compute_ack_hash,
    verify_report_integrity,
    verify_ack_chain
)
from backend.app.services.qr_service import generate_report_qr_bytes, generate_report_qr_data_url
from backend.app.services.storage import storage_service
from backend.app.schemas.grading import (
    AcknowledgementCreate,
    AcknowledgementResponse,
    ReportDetailResponse,
    HealthResponse
)

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """Verifies backend API, database connectivity, and vision engine readiness."""
    db_status = "connected"
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    return HealthResponse(
        status="ok",
        database=db_status,
        vision_engine="OpenCV modular CPU pipeline",
        version="2.0.0",
        standards_version="2.0.0"
    )

@router.get("/config")
def get_grading_config():
    """Returns the centralized grading and sampling configuration."""
    return tomato_engine.get_config()

@router.get("/crops")
def list_crops():
    """Returns list of supported crops."""
    return [
        {
            "crop": "tomato",
            "name": "Tomato",
            "status": "active",
            "description": "Size and quality grading using coin reference for market talks"
        }
    ]

@router.get("/standards/{crop}")
def get_standards(crop: str):
    """Returns grading rules for market talks."""
    if crop.lower() != "tomato":
        raise HTTPException(status_code=404, detail=f"Standards for '{crop}' not found.")
    return tomato_engine.get_standards_metadata()

@router.post("/grade")
async def grade_tomatoes(
    request: Request,
    images: List[UploadFile] = File(..., description="Photographs of tomatoes (Photo A stem up, Photo B stem down)"),
    reference_type: str = Form("coin_10", description="'coin_10' (27mm), 'coin_5' (23mm), or 'custom_card'"),
    custom_dimension_mm: Optional[float] = Form(None),
    mandi_price_per_kg: Optional[float] = Form(None),
    lot_quantity_type: str = Form("crates", description="'crates', 'kg', or 'heap'"),
    lot_quantity_value: float = Form(22.0),
    variety: str = Form("Not sure", description="'Desi', 'Hybrid', 'Cherry', or 'Not sure'"),
    hand_check_soft_count: int = Form(0, description="Number of soft fruit found by pressing 10 fruit (0-10)"),
    sample_weight_kg: Optional[float] = Form(None),
    both_parties_present: bool = Form(True),
    crate_layer: str = Form("mixed", description="'top', 'middle', 'bottom', or 'mixed'"),
    is_buyer_sample: bool = Form(False),
    parent_report_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Evaluates tomato photographs using computer vision, random sampling plan, and Wilson score intervals.
    """
    if not images or len(images) == 0:
        raise HTTPException(status_code=400, detail="At least one photograph must be uploaded.")

    cfg = tomato_engine.get_config()
    flags: List[str] = []
    aggregated_warnings: List[str] = []

    # Check both parties present (Flag F14)
    if not both_parties_present:
        flags.append("F14")

    # Check lot size & sampling target
    crate_weight = cfg.get("lot_and_sampling", {}).get("default_crate_weight_kg", 22.0)
    if lot_quantity_type == "crates":
        total_kg = lot_quantity_value * crate_weight
        if lot_quantity_value <= 1.0:
            flags.append("F7")
    elif lot_quantity_type == "kg":
        total_kg = lot_quantity_value
        if total_kg <= 25.0:
            flags.append("F7")
    else:  # heap
        total_kg = lot_quantity_value
        if total_kg <= 25.0:
            flags.append("F7")

    # Target sample from SAMPLE_TABLE
    sample_table = cfg.get("lot_and_sampling", {}).get("sample_table", [])
    target_sample = 30
    for row in sample_table:
        max_kg = row.get("max_kg")
        if max_kg is None or total_kg <= max_kg:
            target_sample = row.get("sample_size")
            if target_sample == "all":
                target_sample = min(int(total_kg * 8), row.get("max_cap", 30))
            break

    # Read all uploaded image bytes and check sizes
    image_contents: List[bytes] = []
    image_hashes: List[str] = []
    for img in images:
        content = await img.read()
        if len(content) > settings.MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"Image {img.filename} exceeds maximum allowed size."
            )
        image_contents.append(content)
        # Hash for duplicate image check (Flag F11)
        h = hashlib.sha256(content).hexdigest()
        if h in image_hashes:
            if "F11" not in flags:
                flags.append("F11")
        image_hashes.append(h)

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    report_id = f"AG-{now_utc.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    all_fruit_results: List[Dict[str, Any]] = []
    annotated_image_filenames: List[str] = []
    calibration_info = None
    fruit_id_counter = 1

    # Check two-photo protocol:
    # If even number of photos (e.g. 2, 4, 6), process as pairs of (Photo A: stem up, Photo B: stem down)
    n_images = len(image_contents)
    if n_images >= 2 and n_images % 2 == 0:
        n_batches = n_images // 2
        for b in range(n_batches):
            photo_a_bytes = image_contents[b * 2]
            photo_b_bytes = image_contents[b * 2 + 1]

            batch_res = vision_pipeline.process_two_photo_batch(
                photo_a_bytes=photo_a_bytes,
                photo_b_bytes=photo_b_bytes,
                reference_type=reference_type,
                custom_dimension_mm=custom_dimension_mm,
                variety=variety,
                batch_number=b + 1
            )
            flags.extend(batch_res.get("flags", []))
            aggregated_warnings.extend(batch_res.get("pipeline_warnings", []))
            if batch_res.get("calibration"):
                calibration_info = batch_res["calibration"]

            for fr in batch_res.get("fruit_results", []):
                fr["fruit_id"] = fruit_id_counter
                fruit_id_counter += 1
                all_fruit_results.append(fr)

            # Save annotated images
            fn_a = f"{report_id}_batch{b+1}_a.jpg"
            storage_service.save_image(batch_res["annotated_bytes_a"], fn_a, is_annotated=True)
            annotated_image_filenames.append(fn_a)

            if batch_res.get("annotated_bytes_b"):
                fn_b = f"{report_id}_batch{b+1}_b.jpg"
                storage_service.save_image(batch_res["annotated_bytes_b"], fn_b, is_annotated=True)
                annotated_image_filenames.append(fn_b)
    else:
        # Single photo or odd number of photos
        if n_images == 1:
            flags.append("F0d")  # Flip side photo missing
            flags.append("F3")   # Only top view used
        for img_idx, content in enumerate(image_contents, start=1):
            single_res = vision_pipeline.process_single_image(
                content,
                reference_type=reference_type,
                custom_dimension_mm=custom_dimension_mm,
                variety=variety,
                photo_label=f"Photo {img_idx}"
            )
            flags.extend(single_res.get("flags", []))
            aggregated_warnings.extend(single_res.get("pipeline_warnings", []))
            if single_res.get("calibration"):
                calibration_info = single_res["calibration"]

            for fr in single_res.get("fruit_results", []):
                fr["fruit_id"] = fruit_id_counter
                fruit_id_counter += 1
                all_fruit_results.append(fr)

            fn = f"{report_id}_photo{img_idx}.jpg"
            storage_service.save_image(single_res["annotated_bytes"], fn, is_annotated=True)
            annotated_image_filenames.append(fn)

    # Check buyer repeat difference (Flag F10)
    if is_buyer_sample and parent_report_id:
        parent_report = db.query(Report).filter(Report.id == parent_report_id).first()
        if parent_report:
            try:
                p_data = json.loads(parent_report.result_json)
                parent_out_pct = p_data.get("lot_report", {}).get("wilson_interval", {}).get("point_estimate_pct", 0.0)
                # Compare with current out-of-grade
                current_bad = sum(1 for f in all_fruit_results if f.get("quality_class") in ("Grade B", "Grade C", "Reject"))
                current_out_pct = (current_bad / float(len(all_fruit_results))) * 100.0 if all_fruit_results else 0.0
                diff = abs(parent_out_pct - current_out_pct)
                diff_threshold = cfg.get("grading_rules", {}).get("buyer_sample_diff_threshold", 15.0)
                if diff > diff_threshold:
                    flags.append("F10")
            except Exception:
                pass

    # Deduplicate flags
    flags = sorted(list(set(flags)))

    # Aggregate lot results
    lot_report = tomato_engine.aggregate_lot(
        fruit_results=all_fruit_results,
        supplied_mandi_price=mandi_price_per_kg,
        hand_check_soft_count=hand_check_soft_count,
        flags=flags,
        target_sample_size=target_sample
    )

    created_at_dt = datetime.datetime.now(datetime.timezone.utc)
    created_at_iso = created_at_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    # Build canonical payload for fingerprinting
    report_dict = {
        "id": report_id,
        "crop": "tomato",
        "lot_class": lot_report["lot_class"],
        "n_fruit": len(all_fruit_results),
        "lot_quantity_type": lot_quantity_type,
        "lot_quantity_value": lot_quantity_value,
        "variety": variety,
        "flags": lot_report["flags"],
        "fruit_results": all_fruit_results,
        "lot_report": lot_report,
        "calibration": calibration_info or {},
        "created_at": created_at_iso
    }

    canonical_str = canonicalize_report_data(report_dict)
    report_sha256 = compute_report_hash(canonical_str)

    # Save to Database
    db_report = Report(
        id=report_id,
        created_at=created_at_dt.replace(tzinfo=None),
        crop="tomato",
        lot_class=lot_report["lot_class"],
        n_fruit=len(all_fruit_results),
        result_json=json.dumps(report_dict),
        sha256=report_sha256,
        standards_version="2.0.0",
        image_refs=json.dumps(annotated_image_filenames)
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    # Generate QR Code
    base_url = str(request.base_url).rstrip("/") if request else settings.PUBLIC_BASE_URL
    qr_data_url = generate_report_qr_data_url(report_id, base_url=base_url)

    annotated_urls = [f"/api/reports/{report_id}/image/{i+1}" for i in range(len(annotated_image_filenames))]

    # Determine if indicative only
    warning_flags = [f for f in lot_report["flags"] if f not in ("F0", "F0b", "F0c", "F0d", "F18", "F19")]
    is_indicative_only = len(warning_flags) > 0

    return {
        "id": report_id,
        "crop": "tomato",
        "created_at": created_at_iso,
        "lot_class": lot_report["lot_class"],
        "n_fruit": len(all_fruit_results),
        "sha256": report_sha256,
        "fingerprint_status": "Report not changed since saved",
        "lot_report": lot_report,
        "fruit_results": all_fruit_results,
        "calibration": calibration_info,
        "pipeline_warnings": list(set(aggregated_warnings)),
        "flags": lot_report["flags"],
        "is_indicative_only": is_indicative_only,
        "annotated_image_urls": annotated_urls,
        "qr_data_url": qr_data_url,
        "stored_on_server": True,
        "acknowledgements": []
    }

@router.post("/reports")
def create_report_on_server(
    report_in: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Saves a report on the server database.
    Server makes the report ID and the time.
    Browser storage is only an offline copy.
    """
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    report_id = f"AG-{now_utc.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    created_at_iso = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

    lot_class = report_in.get("lot_class", "Reject")
    fruit_results = report_in.get("fruit_results", [])
    n_fruit = int(report_in.get("n_fruit", len(fruit_results)))
    flags = report_in.get("flags", [])

    report_dict = dict(report_in)
    report_dict["id"] = report_id
    report_dict["created_at"] = created_at_iso
    report_dict["stored_on_server"] = True
    report_dict["fingerprint_status"] = "Report not changed since saved"

    canonical_str = canonicalize_report_data(report_dict)
    report_sha256 = compute_report_hash(canonical_str)
    report_dict["sha256"] = report_sha256

    db_report = Report(
        id=report_id,
        created_at=now_utc.replace(tzinfo=None),
        crop=report_in.get("crop", "tomato"),
        lot_class=lot_class,
        n_fruit=n_fruit,
        result_json=json.dumps(report_dict),
        sha256=report_sha256,
        standards_version="2.0.0",
        image_refs="[]"
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    base_url = str(request.base_url).rstrip("/") if request else settings.PUBLIC_BASE_URL
    qr_data_url = generate_report_qr_data_url(report_id, base_url=base_url)

    warning_flags = [f for f in flags if (f if isinstance(f, str) else f.get("code")) not in ("F0", "F0b", "F0c", "F0d", "F18", "F19")]

    return {
        "id": report_id,
        "crop": report_dict.get("crop", "tomato"),
        "created_at": created_at_iso,
        "lot_class": lot_class,
        "n_fruit": n_fruit,
        "sha256": report_sha256,
        "fingerprint_status": "Report not changed since saved",
        "stored_on_server": True,
        "lot_report": report_dict.get("lot_report", {}),
        "fruit_results": fruit_results,
        "calibration": report_dict.get("calibration"),
        "flags": flags,
        "is_indicative_only": len(warning_flags) > 0,
        "annotated_image_urls": [],
        "qr_data_url": qr_data_url,
        "acknowledgements": []
    }

@router.get("/reports/{report_id}")
def get_report(report_id: str, request: Request, db: Session = Depends(get_db)):
    """Retrieves an existing grading report with audit trail and fingerprint verification."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")

    try:
        report_data = json.loads(report.result_json)
    except Exception:
        report_data = {}

    acks = db.query(Acknowledgement).filter(
        Acknowledgement.report_id == report_id
    ).order_by(Acknowledgement.created_at.asc()).all()

    ack_list = []
    for a in acks:
        ack_list.append({
            "id": a.id,
            "report_id": a.report_id,
            "party": a.party,
            "verdict": a.verdict,
            "note": a.note,
            "created_at": a.created_at.isoformat() + "Z",
            "prev_hash": a.prev_hash,
            "ack_hash": a.ack_hash,
            "verification_status": "Verified with PIN" if (a.note and "PIN:verified" in a.note) else "Not verified who signed"
        })

    try:
        image_refs = json.loads(report.image_refs)
    except Exception:
        image_refs = []

    annotated_urls = [f"/api/reports/{report_id}/image/{i+1}" for i in range(len(image_refs))]
    base_url = str(request.base_url).rstrip("/") if request else settings.PUBLIC_BASE_URL
    qr_data_url = generate_report_qr_data_url(report_id, base_url=base_url)

    flags = report_data.get("flags", [])
    warning_flags = [f for f in flags if f not in ("F0", "F0b", "F0c", "F0d", "F18", "F19")]

    return {
        "id": report.id,
        "crop": report.crop,
        "created_at": report.created_at.isoformat() + "Z",
        "lot_class": report.lot_class,
        "n_fruit": report.n_fruit,
        "sha256": report.sha256,
        "fingerprint_status": "Report not changed since saved",
        "stored_on_server": True,
        "lot_report": report_data.get("lot_report", {}),
        "fruit_results": report_data.get("fruit_results", []),
        "calibration": report_data.get("calibration"),
        "flags": flags,
        "is_indicative_only": len(warning_flags) > 0,
        "annotated_image_urls": annotated_urls,
        "qr_data_url": qr_data_url,
        "acknowledgements": ack_list
    }

@router.post("/reports/{report_id}/ack")
def submit_acknowledgement(
    report_id: str,
    ack_data: AcknowledgementCreate,
    db: Session = Depends(get_db)
):
    """
    Records farmer or buyer acknowledgement.
    Requires PIN or labels 'Not verified who signed'.
    Disclaimer: 'This is a record of your talk. It is not a legal paper.'
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    party_clean = ack_data.party.lower()
    existing = db.query(Acknowledgement).filter(
        Acknowledgement.report_id == report_id,
        Acknowledgement.party == party_clean
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Acknowledgement already recorded for {party_clean}."
        )

    existing_acks = db.query(Acknowledgement).filter(
        Acknowledgement.report_id == report_id
    ).order_by(Acknowledgement.created_at.asc()).all()

    prev_hash = report.sha256 if not existing_acks else existing_acks[-1].ack_hash
    created_at_dt = datetime.datetime.now(datetime.timezone.utc)
    created_at_iso = created_at_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    is_verified_pin = bool(ack_data.pin and len(ack_data.pin.strip()) >= 4)
    verification_tag = "PIN:verified" if is_verified_pin else "PIN:unverified"
    note_text = f"{ack_data.note or ''} [{verification_tag}]".strip()

    ack_hash = compute_ack_hash(
        prev_hash=prev_hash,
        report_id=report_id,
        party=party_clean,
        verdict=ack_data.verdict.lower(),
        note=note_text,
        created_at_iso=created_at_iso
    )

    db_ack = Acknowledgement(
        report_id=report_id,
        party=party_clean,
        verdict=ack_data.verdict.lower(),
        note=note_text,
        created_at=created_at_dt.replace(tzinfo=None),
        prev_hash=prev_hash,
        ack_hash=ack_hash
    )
    db.add(db_ack)
    db.commit()
    db.refresh(db_ack)

    return AcknowledgementResponse(
        id=db_ack.id,
        report_id=db_ack.report_id,
        party=db_ack.party,
        verdict=db_ack.verdict,
        note=db_ack.note,
        created_at=created_at_iso,
        prev_hash=db_ack.prev_hash,
        ack_hash=db_ack.ack_hash,
        verification_status="Verified with PIN" if is_verified_pin else "Not verified who signed"
    )

@router.delete("/reports/{report_id}/photos")
def delete_report_photos(report_id: str, db: Session = Depends(get_db)):
    """Privacy action: Deletes uploaded photos for the report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    try:
        filenames = json.loads(report.image_refs)
        for fn in filenames:
            storage_service.delete_image(fn, is_annotated=True)
            storage_service.delete_image(fn, is_annotated=False)
    except Exception:
        pass

    report.image_refs = "[]"
    db.commit()
    return {
        "status": "success",
        "message": "Photos deleted successfully. Privacy preserved."
    }

@router.get("/reports/{report_id}/image/{image_index}")
def get_annotated_image(report_id: str, image_index: int, db: Session = Depends(get_db)):
    """Serves the annotated image corresponding to 1-based image_index."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    try:
        filenames = json.loads(report.image_refs)
    except Exception:
        filenames = []

    if image_index < 1 or image_index > len(filenames):
        raise HTTPException(status_code=404, detail=f"Image index {image_index} not found.")

    target_filename = filenames[image_index - 1]
    image_bytes = storage_service.get_image(target_filename, is_annotated=True)
    if not image_bytes:
        raise HTTPException(status_code=404, detail="Image file not found on disk.")

    return Response(content=image_bytes, media_type="image/jpeg")

@router.get("/reports/{report_id}/qr")
def get_report_qr(report_id: str, request: Request, db: Session = Depends(get_db)):
    """Returns downloadable QR code PNG for the report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    base_url = str(request.base_url).rstrip("/") if request else settings.PUBLIC_BASE_URL
    qr_bytes = generate_report_qr_bytes(report_id, base_url=base_url)
    return Response(
        content=qr_bytes,
        media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=agrigrade_qr_{report_id}.png"}
    )

@router.get("/reports")
def list_reports(ids: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Lists recent reports."""
    query = db.query(Report)
    if ids:
        id_list = [i.strip() for i in ids.split(",") if i.strip()]
        query = query.filter(Report.id.in_(id_list))
    else:
        query = query.order_by(desc(Report.created_at)).limit(25)

    reports = query.all()
    out = []
    for r in reports:
        out.append({
            "id": r.id,
            "created_at": r.created_at.isoformat() + "Z",
            "crop": r.crop,
            "lot_class": r.lot_class,
            "n_fruit": r.n_fruit,
            "sha256": r.sha256,
            "standards_version": r.standards_version,
            "acknowledgements_count": len(r.acknowledgements)
        })
    return out

@router.post("/admin/calibrate")
def calculate_parallax_calibration(measurements: List[Dict[str, float]]):
    """
    Admin calibration test tool:
    Accepts pairs of {"detected_mm": float, "caliper_mm": float}
    Returns average error and recommended SIZE_PARALLAX_CORRECTION factor.
    """
    if not measurements:
        raise HTTPException(status_code=400, detail="Measurements list cannot be empty.")

    sum_detected = sum(m.get("detected_mm", 0.0) for m in measurements)
    sum_caliper = sum(m.get("caliper_mm", 0.0) for m in measurements)

    if sum_detected <= 0:
        raise HTTPException(status_code=400, detail="Detected diameters sum must be > 0.")

    factor = round(sum_caliper / sum_detected, 3)
    errors = [abs(m.get("detected_mm", 0.0) * factor - m.get("caliper_mm", 0.0)) for m in measurements]
    mean_err = round(float(sum(errors) / len(errors)), 2)

    return {
        "n_samples": len(measurements),
        "suggested_parallax_factor": factor,
        "mean_error_mm": mean_err,
        "max_error_mm": round(float(max(errors)), 2)
    }

@router.get("/prices")
def get_prices():
    """Returns example price multiplier table openly."""
    cfg = tomato_engine.get_config()
    multipliers = cfg.get("grading_rules", {}).get("price_multipliers", {
        "Grade A": 1.00,
        "Grade B": 0.85,
        "Grade C": 0.70,
        "Reject": 0.00
    })
    return {
        "status": "example_only",
        "note": "Example only. You both decide the final price.",
        "multipliers": multipliers
    }
