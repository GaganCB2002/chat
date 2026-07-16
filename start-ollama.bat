@echo off
title Kortex - Ollama Server
echo Starting Ollama server...
echo Models will be kept in RAM for zero-latency responses.
echo.
set OLLAMA_KEEP_ALIVE=-1
set OLLAMA_MODELS=%~dp0ollama\models
ollama serve
pause
