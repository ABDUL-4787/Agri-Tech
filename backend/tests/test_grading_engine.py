import pytest
from backend.app.crops.tomato import tomato_engine

def test_size_code_and_category():
    label, code = tomato_engine.determine_size_category(52.0)
    assert code in [1, 2, 3]
    assert "± 3 mm" in label

    # None diameter
    label_none, code_none = tomato_engine.determine_size_category(None)
    assert code_none is None
    assert "not measured" in label_none.lower()

def test_shape_classification():
    cat, _ = tomato_engine.determine_shape_category(0.95)
    assert cat == "round"

    cat, _ = tomato_engine.determine_shape_category(0.72)
    assert cat == "oblong"

    cat, notes = tomato_engine.determine_shape_category(0.55)
    assert cat == "misshapen"

def test_individual_fruit_quality_classes():
    # Grade A: clean skin, defect < 1%, round
    fruit = tomato_engine.grade_fruit(
        fruit_id=1,
        diameter_mm=55.0,
        axis_ratio=0.92,
        color_stage="Red",
        defect_area_pct=0.4,
        has_cracks=False,
        has_decay=False
    )
    assert fruit["quality_class"] == "Grade A"

    # Grade B: minor defects (under 5%)
    fruit_b = tomato_engine.grade_fruit(
        fruit_id=2,
        diameter_mm=52.0,
        axis_ratio=0.84,
        color_stage="Red",
        defect_area_pct=3.2,
        has_cracks=False,
        has_decay=False
    )
    assert fruit_b["quality_class"] == "Grade B"

    # Grade C: moderate defects (under 10%)
    fruit_c = tomato_engine.grade_fruit(
        fruit_id=3,
        diameter_mm=48.0,
        axis_ratio=0.72,
        color_stage="Turning",
        defect_area_pct=7.5,
        has_cracks=False,
        has_decay=False
    )
    assert fruit_c["quality_class"] == "Grade C"

def test_critical_defect_overrides():
    # Skin crack override -> Reject
    fruit_crack = tomato_engine.grade_fruit(
        fruit_id=4,
        diameter_mm=55.0,
        axis_ratio=0.95,
        color_stage="Red",
        defect_area_pct=0.0,
        has_cracks=True,
        has_decay=False
    )
    assert fruit_crack["quality_class"] == "Reject"

    # Visible decay override -> Reject
    fruit_decay = tomato_engine.grade_fruit(
        fruit_id=5,
        diameter_mm=55.0,
        axis_ratio=0.95,
        color_stage="Red",
        defect_area_pct=0.0,
        has_cracks=False,
        has_decay=True
    )
    assert fruit_decay["quality_class"] == "Reject"

    # High defect percentage override -> Reject
    fruit_defects = tomato_engine.grade_fruit(
        fruit_id=6,
        diameter_mm=55.0,
        axis_ratio=0.95,
        color_stage="Red",
        defect_area_pct=15.0,
        has_cracks=False,
        has_decay=False
    )
    assert fruit_defects["quality_class"] == "Reject"

def test_empty_lot():
    lot = tomato_engine.aggregate_lot([])
    assert lot["lot_class"] == "No grade"
    assert lot["n_fruit"] == 0
    assert lot["indicative_price"] is None
