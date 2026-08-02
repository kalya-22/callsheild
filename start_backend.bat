@echo off
title CallShield Backend Server
echo Starting CallShield FastAPI Backend Server on 0.0.0.0:8000...
cd /d "%~dp0"
".venv\Scripts\python.exe" scripts\run_api.py
pause
