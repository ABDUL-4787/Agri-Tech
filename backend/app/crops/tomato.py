import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from backend.app.config import settings

class TomatoGradingEngine:
    def __init__(self, config_path: Optional[Path] = None):
        self.config_path = config_path or settings.TOMATO_STANDARDS_PATH
        self.standards = self._load_standards()

    def _load_standards(self) -> Dict[str, Any]:
        with open(self.config_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_standards_metadata(self) -> Dict[str, Any]:
        return self.standards

    def determine_size_code(self, diameter_mm: Optional[float], shape: str = "round") -> Tuple[Optional[int], Optional[str], List[str]]:
        """
        Determines size code and notes whether fruit meets minimum size requirements.
        """
        notes = []
        if diameter_mm is None or diameter_mm <= 0:
            return None, "Size not measured (uncalibrated)", ["Size could not be calibrated from reference object"]

        min_allowed = self.standards["minimum_size_mm"].get(shape, 35.0)
        is_undersized = diameter_mm < min_allowed

        matched_code = None
        matched_label = None

        for sc in self.standards["size_codes"]:
            if sc["min_diameter_mm"] <= diameter_mm <= sc["max_diameter_mm"]:
                matched_code = sc["code"]
                matched_label = sc["label"]
                break

        if matched_code is None:
            if diameter_mm < 30.0:
                matched_code = 0
                matched_label = "Undersized (<30 mm)"
            else:
                matched_code = 8
                matched_label = "Size 8 (102 mm and above)"

        if is_undersized:
            notes.append(f"Diameter ({diameter_mm:.1f} mm) is below the minimum required ({min_allowed:.1f} mm) for {shape} tomatoes")
        else:
            notes.append(f"Diameter ({diameter_mm:.1f} mm) meets required minimum ({min_allowed:.1f} mm) for {shape} tomatoes")

        return matched_code, matched_label, notes

    def determine_shape_category(self, axis_ratio: float) -> Tuple[str, List[str]]:
        """
        Calculates shape classification: Round, Oval/Oblong, or Misshapen.
        """
        thresholds = self.standards["shape_thresholds"]
        notes = []
        if axis_ratio >= thresholds["uniform_round_axis_ratio"]:
            cat = "round"
            notes.append(f"Axis ratio {axis_ratio:.2f} indicates highly uniform circular shape")
        elif axis_ratio >= thresholds["round_min_axis_ratio"]:
            cat = "round"
            notes.append(f"Axis ratio {axis_ratio:.2f} indicates standard round shape")
        elif axis_ratio >= thresholds["misshapen_max_axis_ratio"]:
            cat = "oblong"
            notes.append(f"Axis ratio {axis_ratio:.2f} indicates oblong/elongated shape")
        else:
            cat = "misshapen"
            notes.append(f"Axis ratio {axis_ratio:.2f} is under 0.65, indicating significant shape irregularity or distortion")
        return cat, notes

    def grade_fruit(
        self,
        fruit_id: int,
        diameter_mm: Optional[float],
        axis_ratio: float,
        color_stage: str,
        defect_area_pct: float,
        has_cracks: bool = False,
        has_decay: bool = False,
        confidence: str = "high"
    ) -> Dict[str, Any]:
        """
        Evaluates an individual tomato deterministically against configured rules.
        """
        reasons: List[str] = []
        warnings: List[str] = []

        shape_cat, shape_notes = self.determine_shape_category(axis_ratio)
        reasons.extend(shape_notes)

        size_code, size_label, size_notes = self.determine_size_code(diameter_mm, shape=shape_cat)
        reasons.extend(size_notes)

        min_allowed = self.standards["minimum_size_mm"].get(shape_cat, 35.0)
        is_undersized = (diameter_mm is not None) and (diameter_mm < min_allowed)

        # Critical defect checks (Override rule)
        if has_decay:
            assigned_class = "Below standard"
            reasons.append("Critical defect: Visible rot, mould, or tissue breakdown detected")
        elif has_cracks:
            assigned_class = "Below standard"
            reasons.append("Critical defect: Visible skin crack or split detected")
        elif is_undersized:
            assigned_class = "Below standard"
            reasons.append(f"Fruit size ({diameter_mm:.1f} mm) is below standard minimum threshold of {min_allowed:.1f} mm")
        elif defect_area_pct >= 8.0:
            assigned_class = "Below standard"
            reasons.append(f"Visible surface defects ({defect_area_pct:.1f}%) exceed the 8.0% tolerance for marketable classes")
        elif axis_ratio < 0.65:
            assigned_class = "Below standard"
            reasons.append(f"Severe shape distortion (axis ratio {axis_ratio:.2f} < 0.65)")
        else:
            # Check Extra
            extra_cfg = self.standards["quality_classes"]["Extra"]
            class_i_cfg = self.standards["quality_classes"]["Class I"]
            class_ii_cfg = self.standards["quality_classes"]["Class II"]

            if defect_area_pct <= extra_cfg["max_defect_area_pct"] and axis_ratio >= extra_cfg["min_axis_ratio"]:
                assigned_class = "Extra"
                reasons.append(f"Qualifies for Extra class: superficial defects ({defect_area_pct:.1f}%) under 1.0% and axis ratio ({axis_ratio:.2f}) >= 0.90")
            elif defect_area_pct <= class_i_cfg["max_defect_area_pct"] and axis_ratio >= class_i_cfg["min_axis_ratio"]:
                assigned_class = "Class I"
                reasons.append(f"Qualifies for Class I: superficial defects ({defect_area_pct:.1f}%) within 3.0% and axis ratio ({axis_ratio:.2f}) >= 0.80")
            elif defect_area_pct <= class_ii_cfg["max_defect_area_pct"] and axis_ratio >= class_ii_cfg["min_axis_ratio"]:
                assigned_class = "Class II"
                reasons.append(f"Qualifies for Class II: superficial defects ({defect_area_pct:.1f}%) within 8.0% and axis ratio ({axis_ratio:.2f}) >= 0.65")
            else:
                assigned_class = "Below standard"
                reasons.append(f"Assigned Below standard due to combined defect area ({defect_area_pct:.1f}%) and shape ratio ({axis_ratio:.2f})")

        if diameter_mm is None:
            warnings.append("Fruit size was not measured due to missing or failed reference coin calibration")

        return {
            "fruit_id": fruit_id,
            "quality_class": assigned_class,
            "diameter_mm": round(diameter_mm, 1) if diameter_mm is not None else None,
            "size_code": size_code,
            "size_label": size_label,
            "shape_category": shape_cat,
            "axis_ratio": round(axis_ratio, 2),
            "color_stage": color_stage,
            "defect_area_pct": round(defect_area_pct, 1),
            "has_cracks": has_cracks,
            "has_decay": has_decay,
            "confidence": confidence,
            "reasons": reasons,
            "warnings": warnings
        }

    def aggregate_lot(
        self,
        fruit_results: List[Dict[str, Any]],
        supplied_mandi_price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Aggregates individual fruit evaluations into an observed lot grade applying tolerances.
        """
        n_fruit = len(fruit_results)
        if n_fruit == 0:
            return {
                "lot_class": "Ungraded",
                "n_fruit": 0,
                "reasons": ["No tomatoes were detected in the provided photographs"],
                "class_counts": {},
                "class_percentages": {},
                "indicative_price": None,
                "warnings": ["Ensure tomatoes are laid clearly in the photograph without severe overlapping or occlusion"]
            }

        # Count classes
        class_counts = {"Extra": 0, "Class I": 0, "Class II": 0, "Below standard": 0}
        for f in fruit_results:
            qc = f["quality_class"]
            class_counts[qc] = class_counts.get(qc, 0) + 1

        class_pcts = {k: round((v / n_fruit) * 100.0, 1) for k, v in class_counts.items()}

        tolerances = self.standards["lot_tolerances"]
        reasons = []
        warnings = [
            f"Graded on {n_fruit} observed fruit in photograph sample.",
            "Sample size notice: 1 to 3 photographs provide an observed sample and may not represent whole-lot variability.",
            "AgriGrade is an independent reference for mandi negotiation, not an official certification."
        ]

        # Evaluation with tolerances:
        # Extra: max 5% below Extra
        pct_below_extra = 100.0 - class_pcts["Extra"]
        pct_below_class_i = class_pcts["Class II"] + class_pcts["Below standard"]
        pct_below_class_ii = class_pcts["Below standard"]

        if pct_below_extra <= tolerances["Extra"]["max_pct_below_class"]:
            lot_class = "Extra"
            reasons.append(f"Lot qualifies as Extra: {class_pcts['Extra']}% of observed fruit are Extra class (tolerated below-class is {pct_below_extra:.1f}%, limit <= {tolerances['Extra']['max_pct_below_class']}%)")
        elif pct_below_class_i <= tolerances["Class I"]["max_pct_below_class"]:
            lot_class = "Class I"
            reasons.append(f"Lot qualifies as Class I: {class_pcts['Extra'] + class_pcts['Class I']:.1f}% meet Class I or higher (fruit below Class I is {pct_below_class_i:.1f}%, limit <= {tolerances['Class I']['max_pct_below_class']}%)")
        elif pct_below_class_ii <= tolerances["Class II"]["max_pct_below_class"]:
            lot_class = "Class II"
            reasons.append(f"Lot qualifies as Class II: {100.0 - class_pcts['Below standard']:.1f}% meet Class II or higher (Below standard fruit is {pct_below_class_ii:.1f}%, limit <= {tolerances['Class II']['max_pct_below_class']}%)")
        else:
            lot_class = "Below standard"
            reasons.append(f"Lot falls into Below standard: {class_pcts['Below standard']}% of observed fruit are Below standard, exceeding the 10.0% out-of-grade tolerance")

        # Indicative price calculation
        price_data = None
        if supplied_mandi_price is not None and supplied_mandi_price > 0:
            multiplier = self.standards["indicative_price_multipliers"].get(lot_class, 1.0)
            calculated_price = round(supplied_mandi_price * multiplier, 2)
            price_data = {
                "base_mandi_price_per_kg": supplied_mandi_price,
                "class_multiplier": multiplier,
                "indicative_price_per_kg": calculated_price,
                "calculation_formula": f"₹{supplied_mandi_price:.2f} × {multiplier:.2f} ({lot_class}) = ₹{calculated_price:.2f}/kg",
                "disclaimer": "This is an illustrative price estimate based on lot grade quality multiplier. It is an independent reference for negotiation, not a guaranteed mandi settlement price."
            }

        return {
            "lot_class": lot_class,
            "n_fruit": n_fruit,
            "class_counts": class_counts,
            "class_percentages": class_pcts,
            "reasons": reasons,
            "warnings": warnings,
            "indicative_price": price_data
        }

tomato_engine = TomatoGradingEngine()
