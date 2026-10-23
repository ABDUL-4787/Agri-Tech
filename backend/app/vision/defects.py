import cv2
import numpy as np
from typing import Tuple, List, Dict, Any

def estimate_visible_defects(
    image_bgr: np.ndarray,
    mask: np.ndarray
) -> Tuple[float, bool, bool, np.ndarray, List[str]]:
    """
    Transparent OpenCV heuristic to estimate surface dark spots, decay indicators, and visible cracks.
    
    Returns:
      (defect_area_pct, has_cracks, has_decay, defect_mask, warnings)
    """
    warnings = []
    total_fruit_pixels = int(cv2.countNonZero(mask))
    if total_fruit_pixels == 0:
        return 0.0, False, False, np.zeros_like(mask), ["Empty mask for defect estimation"]

    # Convert to Lab and Grayscale
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l_channel = lab[:, :, 0]

    # Calculate average lightness across the tomato mask
    fruit_l_values = l_channel[mask > 0]
    mean_l = float(np.mean(fruit_l_values)) if fruit_l_values.size > 0 else 128.0
    std_l = float(np.std(fruit_l_values)) if fruit_l_values.size > 0 else 20.0

    # 1. Dark Spot Segmentation:
    # Pixels noticeably darker than the fruit baseline lightness (e.g. necrotic spots, blossom end rot, bruising)
    dark_threshold = max(35, mean_l - max(20.0, 1.2 * std_l))
    dark_mask = (l_channel < dark_threshold) & (mask > 0)
    dark_mask = dark_mask.astype(np.uint8) * 255

    # Morphological opening to eliminate isolated pixel noise
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    dark_mask_clean = cv2.morphologyEx(dark_mask, cv2.MORPH_OPEN, kernel)

    # 2. Crack Detection:
    # High local gradients / sharp dark line fissures within the fruit interior
    # We erode mask slightly to avoid the boundary perimeter edge being flagged as a crack
    mask_eroded = cv2.erode(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)), iterations=1)
    interior_gray = cv2.bitwise_and(gray, gray, mask=mask_eroded)
    
    # Canny on interior
    edges = cv2.Canny(interior_gray, 60, 150)
    edges = cv2.bitwise_and(edges, edges, mask=mask_eroded)
    
    # Check for crack lines: find contours of edges
    crack_contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    has_cracks = False
    crack_pixels = 0
    
    for cc in crack_contours:
        length = cv2.arcLength(cc, False)
        # If there is a continuous crack line of significant length (e.g. > 25 pixels)
        if length > 28:
            has_cracks = True
            crack_pixels += int(cv2.contourArea(cc))

    # 3. Decay / Mould detection:
    # Severe dark discoloration or grayish fungal patches
    has_decay = False
    # Large concentrated dark blotch
    dark_contours, _ = cv2.findContours(dark_mask_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for dc in dark_contours:
        dc_area = cv2.contourArea(dc)
        # If single defect spot exceeds 6% of the entire fruit area, suspect decay or deep rot
        if dc_area > (total_fruit_pixels * 0.06):
            has_decay = True
            break

    # Combine defect mask
    combined_defect_mask = cv2.bitwise_or(dark_mask_clean, edges)
    combined_defect_mask = cv2.bitwise_and(combined_defect_mask, combined_defect_mask, mask=mask)
    
    defect_pixels = int(cv2.countNonZero(combined_defect_mask))
    defect_area_pct = round((defect_pixels / float(total_fruit_pixels)) * 100.0, 1)

    warnings.append("Defect heuristic disclaimer: Internal rot, hollow cavities, seed maturity, and hidden defects cannot be evaluated from external photographs.")
    if has_cracks:
        warnings.append("Surface fissure/crack detected on fruit skin.")
    if has_decay:
        warnings.append("Concentrated dark lesion detected; probable signs of deep blossom-end rot or visible decay.")

    return defect_area_pct, has_cracks, has_decay, combined_defect_mask, warnings
