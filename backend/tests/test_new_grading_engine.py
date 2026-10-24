import pytest
from backend.app.crops.tomato import tomato_engine, compute_wilson_interval

def test_wilson_interval_known_values():
    """
    Section I1: Unit test for Wilson interval with specified ground truth:
    - n=10, x=1 -> about 0.018 to 0.404
    - n=30, x=3 -> about 0.035 to 0.256
    - n=100, x=10 -> about 0.055 to 0.174
    """
    p1, low1, high1 = compute_wilson_interval(1, 10, z=1.96)
    assert round(low1, 3) == pytest.approx(0.018, abs=0.002)
    assert round(high1, 3) == pytest.approx(0.404, abs=0.002)

    p2, low2, high2 = compute_wilson_interval(3, 30, z=1.96)
    assert round(low2, 3) == pytest.approx(0.035, abs=0.002)
    assert round(high2, 3) == pytest.approx(0.256, abs=0.002)

    p3, low3, high3 = compute_wilson_interval(10, 100, z=1.96)
    assert round(low3, 3) == pytest.approx(0.055, abs=0.002)
    assert round(high3, 3) == pytest.approx(0.174, abs=0.002)

def test_zero_fruit_blocks_grade_and_price():
    """
    Section B & I: A report with 0 fruits must NEVER show a grade or a price.
    Show 'No grade. No fruit found.'
    """
    res = tomato_engine.aggregate_lot(fruit_results=[])
    assert res["lot_class"] == "No grade"
    assert res["verdict_status"] == "BLOCKING"
    assert res["n_fruit"] == 0
    assert res["indicative_price"] is None
    assert "No fruit found" in res["summary_sentence"]
    assert "F0c" in res["flags"]

def test_fewer_than_20_fruit_blocks_grade():
    """
    Section C & I: Minimum to give any grade is 20 fruits (MIN_FRUITS_HARD).
    Below it, show 'Too few fruit. No grade.'
    """
    dummy_fruits = [
        {"fruit_id": i, "quality_class": "Grade A", "diameter_mm": 55.0, "defect_area_pct": 0.5}
        for i in range(15)
    ]
    res = tomato_engine.aggregate_lot(fruit_results=dummy_fruits)
    assert res["lot_class"] == "No grade"
    assert res["verdict_status"] == "BLOCKING"
    assert "F0c" in res["flags"]

def test_photo_a_b_matching_worse_view():
    """
    Section E1: Match fruit between photo A and B. For each fruit take
    higher defect % and worse of two grades. Flag F8 if counts differ by >1.
    """
    fruits_a = [
        {"fruit_id": 1, "center": (100, 100), "quality_class": "Grade A", "defect_area_pct": 0.5, "diameter_mm": 55.0},
        {"fruit_id": 2, "center": (200, 100), "quality_class": "Grade A", "defect_area_pct": 0.8, "diameter_mm": 58.0}
    ]
    fruits_b = [
        {"fruit_id": 1, "center": (105, 102), "quality_class": "Grade B", "defect_area_pct": 3.5, "diameter_mm": 54.0},
        {"fruit_id": 2, "center": (195, 101), "quality_class": "Reject", "defect_area_pct": 12.0, "diameter_mm": 57.0}
    ]

    matched, flags = tomato_engine.match_two_views(fruits_a, fruits_b)
    assert len(matched) == 2
    assert matched[0]["quality_class"] == "Grade B"
    assert matched[0]["defect_area_pct"] == 3.5
    assert matched[1]["quality_class"] == "Reject"
    assert matched[1]["defect_area_pct"] == 12.0
    assert "F8" not in flags

    # Test count mismatch > 1 triggers F8 (e.g. 3 vs 1 -> diff is 2 > 1)
    fruits_a_3 = fruits_a + [{"fruit_id": 3, "center": (300, 100), "quality_class": "Grade A", "defect_area_pct": 0.0}]
    fruits_b_1 = [{"fruit_id": 1, "center": (100, 100), "quality_class": "Grade A", "defect_area_pct": 0.0}]
    _, flags_mismatch = tomato_engine.match_two_views(fruits_a_3, fruits_b_1)
    assert "F8" in flags_mismatch

def test_parallax_correction():
    """
    Section E11: Size correction factor for parallax (default 0.97).
    """
    raw_size = 50.0
    corrected = tomato_engine.apply_parallax_correction(raw_size)
    assert corrected == pytest.approx(48.5, abs=0.1)

def test_three_outcome_verdicts():
    """
    Section E4 & J: Three-outcome verdict for each grade:
    - GREEN 'Sure'
    - AMBER 'Not sure. Check 20 more fruit.' (when Wilson range crosses limit)
    - RED 'Not this grade'
    """
    # 75 clean fruits -> Upper Wilson bound is 4.87% <= 5.0% -> SURE Grade A
    large_sample = [
        {"fruit_id": i, "quality_class": "Grade A", "diameter_mm": 55.0, "defect_area_pct": 0.0}
        for i in range(75)
    ]
    res_large = tomato_engine.aggregate_lot(large_sample, target_sample_size=75)
    assert res_large["lot_class"] == "Grade A"
    assert res_large["verdict_status"] == "SURE"

    # 40 clean fruits -> Upper Wilson bound is 8.76% <= 10.0% -> SURE Grade B
    sample_40 = [
        {"fruit_id": i, "quality_class": "Grade A", "diameter_mm": 55.0, "defect_area_pct": 0.0}
        for i in range(40)
    ]
    res_40 = tomato_engine.aggregate_lot(sample_40, target_sample_size=40)
    assert res_40["lot_class"] == "Grade B"
    assert res_40["verdict_status"] == "SURE"

    # 30 fruits with 2 bad -> Wilson interval crosses limits -> Not sure yet (AMBER)
    borderline_fruits = [
        {"fruit_id": i, "quality_class": "Grade A" if i < 28 else "Grade B", "diameter_mm": 55.0, "defect_area_pct": 0.0}
        for i in range(30)
    ]
    res_borderline = tomato_engine.aggregate_lot(borderline_fruits, target_sample_size=30)
    assert res_borderline["lot_class"] == "Not sure yet"
    assert res_borderline["verdict_status"] == "AMBER"
