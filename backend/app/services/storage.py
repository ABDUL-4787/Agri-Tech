import os
import base64
from pathlib import Path
from typing import Optional, Dict
from backend.app.config import settings

class StorageService:
    def __init__(self):
        self.storage_type = settings.STORAGE_TYPE
        self._memory_cache: Dict[str, bytes] = {}

    def save_image(self, file_bytes: bytes, filename: str, is_annotated: bool = False) -> str:
        """
        Saves image and returns reference key/URL.
        """
        if self.storage_type == "local":
            target_dir = settings.ANNOTATED_DIR if is_annotated else settings.UPLOAD_DIR
            target_dir.mkdir(parents=True, exist_ok=True)
            target_path = target_dir / filename
            with open(target_path, "wb") as f:
                f.write(file_bytes)
            return filename
        else:
            # Memory / Base64 fallback (works seamlessly on Vercel serverless)
            self._memory_cache[filename] = file_bytes
            return filename

    def get_image(self, filename: str, is_annotated: bool = False) -> Optional[bytes]:
        """
        Retrieves image bytes by filename reference.
        """
        if filename in self._memory_cache:
            return self._memory_cache[filename]

        if self.storage_type == "local":
            target_dir = settings.ANNOTATED_DIR if is_annotated else settings.UPLOAD_DIR
            target_path = target_dir / filename
            if target_path.is_file():
                with open(target_path, "rb") as f:
                    return f.read()

        return None

    def get_image_data_url(self, filename: str, is_annotated: bool = False) -> str:
        raw_bytes = self.get_image(filename, is_annotated=is_annotated)
        if not raw_bytes:
            return ""
        encoded = base64.b64encode(raw_bytes).decode("ascii")
        return f"data:image/jpeg;base64,{encoded}"

storage_service = StorageService()
