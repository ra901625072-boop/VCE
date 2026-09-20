@echo off
title VCE Pali - Mobile-Ready Backend Server
echo ======================================================================
echo   VCE Pali — e-Gram Digital Center Backend Server
echo   Mobile-Ready Host (0.0.0.0:8000)
echo ======================================================================
echo.
echo   Local PC Access   : http://127.0.0.1:8000
echo   Mobile Wi-Fi URL  : http://10.212.82.62:8000
echo   Emulator URL      : http://10.0.2.2:8000
echo   USB Debugging URL : http://localhost:8000 (after adb reverse)
echo.
echo ======================================================================
echo   Starting FastAPI Server with Auto-Reload...
echo ======================================================================
echo.

python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pause
