@echo off
REM 🧹 Automated Cleanup Script for React Native Expo App (Windows)
REM This removes all old web-based files

echo 🧹 Starting cleanup...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Are you in the project root?
    exit /b 1
)

echo 📂 Deleting old web component folders...

REM Delete old web UI components
if exist "components\" (
    rmdir /s /q "components\"
    echo   ✅ Deleted /components/
)

REM Delete old src/app structure
if exist "src\app\" (
    rmdir /s /q "src\app\"
    echo   ✅ Deleted /src/app/
)

REM Delete supabase
if exist "supabase\" (
    rmdir /s /q "supabase\"
    echo   ✅ Deleted /supabase/
)

REM Delete utils/supabase
if exist "utils\supabase\" (
    rmdir /s /q "utils\supabase\"
    echo   ✅ Deleted /utils/supabase/
)

REM Delete utils folder if empty
if exist "utils\" (
    dir /a /b "utils\" | findstr "^" > nul || (
        rmdir /s /q "utils\"
        echo   ✅ Deleted empty /utils/
    )
)

REM Delete styles folder
if exist "styles\" (
    rmdir /s /q "styles\"
    echo   ✅ Deleted /styles/
)

REM Delete guidelines (optional)
if exist "guidelines\" (
    rmdir /s /q "guidelines\"
    echo   ✅ Deleted /guidelines/
)

echo.
echo 🎉 Cleanup complete!
echo.
echo 📦 Next steps:
echo   1. npm install
echo   2. npx expo start
echo.
echo ✨ Your project is now 100%% clean React Native Expo!
pause