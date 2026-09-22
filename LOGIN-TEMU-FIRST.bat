@echo off
setlocal
title BrewCart - Temu Login Setup
cd /d "%~dp0"

set "FIREFOX="

if exist "%ProgramFiles%\Mozilla Firefox\firefox.exe" (
  set "FIREFOX=%ProgramFiles%\Mozilla Firefox\firefox.exe"
)

if not defined FIREFOX if exist "%ProgramFiles(x86)%\Mozilla Firefox\firefox.exe" (
  set "FIREFOX=%ProgramFiles(x86)%\Mozilla Firefox\firefox.exe"
)

if not defined FIREFOX if exist "%LocalAppData%\Mozilla Firefox\firefox.exe" (
  set "FIREFOX=%LocalAppData%\Mozilla Firefox\firefox.exe"
)

if not defined FIREFOX (
  echo Mozilla Firefox was not found.
  echo Install Firefox, then run this file again.
  pause
  exit /b 1
)

if not exist "%CD%\.temu-firefox-profile" mkdir "%CD%\.temu-firefox-profile"

echo.
echo ============================================================
echo   TEMU LOGIN - NORMAL FIREFOX
echo ============================================================
echo.
echo A NORMAL Firefox window will open.
echo.
echo 1. Log into Temu normally.
echo 2. Make sure you can open one of the Temu product pages.
echo 3. CLOSE that Firefox window completely.
echo 4. Come back here and press ENTER.
echo.
echo Do NOT press Enter until Firefox is CLOSED.
echo.

start "" "%FIREFOX%" -no-remote -profile "%CD%\.temu-firefox-profile" "https://www.temu.com/"

pause

echo.
echo Temu Firefox profile saved.
echo Now run:
echo IMPORT-MY-3-TEMU-PRODUCTS.bat
echo.
pause
endlocal
