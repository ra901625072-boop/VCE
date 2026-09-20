@echo off
setlocal enabledelayedexpansion
title VCE Pali - 1-Click Rebuild & Update Android App

echo ======================================================================
echo   VCE Pali — 1-Click Rebuild ^& Update Android App
echo   e-Gram Digital Center ^& Financial Ledger System
echo ======================================================================
echo.

:: Step 1: Build fresh APK
echo [STEP 1/2] Compiling and generating fresh APK...
call "%~dp0build_apk.bat"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build step failed. Cannot update device.
    pause
    exit /b %ERRORLEVEL%
)

:: Step 2: Install/Update on device
echo.
echo [STEP 2/2] Updating APK on connected device...
call "%~dp0install_apk.bat"

echo.
echo ======================================================================
echo   [DONE] 1-Click Rebuild and Device Update Complete!
echo ======================================================================
