import pytest
from backend.app.crops.tomato import tomato_engine

def test_size_code_boundaries():
    # 32 mm -> Size 1 (30-34 mm)
    code, label, _ = tomato_engine.determine_size_code(32.0, shape="oblong")
    assert code == 1

    # 36 mm -> Size 2 (35-39 mm)
    code, label, _ = tomato_engine.determine_size_code(36.0, shape="round")
    assert code == 2

    # 45 mm -> Size 3 (40-46 mm)
    code, label, _ = tomato_engine.determine_size_code(45.0, shape="round")
    assert code == 3

    # 52 mm -> Size 4 (47-56 mm)
    code, label, _ = tomato_engine.determine_size_code(52.0, shape="round")
    assert code == 4

    # 62 mm -> Size 5 (57-66 mm)
    code, label, _ = tomato_engine.determine_size_code(62.0, shape="round")
    assert code == 5

    # 75 mm -> Size 6 (67-81 mm)
    code, label, _ = tomato_engine.determine_size_code(75.0, shape="round")
    assert code == 6

    # 90 mm -> Size 7 (82-101 mm)
    code, label, _ = tomato_engine.determine_size_code(90.0, shape="round")
    assert code == 7

    # 105 mm -> Size 8 (102 mm+)
    code, label, _ = tomato_engine.determine_size_code(105.0, shape="round")
    assert code == 8

    # Undersized round (< 35 mm)
    code, label, notes = tomato_engine.determine_size_code(33.0, shape="round")
    assert any("below the minimum required" in n for n in notes)

    # Missing diameter
    code, label, notes = tomato_engine.determine_size_code(None, shape="round")
    assert code is None
    assert "not measured" in label

def test_shape_classification():
    cat, _ = tomato_engine.determine_shape_category(0.95)
    assert cat == "round"

    cat, _ = tomato_engine.determine_shape_category(0.72)
    assert cat == "oblong"

    cat, notes = tomato_engine.determine_shape_category(0.55)
    assert cat == "misshapen"
    assert any("under 0.65" in n for n in notes)

def test_individual_fruit_quality_classes():
    # Extra: defect < 1%, axis >= 0.90, meets min size
    fruit = tomato_engine.grade_fruit(
        fruit_id=1,
        diameter_mm=55.0,
        axis_ratio=0.92,
        color_stage="Red",
        defect_area_pct=0.4,
        has_cracks=False,
        has_decay=False
    )
    assert fruit["quality_class"] == "Extra"
    assert any("Qualifies for Extra" in r for r in fruit["reasons"])

    # Class I: defect 2.2% (under 3%), axis 0.84
    fruit = tomato_engine.grade_fruit(
        fruit_id=2,
        diameter_mm=52.0,
        axis_ratio=0.84,
        color_stage="Red",
        defect_area_pct=2.2,
        has_cracks=False,
        has_decay=False
    )
    assert fruit["quality_class"] == "Class I"

    # Class II: defect 6.5% (under 8%), axis 0.72
    fruit = tomato_engine.grade_fruit(
        fruit_id=3,
        diameter_mm=48.0,
        axis_ratio=0.72,
        color_stage="Turning",
        defect_area_pct=6.5,
        has_cracks=False,
        has_decay=False
    )
    assert fruit["quality_class"] == "Class II"

def test_critical_defect_overrides():
    # Crack override: even if 0% defects and round, cracks force Below standard
    fruit = tomato_engine.grade_fruit(
        fruit_id=4,
        diameter_mm=55.0,
        axis_ratio=0.95,
        color_stage="Red",
        defect_area_pct=0.0,
        has_cracks=True,
        has_decay=False
    )
    assert fruit["quality_class"] == "Below standard"
    assert any("Visible skin crack" in r for r in fruit["reasons"])

    # Decay override
    fruit = tomato_engine.grade_fruit(
        fruit_id=5,
        diameter_mm=55.0,
        axis_ratio=0.95,
        color_stage="Red",
        defect_area_pct=0.0,
        has_cracks=False,
        has_decay=True
    )
    assert fruit["quality_class"] == "Below standard"
    assert any("Visible rot" in r for r in fruit["reasons"])

    # Undersized round override (< 35mm)
    fruit = tomato_engine.grade_fruit(
        fruit_id=6,
        diameter_mm=32.0,
        axis_ratio=0.95,
        color_stage="Red",
        defect_area_pct=0.2,
        has_cracks=False,
        has_decay=False
    )
    assert fruit["quality_class"] == "Below standard"
    assert any("below standard minimum threshold" in r for r in fruit["reasons"])

def test_lot_aggregation_and_tolerances():
    # 20 fruit sample: 19 Extra, 1 Class I (5% out-of-grade -> Extra tolerance is <= 5%)
    fruits = [{"quality_class": "Extra"} for _ in range(19)] + [{"quality_class": "Class I"}]
    lot = tomato_engine.aggregate_lot(fruits, supplied_mandi_price=30.0)
    assert lot["lot_class"] == "Extra"
    assert lot["n_fruit"] == 20
    assert lot["indicative_price"]["indicative_price_per_kg"] == 34.50  # 30 * 1.15

    # 20 fruit: 17 Class I, 2 Class II, 1 Below standard (10% out-of-grade Class I tolerance is <= 10%)
    fruits = [{"quality_class": "Class I"} for _ in range(18)] + [{"quality_class": "Class II"}] + [{"quality_class": "Below standard"}]
    lot = tomato_engine.aggregate_lot(fruits, supplied_mandi_price=25.0)
    assert lot["lot_class"] == "Class I"
    assert lot["indicative_price"]["indicative_price_per_kg"] == 25.0  # 25 * 1.00

    # 10 fruit: 4 Below standard (40% > 10% limit) -> Below standard
    fruits = [{"quality_class": "Class I"} for _ in range(6)] + [{"quality_class": "Below standard"} for _ in range(4)]
    lot = tomato_engine.aggregate_lot(fruits, supplied_mandi_price=20.0)
    assert lot["lot_class"] == "Below standard"
    assert lot["indicative_price"]["indicative_price_per_kg"] == 10.0  # 20 * 0.50

def test_empty_lot():
    lot = tomato_engine.aggregate_lot([])
    assert lot["lot_class"] == "Ungraded"
    assert lot["n_fruit"] == 0
