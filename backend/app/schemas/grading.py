from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class FruitResultSchema(BaseModel):
    fruit_id: int
    quality_class: str
    diameter_mm: Optional[float] = None
    size_code: Optional[int] = None
    size_label: Optional[str] = None
    shape_category: str
    axis_ratio: float
    color_stage: str
    defect_area_pct: float
    has_cracks: bool = False
    has_decay: bool = False
    confidence: str
    reasons: List[str] = []
    warnings: List[str] = []

class IndicativePriceSchema(BaseModel):
    base_mandi_price_per_kg: float
    class_multiplier: float
    indicative_price_per_kg: float
    calculation_formula: str
    disclaimer: str

class LotReportSchema(BaseModel):
    lot_class: str
    n_fruit: int
    class_counts: Dict[str, int]
    class_percentages: Dict[str, float]
    reasons: List[str] = []
    warnings: List[str] = []
    indicative_price: Optional[IndicativePriceSchema] = None

class AcknowledgementCreate(BaseModel):
    party: Literal["farmer", "buyer"] = Field(..., description="Party submitting acknowledgement: 'farmer' or 'buyer'")
    verdict: Literal["accept", "dispute"] = Field(..., description="Verdict: 'accept' or 'dispute'")
    note: Optional[str] = Field("", description="Optional notes or reasons for dispute")

class AcknowledgementResponse(BaseModel):
    id: int
    report_id: str
    party: str
    verdict: str
    note: Optional[str] = ""
    created_at: str
    prev_hash: str
    ack_hash: str

class ReportDetailResponse(BaseModel):
    id: str
    crop: str
    created_at: str
    lot_class: str
    n_fruit: int
    standards_version: str
    sha256: str
    tamper_status: str
    lot_report: LotReportSchema
    fruit_results: List[FruitResultSchema]
    calibration: Optional[Dict[str, Any]] = None
    pipeline_warnings: List[str] = []
    annotated_image_urls: List[str] = []
    qr_data_url: Optional[str] = None
    acknowledgements: List[AcknowledgementResponse] = []

class HealthResponse(BaseModel):
    status: str
    database: str
    vision_engine: str
    version: str
    standards_version: str
