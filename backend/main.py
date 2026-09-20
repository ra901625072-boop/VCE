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


app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="VCE Pali — e-Gram Center & Financial Ledger",
    lifespan=lifespan
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
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": "2.0.0",
        "env": settings.APP_ENV,
        "database": "connected"
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
    # Check if primary VCE_Pali APK exists
    if APK_FILE_PALI.exists():
        return FileResponse(
            path=str(APK_FILE_PALI),
            filename="VCE_Pali.apk",
            media_type="application/vnd.android.package-archive",
            headers={"Content-Disposition": 'attachment; filename="VCE_Pali.apk"'}
        )
    # Check if debug build exists
    fallback_apk = BASE_DIR / "android" / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"
    if fallback_apk.exists():
        return FileResponse(
            path=str(fallback_apk),
            filename="VCE_Pali.apk",
            media_type="application/vnd.android.package-archive",
            headers={"Content-Disposition": 'attachment; filename="VCE_Pali.apk"'}
        )
    raise HTTPException(status_code=404, detail="VCE Pali APK not found. Please run build_apk.bat first.")


@app.get("/api/apk/info", tags=["Mobile App"])
async def get_apk_info():
    """Get metadata about the latest compiled APK."""
    target_apk = (
        APK_FILE_PALI if APK_FILE_PALI.exists()
        else (BASE_DIR / "android" / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk")
    )
    if not target_apk.exists():
        return {"available": False, "message": "APK has not been built yet."}

    stat = target_apk.stat()
    size_mb = round(stat.st_size / (1024 * 1024), 2)
    import datetime
    mod_time = datetime.datetime.fromtimestamp(stat.st_mtime).strftime("%d-%m-%Y %I:%M %p")
    return {
        "available": True,
        "filename": "VCE_Pali.apk",
        "version": "1.0.0",
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
    # Dedicated Backend Mode: Hide / Ignore UI and display Backend Server Health
    @app.get("/", tags=["System"])
    async def backend_root(request: Request):
        accept_header = request.headers.get("accept", "")
        if "text/html" in accept_header:
            html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VCE Pali — API Backend Gateway</title>
  <link rel="icon" type="image/png" href="{settings.FRONTEND_URL}/assets/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #09090b;
      --card: #18181b;
      --border: #27272a;
      --text: #f4f4f5;
      --muted: #a1a1aa;
      --accent: #f97316;
      --success: #10b981;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }}
    .card {{
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      max-width: 580px;
      width: 100%;
      padding: 2.25rem;
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6);
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(16,185,129,0.12);
      color: var(--success);
      border: 1px solid rgba(16,185,129,0.3);
      margin-bottom: 1.25rem;
    }}
    .pulse {{
      width: 8px;
      height: 8px;
      background: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16,185,129,0.7);
      animation: pulse 2s infinite;
    }}
    @keyframes pulse {{
      0% {{ transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }}
      70% {{ transform: scale(1); box-shadow: 0 0 0 8px rgba(16,185,129,0); }}
      100% {{ transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0); }}
    }}
    h1 {{
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }}
    p.subtitle {{
      color: var(--muted);
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 1.75rem;
    }}
    .grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1.75rem;
    }}
    .metric {{
      background: #121214;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.85rem 1rem;
    }}
    .metric-label {{
      font-size: 0.725rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin-bottom: 0.25rem;
    }}
    .metric-val {{
      font-size: 0.925rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text);
    }}
    .btn-group {{
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }}
    .btn {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
    }}
    .btn-primary {{
      background: var(--accent);
      color: #fff;
    }}
    .btn-primary:hover {{
      filter: brightness(1.1);
    }}
    .btn-secondary {{
      background: #27272a;
      color: var(--text);
    }}
    .btn-secondary:hover {{
      background: #3f3f46;
    }}
    .footer-note {{
      text-align: center;
      margin-top: 1.25rem;
      font-size: 0.75rem;
      color: #71717a;
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="pulse"></span>
      API GATEWAY ONLINE
    </div>
    <h1>VCE Pali Backend Service</h1>
    <p class="subtitle">
      Dedicated FastAPI cloud backend powering e-Gram digital seva operations, Rojmel daybook, and financial ledgers.
    </p>

    <div class="grid">
      <div class="metric">
        <div class="metric-label">Server Health</div>
        <div class="metric-val" style="color:var(--success);">200 OK Active</div>
      </div>
      <div class="metric">
        <div class="metric-label">Environment</div>
        <div class="metric-val">{settings.APP_ENV}</div>
      </div>
      <div class="metric">
        <div class="metric-label">API Version</div>
        <div class="metric-val">v2.0.0</div>
      </div>
      <div class="metric">
        <div class="metric-label">Database</div>
        <div class="metric-val">SQLite WAL</div>
      </div>
    </div>

    <div class="btn-group">
      <a href="{settings.FRONTEND_URL}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
        <span>🌐 Open Frontend Web App (Vercel)</span>
      </a>
      <a href="/docs" class="btn btn-secondary">
        <span>📖 Interactive API Docs (Swagger)</span>
      </a>
      <a href="/api/health" class="btn btn-secondary">
        <span>🩺 Health Check JSON (/api/health)</span>
      </a>
    </div>

    <div class="footer-note">
      User Interface is hosted on Vercel at <a href="{settings.FRONTEND_URL}" style="color:var(--accent); text-decoration:none;">{settings.FRONTEND_URL}</a>.
    </div>
  </div>
</body>
</html>"""
            return HTMLResponse(content=html_content, status_code=200)

        return {
            "status": "ok",
            "service": settings.APP_NAME,
            "version": "2.0.0",
            "environment": settings.APP_ENV,
            "database": "connected",
            "frontend_url": settings.FRONTEND_URL,
            "health_check": "/api/health",
            "documentation": "/docs"
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
