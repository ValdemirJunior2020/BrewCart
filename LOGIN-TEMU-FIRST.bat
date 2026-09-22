@echo off
setlocal
title BrewCart - Temu Login Setup
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  pause
  exit /b 1
)

echo Installing/syncing BrewCart packages...
call npm install
if errorlevel 1 (
  echo npm install failed.
  pause
  exit /b 1
)

echo.
echo Opening Temu login in Chrome...
echo Chrome will stay open until YOU press Enter in this window.
echo.

call npm run login:temu

echo.
pause
endlocal
