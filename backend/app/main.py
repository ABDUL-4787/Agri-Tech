from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.config import settings
from backend.app.database.session import init_db
from backend.app.api.routes import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    init_db()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AgriGrade AI-Powered Tomato Grading Platform — Independent quality reference for Indian farmers and mandi buyers.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vercel serverless request path middleware:
# Restores original URL if Vercel internal rewrites rewrite the path to /api/index.py
from fastapi import Request

@app.middleware("http")
async def vercel_path_rewrite_fix(request: Request, call_next):
    path = request.scope.get("path", "")
    if "index.py" in path:
        headers = request.headers
        for header_key in ("x-matched-path", "x-invoke-path", "x-forwarded-uri"):
            original = headers.get(header_key)
            if original and "index.py" not in original:
                request.scope["path"] = original.split("?")[0]
                break
    return await call_next(request)

# Include API Router under both /api and root prefix to guarantee route matching on Vercel
app.include_router(api_router, prefix=settings.API_PREFIX)
app.include_router(api_router, prefix="")

# Serve Frontend static files if directory exists
frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
