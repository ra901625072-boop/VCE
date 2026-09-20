@echo off
setlocal enabledelayedexpansion
title VCE Pali - Android Environment Configuration

echo ======================================================================
echo   VCE Pali — Android Developer Environment Configuration
echo   e-Gram Digital Center ^& Financial Ledger System
echo ======================================================================
echo.

:: 1. Detect and Set JAVA_HOME
if not defined JAVA_HOME (
    if exist "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot" (
        set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
    ) else if exist "%ProgramFiles%\Java\jdk-17" (
        set "JAVA_HOME=%ProgramFiles%\Java\jdk-17"
    ) else (
        for /d %%D in ("%ProgramFiles%\Eclipse Adoptium\jdk-17*") do (
            if exist "%%D\bin\java.exe" set "JAVA_HOME=%%D"
        )
    )
)

if defined JAVA_HOME (
    echo [OK] JAVA_HOME set to: !JAVA_HOME!
    set "PATH=!JAVA_HOME!\bin;!PATH!"
) else (
    echo [WARNING] JAVA_HOME could not be auto-detected! Please install JDK 17.
)

:: 2. Detect and Set ANDROID_HOME
if not defined ANDROID_HOME (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    ) else if exist "%USERPROFILE%\AppData\Local\Android\Sdk" (
        set "ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk"
    )
)

if defined ANDROID_HOME (
    echo [OK] ANDROID_HOME set to: !ANDROID_HOME!
    set "PATH=!ANDROID_HOME!\platform-tools;!ANDROID_HOME!\cmdline-tools\latest\bin;!PATH!"
) else (
    echo [WARNING] ANDROID_HOME could not be auto-detected!
)

:: 3. Test Java executable
echo.
echo Checking Java runtime:
java -version 2>&1 | findstr /i "version"

:: 4. Test ADB executable
echo.
echo Checking Android Debug Bridge (ADB):
where adb >nul 2>&1
if %ERRORLEVEL% equ 0 (
    adb version | findstr /i "version"
    echo.
    echo Scanning for connected devices and emulators:
    adb devices
) else (
    echo [WARNING] adb.exe not found in PATH or Android SDK platform-tools.
)

echo.
echo ======================================================================
echo   Environment configured successfully for this session.
echo ======================================================================
endlocal & (
    set "JAVA_HOME=%JAVA_HOME%"
    set "ANDROID_HOME=%ANDROID_HOME%"
    set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"
)
