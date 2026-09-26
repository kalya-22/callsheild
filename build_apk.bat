@echo off
title CallShield APK Builder
color 0a
echo ========================================================
echo        CallShield 1-Click Android APK Builder
echo ========================================================
echo.

cd /d "%~dp0\mobile_app"

echo [1/2] Bundling latest React Native & TypeScript changes...
call npx expo export:embed --entry-file node_modules/expo/AppEntry.js --platform android --dev false --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

if %errorlevel% neq 0 (
    echo [!] JavaScript bundling failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Compiling Android APK with Android Studio toolchain...
cd android
if exist "C:\Program Files\Android\Android Studio\jbr" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
)

call gradlew.bat assembleDebug

if %errorlevel% neq 0 (
    echo [!] APK compilation failed! Please build via Android Studio.
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo [SUCCESS] Your updated APK is ready at:
echo mobile_app\android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================================
echo.
pause
