@echo off
chcp 65001 >nul
setlocal
set "ROOT=%~dp0"

where python >nul 2>&1
if errorlevel 1 (
  echo [Error] No se encontro "python" en el PATH del sistema.
  pause
  exit /b 1
)

where pnpm >nul 2>&1
if errorlevel 1 (
  echo [Error] No se encontro "pnpm" en el PATH del sistema.
  pause
  exit /b 1
)

echo Iniciando Backend FastAPI (puerto 8000) y Frontend Vite (puerto 5173)...
start "Backend FastAPI (8000)" /D "%ROOT%" cmd /k python -m uvicorn backend.main:app --reload --port 8000
start "Frontend Vite (5173)" /D "%ROOT%frontend" cmd /k pnpm run dev -- --port 5173

timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
