import cv2
import numpy as np
import pytest
from backend.app.vision.pipeline import vision_pipeline
from backend.app.vision.calibration import detect_reference_object
from backend.app.vision.color import estimate_color_stage
from backend.app.vision.defects import estimate_visible_defects

def create_synthetic_scene(
    num_tomatoes: int = 1,
    include_coin: bool = True,
    touching: bool = False,
    is_blurry: bool = False,
    is_dark: bool = False,
    add_defect: bool = False
) -> bytes:
    """
    Generates a synthetic photograph for automated OpenCV computer vision tests.
    """
    h, w = 600, 800
    if is_dark:
        img = np.full((h, w, 3), 20, dtype=np.uint8)  # very dark background
    else:
        img = np.full((h, w, 3), 235, dtype=np.uint8)  # light gray table

    # Draw reference coin if requested (₹10 coin nominal 27mm, radius 40px -> 80px diameter)
    if include_coin:
        coin_cx, coin_cy, coin_r = 150, 450, 40
        # Outer metallic brass ring
        cv2.circle(img, (coin_cx, coin_cy), coin_r, (140, 160, 190), -1)
        # Inner silvery center
        cv2.circle(img, (coin_cx, coin_cy), int(coin_r * 0.65), (200, 205, 210), -1)
        # Border edge
        cv2.circle(img, (coin_cx, coin_cy), coin_r, (90, 110, 130), 2)

    # Draw synthetic tomatoes (Red BGR ~ [30, 35, 215])
    tomato_color = (35, 40, 220)
    
    if num_tomatoes == 1:
        cx, cy, r = 450, 300, 75
        cv2.circle(img, (cx, cy), r, tomato_color, -1)
        if add_defect:
            # Add a dark spot blemish (~10% of fruit area)
            cv2.circle(img, (cx - 20, cy - 20), 24, (15, 20, 30), -1)
    elif num_tomatoes >= 2:
        if touching:
            # Two touching tomatoes with overlapping borders for watershed test
            cv2.circle(img, (380, 300), 70, tomato_color, -1)
            cv2.circle(img, (495, 300), 70, tomato_color, -1)
        else:
            cv2.circle(img, (350, 250), 65, tomato_color, -1)
            cv2.circle(img, (550, 350), 75, tomato_color, -1)

    if is_blurry:
        img = cv2.GaussianBlur(img, (35, 35), 15.0)

    success, encoded = cv2.imencode(".jpg", img)
    return encoded.tobytes()

def test_synthetic_detection_and_calibration():
    # 1 tomato + 1 coin
    img_bytes = create_synthetic_scene(num_tomatoes=1, include_coin=True)
    res = vision_pipeline.process_image(img_bytes, reference_type="coin_10")

    assert res["n_fruit"] >= 1
    assert res["calibration"] is not None
    assert res["pixels_per_mm"] is not None
    assert res["pixels_per_mm"] > 1.0

    fruit = res["fruit_results"][0]
    # Synthetic tomato diameter is ~150px; coin is ~80px (27mm) -> ~50mm diameter
    assert fruit["diameter_mm"] is not None
    assert 35.0 <= fruit["diameter_mm"] <= 70.0
    assert fruit["size_code"] in [1, 2, 3]
    assert fruit["color_stage"] in ["Red", "Mature red"]
    assert fruit["quality_class"] in ["Grade A", "Grade B", "Extra", "Class I"]

def test_missing_reference_object():
    # Tomato without coin
    img_bytes = create_synthetic_scene(num_tomatoes=1, include_coin=False)
    res = vision_pipeline.process_image(img_bytes, reference_type="coin_10")

    assert res["n_fruit"] >= 1
    assert res["calibration"] is None
    assert res["calibration_status"] == "uncalibrated"
    fruit = res["fruit_results"][0]
    assert fruit["diameter_mm"] is None
    assert "not measured" in fruit["size_label"].lower()

def test_no_fruit_detected():
    # Empty background
    img_bytes = create_synthetic_scene(num_tomatoes=0, include_coin=True)
    res = vision_pipeline.process_image(img_bytes, reference_type="coin_10")

    assert res["n_fruit"] == 0
    assert res["lot_report"]["lot_class"] in ["No grade", "Ungraded"]

def test_touching_tomatoes_watershed():
    # 2 touching tomatoes
    img_bytes = create_synthetic_scene(num_tomatoes=2, include_coin=True, touching=True)
    res = vision_pipeline.process_image(img_bytes, reference_type="coin_10")

    # Watershed should separate them into 2 fruits
    assert res["n_fruit"] == 2

def test_defect_detection_on_synthetic_fruit():
    # Tomato with artificial dark necrotic lesion
    img_bytes = create_synthetic_scene(num_tomatoes=1, include_coin=True, add_defect=True)
    res = vision_pipeline.process_image(img_bytes, reference_type="coin_10")

    assert res["n_fruit"] >= 1
    fruit = res["fruit_results"][0]
    assert fruit["defect_area_pct"] > 3.0
    assert fruit["quality_class"] in ["Grade B", "Grade C", "Reject", "Class II", "Below standard"]

def test_blurry_and_dark_warnings():
    # Blurry image
    blurry_bytes = create_synthetic_scene(num_tomatoes=1, include_coin=True, is_blurry=True)
    res_blur = vision_pipeline.process_image(blurry_bytes)
    assert any("sharpness" in w.lower() or "blur" in w.lower() for w in res_blur["pipeline_warnings"])

    # Dark image
    dark_bytes = create_synthetic_scene(num_tomatoes=1, include_coin=True, is_dark=True)
    res_dark = vision_pipeline.process_image(dark_bytes)
    assert any("dark" in w.lower() or "brightness" in w.lower() for w in res_dark["pipeline_warnings"])
