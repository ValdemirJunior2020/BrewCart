@echo off
title BrewCart - Import My 3 Temu Products
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
    echo Installation failed.
    pause
    exit /b 1
  )
)

echo.
echo ============================================================
echo   BREWCART - IMPORTING YOUR 3 TEMU PRODUCTS
echo ============================================================
echo.
echo You do NOT need to paste anything.
echo Images and videos will be saved in data\imports\PRODUCT-ID
echo.

call npm run import:temu -- ^
"https://www.temu.com/espresso-machine-with-grinder-professional-coffee-maker-for-latte-cappuccino-with-milk-frother-steam-wand-removable-water-tank-for-home-g-605596761851539.html" ^
"https://www.temu.com/-espresso-machine-15-bar-coffee-maker-with-milk-frother-steam-wand-built-in-bean-grinder-combo-cappuccino-machine-with-70oz-removable-water-tank-abs-high-strength-plastic-shell-g-601099704667803.html" ^
"https://www.temu.com/1350w-20-machine-instant-heating-system-espresso-maker-with-milk-frother-fast-brew-italian--machine-for-latte-cappuccino-1-6l-removable-water-tank--g-606623779151957.html"

echo.
echo ============================================================
echo Finished.
echo Check:
echo   data\imports\605596761851539
echo   data\imports\601099704667803
echo   data\imports\606623779151957
echo ============================================================
echo.
pause
