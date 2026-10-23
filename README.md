# AgriGrade — AI-Powered Tomato Quality & Size Grading Platform

**AgriGrade** is a production-minded AI computer vision platform designed to help Indian farmers and mandi buyers independently assess tomato quality, measure physical fruit size, generate tamper-evident grading reports, and eliminate disputes over unexplained price deductions.

---

## 1. Key Capabilities & Implemented Features

- **Reference Coin Calibration**:
  - Automatically identifies standard Indian ₹10 coins (nominal 27.0 mm) or ₹5 coins (nominal 23.0 mm) or user-specified custom reference cards to compute exact physical `pixels_per_mm` scale.
  - Perspective distortion and tilt warnings; returns `"Size not measured"` gracefully if coin detection fails or is missing.
- **Watershed Segmentation**:
  - Separates touching tomatoes using distance transform and OpenCV watershed segmentation without merging them into a single fruit.
- **Standardized Size Codes (1 to 8)**:
  - Sizes classified from Size 1 (30–34 mm) to Size 8 (102 mm+) based on AGMARK/UNECE standards, enforcing 35 mm minimum for round and 30 mm minimum for oblong tomatoes.
- **Ripening Color Stage Classification**:
  - HSV red surface proportion mapped to 6 non-overlapping stages: *Mature Green* (0–2%), *Breaker* (2–10%), *Turning* (10–30%), *Pink* (30–60%), *Red* (60–90%), *Mature Red* (>90%).
- **Visible Defect Heuristics**:
  - Measures surface dark spot area percentage (blossom-end rot, necrotic blemishes, lesions) and detects surface cracks.
- **Explainable Quality Grading Policy**:
  - Configurable in `backend/config/tomato_standards.json` with strict rule precedence:
    - **Extra Class**: Defect area < 1.0%, axis ratio ≥ 0.90, uniform color, meets min size.
    - **Class I**: Defect area ≤ 3.0%, axis ratio ≥ 0.80, meets min size.
    - **Class II**: Defect area ≤ 8.0%, axis ratio ≥ 0.65, greenback allowed.
    - **Below Standard**: Defect area > 8.0%, axis ratio < 0.65, undersized, or visible cracks/decay.
  - Generates clear explanation notes for every fruit.
- **Lot-Level Tolerance Aggregation**:
  - Extra lot allows max 5% out-of-grade; Class I and II allow max 10% out-of-grade.
- **Indicative Mandi Pricing**:
  - Applies quality multipliers (Extra: 1.15, Class I: 1.00, Class II: 0.80, Below standard: 0.50) to user-supplied mandi benchmark prices.
- **Tamper-Evident SHA-256 Fingerprinting**:
  - Canonical JSON serialization of report results hashed with SHA-256 and cryptographically verified on retrieval.
- **Append-Only Acknowledgement Audit Trail**:
  - Farmer and buyer Accept/Dispute signatures chained to previous hash (`prev_hash`, `ack_hash`); duplicate submissions by the same party are rejected (HTTP 409).
- **QR Code & Report Sharing**:
  - Generates PNG QR codes pointing to stable report URLs; clipboard copy and Web Share API.
- **Trilingual Localization (English, Hindi, Telugu)**:
  - Complete interface translations for all screens, size codes, defect labels, and legal notices.
  - Browser Speech Synthesis read-aloud support (`en-IN`, `hi-IN`, `te-IN`).
- **Mobile-First PWA**:
  - Installable Progressive Web App with manifest and service worker offline caching.

---

## 2. Project Directory Structure

```
agrigrade/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py             # FastAPI routes (/health, /crops, /grade, /reports, /ack, /prices)
│   │   ├── crops/
│   │   │   └── tomato.py             # Tomato grading policy, rule precedence, lot aggregation
│   │   ├── database/
│   │   │   └── session.py            # SQLite & Neon PostgreSQL engine/session factory
│   │   ├── models/
│   │   │   └── report.py             # Report and Acknowledgement SQLAlchemy models
│   │   ├── schemas/
│   │   │   └── grading.py            # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── integrity.py          # Canonical SHA-256 hashing & ack hash chaining
│   │   │   ├── qr_service.py         # QR code generator with stable URL
│   │   │   └── storage.py            # Storage abstraction (local vs serverless memory/base64)
│   │   ├── vision/
│   │   │   ├── pipeline.py           # OpenCV pipeline (validation, watershed, measurements)
│   │   │   ├── calibration.py        # Coin calibration (₹10: 27mm, ₹5: 23mm, custom card)
│   │   │   ├── color.py              # HSV surface red % and color stages
│   │   │   ├── defects.py            # Dark spot blemish area %, cracks, decay indicators
│   │   │   ├── annotation.py         # Renders contours, ellipses, size mm, grade badges
│   │   │   └── models_adapter.py     # Optional YOLO / MobileNetV3 hooks with error handling
│   │   ├── config.py                 # Application settings and environment resolution
│   │   └── main.py                   # FastAPI main app, CORS, static frontend mounting
│   ├── config/
│   │   └── tomato_standards.json     # Configurable thresholds, size codes, and tolerance limits
│   └── tests/
│       ├── test_api_endpoints.py     # End-to-end API test suite
│       ├── test_grading_engine.py    # Grading policy, size codes, and tolerances
│       ├── test_integrity.py         # SHA-256 fingerprint & ack hash chaining
│       ├── test_vision_pipeline.py   # Synthetic OpenCV contour, coin, and defect tests
│       └── test_deployment_readiness.py # Vercel entry point & manifest validation
├── frontend/
│   ├── css/
│   │   └── style.css                 # Responsive AgriTech design system
│   ├── js/
│   │   ├── api.js                    # Backend API client
│   │   ├── app.js                    # UI controller, camera capture, hash router, audio
│   │   └── i18n.js                   # English, Hindi, and Telugu translation dictionaries
│   ├── index.html                    # Single page PWA shell (14 views)
│   ├── manifest.json                 # Web App Manifest
│   └── service-worker.js             # Service worker offline caching
├── api/
│   └── index.py                      # Vercel Serverless Python entry point
├── migrations/
│   └── init_db.py                    # Database schema synchronization script
├── .env.example                      # Documented environment variables
├── .gitignore                        # Gitignore file
├── Dockerfile                        # Container for standalone grading service
├── render.yaml                       # Render deployment specification
├── requirements.txt                  # Python dependencies
├── vercel.json                       # Vercel deployment routing and headers
└── README.md                         # Comprehensive documentation
```

---

## 3. Local Installation & Setup (Windows)

### Prerequisites
- Python 3.10+ (Verified on Python 3.14.4)
- Pip

### Commands
Open PowerShell in the project directory:

```powershell
# 1. Create a Python virtual environment
python -m venv .venv

# 2. Activate the virtual environment
.\.venv\Scripts\Activate.ps1

# 3. Install required dependencies
pip install -r requirements.txt

# 4. Initialize database schema
python migrations\init_db.py
```

---

## 4. Running the Local Application

Start the local server with Uvicorn:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Open your browser to:
- **Web Application**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 5. Taking & Uploading Tomato Photographs

For best measurement accuracy:
1. **Surface**: Place tomatoes on a flat, plain, light-coloured background (white paper, cloth, or plain tray).
2. **Spacing**: Separate tomatoes so they do not overlap heavily.
3. **Reference Coin**: Place a clean standard Indian ₹10 coin (27 mm) or ₹5 coin (23 mm) flat beside the fruit.
4. **Camera Angle**: Hold camera directly above (perpendicular top-down angle) in clear daylight.
5. **Upload**: In the AgriGrade UI, tap **Open Camera** on your mobile device or drag-and-drop up to 3 photographs.

---

## 6. Running Automated Tests

Run the complete automated test suite with pytest:

```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests/ -v
```

### Verified Test Suite Results:
- `test_health_endpoint`: Verified
- `test_crops_and_standards_endpoints`: Verified
- `test_prices_endpoint`: Verified
- `test_full_grade_and_report_lifecycle`: Verified
- `test_size_code_boundaries`: Verified
- `test_shape_classification`: Verified
- `test_individual_fruit_quality_classes`: Verified
- `test_critical_defect_overrides`: Verified
- `test_lot_aggregation_and_tolerances`: Verified
- `test_empty_lot`: Verified
- `test_canonical_json_determinism`: Verified
- `test_tamper_detection`: Verified
- `test_ack_hash_chain`: Verified
- `test_synthetic_detection_and_calibration`: Verified
- `test_missing_reference_object`: Verified
- `test_no_fruit_detected`: Verified
- `test_touching_tomatoes_watershed`: Verified
- `test_defect_detection_on_synthetic_fruit`: Verified
- `test_blurry_and_dark_warnings`: Verified
- `test_vercel_json_validity`: Verified
- `test_vercel_serverless_entry_point`: Verified
- `test_standards_json`: Verified
- `test_frontend_files_and_views`: Verified
- `test_i18n_keys_parity`: Verified

**Total**: 24 tests passed (100% success rate).

---

## 7. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check (DB, vision engine, version) |
| `GET` | `/api/crops` | List of supported crops (`tomato`) |
| `GET` | `/api/standards/{crop}` | Configurable standards, size codes, tolerances |
| `POST` | `/api/grade` | Upload 1–3 images + coin reference for AI grading |
| `GET` | `/api/reports/{id}` | Retrieve report and verify SHA-256 integrity |
| `GET` | `/api/reports/{id}/image/{n}` | Serve annotated photograph `n` with geometry overlay |
| `GET` | `/api/reports/{id}/qr` | Generate and serve report QR code PNG |
| `POST` | `/api/reports/{id}/ack` | Farmer/Buyer Accept/Dispute hash-chained acknowledgement |
| `GET` | `/api/reports` | List recent reports (supports `?ids=a,b`) |
| `GET` | `/api/prices` | Mandi benchmark integration status & multipliers |

---

## 8. Database Setup (SQLite & Neon PostgreSQL)

- **Local Development**: Default SQLite database stored at `data/agrigrade.db`.
- **Production (Neon PostgreSQL)**:
  1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech).
  2. Copy the connection string (e.g., `postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require`).
  3. Set the `DATABASE_URL` environment variable.
  4. Run `python migrations/init_db.py` to create tables and indexes.

---

## 9. Vercel Deployment Guide

### Deployment Architecture
- **Frontend**: Static files served from `frontend/` (via `vercel.json` rewrites).
- **Backend API**: Serverless Python function in `api/index.py` handling `/api/*` endpoints.
- **Database**: Neon PostgreSQL via `DATABASE_URL`.

### Steps to Deploy on Vercel:
1. Push project to a GitHub repository.
2. Log into [Vercel](https://vercel.com) and click **Add New Project** -> Import repository.
3. Configure Environment Variables in Vercel Project Settings:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `STORAGE_TYPE`: `memory` (stateless serverless storage).
   - `PUBLIC_BASE_URL`: Your deployed Vercel domain (e.g. `https://agrigrade.vercel.app`).
4. Click **Deploy**. Vercel will install dependencies from `requirements.txt`, route `/api/*` requests to `api/index.py`, and serve the responsive PWA frontend.

---

## 10. External Grading Service Fallback (Render / Docker)

If Vercel's serverless size limit (250MB) or memory constraints restrict OpenCV execution in high-concurrency production:
1. Deploy the included `Dockerfile` or `render.yaml` to Render, Railway, or AWS ECS as a dedicated microservice.
2. Set the environment variable on Vercel:
   ```
   GRADING_API_URL=https://agrigrade-vision.onrender.com
   ```
3. AgriGrade's Vercel serverless API will automatically route image processing requests to the dedicated microservice while preserving the identical API contract and database persistence.
4. **Estimated Cost**: Render Free Tier or $7/month starter web service for unlimited grading inference without GPU requirements.

---

## 11. Remaining Limitations & Field-Validation Protocol

### Physical Vision Limitations
1. **External View Only**: Visible external photographs cannot detect internal rot, hollow seed gel, or internal seed maturity.
2. **Perspective Distortion**: A single flat reference coin cannot fully correct severe 3D camera angles or extreme focal lens distortion.

### Field-Validation Workflow
Before presenting AgriGrade as a commercially calibrated negotiation benchmark:
1. Collect a dataset of **at least 200 physical tomatoes** representing local varieties (desi, hybrid, Roma, round, oblong).
2. Have a qualified human AGMARK mandi grader label each tomato for diameter (caliper measurement), visible defects, and quality class.
3. Photograph each tomato under varying mandi daylight conditions with the reference coin.
4. Run AgriGrade across the dataset to compute:
   - Class-wise agreement percentage (Extra, Class I, Class II, Below standard).
   - Confusion matrix.
   - Mean absolute error (MAE) in millimetres between OpenCV calibrated diameter and physical caliper readings.
5. Calibrate the thresholds in `backend/config/tomato_standards.json` based on the empirical field validation findings.
