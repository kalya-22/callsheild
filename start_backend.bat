@echo off
title CallShield AI Voice Security Backend
color 0b
echo ========================================================
echo        CallShield AI Online Backend Server Launcher
echo ========================================================
echo.

cd /d "%~dp0"

echo [+] Checking Python Virtual Environment (.venv)...
if not exist ".venv\Scripts\python.exe" (
    echo [!] Virtual environment not found in .venv!
    pause
    exit /b 1
)

set "PYTHONPATH=%~dp0;%~dp0backend"

echo [+] Starting FastAPI Backend on 0.0.0.0:8000 ...
echo [+] Your Mobile Phone on the same Wi-Fi will connect automatically!
echo.

cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
