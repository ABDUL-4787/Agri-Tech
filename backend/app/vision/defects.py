import cv2
import numpy as np
from typing import Tuple, List, Dict, Any

def estimate_visible_defects(
    image_bgr: np.ndarray,
    mask: np.ndarray,
    variety: str = "Not sure"
) -> Tuple[float, bool, bool, np.ndarray, List[str]]:
    """
    OpenCV heuristic to estimate surface blemishes, rot, and skin cracks,
    with calyx/stem scar exclusion and specular highlight/shadow filtering.
    
    Returns:
      (defect_area_pct, has_cracks, has_decay, defect_mask, warnings)
    """
    warnings = []
    total_fruit_pixels = int(cv2.countNonZero(mask))
    if total_fruit_pixels == 0:
        return 0.0, False, False, np.zeros_like(mask), ["Empty mask for defect estimation"]

    # 1. Convert to color spaces
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    l_channel = lab[:, :, 0]

    # 2. Calyx (stem scar & green star) exclusion:
    # Detect green hue near center/top of fruit contour
    # Calyx has green/olive hue: H in [35, 85], S in [40, 255], V in [30, 240]
    calyx_mask = cv2.inRange(hsv, np.array([32, 35, 30]), np.array([88, 255, 240]))
    calyx_mask = cv2.bitwise_and(calyx_mask, calyx_mask, mask=mask)
    # Calyx is typically located in the central 50% or upper region of the fruit
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if cnts:
        c = max(cnts, key=cv2.contourArea)
        M = cv2.moments(c)
        if M["m00"] > 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
            # Create a central elliptical zone for calyx
            h, w = mask.shape
            calyx_zone = np.zeros((h, w), dtype=np.uint8)
            radius = int(np.sqrt(total_fruit_pixels / np.pi) * 0.45)
            cv2.circle(calyx_zone, (cx, cy), radius, 255, -1)
            calyx_mask = cv2.bitwise_and(calyx_mask, calyx_zone)
        else:
            calyx_mask.fill(0)
    else:
        calyx_mask.fill(0)

    # 3. Specular highlights & water drops exclusion:
    # Very bright specular reflections (L > 92 or V > 240 with low saturation)
    specular_mask = ((l_channel > 235) | (gray > 240)) & (mask > 0)
    specular_mask = specular_mask.astype(np.uint8) * 255

    # 4. Perimeter shadow boundary exclusion:
    # Erode fruit mask slightly (4 pixels) so edge contact shadow with cloth is not called damage
    kernel_5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    clean_fruit_mask = cv2.erode(mask, kernel_5, iterations=1)

    # Average lightness of clean fruit area
    fruit_l_values = l_channel[clean_fruit_mask > 0]
    mean_l = float(np.mean(fruit_l_values)) if fruit_l_values.size > 0 else 128.0
    std_l = float(np.std(fruit_l_values)) if fruit_l_values.size > 0 else 20.0

    # 5. Dark Spot Segmentation:
    dark_threshold = max(35, mean_l - max(20.0, 1.25 * std_l))
    dark_mask = (l_channel < dark_threshold) & (clean_fruit_mask > 0)
    dark_mask = dark_mask.astype(np.uint8) * 255

    # Remove calyx and specular reflections from dark mask
    dark_mask = cv2.bitwise_and(dark_mask, cv2.bitwise_not(calyx_mask))
    dark_mask = cv2.bitwise_and(dark_mask, cv2.bitwise_not(specular_mask))

    # Morphological opening to remove single pixel noise
    kernel_3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    dark_mask_clean = cv2.morphologyEx(dark_mask, cv2.MORPH_OPEN, kernel_3)

    # 6. Crack / Fissure Detection:
    interior_gray = cv2.bitwise_and(gray, gray, mask=clean_fruit_mask)
    edges = cv2.Canny(interior_gray, 70, 160)
    edges = cv2.bitwise_and(edges, edges, mask=clean_fruit_mask)
    edges = cv2.bitwise_and(edges, cv2.bitwise_not(calyx_mask))

    crack_contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    has_cracks = False
    for cc in crack_contours:
        length = cv2.arcLength(cc, False)
        if length > 30:
            has_cracks = True
            break

    # 7. Decay / Rot Check:
    has_decay = False
    dark_contours, _ = cv2.findContours(dark_mask_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for dc in dark_contours:
        if cv2.contourArea(dc) > (total_fruit_pixels * 0.06):
            has_decay = True
            break

    # Combine defect mask
    combined_defect_mask = cv2.bitwise_or(dark_mask_clean, edges)
    combined_defect_mask = cv2.bitwise_and(combined_defect_mask, combined_defect_mask, mask=clean_fruit_mask)

    defect_pixels = int(cv2.countNonZero(combined_defect_mask))
    defect_area_pct = round((defect_pixels / float(total_fruit_pixels)) * 100.0, 1)

    return defect_area_pct, has_cracks, has_decay, combined_defect_mask, warnings
