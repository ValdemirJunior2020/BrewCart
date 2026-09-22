@echo off
title BrewCart
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  echo Install it from https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing BrewCart packages...
  call npm install
  if errorlevel 1 (
    echo Installation failed.
    pause
    exit /b 1
  )
)
echo.
echo BrewCart is starting at http://localhost:3000
echo.
call npm run dev
pause
