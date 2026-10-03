@echo off
chcp 65001 >nul
title AegisVault - Windows Local Launcher
echo ========================================================
echo       AegisVault Windows Local Launcher & Server
echo ========================================================
echo.
cd /d "%~dp0"

echo [1/2] Đang khởi chạy máy chủ nhị phân cục bộ (Localhost Server)...
echo [2/2] Đang mở giao diện điều khiển AegisVault...

REM Run embedded python web server + tray application
python windows_tray.py

if errorlevel 1 (
    echo.
    echo [THÔNG BÁO] Chưa cài pystray, chuyển sang chạy máy chủ HTTP trực tiếp...
    python aegis_server.py
)

pause
