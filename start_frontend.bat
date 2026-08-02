@echo off
title CallShield React Frontend
echo Starting CallShield Frontend-React on host 0.0.0.0...
cd /d "%~dp0frontend-react"
npm run dev -- --host 0.0.0.0
pause
