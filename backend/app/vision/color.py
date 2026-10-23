import cv2
import numpy as np
from typing import Tuple, List, Dict, Any

def estimate_color_stage(
    image_bgr: np.ndarray,
    mask: np.ndarray
) -> Tuple[str, float, List[str]]:
    """
    Estimates the ripening color stage of a segmented tomato based on the percentage of red coloration.
    
    Stages:
      - Mature green: 0% - 2%
      - Breaker: >2% - 10%
      - Turning: >10% - 30%
      - Pink: >30% - 60%
      - Red: >60% - 90%
      - Mature red: >90%
      
    Returns:
      (stage_name, red_percentage, warnings)
    """
    warnings = []
    
    total_pixels = int(cv2.countNonZero(mask))
    if total_pixels == 0:
        return "Unknown", 0.0, ["Empty mask provided for color estimation"]

    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)

    # Red hue wraps around 0 and 180
    # Lower red range (hue 0 to 12)
    lower_red1 = np.array([0, 50, 45], dtype=np.uint8)
    upper_red1 = np.array([14, 255, 255], dtype=np.uint8)
    # Upper red range (hue 165 to 180)
    lower_red2 = np.array([165, 50, 45], dtype=np.uint8)
    upper_red2 = np.array([180, 255, 255], dtype=np.uint8)

    mask_red1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask_red2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = cv2.bitwise_or(mask_red1, mask_red2)

    # Restrict to tomato fruit area
    fruit_red = cv2.bitwise_and(red_mask, red_mask, mask=mask)
    red_pixels = int(cv2.countNonZero(fruit_red))

    red_pct = round((red_pixels / float(total_pixels)) * 100.0, 1)

    # Map to stage
    if red_pct < 2.0:
        stage = "Mature green"
    elif red_pct <= 10.0:
        stage = "Breaker"
    elif red_pct <= 30.0:
        stage = "Turning"
    elif red_pct <= 60.0:
        stage = "Pink"
    elif red_pct <= 90.0:
        stage = "Red"
    else:
        stage = "Mature red"

    # Illumination checks
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    fruit_gray = gray[mask > 0]
    if fruit_gray.size > 0:
        mean_lum = float(np.mean(fruit_gray))
        if mean_lum < 60:
            warnings.append("Low illumination detected on fruit surface; color stage estimate may be biased toward darker hues.")
        elif mean_lum > 220:
            warnings.append("Strong glare or specular reflection detected; may wash out surface color readings.")

    warnings.append("External color estimation reflects visible skin pigmentation only; internal ripeness and seed gel maturity cannot be measured externally.")

    return stage, red_pct, warnings
