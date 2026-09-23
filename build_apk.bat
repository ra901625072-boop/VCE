@echo off
setlocal enabledelayedexpansion
title VCE Pali - Build Android APK

echo ======================================================================
echo   VCE Pali — Android APK Build Generator
echo   e-Gram Digital Center ^& Financial Ledger System
echo ======================================================================
echo.

:: Configure environment
call "%~dp0configure_env.bat"

:: Ensure output directories exist
if not exist "%~dp0apk" (
    mkdir "%~dp0apk"
)
if not exist "%~dp0frontend\apk" (
    mkdir "%~dp0frontend\apk"
)

echo.
echo ======================================================================
echo   Compiling Android APK with Gradle Wrapper...
echo ======================================================================
cd /d "%~dp0android"

call .\gradlew.bat assembleDebug

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Gradle build failed with exit code %ERRORLEVEL%.
    pause
    exit /b %ERRORLEVEL%
)

:: Copy compiled APK to distribution and website folders
set "SRC_APK=%~dp0android\app\build\outputs\apk\debug\app-debug.apk"
set "DEST_APK=%~dp0apk\VCE_Pali.apk"
set "FRONTEND_APK=%~dp0frontend\apk\VCE_Pali.apk"

if exist "%SRC_APK%" (
    copy /y "%SRC_APK%" "%DEST_APK%" >nul
    copy /y "%SRC_APK%" "%FRONTEND_APK%" >nul
    echo.
    echo ======================================================================
    echo   [SUCCESS] APK Generated Successfully!
    echo ======================================================================
    echo   Distribution Location : %DEST_APK%
    echo   Website Static APK    : %FRONTEND_APK%
    
    :: Print File Details
    for %%F in ("%DEST_APK%") do (
        echo   Size                  : %%~zF bytes
        echo   Modified              : %%~tF
    )
    
    echo.
    echo   To install or update on your connected Android device:
    echo   Double-click: install_apk.bat
    echo ======================================================================
) else (
    echo [ERROR] Build succeeded but could not locate %SRC_APK%
)

cd /d "%~dp0"
echo.
pause
