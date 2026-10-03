@echo off
chcp 65001 >nul
echo ========================================================
echo    AegisVault Windows Standalone Executable Builder
echo ========================================================
echo.

echo [1/3] Đang kiểm tra thư viện PyInstaller...
pip install pyinstaller cryptography watchdog pystray pillow >nul 2>&1

echo [2/3] Đang đóng gói tệp AegisVault.exe (Bao gồm Web UI dist)...
cd /d "%~dp0"

REM Bundle dist folder inside PyInstaller so offline localhost works 100%
if exist "..\dist" (
    pyinstaller --onefile --noconsole --name "AegisVault" --add-data "..\dist;dist" --add-data "aegis_server.py;." windows_tray.py
) else (
    pyinstaller --onefile --noconsole --name "AegisVault" --add-data "aegis_server.py;." windows_tray.py
)

echo.
echo [3/3] HOÀN TẤT!
echo Tệp thực thi đã sẵn sàng tại: dist\AegisVault.exe
echo Bạn có thể nhấp đúp vào AegisVault.exe để chạy trực tiếp trên Windows!
pause
