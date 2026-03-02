@echo off
title CareerQuest QuickStart
echo ==========================================
echo    LAUNCHING CAREERQUEST PLACEMENT SITE
echo ==========================================
echo.   

echo [1/3] Ensuring MongoDB is running...
netstat -ano | findstr :27017 > nul
if %errorlevel% neq 0 (
    echo [!] MongoDB not detected. Starting it manually...
    if not exist "C:\data\db" mkdir "C:\data\db"
    start /min "MongoDB" "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "C:\data\db"
    timeout /t 5
) else (
    echo [✓] MongoDB is already running.
)

echo [2/3] Starting Backend Server (Port 5000)...
start cmd /c "cd server && npm run dev"
timeout /t 3

echo [3/3] Starting Frontend Client (Port 5173)...
start cmd /c "cd client && npm run dev"

echo.
echo ==========================================
echo    ALL SYSTEMS GO! 
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:5000
echo ==========================================
echo To stop the servers, close the separate terminal windows.
pause

