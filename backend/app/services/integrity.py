import json
import hashlib
from typing import Dict, Any, List, Tuple

def canonicalize_report_data(data: Dict[str, Any]) -> str:
    """
    Produces deterministic canonical JSON string for SHA-256 hashing.
    Keys are sorted, whitespace eliminated, and non-canonical volatile attributes excluded.
    """
    # Create clean copy without any runtime ephemeral attributes
    clean_dict = {
        "id": data.get("id"),
        "crop": data.get("crop", "tomato"),
        "lot_class": data.get("lot_class"),
        "n_fruit": data.get("n_fruit"),
        "standards_version": data.get("standards_version"),
        "fruit_results": data.get("fruit_results", []),
        "lot_report": data.get("lot_report", {}),
        "calibration": data.get("calibration", {}),
        "created_at": data.get("created_at")
    }
    return json.dumps(clean_dict, sort_keys=True, separators=(',', ':'), ensure_ascii=True)

def compute_report_hash(canonical_str: str) -> str:
    """Computes SHA-256 hex digest of canonical report JSON."""
    return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

def compute_ack_hash(
    prev_hash: str,
    report_id: str,
    party: str,
    verdict: str,
    note: str,
    created_at_iso: str
) -> str:
    """
    Computes cryptographic hash chaining acknowledgement event.
    Formula: SHA256(prev_hash | report_id | party | verdict | note | created_at)
    """
    payload = f"{prev_hash}|{report_id}|{party.lower()}|{verdict.lower()}|{note.strip()}|{created_at_iso}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def verify_report_integrity(report_dict: Dict[str, Any], stored_sha256: str) -> bool:
    """
    Verifies that the retrieved report matches its original SHA-256 fingerprint.
    """
    canonical = canonicalize_report_data(report_dict)
    recalculated = compute_report_hash(canonical)
    return recalculated == stored_sha256

def verify_ack_chain(report_sha256: str, acks: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """
    Verifies the entire append-only acknowledgement cryptographic chain.
    """
    if not acks:
        return True, ["No acknowledgements recorded yet"]

    notes = []
    current_expected_prev = report_sha256

    for idx, ack in enumerate(acks):
        if ack["prev_hash"] != current_expected_prev:
            notes.append(f"Chain broken at ack #{idx+1} ({ack['party']}): prev_hash mismatch")
            return False, notes

        recalc = compute_ack_hash(
            prev_hash=ack["prev_hash"],
            report_id=ack["report_id"],
            party=ack["party"],
            verdict=ack["verdict"],
            note=ack.get("note", ""),
            created_at_iso=ack["created_at"]
        )

        if recalc != ack["ack_hash"]:
            notes.append(f"Chain corrupted at ack #{idx+1} ({ack['party']}): ack_hash mismatch")
            return False, notes

        current_expected_prev = ack["ack_hash"]

    notes.append(f"Cryptographic chain verified across {len(acks)} acknowledgement event(s)")
    return True, notes
