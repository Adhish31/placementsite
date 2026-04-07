@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title CareerQuest FullStack Startup
echo ==========================================
echo    LAUNCHING CAREERQUEST PLACEMENT ECOSYSTEM
echo ==========================================
echo    SMART STARTUP MODE ENABLED
echo.   

echo [1/5] Ensuring MongoDB is running...
netstat -ano | findstr :27017 > nul
if %errorlevel% neq 0 (
    echo [!] MongoDB not detected. Starting it manually...
    if not exist "C:\data\db" mkdir "C:\data\db"
    if exist "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" (
        start /min "MongoDB" "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "C:\data\db"
        timeout /t 5 > nul
    ) else (
        echo [!] MongoDB executable not found at expected path.
        echo     Please start MongoDB manually, then re-run this script.
    )
) else (
    echo [✓] MongoDB is already running.
)

echo [2/5] Checking required commands...
where node > nul 2>nul
if %errorlevel% neq 0 echo [!] Node.js not found in PATH.
where npm > nul 2>nul
if %errorlevel% neq 0 echo [!] npm not found in PATH.
where python > nul 2>nul
if %errorlevel% neq 0 echo [!] Python not found in PATH.

echo [3/5] Starting AI Career Coach (Port 8000)...
netstat -ano | findstr :8000 > nul
if %errorlevel% neq 0 (
    start "AI Service" cmd /k "cd /d ""%~dp0ml_service"" && python -m pip install -r requirements.txt && python -m uvicorn app:app --reload --port 8000"
    timeout /t 2 > nul
) else (
    echo [✓] AI service already running on port 8000.
)

echo [4/5] Starting Backend (Port 5000)...
netstat -ano | findstr :5000 > nul
if %errorlevel% neq 0 (
    start "Backend" cmd /k "cd /d ""%~dp0server"" && npm run dev"
    timeout /t 2 > nul
) else (
    echo [✓] Backend already running on port 5000.
)

echo [5/5] Starting Frontend (Port 5173)...
netstat -ano | findstr :5173 > nul
if %errorlevel% neq 0 (
    start "Frontend" cmd /k "cd /d ""%~dp0client"" && npm run dev"
) else (
    echo [✓] Frontend already running on port 5173.
)

echo.
echo ==========================================
echo    ALL SYSTEMS GO!
echo    - Frontend: http://localhost:5173
echo    - Backend:  http://localhost:5000
echo    - AI Svc:   http://localhost:8000
echo ==========================================
echo To stop, close the individual terminal windows or press CTRL+C in them.
pause
