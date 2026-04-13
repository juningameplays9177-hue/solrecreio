@echo off
chcp 65001 >nul
title Adicionar Node.js ao PATH
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\add-nodejs-to-user-path.ps1"
if errorlevel 1 pause & exit /b 1

echo.
pause
