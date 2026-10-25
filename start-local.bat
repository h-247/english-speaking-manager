@echo off
title English Speaking Practice Manager
echo ====================================================
echo Starting English Speaking Practice Manager (Windows)
echo ====================================================
echo.

if not exist node_modules (
    echo [1/3] Installing dependencies...
    call npm install
)

echo [2/3] Generating database schema...
call npm run db:generate

echo [3/3] Launching development server on http://localhost:3200 ...
call npm run dev
pause
