@echo off
setlocal enabledelayedexpansion
title VCE Pali — e-Gram Workstation ^& Mobile App Hub

:: Check if command-line argument was passed
if /i "%~1"=="apk" goto build_apk
if /i "%~1"=="build" goto build_apk
if /i "%~1"=="install" goto install_apk
if /i "%~1"=="update" goto update_apk
if /i "%~1"=="mobile" goto start_mobile
if /i "%~1"=="web" goto start_web

:show_menu
cls
echo ======================================================================
echo   VCE Pali — e-Gram Digital Center ^& Financial Ledger
echo   Unified Workstation ^& Android Mobile Control Center
echo ======================================================================
echo.
echo   [1] Start Mobile-Ready Server ^(0.0.0.0:8000^) [Recommended]
echo   [2] Generate Android APK File ^(apk\VCE_Pali.apk^)
echo   [3] Install / Update APK on Connected Phone or Emulator
echo   [4] Generate APK + Start Mobile Server
echo   [5] 1-Click Rebuild ^& Update Phone ^(update_apk.bat^)
echo   [6] Start Desktop Web Only ^(127.0.0.1:8000^)
echo   [7] Start React Vite Dev Server ^(port 3000^)
echo   [8] Rebuild React Frontend Production Bundle ^(npm run build^)
echo   [Q] Quit
echo.
echo ======================================================================
set /p CHOICE="Enter choice [1-8, Q] (Press Enter for 1): "

if "%CHOICE%"=="" set "CHOICE=1"
if /i "%CHOICE%"=="1" goto start_mobile
if /i "%CHOICE%"=="2" goto build_apk
if /i "%CHOICE%"=="3" goto install_apk
if /i "%CHOICE%"=="4" goto build_and_start
if /i "%CHOICE%"=="5" goto update_apk
if /i "%CHOICE%"=="6" goto start_web
if /i "%CHOICE%"=="7" goto start_react_dev
if /i "%CHOICE%"=="8" goto build_react
if /i "%CHOICE%"=="Q" exit /b 0

echo Invalid selection. Please choose 1-8 or Q.
timeout /t 2 >nul
goto show_menu

:: ----------------------------------------------------------------------
:: Action 2: Generate APK
:: ----------------------------------------------------------------------
:build_apk
cls
echo [ACTION] Generating Android APK file...
call "%~dp0build_apk.bat"
goto end_action

:: ----------------------------------------------------------------------
:: Action 3: Install/Update on Device
:: ----------------------------------------------------------------------
:install_apk
cls
echo [ACTION] Installing/Updating APK on Android device...
call "%~dp0install_apk.bat"
goto end_action

:: ----------------------------------------------------------------------
:: Action 4: Build APK then Start Server
:: ----------------------------------------------------------------------
:build_and_start
cls
echo [ACTION 1/2] Generating Android APK...
call "%~dp0build_apk.bat"
echo.
echo [ACTION 2/2] Starting Mobile Backend Server...
goto start_mobile

:: ----------------------------------------------------------------------
:: Action 5: 1-Click Update
:: ----------------------------------------------------------------------
:update_apk
cls
echo [ACTION] Rebuilding and updating connected device...
call "%~dp0update_apk.bat"
goto end_action

:: ----------------------------------------------------------------------
:: Action 1: Start Mobile-Ready Server (0.0.0.0)
:: ----------------------------------------------------------------------
:start_mobile
cls
echo ======================================================================
echo   VCE Pali — Starting Mobile-Ready Server
echo ======================================================================
echo   PC Browser URL     : http://127.0.0.1:8000
echo   Android Wi-Fi URL  : http://10.212.82.62:8000
echo   Android Emulator   : http://10.0.2.2:8000
echo   USB Debugging URL  : http://localhost:8000 (after adb reverse)
echo ======================================================================
echo.
start "" "http://127.0.0.1:8000"
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
goto end_action

:: ----------------------------------------------------------------------
:: Action 6: Start Desktop Web Server (127.0.0.1)
:: ----------------------------------------------------------------------
:start_web
cls
echo ======================================================================
echo   Starting Local Desktop Server at http://127.0.0.1:8000
echo ======================================================================
start "" "http://127.0.0.1:8000"
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
goto end_action

:: ----------------------------------------------------------------------
:: Action 7: Start React Vite Dev Server (port 3000)
:: ----------------------------------------------------------------------
:start_react_dev
cls
echo ======================================================================
echo   Starting Vite React Dev Server at http://localhost:3000
echo ======================================================================
start "" "http://localhost:3000"
cd /d "%~dp0frontend"
npm run dev
goto end_action

:: ----------------------------------------------------------------------
:: Action 8: Rebuild React Frontend Production Bundle
:: ----------------------------------------------------------------------
:build_react
cls
echo ======================================================================
echo   Building React Production Bundle (dist)
echo ======================================================================
cd /d "%~dp0frontend"
npm run build
echo.
echo Build complete. Output generated in frontend\dist.
goto end_action

:end_action
echo.
pause
