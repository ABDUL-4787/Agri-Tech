import json
import math
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from backend.app.config import settings

def compute_wilson_interval(x: int, n: int, z: float = 1.96) -> Tuple[float, float, float]:
    """
    Computes Wilson score interval (95% default, z=1.96).
    Returns (point_estimate, low, high) bounded in [0.0, 1.0].
    """
    if n <= 0:
        return 0.0, 0.0, 0.0
    p = float(x) / float(n)
    z2 = z * z
    denom = 1.0 + (z2 / float(n))
    center = (p + (z2 / (2.0 * float(n)))) / denom
    radicand = (p * (1.0 - p) / float(n)) + (z2 / (4.0 * float(n) * float(n)))
    half = (z * math.sqrt(max(0.0, radicand))) / denom
    low = max(0.0, center - half)
    high = min(1.0, center + half)
    return p, low, high

class TomatoGradingEngine:
    def __init__(self, config_path: Optional[Path] = None):
        self.config_path = config_path or settings.GRADING_CONFIG_PATH
        self.standards_path = settings.TOMATO_STANDARDS_PATH
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        if self.config_path.is_file():
            with open(self.config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        # Fallback to standards path if grading_config not found
        with open(self.standards_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_config(self) -> Dict[str, Any]:
        return self.config

    def get_standards_metadata(self) -> Dict[str, Any]:
        return {
            "standards_version": "2.0.0",
            "name": "AgriGrade Market Rules",
            "disclaimer": "Our simple rules are made for market talks. They are not official.",
            "grades": self.config.get("grading_rules", {}).get("grades", ["Grade A", "Grade B", "Grade C", "Reject"]),
            "tolerances": self.config.get("grading_rules", {}).get("tolerances", {}),
            "price_multipliers": self.config.get("grading_rules", {}).get("price_multipliers", {})
        }

    def apply_parallax_correction(self, diameter_mm: Optional[float]) -> Optional[float]:
        if diameter_mm is None or diameter_mm <= 0:
            return None
        factor = self.config.get("measurement_and_calibration", {}).get("size_parallax_correction", 0.97)
        return round(diameter_mm * factor, 1)

    def determine_size_category(self, diameter_mm: Optional[float], variety: str = "Not sure") -> Tuple[str, Optional[int]]:
        if diameter_mm is None:
            return "Size not measured", None
        margin = self.config.get("measurement_and_calibration", {}).get("approx_size_margin_mm", 3.0)
        v_info = self.config.get("varieties", {}).get(variety, self.config.get("varieties", {}).get("Not sure", {}))
        min_typ = v_info.get("typical_min_mm", 40.0)
        max_typ = v_info.get("typical_max_mm", 80.0)

        if diameter_mm < min_typ:
            label = f"Small ({diameter_mm:.0f} ± {margin:.0f} mm)"
            code = 1
        elif diameter_mm <= max_typ:
            label = f"Medium-Large ({diameter_mm:.0f} ± {margin:.0f} mm)"
            code = 2
        else:
            label = f"Jumbo ({diameter_mm:.0f} ± {margin:.0f} mm)"
            code = 3
        return label, code

    def determine_size_code(self, diameter_mm: Optional[float], shape: str = "round") -> Tuple[Optional[int], Optional[str], List[str]]:
        """Backwards compatibility helper for legacy tests."""
        if diameter_mm is None:
            return None, "Unmeasured", ["Size uncalibrated"]
        label, code = self.determine_size_category(diameter_mm)
        return code, label, [f"Size evaluated as {label}"]

    def determine_shape_category(self, axis_ratio: float) -> Tuple[str, List[str]]:
        """Backwards compatibility helper for legacy tests."""
        if axis_ratio >= 0.80:
            return "round", [f"Axis ratio {axis_ratio:.2f} is round"]
        elif axis_ratio >= 0.65:
            return "oblong", [f"Axis ratio {axis_ratio:.2f} is oblong"]
        else:
            return "misshapen", [f"Axis ratio {axis_ratio:.2f} is misshapen"]

    def grade_fruit(
        self,
        fruit_id: int,
        diameter_mm: Optional[float],
        axis_ratio: float,
        color_stage: str,
        defect_area_pct: float,
        has_cracks: bool = False,
        has_decay: bool = False,
        circle_fit_error: float = 0.0,
        variety: str = "Not sure",
        confidence: str = "high"
    ) -> Dict[str, Any]:
        """
        Evaluates an individual tomato: Grade A, Grade B, Grade C, or Reject.
        """
        reasons = []
        warnings = []

        # Apply parallax correction
        corr_diameter_mm = self.apply_parallax_correction(diameter_mm)
        size_label, size_code = self.determine_size_category(corr_diameter_mm, variety)

        # Check circle fit error for "shape unclear"
        max_fit_err = self.config.get("measurement_and_calibration", {}).get("shape_fit_error_threshold", 0.35)
        shape_unclear = circle_fit_error > max_fit_err
        if shape_unclear:
            shape_cat = "shape unclear"
            warnings.append("Shape fit error high; boundary irregular")
        elif axis_ratio >= 0.80:
            shape_cat = "round"
        else:
            shape_cat = "oblong"

        # Quality evaluation
        tolerances = self.config.get("grading_rules", {}).get("tolerances", {})
        grade_a_tol = tolerances.get("Grade A", {"max_defect_area_pct": 1.0, "min_axis_ratio": 0.85})
        grade_b_tol = tolerances.get("Grade B", {"max_defect_area_pct": 5.0, "min_axis_ratio": 0.75})
        grade_c_tol = tolerances.get("Grade C", {"max_defect_area_pct": 10.0, "min_axis_ratio": 0.65})

        if has_decay or has_cracks or defect_area_pct > grade_c_tol.get("max_defect_area_pct", 10.0):
            assigned_grade = "Reject"
            reasons.append("Severe defects, rot or skin crack")
        elif defect_area_pct <= grade_a_tol.get("max_defect_area_pct", 1.0) and axis_ratio >= grade_a_tol.get("min_axis_ratio", 0.85):
            assigned_grade = "Grade A"
            reasons.append("Clean skin, uniform shape")
        elif defect_area_pct <= grade_b_tol.get("max_defect_area_pct", 5.0) and axis_ratio >= grade_b_tol.get("min_axis_ratio", 0.75):
            assigned_grade = "Grade B"
            reasons.append("Minor spots, good market quality")
        elif defect_area_pct <= grade_c_tol.get("max_defect_area_pct", 10.0) and axis_ratio >= grade_c_tol.get("min_axis_ratio", 0.65):
            assigned_grade = "Grade C"
            reasons.append("Moderate skin spots or shape irregularity")
        else:
            assigned_grade = "Reject"
            reasons.append("Defects exceed acceptable limits")

        margin = self.config.get("measurement_and_calibration", {}).get("approx_size_margin_mm", 3.0)

        return {
            "fruit_id": fruit_id,
            "quality_class": assigned_grade,
            "diameter_mm": corr_diameter_mm,
            "approx_diameter_display": f"{corr_diameter_mm:.0f} ± {margin:.0f} mm" if corr_diameter_mm else "Unmeasured",
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

    def match_two_views(
        self,
        fruits_a: List[Dict[str, Any]],
        fruits_b: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        E1. Matches fruit between Photo A (stem up) and Photo B (stem down).
        Sorts by grid position (row then column) plus nearest centroid matching.
        Takes higher defect % and worse of the two grades.
        Emits F8 if fruit counts differ by > 1.
        """
        flags = []
        na = len(fruits_a)
        nb = len(fruits_b)

        if abs(na - nb) > 1:
            flags.append("F8")

        # Sort each list by y (row) then x (column)
        def sort_key(f):
            pt = f.get("center", (0, 0))
            return (round(pt[1] / 60) * 60, pt[0])

        sorted_a = sorted(fruits_a, key=sort_key)
        sorted_b = sorted(fruits_b, key=sort_key)

        grade_rank = {"Grade A": 1, "Grade B": 2, "Grade C": 3, "Reject": 4}
        rank_to_grade = {1: "Grade A", 2: "Grade B", 3: "Grade C", 4: "Reject"}

        matched_results = []
        paired_count = min(na, nb)

        for i in range(paired_count):
            fa = sorted_a[i]
            fb = sorted_b[i]

            defect_a = fa.get("defect_area_pct", 0.0)
            defect_b = fb.get("defect_area_pct", 0.0)
            worse_defect = max(defect_a, defect_b)

            rank_a = grade_rank.get(fa.get("quality_class"), 4)
            rank_b = grade_rank.get(fb.get("quality_class"), 4)
            worse_rank = max(rank_a, rank_b)
            worse_grade = rank_to_grade.get(worse_rank, "Reject")

            diam_a = fa.get("diameter_mm")
            diam_b = fb.get("diameter_mm")
            avg_diam = None
            if diam_a and diam_b:
                avg_diam = round((diam_a + diam_b) / 2.0, 1)
            elif diam_a:
                avg_diam = diam_a
            elif diam_b:
                avg_diam = diam_b

            combined = dict(fa)
            combined["fruit_id"] = i + 1
            combined["quality_class"] = worse_grade
            combined["defect_area_pct"] = worse_defect
            combined["diameter_mm"] = avg_diam
            combined["has_cracks"] = fa.get("has_cracks", False) or fb.get("has_cracks", False)
            combined["has_decay"] = fa.get("has_decay", False) or fb.get("has_decay", False)
            combined["view_matched"] = True
            combined["view_surface_seen_pct"] = 85
            matched_results.append(combined)

        # Handle any leftover unmatched fruits if count differed by 1
        if na > nb:
            for extra_f in sorted_a[paired_count:]:
                extra_copy = dict(extra_f)
                extra_copy["fruit_id"] = len(matched_results) + 1
                extra_copy["view_matched"] = False
                extra_copy["view_surface_seen_pct"] = 45
                matched_results.append(extra_copy)
        elif nb > na:
            for extra_f in sorted_b[paired_count:]:
                extra_copy = dict(extra_f)
                extra_copy["fruit_id"] = len(matched_results) + 1
                extra_copy["view_matched"] = False
                extra_copy["view_surface_seen_pct"] = 45
                matched_results.append(extra_copy)

        return matched_results, flags

    def aggregate_lot(
        self,
        fruit_results: List[Dict[str, Any]],
        supplied_mandi_price: Optional[float] = None,
        hand_check_soft_count: int = 0,
        flags: Optional[List[str]] = None,
        target_sample_size: int = 30
    ) -> Dict[str, Any]:
        """
        E2. Lot grading by COUNT of fruits (not average damage area).
        E3. Wilson score interval for bad fruit rate.
        E4. Three-outcome verdict (Sure / Not sure / Not this grade).
        """
        flags = list(flags or [])
        n_fruit = len(fruit_results)

        # 0 Fruits Block (Section B)
        if n_fruit == 0:
            if "F0c" not in flags:
                flags.append("F0c")
            return {
                "lot_class": "No grade",
                "verdict_status": "BLOCKING",
                "n_fruit": 0,
                "summary_sentence": "No grade. No fruit found.",
                "class_counts": {},
                "class_percentages": {},
                "wilson_interval": None,
                "indicative_price": None,
                "flags": flags,
                "reasons": ["No fruit found. Please take photos of tomatoes."]
            }

        # Check hard minimum
        min_hard = self.config.get("lot_and_sampling", {}).get("min_fruits_hard", 20)
        if n_fruit < min_hard:
            if "F0c" not in flags:
                flags.append("F0c")
            return {
                "lot_class": "No grade",
                "verdict_status": "BLOCKING",
                "n_fruit": n_fruit,
                "summary_sentence": f"Too few fruit ({n_fruit}). Need at least {min_hard}.",
                "class_counts": {},
                "class_percentages": {},
                "wilson_interval": None,
                "indicative_price": None,
                "flags": flags,
                "reasons": [f"Only {n_fruit} fruit checked. Minimum {min_hard} required for any grade."]
            }

        # Small sample warning flag F1
        if n_fruit < target_sample_size and "F1" not in flags:
            flags.append("F1")

        # Hand check soft fruit flag F13
        soft_threshold = self.config.get("grading_rules", {}).get("hand_check_soft_threshold", 1)
        if hand_check_soft_count > soft_threshold and "F13" not in flags:
            flags.append("F13")

        # Count fruits per grade
        class_counts = {"Grade A": 0, "Grade B": 0, "Grade C": 0, "Reject": 0}
        for f in fruit_results:
            qc = f.get("quality_class", "Reject")
            class_counts[qc] = class_counts.get(qc, 0) + 1

        class_pcts = {k: round((v / float(n_fruit)) * 100.0, 1) for k, v in class_counts.items()}

        # Evaluate Grade A
        # Out-of-grade for Grade A = Grade B + Grade C + Reject
        out_a_count = class_counts["Grade B"] + class_counts["Grade C"] + class_counts["Reject"]
        p_a, low_a, high_a = compute_wilson_interval(out_a_count, n_fruit)
        limit_a = self.config.get("grading_rules", {}).get("tolerances", {}).get("Grade A", {}).get("max_out_of_grade_pct", 5.0) / 100.0

        # Evaluate Grade B
        # Out-of-grade for Grade B = Grade C + Reject
        out_b_count = class_counts["Grade C"] + class_counts["Reject"]
        p_b, low_b, high_b = compute_wilson_interval(out_b_count, n_fruit)
        limit_b = self.config.get("grading_rules", {}).get("tolerances", {}).get("Grade B", {}).get("max_out_of_grade_pct", 10.0) / 100.0

        # Evaluate Grade C
        # Out-of-grade for Grade C = Reject
        out_c_count = class_counts["Reject"]
        p_c, low_c, high_c = compute_wilson_interval(out_c_count, n_fruit)
        limit_c = self.config.get("grading_rules", {}).get("tolerances", {}).get("Grade C", {}).get("max_out_of_grade_pct", 10.0) / 100.0

        def evaluate_verdict(low: float, high: float, limit: float) -> str:
            if high <= limit:
                return "SURE_GREEN"
            elif low > limit:
                return "NOT_RED"
            else:
                return "NOT_SURE_AMBER"

        verdict_a = evaluate_verdict(low_a, high_a, limit_a)
        verdict_b = evaluate_verdict(low_b, high_b, limit_b)
        verdict_c = evaluate_verdict(low_c, high_c, limit_c)

        # Hand check lowers Sure to Amber if soft fruit > 1
        if hand_check_soft_count > soft_threshold:
            if verdict_a == "SURE_GREEN":
                verdict_a = "NOT_SURE_AMBER"
            if verdict_b == "SURE_GREEN":
                verdict_b = "NOT_SURE_AMBER"
            if verdict_c == "SURE_GREEN":
                verdict_c = "NOT_SURE_AMBER"

        # Determine best GREEN grade
        if verdict_a == "SURE_GREEN":
            lot_grade = "Grade A"
            active_out_count = out_a_count
            active_p, active_low, active_high = p_a, low_a, high_a
            verdict_status = "SURE"
        elif verdict_b == "SURE_GREEN":
            lot_grade = "Grade B"
            active_out_count = out_b_count
            active_p, active_low, active_high = p_b, low_b, high_b
            verdict_status = "SURE"
        elif verdict_c == "SURE_GREEN":
            lot_grade = "Grade C"
            active_out_count = out_c_count
            active_p, active_low, active_high = p_c, low_c, high_c
            verdict_status = "SURE"
        else:
            # None is sure green: check if definitely reject or amber
            if verdict_c == "NOT_RED":
                lot_grade = "Reject"
                active_out_count = out_c_count
                active_p, active_low, active_high = p_c, low_c, high_c
                verdict_status = "SURE"
            else:
                lot_grade = "Not sure yet"
                active_out_count = out_b_count
                active_p, active_low, active_high = p_b, low_b, high_b
                verdict_status = "AMBER"

        # Wilson simple bar formatting (Section E3)
        bad_per_100 = round(active_p * 100)
        low_per_100 = round(active_low * 100)
        high_per_100 = round(active_high * 100)

        wilson_data = {
            "bad_count": active_out_count,
            "total_count": n_fruit,
            "point_estimate_pct": round(active_p * 100.0, 1),
            "low_pct": round(active_low * 100.0, 1),
            "high_pct": round(active_high * 100.0, 1),
            "simple_bar_en": f"Bad fruit: about {bad_per_100} in 100. Could be {low_per_100} to {high_per_100} in 100.",
            "simple_bar_hi": f"ख़राब फल: 100 में से लगभग {bad_per_100}। 100 में से {low_per_100} से {high_per_100} हो सकते हैं।",
            "simple_bar_te": f"చెడిపోయినవి: 100 కి దాదాపు {bad_per_100}. 100 కి {low_per_100} నుండి {high_per_100} వరకు ఉండవచ్చు."
        }

        # Pricing table (Section B)
        pricing_data = None
        if supplied_mandi_price is not None and supplied_mandi_price > 0:
            mult_table = self.config.get("grading_rules", {}).get("price_multipliers", {
                "Grade A": 1.0,
                "Grade B": 0.85,
                "Grade C": 0.70,
                "Reject": 0.0
            })
            chosen_mult = mult_table.get(lot_grade, 0.0) if lot_grade in mult_table else None
            pricing_data = {
                "base_price": supplied_mandi_price,
                "lot_grade_price": round(supplied_mandi_price * chosen_mult, 2) if chosen_mult is not None else None,
                "multiplier_table": [
                    { "grade": "Grade A", "multiplier": mult_table.get("Grade A", 1.00), "price": round(supplied_mandi_price * mult_table.get("Grade A", 1.00), 2) },
                    { "grade": "Grade B", "multiplier": mult_table.get("Grade B", 0.85), "price": round(supplied_mandi_price * mult_table.get("Grade B", 0.85), 2) },
                    { "grade": "Grade C", "multiplier": mult_table.get("Grade C", 0.70), "price": round(supplied_mandi_price * mult_table.get("Grade C", 0.70), 2) },
                    { "grade": "Reject", "multiplier": mult_table.get("Reject", 0.00), "price": 0.0 }
                ],
                "note_en": "Example only. You both decide the final price.",
                "note_hi": "केवल उदाहरण। अंतिम भाव आप दोनों तय करें।",
                "note_te": "ఉదాహరణ మాత్రమే. తుది ధరను మీరిద్దరూ నిర్ణయించుకోండి."
            }

        # Summary sentence
        if lot_grade == "Not sure yet":
            summary_sentence = "Not sure yet. Check 20 more fruit."
        elif lot_grade == "Grade A":
            summary_sentence = "Very good quality. Clean fruit."
        elif lot_grade == "Grade B":
            summary_sentence = "Good market quality. Minor spots."
        elif lot_grade == "Grade C":
            summary_sentence = "Fair quality. Moderate spots."
        else:
            summary_sentence = "Many damaged fruit. Not recommended."

        return {
            "lot_class": lot_grade,
            "verdict_status": verdict_status,
            "n_fruit": n_fruit,
            "summary_sentence": summary_sentence,
            "class_counts": class_counts,
            "class_percentages": class_pcts,
            "wilson_interval": wilson_data,
            "indicative_price": pricing_data,
            "flags": flags,
            "surface_seen_note": "About 85% of fruit surface seen.",
            "hidden_defect_note": "Inside rot and soft fruit cannot be seen by photo."
        }

tomato_engine = TomatoGradingEngine()
