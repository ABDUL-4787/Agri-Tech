from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class FruitResultSchema(BaseModel):
    fruit_id: int
    quality_class: str
    diameter_mm: Optional[float] = None
    approx_diameter_display: Optional[str] = None
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
    base_price: float
    lot_grade_price: Optional[float] = None
    multiplier_table: List[Dict[str, Any]] = []
    note_en: str
    note_hi: str
    note_te: str

class WilsonIntervalSchema(BaseModel):
    bad_count: int
    total_count: int
    point_estimate_pct: float
    low_pct: float
    high_pct: float
    simple_bar_en: str
    simple_bar_hi: str
    simple_bar_te: str

class LotReportSchema(BaseModel):
    lot_class: str
    verdict_status: str
    n_fruit: int
    summary_sentence: str
    class_counts: Dict[str, int]
    class_percentages: Dict[str, float]
    wilson_interval: Optional[WilsonIntervalSchema] = None
    indicative_price: Optional[IndicativePriceSchema] = None
    flags: List[str] = []
    surface_seen_note: str
    hidden_defect_note: str

class AcknowledgementCreate(BaseModel):
    party: Literal["farmer", "buyer"] = Field(..., description="Party submitting acknowledgement: 'farmer' or 'buyer'")
    verdict: Literal["accept", "dispute"] = Field(..., description="Verdict: 'accept' or 'dispute'")
    note: Optional[str] = Field("", description="Optional notes or reasons for dispute")
    pin: Optional[str] = Field(None, description="Optional 4-digit verification PIN")

class AcknowledgementResponse(BaseModel):
    id: int
    report_id: str
    party: str
    verdict: str
    note: Optional[str] = ""
    created_at: str
    prev_hash: str
    ack_hash: str
    verification_status: str = "Verified with PIN"

class ReportDetailResponse(BaseModel):
    id: str
    crop: str
    created_at: str
    lot_class: str
    n_fruit: int
    sha256: str
    fingerprint_status: str
    lot_report: Dict[str, Any]
    fruit_results: List[Dict[str, Any]]
    calibration: Optional[Dict[str, Any]] = None
    pipeline_warnings: List[str] = []
    flags: List[str] = []
    is_indicative_only: bool = False
    annotated_image_urls: List[str] = []
    qr_data_url: Optional[str] = None
    acknowledgements: List[AcknowledgementResponse] = []

class HealthResponse(BaseModel):
    status: str
    database: str
    vision_engine: str
    version: str
    standards_version: str
