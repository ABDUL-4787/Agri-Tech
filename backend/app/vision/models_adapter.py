import os
from pathlib import Path
from typing import Optional, Dict, Any, List
import numpy as np

class OptionalModelAdapter:
    """
    Adapter for optional lightweight ML models (YOLO segmentation or MobileNetV3 classifier).
    
    Adheres strictly to the requirement:
    - Never download weights on request.
    - Model paths are configurable.
    - Return meaningful, structured errors when weights are missing; never fabricate mock predictions.
    - When weights are not configured, transparently declare fallback to the deterministic OpenCV baseline.
    """
    def __init__(self, yolo_weights_path: Optional[str] = None, mobilenet_weights_path: Optional[str] = None):
        self.yolo_path = yolo_weights_path or os.getenv("YOLO_WEIGHTS_PATH", "")
        self.mobilenet_path = mobilenet_weights_path or os.getenv("MOBILENET_WEIGHTS_PATH", "")
        self._yolo_model = None
        self._mobilenet_model = None

    def is_yolo_available(self) -> bool:
        return bool(self.yolo_path and Path(self.yolo_path).is_file())

    def is_mobilenet_available(self) -> bool:
        return bool(self.mobilenet_path and Path(self.mobilenet_path).is_file())

    def segment_with_yolo(self, image_bgr: np.ndarray) -> List[np.ndarray]:
        if not self.is_yolo_available():
            raise FileNotFoundError(
                f"Configured YOLO segmentation weights not found at '{self.yolo_path}'. "
                "AgriGrade uses the transparent OpenCV watershed pipeline by default. "
                "To enable YOLO, place valid weights at the path specified in YOLO_WEIGHTS_PATH."
            )
        # Placeholder for PyTorch / ONNX loading when user installs task-specific weights
        raise NotImplementedError("YOLO segmentation runtime loaded without pre-trained model weights.")

    def classify_condition_with_mobilenet(self, crop_bgr: np.ndarray) -> Dict[str, float]:
        if not self.is_mobilenet_available():
            raise FileNotFoundError(
                f"Configured MobileNetV3 weights not found at '{self.mobilenet_path}'. "
                "AgriGrade defaults to deterministic OpenCV Lab/HSV defect heuristics. "
                "Pretrained ImageNet weights cannot reliably assess tomato blemishes without fine-tuning."
            )
        raise NotImplementedError("MobileNetV3 runtime requires task-specific calibrated checkpoint.")

model_adapter = OptionalModelAdapter()
