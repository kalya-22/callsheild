@echo off
title CallShield Public Cloud Tunnel (4G/5G Internet Access)
color 0b
echo ========================================================
echo   CallShield Public Cloud Tunnel (4G / 5G / Remote)
echo ========================================================
echo.
echo [+] Starting Cloud Tunnel on port 8000...
echo [+] This allows your phone to connect from ANY network (4G/5G/Mobile Data)
echo.

npx localtunnel --port 8000 --subdomain callshield-api
pause
