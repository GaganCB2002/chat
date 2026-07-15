@echo off
title Kortex - Run Bot

echo ========================================
echo   Kortex - Starting All Services
echo ========================================
echo.

echo [1/2] Starting Ollama backend...
set OLLAMA_KEEP_ALIVE=-1
start "Ollama" /min ollama serve
echo       Waiting for Ollama to initialize...
timeout /t 3 /nobreak >nul
echo       Ollama is running.
echo.

echo [2/2] Starting frontend dev server...
start "Kortex Frontend" cmd /c "cd /d d:\chat_bot\chat-frontend && npm run dev"
echo       Frontend starting at http://localhost:5173
echo.

echo ========================================
echo   Both services are starting up.
echo   Frontend: http://localhost:5173
echo   Ollama:   http://localhost:11434
echo ========================================
echo.
echo   Press any key to close this window.
echo   (Services will continue running)
pause >nul
