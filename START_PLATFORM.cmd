@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required. Install it from https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Installing the open-source dependencies...
  call npm install
  if errorlevel 1 pause & exit /b 1
)
echo Starting the interactive Ministry of Transport platform...
call npm run dev -- --host 127.0.0.1
