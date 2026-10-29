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
    
    # Filter glare mask: bright specular highlights (V > 238 and S < 35)
    glare_mask = cv2.inRange(hsv, np.array([0, 0, 238]), np.array([180, 35, 255]))
    
    def check_is_glare(roi_hsv: np.ndarray) -> bool:
        if roi_hsv.size == 0:
            return False
        mean_val = float(np.mean(roi_hsv[:, :, 2]))
        mean_sat = float(np.mean(roi_hsv[:, :, 1]))
        if mean_val > 238 and mean_sat < 35:
            return True
        white_ratio = np.sum((roi_hsv[:, :, 2] > 238) & (roi_hsv[:, :, 1] < 35)) / float(roi_hsv.shape[0] * roi_hsv.shape[1])
        return white_ratio > 0.35

    def evaluate_coin_candidate(cx: int, cy: int, radius: float, circularity: float, box: Tuple[int, int, int, int]) -> Optional[Dict[str, Any]]:
        # 1. Size check: reasonable coin fraction of image
        min_r = max(10.0, min(h, w) * 0.012)
        max_r = min(h, w) * 0.16
        if not (min_r <= radius <= max_r):
            return None
        if circularity < 0.68:
            return None
        
        # Sample pixels inside the circle (inner 75% radius to avoid background edge bleeding)
        sample_r = max(3, int(radius * 0.75))
        sample_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.circle(sample_mask, (int(cx), int(cy)), sample_r, 255, -1)
        sampled_hsv = hsv[sample_mask == 255]
        if sampled_hsv.size == 0:
            return None
            
        mean_sat = float(np.mean(sampled_hsv[:, 1]))
        mean_val = float(np.mean(sampled_hsv[:, 2]))
        mean_hue = float(np.mean(sampled_hsv[:, 0]))
        
        # 2. Glare check: ignore very bright white spots (specular reflections)
        if mean_val > 238 and mean_sat < 32:
            return None
        glare_ratio = np.sum((sampled_hsv[:, 2] > 238) & (sampled_hsv[:, 1] < 32)) / float(len(sampled_hsv))
        if glare_ratio > 0.35:
            return None
            
        # 3. Exclude tomato red/orange fruit (high saturation red)
        if (mean_sat > 80) and (mean_hue <= 11 or mean_hue >= 170):
            return None
            
        # 4. Gold or silver colour check
        # Gold/brass: hue 10 to 45, sat 20 to 170, val 45 to 235
        is_gold = (10 <= mean_hue <= 48) and (20 <= mean_sat <= 170) and (45 <= mean_val <= 235)
        # Silver/steel: low saturation (<= 45), metallic brightness 55 to 235
        is_silver = (mean_sat <= 45) and (55 <= mean_val <= 235)
        
        if not (is_gold or is_silver):
            return None
            
        color_score = 0.9 if is_gold else 0.8
        if is_gold:
            color_score -= (abs(mean_hue - 24) / 50.0)
        else:
            color_score -= (mean_sat / 100.0)
        color_score = max(0.1, color_score)
        
        ideal_r = min(h, w) * 0.045
        size_score = max(0.2, 1.0 - abs(radius - ideal_r) / (ideal_r * 2.5))
        total_score = (circularity ** 2) * color_score * size_score
        
        x, y, bw, bh = box
        return {
            "center": (int(cx), int(cy)),
            "radius": float(radius),
            "diameter_px": float(radius * 2),
            "box": (int(x), int(y), int(bw), int(bh)),
            "circularity": float(circularity),
            "mean_sat": mean_sat,
            "mean_val": mean_val,
            "is_gold": is_gold,
            "is_silver": is_silver,
            "score": float(total_score)
        }

    # Evaluate edges excluding glare
    edges = cv2.Canny(blurred, 40, 120)
    edges[glare_mask == 255] = 0  # ignore glare edges
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    edges_dilated = cv2.dilate(edges, kernel, iterations=1)
    
    contours, _ = cv2.findContours(edges_dilated, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    candidate_coins = []
    
    # 1. Hough circles
    min_radius = int(min(h, w) * 0.012)
    max_radius = int(min(h, w) * 0.16)
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
            x1, y1 = max(0, cx - r), max(0, cy - r)
            x2, y2 = min(w, cx + r), min(h, cy + r)
            if x2 <= x1 or y2 <= y1:
                continue
            cand = evaluate_coin_candidate(cx, cy, float(r), 0.95, (int(x1), int(y1), int(x2 - x1), int(y2 - y1)))
            if cand:
                candidate_coins.append(cand)

    # 2. Contours for circularity
    for c in contours:
        area = cv2.contourArea(c)
        if area < (np.pi * (min_radius ** 2)) or area > (np.pi * (max_radius ** 2)):
            continue
        perimeter = cv2.arcLength(c, True)
        if perimeter <= 0:
            continue
        circularity = 4.0 * np.pi * area / (perimeter ** 2)
        (cx, cy), radius = cv2.minEnclosingCircle(c)
        x, y, bw, bh = cv2.boundingRect(c)
        aspect_ratio = float(bw) / float(bh) if bh > 0 else 0
        if not (0.75 <= aspect_ratio <= 1.30):
            continue
        cand = evaluate_coin_candidate(int(cx), int(cy), float(radius), float(circularity), (int(x), int(y), int(bw), int(bh)))
        if cand:
            candidate_coins.append(cand)

    if not candidate_coins:
        warnings.append(f"No plausible reference object ({reference_type}) was detected in the photograph.")
        warnings.append("Note: Place the coin flat beside tomatoes on a plain, light background.")
        return None, None, "uncalibrated", warnings

    # Filter out inner concentric circles (e.g. inner core of bimetallic ₹10 coin)
    outer_candidates = []
    for cand in candidate_coins:
        is_inner = False
        cx, cy, r = cand["center"][0], cand["center"][1], cand["radius"]
        for other in candidate_coins:
            if cand is other:
                continue
            ocx, ocy, orad = other["center"][0], other["center"][1], other["radius"]
            dist = np.hypot(cx - ocx, cy - ocy)
            if dist < orad * 0.5 and r < orad * 0.85:
                is_inner = True
                break
        if not is_inner:
            outer_candidates.append(cand)
    if outer_candidates:
        candidate_coins = outer_candidates

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
