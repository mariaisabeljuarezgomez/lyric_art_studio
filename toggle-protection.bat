@echo off
title Image Protection Toggle
color 0A

echo.
echo ========================================
echo    Image Protection Toggle Script
echo ========================================
echo.

if "%1"=="" (
    echo Usage: toggle-protection.bat [command]
    echo.
    echo Commands:
    echo   disable  - Turn OFF image protection
    echo   enable   - Turn ON image protection  
    echo   status   - Check current status
    echo.
    echo Examples:
    echo   toggle-protection.bat disable
    echo   toggle-protection.bat enable
    echo   toggle-protection.bat status
    echo.
    pause
    exit /b
)

echo Running: node toggle-image-protection.js %1
echo.

node toggle-image-protection.js %1

echo.
echo Press any key to continue...
pause >nul 