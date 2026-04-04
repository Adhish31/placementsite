@echo off
cd /d "%~dp0"
title CareerQuest FullStack Startup
echo ==========================================
echo    LAUNCHING CAREERQUEST PLACEMENT ECOSYSTEM
echo ==========================================
echo.   

echo [1/4] Ensuring MongoDB is running...
netstat -ano | findstr :27017 > nul
if %errorlevel% neq 0 (
    echo [!] MongoDB not detected. Starting it manually...
    if not exist "C:\data\db" mkdir "C:\data\db"
    start /min "MongoDB" "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "C:\data\db"
    timeout /t 5
) else (
    echo [✓] MongoDB is already running.
)

echo [2/4] Starting AI Career Coach (Port 8000, first load may take up to 60 seconds)...
start "AI Service" cmd /k "cd ml_service && python -m pip install -r requirements.txt && python -m uvicorn app:app --port 8000"
timeout /t 3

echo [3/4] Starting Backend (Port 5000)...
start "Backend" cmd /c "cd server && npm run dev"
timeout /t 3

echo [4/4] Starting Frontend (Port 5173)...
start "Frontend" cmd /c "cd client && npm run dev"

echo.
echo ==========================================
echo    ALL SYSTEMS GO!
echo    - Frontend: http://localhost:5173
echo    - Backend:  http://localhost:5000
echo    - AI Svc:   http://localhost:8000
echo ==========================================
echo To stop, close the individual terminal windows.
pause
