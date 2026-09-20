# VCE Work & Money Flow Tracker — Deployment & Operations Guide

## 1. Local Development / Single-Machine Run
To start the application on Windows:
```cmd
run.bat
```
Or with Python directly:
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The application will be accessible at `http://127.0.0.1:8000`.

---

## 2. Environment Configuration
Copy `.env.example` to `.env`:
```ini
APP_NAME="Work & Money Flow Tracker"
APP_ENV="production"
DEBUG=False
HOST="0.0.0.0"
PORT=8000
SECRET_KEY="generate_a_random_cryptographic_secret_key"
TIMEZONE="Asia/Kolkata"
CURRENCY_SYMBOL="₹"
```

---

## 3. Database Maintenance
- **Automatic Schema Initialization**: Automatically run on application boot.
- **Backup Database**:
  ```powershell
  python scripts/backup_database.py
  ```
  Creates timestamped SQLite backups in `database/backups/`.
- **Seed Demo Data**:
  ```powershell
  python scripts/seed_database.py
  ```
- **Safe Reset**:
  ```powershell
  python scripts/reset_database.py
  ```

---

## 4. Production Deployment (Reverse Proxy)
When hosting on a Linux or Windows cloud server:
1. Run Uvicorn via Gunicorn or systemd / Windows Service:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app --bind 127.0.0.1:8000
   ```
2. Put Nginx or Caddy in front with HTTPS (Let's Encrypt TLS certificate).
3. Ensure `database/vce.db` has appropriate filesystem permissions (read/write by application process).
