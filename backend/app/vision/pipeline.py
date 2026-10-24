import cv2
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from backend.app.config import settings
from backend.app.crops.tomato import tomato_engine
from backend.app.vision.calibration import detect_reference_object
from backend.app.vision.color import estimate_color_stage
from backend.app.vision.defects import estimate_visible_defects
from backend.app.vision.annotation import annotate_image

class VisionPipeline:
    def __init__(self):
        self.config = tomato_engine.get_config()
        cal_cfg = self.config.get("measurement_and_calibration", {})
        self.max_dimension = settings.MAX_IMAGE_DIMENSION
        self.min_sharpness = cal_cfg.get("min_sharpness_laplacian", settings.MIN_SHARPNESS_LAPLACIAN_VAR)
        self.min_brightness = cal_cfg.get("min_brightness", settings.MIN_BRIGHTNESS)
        self.max_brightness = cal_cfg.get("max_brightness", settings.MAX_BRIGHTNESS)
        self.watershed_max_ratio = self.config.get("grading_rules", {}).get("watershed_max_area_ratio", 1.6)

    def validate_image(self, image_bytes: bytes) -> Tuple[np.ndarray, List[str]]:
        warnings = []
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid or corrupted image format. Only valid JPEG, PNG, or WebP images are accepted.")

        h, w = img.shape[:2]
        if max(h, w) > self.max_dimension:
            scale = self.max_dimension / float(max(h, w))
            new_w, new_h = int(w * scale), int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        return img, warnings

    def check_quality(self, img_bgr: np.ndarray) -> Tuple[List[str], List[str]]:
        """
        Checks blur/sharpness, brightness, and white balance tint.
        Returns (warnings, flags).
        """
        warnings = []
        flags = []
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # Sharpness via Laplacian variance
        lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if lap_var < self.min_sharpness:
            warnings.append(f"Image sharpness ({lap_var:.1f}) is low.")
            flags.append("F0b")

        # Brightness check
        mean_brightness = float(np.mean(gray))
        if mean_brightness < self.min_brightness:
            warnings.append(f"Image is dark ({mean_brightness:.1f}/255).")
            if "F0b" not in flags:
                flags.append("F0b")
        elif mean_brightness > self.max_brightness:
            warnings.append(f"Image is overexposed ({mean_brightness:.1f}/255).")
            flags.append("F17")

        # White balance tint check (R vs B channel ratio)
        b_mean, g_mean, r_mean = cv2.mean(img_bgr)[:3]
        if b_mean > 0:
            rb_ratio = r_mean / float(b_mean)
            if rb_ratio > 1.85 or rb_ratio < 0.55:
                warnings.append(f"Strong color tint detected (R/B ratio {rb_ratio:.2f}).")
                if "F17" not in flags:
                    flags.append("F17")

        return warnings, flags

    def segment_tomatoes(
        self,
        img_bgr: np.ndarray,
        ref_box: Optional[Tuple[int, int, int, int]] = None
    ) -> Tuple[List[np.ndarray], List[Dict[str, Any]], List[str]]:
        """
        Segments tomato regions using adaptive color thresholding and watershed segmentation.
        Checks for touching fruit exceeding area ratio -> flag F6.
        """
        flags = []
        h, w = img_bgr.shape[:2]
        img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

        # Color masks for tomato ripening stages
        m1 = cv2.inRange(img_hsv, np.array([0, 50, 40]), np.array([14, 255, 255]))
        m2 = cv2.inRange(img_hsv, np.array([165, 50, 40]), np.array([180, 255, 255]))
        m3 = cv2.inRange(img_hsv, np.array([14, 45, 45]), np.array([38, 255, 255]))
        m4 = cv2.inRange(img_hsv, np.array([38, 40, 40]), np.array([85, 255, 255]))

        tomato_mask = cv2.bitwise_or(m1, m2)
        tomato_mask = cv2.bitwise_or(tomato_mask, m3)
        tomato_mask = cv2.bitwise_or(tomato_mask, m4)

        # Clean noise
        kernel_3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        kernel_7 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        tomato_mask = cv2.morphologyEx(tomato_mask, cv2.MORPH_OPEN, kernel_3, iterations=1)
        tomato_mask = cv2.morphologyEx(tomato_mask, cv2.MORPH_CLOSE, kernel_7, iterations=2)

        # Fill holes
        cnts, _ = cv2.findContours(tomato_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            if cv2.contourArea(c) > 400:
                cv2.drawContours(tomato_mask, [c], -1, 255, -1)

        # Exclude coin
        if ref_box is not None:
            rx, ry, rw, rh = ref_box
            pad = 8
            x1, y1 = max(0, rx - pad), max(0, ry - pad)
            x2, y2 = min(w, rx + rw + pad), min(h, ry + rh + pad)
            tomato_mask[y1:y2, x1:x2] = 0

        # Distance transform & watershed
        dist_transform = cv2.distanceTransform(tomato_mask, cv2.DIST_L2, 5)
        max_dist = dist_transform.max()

        fruit_masks = []
        fruit_geometries = []

        if max_dist > 5:
            _, sure_fg = cv2.threshold(dist_transform, 0.65 * max_dist, 255, 0)
            sure_fg = np.uint8(sure_fg)
            sure_bg = cv2.dilate(tomato_mask, kernel_7, iterations=3)
            unknown = cv2.subtract(sure_bg, sure_fg)

            num_markers, markers = cv2.connectedComponents(sure_fg)
            markers = markers + 1
            markers[unknown == 255] = 0

            watershed_img = img_bgr.copy()
            cv2.watershed(watershed_img, markers)

            min_fruit_area = max(500, int((h * w) * 0.003))

            for label_id in range(2, num_markers + 1):
                single_mask = np.uint8(markers == label_id) * 255
                single_mask = cv2.bitwise_and(single_mask, tomato_mask)
                area = cv2.countNonZero(single_mask)
                if area < min_fruit_area:
                    continue

                contours, _ = cv2.findContours(single_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                if not contours:
                    continue
                c = max(contours, key=cv2.contourArea)
                if cv2.contourArea(c) < min_fruit_area:
                    continue

                fruit_masks.append(single_mask)
                fruit_geometries.append({"contour": c, "area": area})

        if not fruit_masks:
            contours, _ = cv2.findContours(tomato_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            min_fruit_area = max(500, int((h * w) * 0.003))
            for c in contours:
                area = cv2.contourArea(c)
                if area >= min_fruit_area:
                    m = np.zeros((h, w), dtype=np.uint8)
                    cv2.drawContours(m, [c], -1, 255, -1)
                    fruit_masks.append(m)
                    fruit_geometries.append({"contour": c, "area": area})

        # Watershed sanity check (Section G):
        # If any contour area > 1.6x median fruit area, flag F6
        if fruit_geometries:
            areas = [g["area"] for g in fruit_geometries]
            median_area = float(np.median(areas))
            for g in fruit_geometries:
                if g["area"] > (self.watershed_max_ratio * median_area) and len(fruit_geometries) > 1:
                    if "F6" not in flags:
                        flags.append("F6")
                    break

        return fruit_masks, fruit_geometries, flags

    def process_single_image(
        self,
        image_bytes: bytes,
        reference_type: str = "coin_10",
        custom_dimension_mm: Optional[float] = None,
        variety: str = "Not sure",
        photo_label: str = "Photo A"
    ) -> Dict[str, Any]:
        """
        Processes a single photograph (Photo A or Photo B).
        Returns fruit detections, coin calibration info, flags, and annotated image bytes.
        """
        pipeline_warnings = []
        flags = []

        # 1. Validation & downscaling
        img_bgr, val_warns = self.validate_image(image_bytes)
        pipeline_warnings.extend(val_warns)

        # 2. Quality assessment
        quality_warns, quality_flags = self.check_quality(img_bgr)
        pipeline_warnings.extend(quality_warns)
        flags.extend(quality_flags)

        # 3. Reference coin detection
        pixels_per_mm, ref_info, cal_confidence, cal_warns = detect_reference_object(
            img_bgr,
            reference_type=reference_type,
            custom_dimension_mm=custom_dimension_mm
        )
        pipeline_warnings.extend(cal_warns)
        if not ref_info or not pixels_per_mm:
            flags.append("F0")

        # 4. Tomato segmentation
        ref_box = ref_info["box"] if ref_info else None
        fruit_masks, fruit_geoms, seg_flags = self.segment_tomatoes(img_bgr, ref_box=ref_box)
        flags.extend(seg_flags)

        # 5. Measure fruit
        fruit_results = []
        annotated_fruit_data = []

        for idx, (mask, geom) in enumerate(zip(fruit_masks, fruit_geoms), start=1):
            c = geom["contour"]
            area = geom["area"]

            # Fit circle and calculate fit error
            (circle_x, circle_y), circle_r = cv2.minEnclosingCircle(c)
            circle_area = np.pi * (circle_r ** 2)
            circle_fit_error = abs(circle_area - area) / circle_area if circle_area > 0 else 0.0

            # Fit ellipse or bounding box
            if len(c) >= 5:
                try:
                    ellipse = cv2.fitEllipse(c)
                    (cx, cy), (axis1, axis2), angle = ellipse
                    major_axis_px = max(axis1, axis2)
                    minor_axis_px = min(axis1, axis2)
                except Exception:
                    ellipse = None
                    rect = cv2.minAreaRect(c)
                    (cx, cy), (rw, rh), angle = rect
                    major_axis_px = max(rw, rh)
                    minor_axis_px = min(rw, rh)
            else:
                ellipse = None
                rect = cv2.minAreaRect(c)
                (cx, cy), (rw, rh), angle = rect
                major_axis_px = max(rw, rh)
                minor_axis_px = min(rw, rh)

            axis_ratio = (minor_axis_px / major_axis_px) if major_axis_px > 0 else 1.0
            axis_ratio = min(1.0, max(0.1, axis_ratio))

            diameter_px = 2.0 * np.sqrt(area / np.pi)
            raw_diameter_mm = (diameter_px / pixels_per_mm) if pixels_per_mm else None

            # Color stage
            color_stage, red_pct, color_warns = estimate_color_stage(img_bgr, mask)

            # Defects with calyx and specular exclusion
            defect_pct, has_cracks, has_decay, defect_mask, defect_warns = estimate_visible_defects(
                img_bgr, mask, variety=variety
            )

            graded = tomato_engine.grade_fruit(
                fruit_id=idx,
                diameter_mm=raw_diameter_mm,
                axis_ratio=axis_ratio,
                color_stage=color_stage,
                defect_area_pct=defect_pct,
                has_cracks=has_cracks,
                has_decay=has_decay,
                circle_fit_error=circle_fit_error,
                variety=variety,
                confidence=cal_confidence if raw_diameter_mm else "moderate"
            )

            graded["center"] = (float(cx), float(cy))
            graded["photo_label"] = photo_label
            fruit_results.append(graded)

            annotated_fruit_data.append({
                "fruit_id": idx,
                "contour": c,
                "ellipse": ellipse,
                "center": (cx, cy),
                "diameter_mm": graded.get("diameter_mm"),
                "quality_class": graded["quality_class"],
                "color_stage": color_stage,
                "defect_mask": defect_mask
            })

        # Render annotated image
        annotated_bgr = annotate_image(img_bgr, annotated_fruit_data, ref_info=ref_info)
        success, encoded_annotated = cv2.imencode(".jpg", annotated_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
        annotated_bytes = encoded_annotated.tobytes() if success else image_bytes

        return {
            "n_fruit": len(fruit_results),
            "fruit_results": fruit_results,
            "calibration": ref_info,
            "calibration_status": cal_confidence,
            "pixels_per_mm": pixels_per_mm,
            "flags": list(set(flags)),
            "pipeline_warnings": list(set(pipeline_warnings)),
            "annotated_bytes": annotated_bytes
        }

    def process_image(
        self,
        image_bytes: bytes,
        reference_type: str = "coin_10",
        custom_dimension_mm: Optional[float] = None,
        supplied_mandi_price: Optional[float] = None,
        variety: str = "Not sure"
    ) -> Dict[str, Any]:
        """Backwards compatibility wrapper for single image processing and lot aggregation."""
        res = self.process_single_image(
            image_bytes=image_bytes,
            reference_type=reference_type,
            custom_dimension_mm=custom_dimension_mm,
            variety=variety
        )
        lot_report = tomato_engine.aggregate_lot(
            fruit_results=res["fruit_results"],
            supplied_mandi_price=supplied_mandi_price,
            flags=res.get("flags", [])
        )
        res["lot_report"] = lot_report
        return res

    def process_two_photo_batch(
        self,
        photo_a_bytes: bytes,
        photo_b_bytes: Optional[bytes] = None,
        reference_type: str = "coin_10",
        custom_dimension_mm: Optional[float] = None,
        variety: str = "Not sure",
        batch_number: int = 1
    ) -> Dict[str, Any]:
        """
        Processes a mandatory two-photo batch:
        Photo A (stem up) and Photo B (stem down).
        Matches fruit between views and takes the worse view for each fruit.
        """
        res_a = self.process_single_image(
            photo_a_bytes,
            reference_type=reference_type,
            custom_dimension_mm=custom_dimension_mm,
            variety=variety,
            photo_label=f"Batch {batch_number} - Photo A"
        )

        all_flags = list(res_a.get("flags", []))

        # Check Photo B
        if photo_b_bytes is None or len(photo_b_bytes) == 0:
            all_flags.append("F0d")
            all_flags.append("F3")
            return {
                "batch_number": batch_number,
                "n_fruit": res_a["n_fruit"],
                "fruit_results": res_a["fruit_results"],
                "flags": list(set(all_flags)),
                "calibration": res_a["calibration"],
                "pixels_per_mm": res_a["pixels_per_mm"],
                "annotated_bytes_a": res_a["annotated_bytes"],
                "annotated_bytes_b": None,
                "pipeline_warnings": res_a.get("pipeline_warnings", [])
            }

        res_b = self.process_single_image(
            photo_b_bytes,
            reference_type=reference_type,
            custom_dimension_mm=custom_dimension_mm,
            variety=variety,
            photo_label=f"Batch {batch_number} - Photo B"
        )
        all_flags.extend(res_b.get("flags", []))

        # Match fruit between Photo A and Photo B (Section E1)
        matched_fruits, match_flags = tomato_engine.match_two_views(
            res_a["fruit_results"],
            res_b["fruit_results"]
        )
        all_flags.extend(match_flags)

        return {
            "batch_number": batch_number,
            "n_fruit": len(matched_fruits),
            "fruit_results": matched_fruits,
            "flags": list(set(all_flags)),
            "calibration": res_a["calibration"] or res_b["calibration"],
            "pixels_per_mm": res_a["pixels_per_mm"] or res_b["pixels_per_mm"],
            "annotated_bytes_a": res_a["annotated_bytes"],
            "annotated_bytes_b": res_b["annotated_bytes"],
            "pipeline_warnings": list(set(res_a.get("pipeline_warnings", []) + res_b.get("pipeline_warnings", [])))
        }

vision_pipeline = VisionPipeline()
