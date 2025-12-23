@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
echo Building frontend project...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)
echo Build successful!
pause

