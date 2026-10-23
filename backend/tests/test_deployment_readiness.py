import json
from pathlib import Path
import pytest

ROOT_DIR = Path(__file__).resolve().parent.parent.parent

def test_vercel_json_validity():
    vercel_path = ROOT_DIR / "vercel.json"
    assert vercel_path.is_file()
    with open(vercel_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    assert "rewrites" in config or "routes" in config

def test_vercel_serverless_entry_point():
    # Verify api/index.py imports FastAPI app without throwing
    import api.index as vercel_entry
    assert hasattr(vercel_entry, "app")
    assert vercel_entry.app.title == "AgriGrade"

def test_standards_json():
    standards_path = ROOT_DIR / "backend" / "config" / "tomato_standards.json"
    assert standards_path.is_file()
    with open(standards_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["crop"] == "tomato"
    assert len(data["size_codes"]) == 8
    assert len(data["color_stages"]) == 6
    assert "Extra" in data["quality_classes"]
    assert "indicative_price_multipliers" in data

def test_frontend_files_and_views():
    index_html = ROOT_DIR / "frontend" / "index.html"
    assert index_html.is_file()
    content = index_html.read_text(encoding="utf-8")

    # Check that required panels exist
    expected_views = [
        "view-home",
        "view-new-grade",
        "view-progress",
        "view-report",
        "view-history",
        "view-methodology",
        "view-standards"
    ]
    for view in expected_views:
        assert f'id="{view}"' in content, f"Missing view: {view}"

    # Check coin references
    assert "coin_10" in content
    assert "coin_5" in content
    assert "custom_card" in content

    # Check manifest and service worker
    assert (ROOT_DIR / "frontend" / "manifest.json").is_file()
    assert (ROOT_DIR / "frontend" / "service-worker.js").is_file()

def test_i18n_keys_parity():
    # Parse i18n.js to ensure en, hi, and te are present
    i18n_path = ROOT_DIR / "frontend" / "js" / "i18n.js"
    assert i18n_path.is_file()
    content = i18n_path.read_text(encoding="utf-8")
    assert "en: {" in content
    assert "hi: {" in content
    assert "te: {" in content
