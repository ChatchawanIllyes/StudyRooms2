@echo off
REM 🧹 INSTANT CLEANUP - Delete ALL old web files (Windows)
REM Run this ONCE to get a clean React Native project

echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║           🧹 CLEANING UP OLD WEB FILES - PLEASE WAIT...              ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.

REM Delete old web UI components
echo 🗑️  Deleting /components/ (old web UI components)...
if exist "components\" rmdir /s /q "components\"

REM Delete old web app structure
echo 🗑️  Deleting /src/app/ (old web structure)...
if exist "src\app\" rmdir /s /q "src\app\"

REM Delete supabase backend
echo 🗑️  Deleting /supabase/ (backend files)...
if exist "supabase\" rmdir /s /q "supabase\"

REM Delete utils folder
echo 🗑️  Deleting /utils/ (old utilities)...
if exist "utils\" rmdir /s /q "utils\"

REM Delete styles folder
echo 🗑️  Deleting /styles/ (CSS files)...
if exist "styles\" rmdir /s /q "styles\"

REM Delete guidelines
echo 🗑️  Deleting /guidelines/ (optional guidelines)...
if exist "guidelines\" rmdir /s /q "guidelines\"

REM Delete optional documentation
echo 🗑️  Deleting extra .md files...
if exist "ATTRIBUTIONS.md" del /f "ATTRIBUTIONS.md"

echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                    ✅ CLEANUP COMPLETE!                              ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo ✨ Your project is now 100%% clean React Native!
echo.
echo 📂 What's left (all React Native files):
echo    ✅ /src/screens/     - All app screens
echo    ✅ /src/context/     - Theme management
echo    ✅ /src/utils/       - Room utilities
echo    ✅ /App.tsx          - Main entry
echo    ✅ /package.json     - Dependencies
echo    ✅ Documentation     - All .md guides
echo.
echo 🚀 Next steps:
echo    1. npm install
echo    2. npx expo start
echo    3. Scan QR code with Expo Go
echo.
echo 🎉 Ready to code!
pause
