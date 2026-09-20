@echo off
setlocal enabledelayedexpansion
title VCE Pali - Install & Update APK on Android Device

echo ======================================================================
echo   VCE Pali — Android Device Deployment ^& Update Manager
echo   e-Gram Digital Center ^& Financial Ledger System
echo ======================================================================
echo.

:: Configure environment
call "%~dp0configure_env.bat"

set "TARGET_APK=%~dp0apk\VCE_Pali.apk"

:: Verify APK exists, otherwise build it
if not exist "%TARGET_APK%" (
    echo [INFO] %TARGET_APK% not found. Building APK first...
    call "%~dp0build_apk.bat"
)

if not exist "%TARGET_APK%" (
    echo [ERROR] Cannot proceed without APK file.
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo   Scanning for Connected Devices ^& Emulators...
echo ======================================================================
adb devices

:: Check if at least one device is recognized
adb get-state >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [NOTICE] No active Android device or emulator detected.
    echo.
    echo Please make sure:
    echo   1. Your Android phone is connected via USB cable.
    echo   2. "USB Debugging" is enabled in Developer Options on your phone.
    echo   3. Or start an Android Emulator via Android Studio or 'android emulator start'.
    echo.
    set /p RETRY="Press ENTER to scan again, or type Q to quit: "
    if /i "!RETRY!"=="Q" exit /b 1
    adb devices
)

echo.
echo ======================================================================
echo   Configuring USB Port Forwarding (adb reverse tcp:8000 tcp:8000)...
echo ======================================================================
adb reverse tcp:8000 tcp:8000
if %ERRORLEVEL% equ 0 (
    echo [OK] Port 8000 forwarded. Phone can access server at http://localhost:8000
) else (
    echo [INFO] adb reverse not supported or device offline. Use Wi-Fi IP http://10.212.82.62:8000
)

echo.
echo ======================================================================
echo   Installing / Updating APK on Device (Preserving App Data)...
echo ======================================================================
echo Target: %TARGET_APK%
echo.

adb install -r -d "%TARGET_APK%"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ======================================================================
    echo   [SUCCESS] App Installed / Updated Successfully!
    echo ======================================================================
    echo.
    echo Launching VCE Pali App on device...
    adb shell am start -n com.vcegujarat.app/.MainActivity
    echo [OK] App launched!
) else (
    echo.
    echo [ERROR] Installation failed. Check device screen for permission prompts.
)

echo.
pause
