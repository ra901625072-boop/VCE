@echo off
echo ====================================================
echo Setting up VCE Work & Money Flow Tracker environment
echo ====================================================

python --version
if errorlevel 1 (
    echo Python is not installed or not in PATH. Please install Python 3.10+
    pause
    exit /b 1
)

echo.
echo Initializing database schema...
python -c "from backend.database.migrations import init_db; from backend.core.config import settings; init_db(settings.DB_PATH); print('Database initialized successfully at:', settings.DB_PATH)"

echo.
echo Environment setup complete!
pause
