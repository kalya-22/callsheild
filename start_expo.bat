@echo off
title CallShield Expo App
echo ======================================================
echo Starting CallShield Expo Mobile App...
echo ======================================================
cd /d "%~dp0mobile_app"
echo.
echo Choose launch mode:
echo [1] Tunnel Mode (RECOMMENDED - Works on any Wi-Fi/Mobile Data)
echo [2] Local LAN Mode (Requires phone & laptop on same Wi-Fi)
echo [3] Web Mode (Open in desktop browser)
echo.
set /p mode="Enter choice (1, 2, or 3) [Default: 1]: "

if "%mode%"=="2" (
    echo Starting in Local LAN Mode...
    npx expo start
) else if "%mode%"=="3" (
    echo Starting in Web Mode...
    npx expo start --web
) else (
    echo Starting in Tunnel Mode...
    npx expo start --tunnel
)
pause
