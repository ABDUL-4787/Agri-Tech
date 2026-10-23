import json
import uuid
import datetime
import requests
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response, status
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
    HealthResponse,
    LotReportSchema,
    FruitResultSchema
)

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """Verifies backend API, database connectivity, and vision engine readiness."""
    db_status = "connected"
    try:
        db.execute("SELECT 1")
    except Exception as e:
        # For SQLAlchemy 2.0 select(1) or basic query
        try:
            from sqlalchemy import text
            db.execute(text("SELECT 1"))
        except Exception as e2:
            db_status = f"error: {str(e2)}"

    standards = tomato_engine.get_standards_metadata()

    return HealthResponse(
        status="ok",
        database=db_status,
        vision_engine="OpenCV modular CPU pipeline",
        version=settings.VERSION,
        standards_version=standards.get("standards_version", "1.0.0-provisional")
    )

@router.get("/crops")
def list_crops():
    """Returns list of supported crops and their operational status."""
    return [
        {
            "crop": "tomato",
            "name": "Tomato (Solanum lycopersicum)",
            "status": "active",
            "description": "Standard round and oblong fresh market tomatoes with reference coin sizing and AGMARK/UNECE based grading"
        }
    ]

@router.get("/standards/{crop}")
def get_standards(crop: str):
    """Returns complete configurable grading standards, size codes, and tolerance thresholds for a crop."""
    if crop.lower() != "tomato":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Standards for crop '{crop}' not found. Currently supported crops: tomato."
        )
    return tomato_engine.get_standards_metadata()

@router.post("/grade")
async def grade_tomatoes(
    images: List[UploadFile] = File(..., description="1 to 3 photographs of tomatoes with reference coin"),
    reference_type: str = Form("coin_10", description="'coin_10' (27mm), 'coin_5' (23mm), or 'custom_card'"),
    custom_dimension_mm: Optional[float] = Form(None, description="Diameter or width in mm if using custom reference card"),
    mandi_price_per_kg: Optional[float] = Form(None, description="Optional local mandi price per kg in INR"),
    db: Session = Depends(get_db)
):
    """
    Submits photographs for computer vision inspection, individual grading, and lot aggregation.
    """
    if not images or len(images) == 0:
        raise HTTPException(status_code=400, detail="At least one photograph must be uploaded.")
    if len(images) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 photographs per grading report are allowed.")

    # External grading service fallback if configured
    if settings.GRADING_API_URL:
        try:
            files_payload = []
            for img in images:
                content = await img.read()
                files_payload.append(("images", (img.filename, content, img.content_type)))
                await img.seek(0)
            data_payload = {
                "reference_type": reference_type,
                "custom_dimension_mm": custom_dimension_mm or "",
                "mandi_price_per_kg": mandi_price_per_kg or ""
            }
            resp = requests.post(
                f"{settings.GRADING_API_URL.rstrip('/')}/api/grade",
                files=files_payload,
                data=data_payload,
                timeout=45
            )
            if resp.status_code == 200:
                return resp.json()
            else:
                raise HTTPException(
                    status_code=502,
                    detail=f"External grading service returned error: {resp.status_code} - {resp.text}"
                )
        except requests.RequestException as e:
            # Fall back to local execution or raise clear error
            pass

    # Read and validate images
    all_fruit_results = []
    annotated_image_filenames = []
    aggregated_warnings = []
    calibration_info = None
    cal_status = "uncalibrated"
    fruit_id_counter = 1

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    report_id = f"AG-{now_utc.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    for img_idx, img in enumerate(images, start=1):
        content = await img.read()
        if len(content) > settings.MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"Image {img.filename} exceeds maximum allowed size of {settings.MAX_IMAGE_SIZE_BYTES // (1024*1024)} MB."
            )

        try:
            res = vision_pipeline.process_image(
                image_bytes=content,
                reference_type=reference_type,
                custom_dimension_mm=custom_dimension_mm,
                supplied_mandi_price=mandi_price_per_kg
            )
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=f"Image validation failed: {str(ve)}")

        # Collect calibration
        if res.get("calibration"):
            calibration_info = res["calibration"]
            cal_status = res.get("calibration_status", "high")

        aggregated_warnings.extend(res.get("pipeline_warnings", []))

        # Re-number fruits uniquely across multiple photos
        for fr in res.get("fruit_results", []):
            fr["fruit_id"] = fruit_id_counter
            fruit_id_counter += 1
            all_fruit_results.append(fr)

        # Save annotated image
        annotated_filename = f"{report_id}_annotated_{img_idx}.jpg"
        storage_service.save_image(res["annotated_bytes"], annotated_filename, is_annotated=True)
        annotated_image_filenames.append(annotated_filename)

    # Aggregate lot across all detected fruit
    lot_report = tomato_engine.aggregate_lot(
        fruit_results=all_fruit_results,
        supplied_mandi_price=mandi_price_per_kg
    )

    created_at_dt = datetime.datetime.now(datetime.timezone.utc)
    created_at_iso = created_at_dt.isoformat()
    standards = tomato_engine.get_standards_metadata()

    # Build canonical payload for SHA-256 fingerprinting
    report_dict = {
        "id": report_id,
        "crop": "tomato",
        "lot_class": lot_report["lot_class"],
        "n_fruit": len(all_fruit_results),
        "standards_version": standards.get("standards_version", "1.0.0-provisional"),
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
        standards_version=standards.get("standards_version", "1.0.0-provisional"),
        image_refs=json.dumps(annotated_image_filenames)
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    # Generate QR Code
    qr_data_url = generate_report_qr_data_url(report_id)

    # Annotated image URLs
    annotated_urls = [f"/api/reports/{report_id}/image/{i+1}" for i in range(len(annotated_image_filenames))]

    return {
        "id": report_id,
        "crop": "tomato",
        "created_at": created_at_iso,
        "lot_class": lot_report["lot_class"],
        "n_fruit": len(all_fruit_results),
        "standards_version": standards.get("standards_version", "1.0.0-provisional"),
        "sha256": report_sha256,
        "tamper_status": "VERIFIED_AUTHENTIC",
        "lot_report": lot_report,
        "fruit_results": all_fruit_results,
        "calibration": calibration_info,
        "pipeline_warnings": list(set(aggregated_warnings)),
        "annotated_image_urls": annotated_urls,
        "qr_data_url": qr_data_url,
        "acknowledgements": []
    }

@router.get("/reports/{report_id}")
def get_report(report_id: str, db: Session = Depends(get_db)):
    """
    Retrieves full grading report by ID and verifies SHA-256 integrity and acknowledgement chain.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")

    data = json.loads(report.result_json)

    # Verify SHA-256 Fingerprint
    is_authentic = verify_report_integrity(data, report.sha256)
    tamper_status = "VERIFIED_AUTHENTIC" if is_authentic else "INTEGRITY_MISMATCH"

    # Load Acknowledgements
    acks = []
    for ack in report.acknowledgements:
        acks.append({
            "id": ack.id,
            "report_id": ack.report_id,
            "party": ack.party,
            "verdict": ack.verdict,
            "note": ack.note or "",
            "created_at": ack.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "prev_hash": ack.prev_hash,
            "ack_hash": ack.ack_hash
        })

    # Verify acknowledgement chain
    chain_valid, chain_notes = verify_ack_chain(report.sha256, acks)
    if not chain_valid:
        tamper_status = "ACK_CHAIN_CORRUPTED"

    try:
        image_refs = json.loads(report.image_refs)
    except Exception:
        image_refs = []

    annotated_urls = [f"/api/reports/{report.id}/image/{i+1}" for i in range(len(image_refs))]
    qr_data_url = generate_report_qr_data_url(report.id)

    return {
        "id": report.id,
        "crop": report.crop,
        "created_at": data.get("created_at", report.created_at.isoformat() + "Z"),
        "lot_class": report.lot_class,
        "n_fruit": report.n_fruit,
        "standards_version": report.standards_version,
        "sha256": report.sha256,
        "tamper_status": tamper_status,
        "lot_report": data.get("lot_report", {}),
        "fruit_results": data.get("fruit_results", []),
        "calibration": data.get("calibration"),
        "pipeline_warnings": data.get("lot_report", {}).get("warnings", []),
        "annotated_image_urls": annotated_urls,
        "qr_data_url": qr_data_url,
        "acknowledgements": acks
    }

@router.get("/reports/{report_id}/image/{image_index}")
def get_report_image(report_id: str, image_index: int, db: Session = Depends(get_db)):
    """Serves the annotated JPEG image corresponding to the report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        image_refs = json.loads(report.image_refs)
    except Exception:
        image_refs = []

    if image_index < 1 or image_index > len(image_refs):
        raise HTTPException(status_code=404, detail="Image index out of range")

    filename = image_refs[image_index - 1]
    raw_bytes = storage_service.get_image(filename, is_annotated=True)
    if not raw_bytes:
        raise HTTPException(status_code=404, detail="Image file not found on server")

    return Response(content=raw_bytes, media_type="image/jpeg")

@router.get("/reports/{report_id}/qr")
def get_report_qr(report_id: str):
    """Serves PNG QR code image pointing to stable report view."""
    qr_bytes = generate_report_qr_bytes(report_id)
    return Response(content=qr_bytes, media_type="image/png")

@router.post("/reports/{report_id}/ack", response_model=AcknowledgementResponse)
def submit_acknowledgement(
    report_id: str,
    ack_data: AcknowledgementCreate,
    db: Session = Depends(get_db)
):
    """
    Submits a Farmer or Buyer Accept/Dispute verdict with cryptographic hash chaining.
    Prevents duplicate submissions from the same party.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    party_clean = ack_data.party.lower().strip()
    if party_clean not in ["farmer", "buyer"]:
        raise HTTPException(status_code=400, detail="Party must be 'farmer' or 'buyer'")

    # Check for duplicate submission
    existing = db.query(Acknowledgement).filter(
        Acknowledgement.report_id == report_id,
        Acknowledgement.party == party_clean
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Acknowledgement already recorded for {party_clean}. Duplicate entries are prohibited to preserve audit trail integrity."
        )

    # Determine previous hash in chain
    existing_acks = db.query(Acknowledgement).filter(
        Acknowledgement.report_id == report_id
    ).order_by(Acknowledgement.created_at.asc()).all()

    if not existing_acks:
        prev_hash = report.sha256
    else:
        prev_hash = existing_acks[-1].ack_hash

    created_at_dt = datetime.datetime.now(datetime.timezone.utc)
    created_at_iso = created_at_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    note_clean = (ack_data.note or "").strip()

    ack_hash = compute_ack_hash(
        prev_hash=prev_hash,
        report_id=report_id,
        party=party_clean,
        verdict=ack_data.verdict.lower(),
        note=note_clean,
        created_at_iso=created_at_iso
    )

    db_ack = Acknowledgement(
        report_id=report_id,
        party=party_clean,
        verdict=ack_data.verdict.lower(),
        note=note_clean,
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
        ack_hash=db_ack.ack_hash
    )

@router.get("/reports")
def list_reports(ids: Optional[str] = Query(None, description="Comma-separated report IDs"), db: Session = Depends(get_db)):
    """Lists recent reports or queries specific comma-separated IDs."""
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

@router.get("/prices")
def get_prices():
    """
    Returns reference price integration status and standard multipliers.
    AgriGrade does not fabricate live mandi rates.
    """
    return {
        "status": "reference_benchmark_only",
        "live_api_configured": False,
        "note": "Live APMC mandi pricing requires official Agmarknet / e-NAM gateway credentials. AgriGrade provides quality-based multipliers applied to user-supplied local mandi prices to estimate transparent price differentials.",
        "sample_indicative_range_inr_per_kg": {
            "min": 14.0,
            "modal": 22.0,
            "max": 34.0,
            "currency": "INR",
            "commodity": "Tomato (Hybrid / Local fresh)"
        },
        "quality_class_multipliers": {
            "Extra": 1.15,
            "Class I": 1.00,
            "Class II": 0.80,
            "Below standard": 0.50
        }
    }
