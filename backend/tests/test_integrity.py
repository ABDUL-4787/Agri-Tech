import pytest
from backend.app.services.integrity import (
    canonicalize_report_data,
    compute_report_hash,
    compute_ack_hash,
    verify_report_integrity,
    verify_ack_chain
)

def test_canonical_json_determinism():
    data1 = {
        "id": "AG-123",
        "crop": "tomato",
        "lot_class": "Class I",
        "n_fruit": 5,
        "standards_version": "1.0.0-provisional",
        "fruit_results": [{"fruit_id": 1}],
        "lot_report": {"lot_class": "Class I"},
        "calibration": {"pixels_per_mm": 5.2},
        "created_at": "2026-10-23T10:00:00Z"
    }

    # Same data with different key order
    data2 = {
        "created_at": "2026-10-23T10:00:00Z",
        "calibration": {"pixels_per_mm": 5.2},
        "lot_report": {"lot_class": "Class I"},
        "fruit_results": [{"fruit_id": 1}],
        "standards_version": "1.0.0-provisional",
        "n_fruit": 5,
        "lot_class": "Class I",
        "crop": "tomato",
        "id": "AG-123"
    }

    c1 = canonicalize_report_data(data1)
    c2 = canonicalize_report_data(data2)
    assert c1 == c2

    h1 = compute_report_hash(c1)
    h2 = compute_report_hash(c2)
    assert h1 == h2
    assert len(h1) == 64

def test_tamper_detection():
    data = {
        "id": "AG-TEST",
        "crop": "tomato",
        "lot_class": "Class I",
        "n_fruit": 10,
        "standards_version": "1.0.0-provisional",
        "fruit_results": [],
        "lot_report": {},
        "calibration": {},
        "created_at": "2026-10-23T12:00:00Z"
    }
    canonical = canonicalize_report_data(data)
    original_hash = compute_report_hash(canonical)

    # Valid check
    assert verify_report_integrity(data, original_hash) is True

    # Tampered check (e.g. unauthorized change of lot_class to Extra)
    tampered_data = dict(data)
    tampered_data["lot_class"] = "Extra"
    assert verify_report_integrity(tampered_data, original_hash) is False

def test_ack_hash_chain():
    report_sha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    report_id = "AG-CHAIN-TEST"

    # Ack 1: Farmer
    farmer_time = "2026-10-23T12:05:00Z"
    farmer_prev = report_sha256
    farmer_hash = compute_ack_hash(
        prev_hash=farmer_prev,
        report_id=report_id,
        party="farmer",
        verdict="accept",
        note="Approved at sorting table",
        created_at_iso=farmer_time
    )

    # Ack 2: Buyer
    buyer_time = "2026-10-23T12:10:00Z"
    buyer_prev = farmer_hash
    buyer_hash = compute_ack_hash(
        prev_hash=buyer_prev,
        report_id=report_id,
        party="buyer",
        verdict="accept",
        note="Agreed on Class I lot rate",
        created_at_iso=buyer_time
    )

    acks = [
        {
            "report_id": report_id,
            "party": "farmer",
            "verdict": "accept",
            "note": "Approved at sorting table",
            "created_at": farmer_time,
            "prev_hash": farmer_prev,
            "ack_hash": farmer_hash
        },
        {
            "report_id": report_id,
            "party": "buyer",
            "verdict": "accept",
            "note": "Agreed on Class I lot rate",
            "created_at": buyer_time,
            "prev_hash": buyer_prev,
            "ack_hash": buyer_hash
        }
    ]

    # Verify chain
    valid, notes = verify_ack_chain(report_sha256, acks)
    assert valid is True

    # Test tampering with buyer note in chain
    corrupted_acks = [dict(a) for a in acks]
    corrupted_acks[1]["note"] = "Tampered unauthorized note"
    valid, notes = verify_ack_chain(report_sha256, corrupted_acks)
    assert valid is False
    assert any("Chain corrupted" in n for n in notes)
