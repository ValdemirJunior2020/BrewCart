@echo off
setlocal
title BrewCart - Temu Login Setup
cd /d "%~dp0"

set "CHROME="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
)

if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
)

if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
  set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if not defined CHROME (
  echo Google Chrome was not found.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   TEMU LOGIN - NORMAL CHROME
echo ============================================================
echo.
echo A NORMAL Chrome window will open.
echo.
echo 1. Log into Temu normally. Google login should work here.
echo 2. Make sure you can see a Temu product page while logged in.
echo 3. CLOSE that Chrome window completely.
echo 4. Come back here and press ENTER.
echo.
echo Do NOT press Enter until the Temu Chrome window is CLOSED.
echo.

start "" "%CHROME%" --user-data-dir="%CD%\.temu-browser-profile" "https://www.temu.com/"

pause

echo.
echo Login profile saved.
echo Now run:
echo IMPORT-MY-3-TEMU-PRODUCTS.bat
echo.
pause
endlocal
