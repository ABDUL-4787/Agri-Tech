import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_DIR = BASE_DIR / "config"
DATA_DIR = BASE_DIR.parent / "data"

# Load environment variables from .env file
load_dotenv(BASE_DIR.parent / ".env")

class Settings(BaseModel):
    PROJECT_NAME: str = "AgriGrade"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'agrigrade.db'}")
    
    # Grading Service Fallback (if remote/external grading service is configured)
    GRADING_API_URL: str = os.getenv("GRADING_API_URL", "")
    
    # Storage settings
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")  # "local", "memory", "cloud"
    UPLOAD_DIR: Path = DATA_DIR / "uploads"
    ANNOTATED_DIR: Path = DATA_DIR / "annotated"
    
    # Base URL for QR codes and report links
    PUBLIC_BASE_URL: str = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")
    
    # Standards and Centralized Tuning Config
    TOMATO_STANDARDS_PATH: Path = CONFIG_DIR / "tomato_standards.json"
    GRADING_CONFIG_PATH: Path = CONFIG_DIR / "grading_config.json"
    
    # Image constraints
    MAX_IMAGE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    MAX_IMAGE_DIMENSION: int = 1600
    MIN_SHARPNESS_LAPLACIAN_VAR: float = 65.0
    MIN_BRIGHTNESS: float = 40.0
    MAX_BRIGHTNESS: float = 245.0

settings = Settings()

# Ensure local directories exist when running locally
if settings.STORAGE_TYPE == "local":
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.ANNOTATED_DIR.mkdir(parents=True, exist_ok=True)
