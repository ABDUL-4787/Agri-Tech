import cv2
import numpy as np
from typing import List, Dict, Any, Optional

CLASS_COLORS = {
    "Extra": (34, 139, 34),       # Forest Green (BGR)
    "Class I": (0, 180, 0),       # Vibrant Green
    "Class II": (0, 140, 255),    # Orange
    "Below standard": (0, 0, 220),# Red
    "Unknown": (128, 128, 128)
}

def annotate_image(
    image_bgr: np.ndarray,
    fruits: List[Dict[str, Any]],
    ref_info: Optional[Dict[str, Any]] = None
) -> np.ndarray:
    """
    Produces a transparently annotated photograph showing fruit contours, fitted geometry,
    fruit ID numbers, diameter in mm, quality grade badges, and reference coin markings.
    """
    annotated = image_bgr.copy()
    h, w = annotated.shape[:2]

    # Draw reference object if present
    if ref_info and "center" in ref_info and "radius" in ref_info:
        cx, cy = ref_info["center"]
        r = int(ref_info["radius"])
        cv2.circle(annotated, (cx, cy), r, (255, 255, 0), 2)  # Cyan circle
        cv2.circle(annotated, (cx, cy), 3, (0, 255, 255), -1)
        ref_text = f"Ref: {ref_info['reference_type']} ({ref_info.get('nominal_diameter_mm', 0):.0f}mm)"
        cv2.putText(annotated, ref_text, (max(10, cx - r - 20), max(20, cy - r - 8)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 0), 2, cv2.LINE_AA)

    # Draw fruits
    for fruit in fruits:
        f_id = fruit["fruit_id"]
        q_class = fruit.get("quality_class", "Unknown")
        color = CLASS_COLORS.get(q_class, (0, 200, 200))

        contour = fruit.get("contour")
        if contour is not None and len(contour) > 0:
            cv2.drawContours(annotated, [contour], -1, color, 2)

        # Highlight defects if defect mask exists
        defect_mask = fruit.get("defect_mask")
        if defect_mask is not None:
            # overlay red tint for defects
            defect_pts = np.where(defect_mask > 0)
            if len(defect_pts[0]) > 0:
                overlay = annotated.copy()
                overlay[defect_pts] = [0, 0, 255]
                cv2.addWeighted(overlay, 0.45, annotated, 0.55, 0, annotated)

        # Draw ellipse if available
        ellipse = fruit.get("ellipse")
        if ellipse is not None:
            try:
                cv2.ellipse(annotated, ellipse, (200, 200, 200), 1)
            except Exception:
                pass

        # Text badge location
        center = fruit.get("center", (w // 2, h // 2))
        cx, cy = int(center[0]), int(center[1])

        dia_str = f"{fruit['diameter_mm']:.1f}mm" if fruit.get("diameter_mm") is not None else "No Size"
        label_line1 = f"#{f_id}: {q_class}"
        label_line2 = f"{dia_str} | {fruit.get('color_stage', '')}"

        # Draw small background pill for readability
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.50
        thickness = 1
        
        (w1, h1), _ = cv2.getTextSize(label_line1, font, font_scale, thickness)
        (w2, h2), _ = cv2.getTextSize(label_line2, font, font_scale, thickness)
        box_w = max(w1, w2) + 14
        box_h = h1 + h2 + 16

        bx = max(5, min(w - box_w - 5, cx - box_w // 2))
        by = max(5, min(h - box_h - 5, cy - box_h // 2))

        # Pill background
        cv2.rectangle(annotated, (bx, by), (bx + box_w, by + box_h), (25, 25, 25), -1)
        cv2.rectangle(annotated, (bx, by), (bx + box_w, by + box_h), color, 2)

        # Text
        cv2.putText(annotated, label_line1, (bx + 7, by + h1 + 4), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)
        cv2.putText(annotated, label_line2, (bx + 7, by + h1 + h2 + 10), font, 0.40, (220, 220, 220), 1, cv2.LINE_AA)

    return annotated

def annotate_debug_image(
    image_bgr: np.ndarray,
    ref_info: Optional[Dict[str, Any]],
    accepted_fruits: List[Dict[str, Any]],
    rejected_shapes: List[Dict[str, Any]],
    debug_text: str
) -> np.ndarray:
    """
    PART 1: Debug view (admin only)
    Draws on the photo:
      - A green circle on the coin the app chose.
      - A numbered green box on every shape accepted as fruit.
      - A grey box on every shape rejected, with the reason
        (too small, too big, not round, glare, touching the edge).
      - Text at the top: 'Coin: X px = 27 mm. Scale: Y px per mm. Found: N. Rejected: M.'
    """
    debug_img = image_bgr.copy()
    h, w = debug_img.shape[:2]

    # Top banner background bar
    banner_h = 44
    cv2.rectangle(debug_img, (0, 0), (w, banner_h), (25, 25, 25), -1)
    cv2.putText(
        debug_img,
        debug_text,
        (15, 29),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.62,
        (255, 255, 255),
        2,
        cv2.LINE_AA
    )

    # 1. Green circle on the coin the app chose
    if ref_info and "center" in ref_info and "radius" in ref_info:
        cx, cy = int(ref_info["center"][0]), int(ref_info["center"][1])
        r = int(ref_info["radius"])
        cv2.circle(debug_img, (cx, cy), r, (0, 255, 0), 3)
        cv2.putText(
            debug_img,
            "COIN",
            (max(5, cx - 22), max(18, cy - r - 6)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 255, 0),
            2,
            cv2.LINE_AA
        )

    # 2. Numbered green box on every shape accepted as fruit
    for idx, item in enumerate(accepted_fruits, start=1):
        f_id = item.get("fruit_id") or item.get("id", idx)
        bx, by, bw, bh = item["box"]
        # Green box
        cv2.rectangle(debug_img, (bx, by), (bx + bw, by + bh), (0, 255, 0), 2)
        # Numbered tag
        tag_str = f"#{f_id}"
        (tw, th), _ = cv2.getTextSize(tag_str, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        tag_y = max(banner_h + 2, by)
        cv2.rectangle(debug_img, (bx, tag_y - th - 6), (bx + tw + 8, tag_y), (0, 255, 0), -1)
        cv2.putText(debug_img, tag_str, (bx + 4, tag_y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2, cv2.LINE_AA)

    # 3. Grey box on every shape rejected, with reason
    for item in rejected_shapes:
        bx, by, bw, bh = item["box"]
        reason = item.get("reason", "rejected")
        # Grey box (128, 128, 128)
        cv2.rectangle(debug_img, (bx, by), (bx + bw, by + bh), (128, 128, 128), 2)
        # Reason label
        (tw, th), _ = cv2.getTextSize(reason, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        tag_y = max(banner_h + 2, by)
        cv2.rectangle(debug_img, (bx, tag_y - th - 6), (bx + tw + 8, tag_y), (128, 128, 128), -1)
        cv2.putText(debug_img, reason, (bx + 4, tag_y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

    return debug_img

