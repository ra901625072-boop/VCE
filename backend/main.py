"""Main FastAPI application entry point for VCE Work & Money Flow Tracker."""
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse, RedirectResponse

from backend.core.config import settings, FRONTEND_DIR
from backend.database.migrations import init_db
from backend.api import (
    auth,
    people,
    work,
    payments,
    expenses,
    savings,
    dashboard,
    search,
    reports,
    settings as app_settings,
    vce
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run DB migrations on startup
    init_db(settings.DB_PATH)
    yield


is_prod = (settings.APP_ENV == "production" and not settings.DEBUG)

app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="VCE Pali — e-Gram Center & Financial Ledger",
    lifespan=lifespan,
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json"
)

# CORS Middleware (Supports Vercel frontend, local dev, and custom domains)
cors_origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://.*" if "*" in cors_origins else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
api_prefix = "/api"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(people.router, prefix=api_prefix)
app.include_router(work.router, prefix=api_prefix)
app.include_router(payments.router, prefix=api_prefix)
app.include_router(expenses.router, prefix=api_prefix)
app.include_router(savings.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(search.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(app_settings.router, prefix=api_prefix)
app.include_router(vce.router, prefix=api_prefix)


# Health Check (Used by Render blueprint and frontend connectivity tester)
@app.get("/api/health", tags=["Health"])
def health_check():
    db_type = "postgresql" if (settings.DATABASE_URL and (settings.DATABASE_URL.startswith("postgresql://") or settings.DATABASE_URL.startswith("postgres://"))) else "sqlite"
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": "2.0.0",
        "env": settings.APP_ENV,
        "database": db_type
    }


# APK Distribution Endpoints
BASE_DIR = Path(__file__).resolve().parent.parent
APK_DIR = BASE_DIR / "apk"
APK_FILE_PALI = APK_DIR / "VCE_Pali.apk"

# Mount apk directory for direct streaming if it exists
if APK_DIR.exists():
    app.mount("/apk-files", StaticFiles(directory=str(APK_DIR)), name="apk-files")


@app.get("/download/apk", tags=["Mobile App"])
@app.get("/api/download/apk", tags=["Mobile App"])
async def download_latest_apk():
    """Download the latest compiled VCE Pali Android APK."""
    # Check if primary VCE_Pali APK exists in apk/ or frontend/apk/
    candidates = [
        APK_FILE_PALI,
        BASE_DIR / "frontend" / "apk" / "VCE_Pali.apk",
        BASE_DIR / "android" / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"
    ]
    for candidate in candidates:
        if candidate.exists():
            return FileResponse(
                path=str(candidate),
                filename="VCE_Pali.apk",
                media_type="application/vnd.android.package-archive",
                headers={"Content-Disposition": 'attachment; filename="VCE_Pali.apk"'}
            )
    raise HTTPException(status_code=404, detail="VCE Pali APK not found. Please run build_apk.bat first.")


@app.get("/api/apk/info", tags=["Mobile App"])
async def get_apk_info():
    """Get metadata about the latest compiled APK."""
    candidates = [
        APK_FILE_PALI,
        BASE_DIR / "frontend" / "apk" / "VCE_Pali.apk",
        BASE_DIR / "android" / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"
    ]
    target_apk = None
    for candidate in candidates:
        if candidate.exists():
            target_apk = candidate
            break

    if not target_apk:
        return {"available": False, "message": "APK has not been built yet."}

    stat = target_apk.stat()
    size_mb = round(stat.st_size / (1024 * 1024), 2)
    import datetime
    mod_time = datetime.datetime.fromtimestamp(stat.st_mtime).strftime("%d-%m-%Y %I:%M %p")
    return {
        "available": True,
        "filename": "VCE_Pali.apk",
        "version": "1.1.0",
        "size_bytes": stat.st_size,
        "size_formatted": f"{size_mb} MB",
        "last_modified": mod_time,
        "download_url": "/download/apk"
    }


# Conditional Frontend Serving vs Dedicated Headless API Server
if settings.SERVE_FRONTEND and FRONTEND_DIR.exists():
    for subdir in ["css", "js", "components", "pages", "assets"]:
        subpath = FRONTEND_DIR / subdir
        if subpath.exists():
            app.mount(f"/{subdir}", StaticFiles(directory=str(subpath)), name=subdir)

    @app.get("/")
    async def serve_index():
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return JSONResponse({"message": "Frontend index.html not found"})
else:
    # Dedicated Backend Mode: Return pure JSON status matching cloud API backends
    @app.get("/", tags=["System"])
    def backend_root():
        return {
            "status": "online",
            "message": "VCE Pali API Backend is running. Frontend is hosted separately on Vercel."
        }

    # Redirect any direct UI page accesses on the backend to the Vercel frontend
    @app.get("/pages/{path:path}", tags=["System"])
    async def redirect_pages_to_frontend(path: str):
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/pages/{path}", status_code=307)

    @app.get("/index.html", tags=["System"])
    async def redirect_index_to_frontend():
        return RedirectResponse(url=settings.FRONTEND_URL, status_code=307)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
