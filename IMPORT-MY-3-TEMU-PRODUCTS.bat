@echo off
setlocal
title BrewCart - Import My 3 Temu Products
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   BREWCART - IMPORTING YOUR 3 TEMU PRODUCTS
echo ============================================================
echo.
echo Using your installed Firefox and saved Temu login.
echo.
echo Syncing BrewCart packages...
call npm install
if errorlevel 1 (
  echo npm install failed.
  pause
  exit /b 1
)

echo.
echo Importing product 1 of 3...
call npm run import:temu -- "https://www.temu.com/espresso-machine-with-grinder-professional-coffee-maker-for-latte-cappuccino-with-milk-frother-steam-wand-removable-water-tank-for-home-g-605596761851539.html"
if errorlevel 1 goto :failed

echo.
echo Importing product 2 of 3...
call npm run import:temu -- "https://www.temu.com/-espresso-machine-15-bar-coffee-maker-with-milk-frother-steam-wand-built-in-bean-grinder-combo-cappuccino-machine-with-70oz-removable-water-tank-abs-high-strength-plastic-shell-g-601099704667803.html"
if errorlevel 1 goto :failed

echo.
echo Importing product 3 of 3...
call npm run import:temu -- "https://www.temu.com/1350w-20-machine-instant-heating-system-espresso-maker-with-milk-frother-fast-brew-italian--machine-for-latte-cappuccino-1-6l-removable-water-tank--g-606623779151957.html"
if errorlevel 1 goto :failed

echo.
echo ============================================================
echo SUCCESS
echo Check:
echo   data\imports\605596761851539
echo   data\imports\601099704667803
echo   data\imports\606623779151957
echo ============================================================
echo.
pause
exit /b 0

:failed
echo.
echo ============================================================
echo IMPORT STOPPED BECAUSE OF AN ERROR
echo ============================================================
echo.
pause
exit /b 1
