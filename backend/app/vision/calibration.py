import cv2
import numpy as np
from typing import Tuple, Optional, Dict, Any, List

def detect_reference_object(
    image_bgr: np.ndarray,
    reference_type: str = "coin_10",
    custom_dimension_mm: Optional[float] = None
) -> Tuple[Optional[float], Optional[Dict[str, Any]], str, List[str]]:
    """
    Detects reference object (₹10 coin, ₹5 coin, or custom card/disc) to compute pixels_per_mm.
    
    Nominal diameters:
      - coin_10: 27.0 mm
      - coin_5: 23.0 mm
      - custom_card: custom_dimension_mm (e.g. width or diameter)
    
    Returns:
      (pixels_per_mm, ref_info_dict, confidence, warnings)
    """
    warnings = []
    
    nominal_mm = 27.0
    if reference_type == "coin_10":
        nominal_mm = 27.0
    elif reference_type == "coin_5":
        nominal_mm = 23.0
    elif reference_type == "custom_card":
        if not custom_dimension_mm or custom_dimension_mm <= 0:
            return None, None, "failed", ["Custom reference dimension must be greater than 0 mm"]
        nominal_mm = float(custom_dimension_mm)
    else:
        nominal_mm = 27.0

    h, w = image_bgr.shape[:2]
    total_area = h * w
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (7, 7), 2.0)

    # Convert to HSV to differentiate coins from red/orange tomatoes
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    
    # We look for candidate circular contours:
    # 1. Adaptive threshold and edge detection
    edges = cv2.Canny(blurred, 40, 120)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    edges_dilated = cv2.dilate(edges, kernel, iterations=1)
    
    contours, _ = cv2.findContours(edges_dilated, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    candidate_coins = []
    
    # Also attempt HoughCircles as a robust complementary method
    min_radius = int(min(h, w) * 0.015)
    max_radius = int(min(h, w) * 0.20)
    
    detected_circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=min_radius * 2,
        param1=90,
        param2=35,
        minRadius=min_radius,
        maxRadius=max_radius
    )

    if detected_circles is not None:
        detected_circles = np.uint16(np.around(detected_circles[0]))
        for (cx, cy, r) in detected_circles:
            # Check bounding box
            x1, y1 = max(0, cx - r), max(0, cy - r)
            x2, y2 = min(w, cx + r), min(h, cy + r)
            if x2 <= x1 or y2 <= y1:
                continue
            
            # Check color inside circle: tomatoes have high red/orange saturation
            roi_hsv = hsv[y1:y2, x1:x2]
            if roi_hsv.size == 0:
                continue
            mean_sat = float(np.mean(roi_hsv[:, :, 1]))
            mean_val = float(np.mean(roi_hsv[:, :, 2]))
            mean_hue = float(np.mean(roi_hsv[:, :, 0]))

            # Tomatoes have high saturation (>80) and red hue (0-16 or 165-180)
            is_tomato_red = (mean_sat > 75) and (mean_hue <= 16 or mean_hue >= 165)
            if is_tomato_red:
                continue
            
            candidate_coins.append({
                "type": "hough_circle",
                "center": (int(cx), int(cy)),
                "radius": float(r),
                "diameter_px": float(r * 2),
                "box": (int(x1), int(y1), int(x2 - x1), int(y2 - y1)),
                "mean_sat": mean_sat,
                "mean_val": mean_val,
                "score": 1.0 / (1.0 + abs(mean_sat - 50))
            })

    # Evaluate contours for circularity
    for c in contours:
        area = cv2.contourArea(c)
        if area < (np.pi * (min_radius ** 2)) or area > (np.pi * (max_radius ** 2)):
            continue
            
        perimeter = cv2.arcLength(c, True)
        if perimeter <= 0:
            continue
            
        circularity = 4.0 * np.pi * area / (perimeter ** 2)
        if circularity < 0.78:
            continue
            
        (cx, cy), radius = cv2.minEnclosingCircle(c)
        x, y, bw, bh = cv2.boundingRect(c)
        aspect_ratio = float(bw) / float(bh) if bh > 0 else 0
        if not (0.80 <= aspect_ratio <= 1.25):
            continue
            
        # Check color
        roi_hsv = hsv[max(0, y):min(h, y+bh), max(0, x):min(w, x+bw)]
        if roi_hsv.size == 0:
            continue
        mean_sat = float(np.mean(roi_hsv[:, :, 1]))
        mean_hue = float(np.mean(roi_hsv[:, :, 0]))

        # Exclude tomato-red objects
        is_tomato_red = (mean_sat > 75) and (mean_hue <= 16 or mean_hue >= 165)
        if is_tomato_red:
            continue
        
        candidate_coins.append({
            "type": "contour_circle",
            "center": (int(cx), int(cy)),
            "radius": float(radius),
            "diameter_px": float(radius * 2),
            "box": (int(x), int(y), int(bw), int(bh)),
            "circularity": float(circularity),
            "mean_sat": mean_sat,
            "score": circularity * (1.0 / (1.0 + abs(mean_sat - 50)))
        })

    if not candidate_coins:
        warnings.append(f"No plausible reference object ({reference_type}) was detected in the photograph.")
        warnings.append("Note: Place the coin flat beside tomatoes on a plain, light background.")
        return None, None, "uncalibrated", warnings

    # Sort candidates by score and pick best candidate
    candidate_coins.sort(key=lambda x: x["score"], reverse=True)
    best_candidate = candidate_coins[0]
    
    diameter_px = best_candidate["diameter_px"]
    if diameter_px <= 10:
        warnings.append("Detected reference object diameter in pixels is too small for reliable calibration.")
        return None, None, "uncertain", warnings

    pixels_per_mm = diameter_px / nominal_mm

    # Check plausibility of pixels_per_mm
    # A standard mobile photo of ~1200px width with coin ~80-300px gives ~3 to 12 px/mm
    confidence = "high"
    if pixels_per_mm < 0.5 or pixels_per_mm > 40.0:
        confidence = "low"
        warnings.append(f"Calibration ratio ({pixels_per_mm:.2f} px/mm) is unusually extreme. Measurements may exhibit perspective distortion.")

    warnings.append("Calibration note: A single reference coin cannot fully correct camera tilt or 3D perspective distortion.")

    ref_info = {
        "reference_type": reference_type,
        "nominal_diameter_mm": nominal_mm,
        "detected_diameter_pixels": round(diameter_px, 1),
        "pixels_per_mm": round(pixels_per_mm, 3),
        "center": best_candidate["center"],
        "radius": round(best_candidate["radius"], 1),
        "box": best_candidate["box"],
        "confidence": confidence
    }

    return pixels_per_mm, ref_info, confidence, warnings
