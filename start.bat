@echo off
title Kortex - Starting All Services
cd /d "%~dp0"

echo ============================================
echo    Kortex - AI Chat Platform
echo    Starting all services...
echo ============================================
echo.

:: Kill any lingering ollama processes first
taskkill /f /im ollama.exe >nul 2>&1

:: Check if Ollama is installed
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Ollama not found in PATH.
    echo Install from https://ollama.com and ensure 'ollama' is available.
    echo The frontend and backend will still start.
    echo.
)

:: Start Ollama with local models, keep-alive=-1 (stay in RAM)
where ollama >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [1/3] Starting Ollama server...
    start "Kortex-Ollama" cmd /c "title Kortex - Ollama && set OLLAMA_KEEP_ALIVE=-1 && set OLLAMA_MODELS=%~dp0ollama\models && ollama serve"
    timeout /t 5 /nobreak >nul
)

:: Install backend deps if missing
if not exist "%~dp0backend\kortex.db" (
    echo [*] Installing backend dependencies...
    cd /d "%~dp0backend"
    pip install -r requirements.txt >nul 2>&1
)

:: Start Backend (FastAPI)
echo [2/3] Starting Backend server (port 8000)...
start "Kortex-Backend" cmd /c "title Kortex - Backend && cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 4 /nobreak >nul

:: Install frontend deps if missing
if not exist "%~dp0chat-frontend\node_modules" (
    echo [*] Installing frontend dependencies...
    cd /d "%~dp0chat-frontend"
    npm install >nul 2>&1
)

:: Start Frontend (Vite)
echo [3/3] Starting Frontend dev server (port 5173)...
start "Kortex-Frontend" cmd /c "title Kortex - Frontend && cd /d %~dp0chat-frontend && npm run dev"

echo.
echo ============================================
echo    All services starting!
echo    Frontend : http://localhost:5173
echo    Backend  : http://localhost:8000
echo    Backend API Docs: http://localhost:8000/docs
echo    Ollama   : http://localhost:11434
echo ============================================
echo.
echo Models available:
set OLLAMA_MODELS=%~dp0ollama\models
for %%m in (%~dp0ollama\models\manifests\registry.ollama.ai\library\*) do echo   - %%~nxm
echo.
echo Close this window to stop all services (manually).
pause
