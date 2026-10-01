@echo off
cd /d "%~dp0"
cls
chcp 65001 > nul
title Desktop Build Tool - Print Barcodes
color 0B

:: تهيئة مسارات التنزيل السريع لتجنب حجب جيت هاب أو بطء الإنترنت في بعض الدول العربية
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo ===================================================================
echo [!] Tool to build the standalone desktop application [EXE] for Windows
echo ===================================================================
echo.
echo This tool will install dependencies and build your desktop app.
echo It will generate a standalone executable for Windows.
echo.
echo Requirements: Node.js must be installed from https://nodejs.org
echo.
echo -------------------------------------------------------------------
echo Press any key to start the desktop packaging process...
pause > nul
echo.

:check_node
cls
color 0B
echo [+] Step 1: Verifying active Node.js installation...
node -v >nul 2>&1
if %errorlevel% equ 0 goto node_installed

cls
color 0C
echo ===================================================================
echo [ERROR] Node.js was not found on your system!
echo ===================================================================
echo.
echo To compile and build this app into a standalone desktop (.exe) file,
echo you must first install Node.js on your computer.
echo.
echo Please follow these simple steps to get set up:
echo 1. Download and install Node.js LTS version from the official site:
echo    https://nodejs.org/
echo 2. During installation, make sure the "Add to PATH" option is checked.
echo.
echo IMPORTANT: After installation is complete, you MUST CLOSE this window 
echo            and re-open this script for the changes to take effect!
echo.
echo -------------------------------------------------------------------
echo Press any key to exit and install Node.js...
pause > nul
exit

:node_installed
color 0B
echo [SUCCESS] Node.js is installed! Version:
node -v
echo.

echo [+] Step 2: Installing application dependencies...
echo     Please keep this window open while dependencies are loading.
echo.
call npm install
if %errorlevel% neq 0 echo [WARNING] npm install reported warnings, continuing build...

echo.
echo [+] Step 2.5: Restoring and verifying application icons...
node generate_icons.js
if %errorlevel% neq 0 echo [WARNING] Icon restoration failed or warned, continuing build...

:build_react
echo.
echo [+] Step 3: Compiling React app assets...
call npm run build
if %errorlevel% equ 0 goto build_success

echo.
color 0C
echo ===================================================================
echo [ERROR] React compilation failed!
echo ===================================================================
echo.
echo Please review the compilation errors printed above. Check your source code files
echo for any syntax errors or missing files that prevent React from building.
echo.
echo 1. Fix the errors in your code.
echo 2. Press any key to try compiling the React assets again.
echo.
pause
goto build_react

:build_success
echo.
echo [+] Step 4: Packaging application into a standalone EXE...
call npm run electron:build:64
if %errorlevel% equ 0 goto packaging_success

echo.
echo [WARNING] 64-bit build failed, trying standard build...
call npm run electron:build
if %errorlevel% equ 0 goto packaging_success

echo.
echo [WARNING] Trying 32-bit legacy build as a last resort...
call npm run electron:build:32
if %errorlevel% equ 0 goto packaging_success

echo.
color 0C
echo ===================================================================
echo [ERROR] Standalone desktop packaging failed!
echo ===================================================================
echo.
echo Please review the direct error messages printed in the console above!
echo.
echo Common reasons for this failure at the last moment of assembly:
echo.
echo 1. PREVIOUS COPY RUNNING IN BACKGROUND (EACCES / Permission Denied):
echo    ==> If "BarCode Master.exe" is already open or running, the builder cannot
echo        overwrite it. Make sure you close the app completely. Open Task Manager
echo        and terminate any lingering "BarCode Master" or "Electron" processes!
echo.
echo 2. ANTIVIRUS OR WINDOWS DEFENDER INTERVENTION:
echo    ==> Windows Defender or third-party Antivirus (Avast, Kaspersky, etc.) may 
echo        intercept the builder when it attempts to write/package the new executable.
echo        Try temporarily disabling the Antivirus Real-Time Protection and rebuild.
echo.
echo 3. Network/Internet issues download failures:
echo    ==> electron-builder must download precompiled binaries (Electron, winCodeSign, nsis)
echo        from GitHub. If internet is slow or blocking GitHub releases:
echo        = Try using a VPN or changing your internet connection.
echo.
echo 4. Permissions issue: Ensure you have unzipped this project to a local, 
echo    writeable folder (e.g. C:\Projects or your Desktop). DO NOT run from inside a ZIP explorer.
echo.
echo 5. Local Web Server Alternative:
echo    If packaging into a standalone EXE continues to fail on your machine, 
echo    you can always run the fully-functional app as a local server!
echo    Simply run "npm run dev" and open http://localhost:3000 in your browser.
echo.
echo -------------------------------------------------------------------
echo Press any key to exit...
pause > nul
exit

:packaging_success
cls
color 0A
echo ===================================================================
echo [SUCCESS] Desktop application compiled successfully!
echo ===================================================================
echo.
echo [+] Output Files:
echo     Your executable is saved inside the folder: dist_electron
echo.
echo [+] Complete files generated inside "dist_electron" folder.
echo.
echo Note: If the Arabic text above looks distorted in this console window, 
echo       don't worry! Universal Unicode is supported in Windows.
echo -------------------------------------------------------------------
echo Press any key to open the output folder...
pause > nul
explorer dist_electron
exit
