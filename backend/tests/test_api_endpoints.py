import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import init_db
from backend.tests.test_vision_pipeline import create_synthetic_scene

init_db()
client = TestClient(app)

def test_health_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert "OpenCV" in data["vision_engine"]
    assert "version" in data

def test_crops_and_standards_endpoints():
    resp = client.get("/api/crops")
    assert resp.status_code == 200
    crops = resp.json()
    assert len(crops) >= 1
    assert crops[0]["crop"] == "tomato"

    resp = client.get("/api/standards/tomato")
    assert resp.status_code == 200
    std = resp.json()
    assert "grades" in std or "crop" in std

    # Invalid crop
    resp = client.get("/api/standards/banana")
    assert resp.status_code == 404

def test_prices_endpoint():
    resp = client.get("/api/prices")
    assert resp.status_code == 200
    data = resp.json()
    assert "multipliers" in data or "quality_class_multipliers" in data

def test_full_grade_and_report_lifecycle():
    # 1. POST /api/grade with synthetic image
    img_bytes = create_synthetic_scene(num_tomatoes=1, include_coin=True)
    files = [("images", ("test_tomato.jpg", io.BytesIO(img_bytes), "image/jpeg"))]
    data = {
        "reference_type": "coin_10",
        "mandi_price_per_kg": "28.0"
    }

    grade_resp = client.post("/api/grade", files=files, data=data)
    assert grade_resp.status_code == 200
    result = grade_resp.json()

    report_id = result["id"]
    assert report_id.startswith("AG-")
    assert result["fingerprint_status"] == "Report not changed since saved"
    assert result["n_fruit"] >= 1
    assert result["sha256"] is not None
    assert len(result["sha256"]) == 64
    assert len(result["annotated_image_urls"]) == 1

    # 2. GET /api/reports/{id}
    get_resp = client.get(f"/api/reports/{report_id}")
    assert get_resp.status_code == 200
    report_data = get_resp.json()
    assert report_data["id"] == report_id
    assert report_data["fingerprint_status"] == "Report not changed since saved"

    # 3. GET /api/reports/{id}/image/1
    img_resp = client.get(f"/api/reports/{report_id}/image/1")
    assert img_resp.status_code == 200
    assert img_resp.headers["content-type"] == "image/jpeg"

    # 4. GET /api/reports/{id}/qr
    qr_resp = client.get(f"/api/reports/{report_id}/qr")
    assert qr_resp.status_code == 200
    assert qr_resp.headers["content-type"] == "image/png"

    # 5. POST /api/reports/{id}/ack (Farmer Accept)
    ack_resp = client.post(
        f"/api/reports/{report_id}/ack",
        json={"party": "farmer", "verdict": "accept", "note": "Checked at packing shade"}
    )
    assert ack_resp.status_code == 200
    ack1 = ack_resp.json()
    assert ack1["party"] == "farmer"
    assert ack1["verdict"] == "accept"
    assert ack1["prev_hash"] == report_data["sha256"]

    # 6. Reject duplicate Farmer acknowledgement
    dup_resp = client.post(
        f"/api/reports/{report_id}/ack",
        json={"party": "farmer", "verdict": "dispute", "note": "Duplicate attempt"}
    )
    assert dup_resp.status_code == 409

    # 7. POST /api/reports/{id}/ack (Buyer Accept)
    ack2_resp = client.post(
        f"/api/reports/{report_id}/ack",
        json={"party": "buyer", "verdict": "accept", "note": "Rate agreed per grade"}
    )
    assert ack2_resp.status_code == 200
    ack2 = ack2_resp.json()
    assert ack2["party"] == "buyer"
    assert ack2["prev_hash"] == ack1["ack_hash"]  # chained!

    # 8. Verify report again and verify both acks are chained
    final_resp = client.get(f"/api/reports/{report_id}")
    assert final_resp.status_code == 200
    final_data = final_resp.json()
    assert final_data["fingerprint_status"] == "Report not changed since saved"
    assert len(final_data["acknowledgements"]) == 2

    # 9. List reports
    list_resp = client.get("/api/reports")
    assert list_resp.status_code == 200
    reports_list = list_resp.json()
    assert any(r["id"] == report_id for r in reports_list)
