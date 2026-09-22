@echo off
title BrewCart - Temu Media Importer
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing BrewCart packages...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

echo.
echo Paste ONE Temu product URL below.
echo Media will be saved under data\imports\PRODUCT-ID
echo.
set /p TEMU_URL=Temu URL: 

if "%TEMU_URL%"=="" (
  echo No URL entered.
  pause
  exit /b 1
)

call npm run import:temu -- "%TEMU_URL%"
echo.
pause
