@echo off
:: ============================================================================
:: AegisVault Windows Service Installer
:: Automatically configures Python environment, installs cryptographic libs,
:: and registers AegisVault as a native background Windows Service.
:: ============================================================================

title AegisVault - Windows System Service Setup
echo ================================================================
echo   AegisVault: Local Windows E2EE & Blockchain Protection Setup
echo ================================================================
echo.

:: Check for Administrative privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [LOI] Vui long chay tap tin nay voi quyen Quan tri vien (Run as Administrator)!
    echo Nhan chuot phai vao file -> Chon "Run as Administrator".
    pause
    exit /b 1
)

echo [1/4] Kiem tra moi truong Python...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [LOI] Khong tim thay Python tren may tinh cua ban!
    echo Vui long cai dat Python 3.10 tro len tu https://www.python.org/
    echo Nho tich chon "Add Python to PATH" khi cai dat.
    pause
    exit /b 1
)

echo [2/4] Dang cai dat cac thu vien bao mat va nen tang he thong...
pip install -r requirements.txt
if %errorLevel% neq 0 (
    echo [CANH BAO] Khong the cai mot so thu vien. Thu lai voi --upgrade...
    pip install cryptography watchdog pystray pillow pywin32
)

echo [3/4] Dang tao cac thu muc luu tru kho bao mat...
mkdir "%USERPROFILE%\AegisVault\AutoProtect" 2>nul
mkdir "%USERPROFILE%\AegisVault\EncryptedVault" 2>nul
mkdir "%USERPROFILE%\.aegis_vault\logs" 2>nul

echo [4/4] Dang dang ky Dich vu he thong Windows Service (AegisVaultSvc)...
python windows_service.py --startup=auto install
if %errorLevel% equ 0 (
    echo Khoi dong dich vu nen tang...
    python windows_service.py start
    echo.
    echo ================================================================
    echo  [HOAN TAT] Dich vu AegisVault da duoc cai dat thanh cong!
    echo  - Trang thai: Dang chay ngam trong he thong Windows (Background Service)
    echo  - Thu muc tu dong bao ve: %USERPROFILE%\AegisVault\AutoProtect
    echo  - Kho luu tru ma hoa: %USERPROFILE%\AegisVault\EncryptedVault
    echo ================================================================
) else (
    echo [THONG BAO] Neu ban khong dung pywin32, ban co the chay truc tiep:
    echo python windows_service.py --daemon
)

pause
