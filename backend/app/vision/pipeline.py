import cv2
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from backend.app.config import settings
from backend.app.crops.tomato import tomato_engine
from backend.app.vision.calibration import detect_reference_object
from backend.app.vision.color import estimate_color_stage
from backend.app.vision.defects import estimate_visible_defects
from backend.app.vision.annotation import annotate_image, annotate_debug_image

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
        ref_box: Optional[Tuple[int, int, int, int]] = None,
        pixels_per_mm: Optional[float] = None
    ) -> Tuple[List[np.ndarray], List[Dict[str, Any]], List[str], List[Dict[str, Any]]]:
        """
        Segments tomato regions using colour against background and contours.
        Relaxed limits: fruit width 35 to 110 mm, roundness >= 0.6.
        Do not reject fruit by size until coin scale is confirmed.
        Returns: (fruit_masks, fruit_geometries, flags, rejected_shapes)
        """
        flags = []
        h, w = img_bgr.shape[:2]
        img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

        # 1. Background color reference from border samples
        ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        
        border_cr = np.concatenate([ycrcb[:25, :, 1].ravel(), ycrcb[-25:, :, 1].ravel(), ycrcb[:, :25, 1].ravel(), ycrcb[:, -25:, 1].ravel()])
        bg_cr = float(np.median(border_cr))
        
        border_a = np.concatenate([lab[:25, :, 1].ravel(), lab[-25:, :, 1].ravel(), lab[:, :25, 1].ravel(), lab[:, -25:, 1].ravel()])
        bg_a = float(np.median(border_a))
        
        border_s = np.concatenate([img_hsv[:25, :, 1].ravel(), img_hsv[-25:, :, 1].ravel(), img_hsv[:, :25, 1].ravel(), img_hsv[:, -25:, 1].ravel()])
        bg_s = float(np.median(border_s))
        
        # Color contrast against background
        cr_diff = cv2.subtract(ycrcb[:, :, 1], int(bg_cr))
        a_diff = cv2.subtract(lab[:, :, 1], int(bg_a))
        
        # 2. Red & orange fruit color masks (covers desi, hybrid, turning tomatoes)
        m_red1 = cv2.inRange(img_hsv, np.array([0, 50, 35]), np.array([16, 255, 255]))
        m_red2 = cv2.inRange(img_hsv, np.array([160, 50, 35]), np.array([180, 255, 255]))
        m_orange = cv2.inRange(img_hsv, np.array([16, 65, 45]), np.array([35, 255, 255]))
        hsv_fruit = cv2.bitwise_or(cv2.bitwise_or(m_red1, m_red2), m_orange)
        
        # Contrast thresholds against floor
        _, cr_mask = cv2.threshold(cr_diff, 16, 255, cv2.THRESH_BINARY)
        _, a_mask = cv2.threshold(a_diff, 14, 255, cv2.THRESH_BINARY)
        bg_contrast_mask = cv2.bitwise_or(cr_mask, a_mask)
        
        # Combine: fruit must match red/orange and stand out from background
        tomato_mask = cv2.bitwise_and(bg_contrast_mask, hsv_fruit)
        
        # Also include strong Cr contrast even if slightly outside hue window (turning fruit)
        _, strong_cr = cv2.threshold(cr_diff, 32, 255, cv2.THRESH_BINARY)
        sat_thresh = cv2.threshold(img_hsv[:, :, 1], max(35, int(bg_s + 15)), 255, cv2.THRESH_BINARY)[1]
        tomato_mask = cv2.bitwise_or(tomato_mask, cv2.bitwise_and(strong_cr, sat_thresh))

        # Clean noise & fill holes
        kernel_3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        kernel_9 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        tomato_mask = cv2.morphologyEx(tomato_mask, cv2.MORPH_OPEN, kernel_3, iterations=1)
        tomato_mask = cv2.morphologyEx(tomato_mask, cv2.MORPH_CLOSE, kernel_9, iterations=2)

        cnts, _ = cv2.findContours(tomato_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            if cv2.contourArea(c) > 150:
                cv2.drawContours(tomato_mask, [c], -1, 255, -1)

        # Exclude chosen coin box
        if ref_box is not None:
            rx, ry, rw, rh = ref_box
            pad = 10
            x1, y1 = max(0, rx - pad), max(0, ry - pad)
            x2, y2 = min(w, rx + rw + pad), min(h, ry + rh + pad)
            tomato_mask[y1:y2, x1:x2] = 0

        # Find candidate contours
        candidate_contours, _ = cv2.findContours(tomato_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Check for touching shapes and split them locally if needed
        split_contours = []
        for c in candidate_contours:
            c_area = cv2.contourArea(c)
            bx, by, bw, bh = cv2.boundingRect(c)
            aspect = max(bw, bh) / float(max(1, min(bw, bh)))
            # If elongated or very large (touching tomatoes), split locally
            if c_area > 8000 and aspect > 1.7:
                sub_mask = np.zeros((h, w), dtype=np.uint8)
                cv2.drawContours(sub_mask, [c], -1, 255, -1)
                dist = cv2.distanceTransform(sub_mask, cv2.DIST_L2, 5)
                l_max = dist.max()
                if l_max > 10:
                    split_found = False
                    for factor in [0.70, 0.60, 0.50, 0.40]:
                        _, local_fg = cv2.threshold(dist, factor * l_max, 255, 0)
                        local_fg = np.uint8(local_fg)
                        num_m, l_markers = cv2.connectedComponents(local_fg)
                        if num_m > 2:
                            unknown = cv2.subtract(sub_mask, local_fg)
                            l_markers = l_markers + 1
                            l_markers[unknown == 255] = 0
                            w_img = img_bgr.copy()
                            cv2.watershed(w_img, l_markers)
                            for mid in range(2, num_m + 1):
                                m_part = np.uint8(l_markers == mid) * 255
                                p_cnts, _ = cv2.findContours(m_part, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                                if p_cnts:
                                    split_contours.append(max(p_cnts, key=cv2.contourArea))
                            split_found = True
                            break
                    if split_found:
                        continue
            split_contours.append(c)

        fruit_masks = []
        fruit_geometries = []
        rejected_shapes = []

        # Relaxed limits from config
        fruit_min_w_mm = 35.0
        fruit_max_w_mm = 110.0
        fruit_min_roundness = 0.60

        for c in split_contours:
            area = cv2.contourArea(c)
            bx, by, bw, bh = cv2.boundingRect(c)
            if area < 100:
                continue

            perimeter = cv2.arcLength(c, True)
            circularity = (4.0 * np.pi * area / (perimeter ** 2)) if perimeter > 0 else 0.0
            aspect_ratio = min(bw, bh) / float(max(1, max(bw, bh)))
            roundness = max(circularity, aspect_ratio)
            diameter_px = 2.0 * np.sqrt(area / np.pi)

            # Rejection checks:
            # 1. touching the edge
            if bx <= 2 or by <= 2 or (bx + bw) >= (w - 2) or (by + bh) >= (h - 2):
                rejected_shapes.append({"box": (bx, by, bw, bh), "reason": "touching the edge", "contour": c})
                continue

            # 2. glare
            c_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.drawContours(c_mask, [c], -1, 255, -1)
            mean_val = float(np.mean(img_hsv[c_mask == 255, 2]))
            mean_sat = float(np.mean(img_hsv[c_mask == 255, 1]))
            if mean_val > 238 and mean_sat < 32:
                rejected_shapes.append({"box": (bx, by, bw, bh), "reason": "glare", "contour": c})
                continue

            # 3. not round
            if roundness < fruit_min_roundness:
                rejected_shapes.append({"box": (bx, by, bw, bh), "reason": "not round", "contour": c})
                continue

            # 4. size checks (PART 2.3: do not reject any fruit by size until coin scale confirmed)
            if pixels_per_mm is not None and pixels_per_mm > 0:
                width_mm = max(diameter_px, max(bw, bh)) / pixels_per_mm
                if width_mm < fruit_min_w_mm:
                    rejected_shapes.append({"box": (bx, by, bw, bh), "reason": "too small", "contour": c})
                    continue
                elif width_mm > fruit_max_w_mm:
                    rejected_shapes.append({"box": (bx, by, bw, bh), "reason": "too big", "contour": c})
                    continue

            # Accepted as fruit!
            fruit_masks.append(c_mask)
            fruit_geometries.append({
                "contour": c,
                "area": area,
                "box": (bx, by, bw, bh),
                "roundness": roundness,
                "diameter_px": diameter_px
            })

        # Touching check for flag F6
        if len(fruit_geometries) > 1:
            areas = [g["area"] for g in fruit_geometries]
            median_area = float(np.median(areas))
            for g in fruit_geometries:
                if g["area"] > (self.watershed_max_ratio * median_area):
                    if "F6" not in flags:
                        flags.append("F6")
                    break

        return fruit_masks, fruit_geometries, flags, rejected_shapes

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

        # 4. Tomato segmentation (Do not reject by size until coin scale is confirmed)
        ref_box = ref_info["box"] if ref_info else None
        fruit_masks, fruit_geoms, seg_flags, rejected_shapes = self.segment_tomatoes(
            img_bgr, ref_box=ref_box, pixels_per_mm=pixels_per_mm
        )
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

        # Debug summary text: PART 1.3 & PART 1.4
        n_found = len(fruit_results)
        n_rejected = len(rejected_shapes)
        if ref_info and "detected_diameter_pixels" in ref_info:
            coin_x = round(ref_info["detected_diameter_pixels"])
            scale_y = ref_info["pixels_per_mm"]
            debug_text = f"Coin: {coin_x} px = 27 mm. Scale: {scale_y:.2f} px per mm. Found: {n_found}. Rejected: {n_rejected}."
        else:
            debug_text = f"Coin: 0 px = 27 mm. Scale: 0.00 px per mm. Found: {n_found}. Rejected: {n_rejected}."

        # Print the same in the console
        print(debug_text)

        # Render standard annotated image
        annotated_bgr = annotate_image(img_bgr, annotated_fruit_data, ref_info=ref_info)
        success, encoded_annotated = cv2.imencode(".jpg", annotated_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
        annotated_bytes = encoded_annotated.tobytes() if success else image_bytes

        # Render debug image: PART 1.2
        debug_bgr = annotate_debug_image(
            img_bgr,
            ref_info=ref_info,
            accepted_fruits=[{"fruit_id": idx, "box": g["box"]} for idx, g in enumerate(fruit_geoms, start=1)],
            rejected_shapes=rejected_shapes,
            debug_text=debug_text
        )
        success_dbg, encoded_dbg = cv2.imencode(".jpg", debug_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
        debug_annotated_bytes = encoded_dbg.tobytes() if success_dbg else None

        return {
            "n_fruit": len(fruit_results),
            "fruit_results": fruit_results,
            "calibration": ref_info,
            "calibration_status": cal_confidence,
            "pixels_per_mm": pixels_per_mm,
            "flags": list(set(flags)),
            "pipeline_warnings": list(set(pipeline_warnings)),
            "annotated_bytes": annotated_bytes,
            "debug_annotated_bytes": debug_annotated_bytes,
            "debug_info": {
                "coin": ref_info,
                "debug_text": debug_text,
                "found": n_found,
                "rejected": n_rejected,
                "accepted_fruits": [{"fruit_id": idx, "box": g["box"]} for idx, g in enumerate(fruit_geoms, start=1)],
                "rejected_shapes": [{"box": r["box"], "reason": r["reason"]} for r in rejected_shapes]
            }
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
            "debug_annotated_bytes_a": res_a.get("debug_annotated_bytes"),
            "debug_annotated_bytes_b": res_b.get("debug_annotated_bytes"),
            "debug_info": res_a.get("debug_info"),
            "pipeline_warnings": list(set(res_a.get("pipeline_warnings", []) + res_b.get("pipeline_warnings", [])))
        }

vision_pipeline = VisionPipeline()
