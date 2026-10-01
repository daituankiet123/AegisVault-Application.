# ============================================================================
# AegisVault PowerShell Setup Script for Windows 10/11
# ============================================================================

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   AegisVault - Windows Local Security & Blockchain Setup" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Check for Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "Vui lòng chạy PowerShell với quyền Administrator (Run as Administrator)!"
    Break
}

# 1. Check Python
Write-Host "[1/4] Kiểm tra phiên bản Python..." -ForegroundColor Yellow
try {
    $pyVer = python --version 2>&1
    Write-Host "Tìm thấy: $pyVer" -ForegroundColor Green
} catch {
    Write-Error "Không tìm thấy Python. Vui lòng cài đặt Python từ python.org và bật Add to PATH."
    Exit
}

# 2. Install requirements
Write-Host "[2/4] Đang cài đặt thư viện cryptography, watchdog, pywin32..." -ForegroundColor Yellow
pip install -r requirements.txt

# 3. Create Vault folders
$vaultDir = Join-Path $env:USERPROFILE "AegisVault"
$autoProtect = Join-Path $vaultDir "AutoProtect"
$encryptedVault = Join-Path $vaultDir "EncryptedVault"
New-Item -ItemType Directory -Force -Path $autoProtect | Out-Null
New-Item -ItemType Directory -Force -Path $encryptedVault | Out-Null
Write-Host "[3/4] Đã tạo thư mục theo dõi: $autoProtect" -ForegroundColor Green

# 4. Register Service
Write-Host "[4/4] Đang đăng ký Windows Background Service..." -ForegroundColor Yellow
python windows_service.py --startup=auto install
python windows_service.py start

Write-Host "================================================================" -ForegroundColor Green
Write-Host " Cài đặt hoàn tất! AegisVault đang bảo vệ máy tính của bạn." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
