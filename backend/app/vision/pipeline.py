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
        self.max_dimension = settings.MAX_IMAGE_DIMENSION
        self.min_sharpness = settings.MIN_SHARPNESS_LAPLACIAN_VAR
        self.min_brightness = settings.MIN_BRIGHTNESS
        self.max_brightness = settings.MAX_BRIGHTNESS

    def validate_image(self, image_bytes: bytes) -> Tuple[np.ndarray, List[str]]:
        """
        Validates raw image bytes, decodes, checks dimensions and downscales if needed.
        """
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
            warnings.append(f"Image downscaled from {w}x{h} to {new_w}x{new_h} for optimal processing performance.")

        return img, warnings

    def check_quality(self, img_bgr: np.ndarray) -> List[str]:
        """
        Checks blur / sharpness and brightness.
        """
        warnings = []
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # Sharpness via Laplacian variance
        lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if lap_var < self.min_sharpness:
            warnings.append(
                f"Image sharpness ({lap_var:.1f}) is low (threshold {self.min_sharpness:.1f}). "
                "Camera blur may reduce the accuracy of defect and boundary detection."
            )

        # Brightness check
        mean_brightness = float(np.mean(gray))
        if mean_brightness < self.min_brightness:
            warnings.append(
                f"Image is dark (brightness {mean_brightness:.1f}/255). "
                "Low daylight or uneven lighting may cause color stage and defect errors."
            )
        elif mean_brightness > self.max_brightness:
            warnings.append(
                f"Image is overexposed (brightness {mean_brightness:.1f}/255). "
                "Specular glare may mask surface discolorations."
            )

        return warnings

    def segment_tomatoes(self, img_bgr: np.ndarray, ref_box: Optional[Tuple[int, int, int, int]] = None) -> Tuple[List[np.ndarray], List[Dict[str, Any]]]:
        """
        Segments tomato regions using adaptive color thresholding and watershed segmentation
        to cleanly separate touching fruit.
        """
        h, w = img_bgr.shape[:2]
        img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        img_lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)

        # Tomato color masks (Red, Orange, Breaker, Turning, Mature Green)
        # Red lower: Hue 0-14
        m1 = cv2.inRange(img_hsv, np.array([0, 50, 40]), np.array([14, 255, 255]))
        # Red upper: Hue 165-180
        m2 = cv2.inRange(img_hsv, np.array([165, 50, 40]), np.array([180, 255, 255]))
        # Orange/Yellowish (Breaker & Turning): Hue 14-38
        m3 = cv2.inRange(img_hsv, np.array([14, 45, 45]), np.array([38, 255, 255]))
        # Green (Mature green): Hue 38-85 with sufficient saturation
        m4 = cv2.inRange(img_hsv, np.array([38, 40, 40]), np.array([85, 255, 255]))

        tomato_mask = cv2.bitwise_or(m1, m2)
        tomato_mask = cv2.bitwise_or(tomato_mask, m3)
        tomato_mask = cv2.bitwise_or(tomato_mask, m4)

        # Clean noise
        kernel_3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        kernel_7 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        tomato_mask = cv2.morphologyEx(tomato_mask, cv2.MORPH_OPEN, kernel_3, iterations=1)
        tomato_mask = cv2.morphologyEx(tomato_mask, cv2.MORPH_CLOSE, kernel_7, iterations=2)

        # Fill interior holes: blemishes, dark spots, and specular spots inside tomato boundary
        cnts, _ = cv2.findContours(tomato_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            if cv2.contourArea(c) > 400:
                cv2.drawContours(tomato_mask, [c], -1, 255, -1)

        # Exclude reference coin region from tomato mask if known
        if ref_box is not None:
            rx, ry, rw, rh = ref_box
            pad = 8
            x1, y1 = max(0, rx - pad), max(0, ry - pad)
            x2, y2 = min(w, rx + rw + pad), min(h, ry + rh + pad)
            tomato_mask[y1:y2, x1:x2] = 0

        # Distance transform and watershed to separate touching tomatoes
        dist_transform = cv2.distanceTransform(tomato_mask, cv2.DIST_L2, 5)
        max_dist = dist_transform.max()

        fruit_masks = []
        fruit_geometries = []

        if max_dist > 5:
            # Sure foreground seeds (0.65 cleanly resolves touching fruit while keeping single fruit intact)
            _, sure_fg = cv2.threshold(dist_transform, 0.65 * max_dist, 255, 0)
            sure_fg = np.uint8(sure_fg)

            # Sure background
            sure_bg = cv2.dilate(tomato_mask, kernel_7, iterations=3)

            # Unknown region
            unknown = cv2.subtract(sure_bg, sure_fg)

            # Marker labelling
            num_markers, markers = cv2.connectedComponents(sure_fg)
            markers = markers + 1
            markers[unknown == 255] = 0

            # Apply watershed
            watershed_img = img_bgr.copy()
            cv2.watershed(watershed_img, markers)

            min_fruit_area = max(500, int((h * w) * 0.003))

            for label_id in range(2, num_markers + 1):
                single_mask = np.uint8(markers == label_id) * 255
                # Clean up mask
                single_mask = cv2.bitwise_and(single_mask, tomato_mask)
                area = cv2.countNonZero(single_mask)
                if area < min_fruit_area:
                    continue

                contours, _ = cv2.findContours(single_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                if not contours:
                    continue
                # Pick largest contour for this segment
                c = max(contours, key=cv2.contourArea)
                if cv2.contourArea(c) < min_fruit_area:
                    continue

                fruit_masks.append(single_mask)
                fruit_geometries.append({"contour": c, "area": area})

        # Fallback if watershed found no seeds (e.g., small or low-contrast fruit)
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

        return fruit_masks, fruit_geometries

    def process_image(
        self,
        image_bytes: bytes,
        reference_type: str = "coin_10",
        custom_dimension_mm: Optional[float] = None,
        supplied_mandi_price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Runs the end-to-end vision pipeline:
        validation -> sharpness/brightness -> calibration -> segmentation -> individual grading -> lot aggregation -> annotation.
        """
        pipeline_warnings = []

        # 1. Validation & downscale
        img_bgr, val_warns = self.validate_image(image_bytes)
        pipeline_warnings.extend(val_warns)

        # 2. Lighting & sharpness checks
        quality_warns = self.check_quality(img_bgr)
        pipeline_warnings.extend(quality_warns)

        # 3. Calibration
        pixels_per_mm, ref_info, cal_confidence, cal_warns = detect_reference_object(
            img_bgr,
            reference_type=reference_type,
            custom_dimension_mm=custom_dimension_mm
        )
        pipeline_warnings.extend(cal_warns)

        # 4. Tomato segmentation
        ref_box = ref_info["box"] if ref_info else None
        fruit_masks, fruit_geoms = self.segment_tomatoes(img_bgr, ref_box=ref_box)

        # 5. Measure each fruit
        fruit_results = []
        annotated_fruit_data = []

        for idx, (mask, geom) in enumerate(zip(fruit_masks, fruit_geoms), start=1):
            c = geom["contour"]
            area = geom["area"]

            # Fit ellipse or bounding geometry
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

            # Equivalent circular diameter in pixels
            diameter_px = 2.0 * np.sqrt(area / np.pi)

            # Estimate diameter in mm if calibrated
            diameter_mm = (diameter_px / pixels_per_mm) if pixels_per_mm else None

            # Color stage estimation
            color_stage, red_pct, color_warns = estimate_color_stage(img_bgr, mask)

            # Visible defect estimation
            defect_pct, has_cracks, has_decay, defect_mask, defect_warns = estimate_visible_defects(img_bgr, mask)

            # Grade the fruit
            graded = tomato_engine.grade_fruit(
                fruit_id=idx,
                diameter_mm=diameter_mm,
                axis_ratio=axis_ratio,
                color_stage=color_stage,
                defect_area_pct=defect_pct,
                has_cracks=has_cracks,
                has_decay=has_decay,
                confidence=cal_confidence if diameter_mm else "moderate"
            )

            fruit_results.append(graded)

            # Store data for annotation
            annotated_fruit_data.append({
                "fruit_id": idx,
                "contour": c,
                "ellipse": ellipse,
                "center": (cx, cy),
                "diameter_mm": diameter_mm,
                "quality_class": graded["quality_class"],
                "color_stage": color_stage,
                "defect_mask": defect_mask
            })

        # 6. Aggregate Lot Grade
        lot_report = tomato_engine.aggregate_lot(
            fruit_results=fruit_results,
            supplied_mandi_price=supplied_mandi_price
        )

        # 7. Render annotated image
        annotated_bgr = annotate_image(img_bgr, annotated_fruit_data, ref_info=ref_info)
        success, encoded_annotated = cv2.imencode(".jpg", annotated_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
        annotated_bytes = encoded_annotated.tobytes() if success else image_bytes

        return {
            "n_fruit": len(fruit_results),
            "lot_report": lot_report,
            "fruit_results": fruit_results,
            "calibration": ref_info,
            "calibration_status": cal_confidence,
            "pixels_per_mm": pixels_per_mm,
            "pipeline_warnings": list(set(pipeline_warnings)),
            "annotated_bytes": annotated_bytes
        }

vision_pipeline = VisionPipeline()
