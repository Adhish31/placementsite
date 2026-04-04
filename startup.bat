@echo off
REM ============================================================================
REM   CAREERQUEST PLACEMENT ECOSYSTEM - STARTUP SCRIPT
REM   AI Smart Mock Interview System - Phase 1-5
REM ============================================================================

setlocal enabledelayedexpansion
cd /d "C:\Users\ADHISH\OneDrive\ドキュメント\placementsite"

echo.
echo ============================================================================
echo   🎤 CAREERQUEST AI MOCK INTERVIEW SYSTEM - STARTUP
echo ============================================================================
echo.

REM Check for MongoDB
echo [1/3] Checking MongoDB status...
netstat -ano | findstr :27017 > nul
if %errorlevel% neq 0 (
    echo [!] MongoDB not running. Please start MongoDB:
    echo     Command: mongod --dbpath C:\data\db
    echo.
    echo     Or install MongoDB: https://www.mongodb.com/try/download/community
    echo.
) else (
    echo [OK] MongoDB is running ✓
)

echo.
echo [2/3] Starting Backend (Port 5000)...
start "CareerQuest Backend" cmd /k "cd server && npm run dev"
timeout /t 2

echo [3/3] Starting Frontend (Port 5173)...
start "CareerQuest Frontend" cmd /k "cd client && npm run dev"

echo.
echo ============================================================================
echo   ✓ STARTUP COMPLETE
echo ============================================================================
echo.
echo   📱 Frontend: http://localhost:5173
echo   🖥️  Backend:  http://localhost:5000
echo.
echo   ⚠️  IMPORTANT: AI Service Setup
echo   ────────────────────────────────────────────────────────────────────
echo   The AI mock interview feature requires Python ML libraries.
echo   
echo   To enable AI features, open another terminal and run:
echo   
echo     cd ml_service
echo     pip install torch transformers sentence-transformers scikit-learn numpy scipy librosa
echo     uvicorn app:app --reload --port 8000
echo.
echo   Then update your .env file with ML_SERVICE_URL=http://localhost:8000
echo.
echo ============================================================================
echo   Windows opened: Frontend and Backend are launching in new windows
echo   Press CTRL+C in any window to stop that service
echo ============================================================================
echo.
pause
