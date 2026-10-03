# AegisVault - Windows Local Blockchain & E2EE File Protection

> **Hệ thống bảo vệ dữ liệu cục bộ cho máy tính Windows với mã hóa đầu cuối AES-256-GCM, sổ cái Blockchain bất biến thế hệ mới và dịch vụ nền tảng hệ thống Python.**

[![Platform](https://img.shields.io/badge/Platform-Windows%2011%20%7C%2010-0078D6.svg?logo=windows)](https://microsoft.com)
[![Cryptography](https://img.shields.io/badge/Cipher-AES--256--GCM-06B6D4.svg)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
[![KDF](https://img.shields.io/badge/KDF-PBKDF2--SHA256%20(600k%20rounds)-emerald.svg)]()
[![Blockchain](https://img.shields.io/badge/Ledger-Sparse%20Merkle%20Tree%20%7C%20TPM%202.0-8B5CF6.svg)]()
[![Capacity](https://img.shields.io/badge/Vault%20Quota-5.0%20GB-blue.svg)]()

---

## 📑 Mục Lục (Table of Contents)
1. [Giới thiệu Tổng quan (Overview)](#1-giới-thiệu-tổng-quan)
2. [Tính năng Nổi bật (Core Features)](#2-tính-năng-nổi-bật)
3. [Kiến trúc Mật mã & Blockchain Next-Gen](#3-kiến-trúc-mật-mã--blockchain-next-gen)
4. [Hướng dẫn Cài đặt & Triển khai trên Windows](#4-hướng-dẫn-cài-đặt--triển-khai-trên-windows)
   - [Cách 1: Cài đặt Desktop App (PWA 1-Click)](#cách-1-cài-đặt-desktop-app-pwa-khuyên-dùng)
   - [Cách 2: Cài đặt Dịch vụ Chạy ngầm Windows Service](#cách-2-chạy-ngầm-dưới-dạng-windows-service-247)
   - [Cách 3: Đóng gói Tệp Thực thi Độc lập (.exe)](#cách-3-đóng-gói-tệp-thực-thi-độc-lập-exe)
5. [Cấu trúc Thư mục Dự án (Project Structure)](#5-cấu-trúc-thư-mục-dự-án)
6. [Hướng dẫn Sử dụng CLI & Giao diện](#6-hướng-dẫn-sử-dụng-cli--giao-diện)
7. [Cam kết An toàn Zero-Knowledge](#7-cam-kết-an-toàn-zero-knowledge)

---

## 1. Giới thiệu Tổng quan

**AegisVault** là giải pháp bảo mật toàn diện hoạt động **100% cục bộ (On-Device Local)** trên máy tính Windows. Ứng dụng giải quyết triệt để nguy cơ dữ liệu bị đánh cắp, tống tiền bằng mã độc tống tiền (Ransomware), hoặc bị can thiệp âm thầm mà người dùng không hay biết.

Bằng việc kết hợp **Mã hóa Xác thực AES-256-GCM** với **Sổ cái Blockchain Cục bộ**, mọi tệp tin đều được niêm phong mật mã toán học, tự động phát hiện và ngăn chặn mọi sự sai lệch dữ liệu.

---

## 2. Tính năng Nổi bật

- 🛡️ **Mã hóa Đầu Cuối AES-256-GCM**: Khóa đối xứng 256-bit, IV ngẫu nhiên 96-bit và thẻ chứng thực Authentication Tag 128-bit (GHASH).
- 🔑 **Dẫn xuất Khóa PBKDF2 600,000 Vòng Lặp**: Chống lại các cuộc tấn công Brute-force và Rainbow Tables bằng phần cứng GPU chuyên dụng.
- ⛓️ **Sổ cái Blockchain Cục bộ Next-Gen**:
  - **Sparse Merkle Tree (SMT)**: Bằng chứng Merkle Inclusion $O(\log N)$ chứng minh tệp tin nguyên vẹn độc lập.
  - **Cumulative State Root Accumulator**: Lưu vết và tích lũy trạng thái toàn diện tương tự Ethereum 2.0.
  - **Zero-Knowledge File Attestation**: Tạo bằng chứng cam kết bí mật (Pedersen-style Commitments) chứng minh tệp hợp lệ mà không tiết lộ nội dung hay mã băm tệp.
  - **TPM 2.0 Multi-Signature**: Đồng thuận 3-of-3 kết hợp chip bảo mật phần cứng Windows TPM 2.0.
  - **Dual-Hash Quantum Shield**: Phòng thủ va chạm lượng tử với chuỗi xếp tầng thời gian thực.
- 💾 **Dung lượng Kho Lưu trữ 5.0 GB**: Tiện ích theo dõi phân đoạn dung lượng trực quan (Đã mã hóa vs Đang mở trong RAM).
- 🧹 **Hủy Tệp Bảo mật DoD 5220.22-M 3-Pass**: Ghi đè 3 lượt (`0x00`, `0xFF`, CSPRNG ngẫu nhiên) trước khi xóa vĩnh viễn khỏi ổ đĩa.
- 👁️ **Xem trước Tệp An toàn trong Bộ nhớ (Zero Disk Footprint)**: Xem văn bản, hình ảnh trực tiếp trong RAM mà không tạo tệp tạm trên ổ cứng.
- 🔄 **Giám sát Thư mục Tự động (Windows Folder Watchdog)**: Tự động phát hiện tệp mới lưu trong thư mục `AutoProtect`, mã hóa tức thì và tiêu hủy tệp thô.

---

## 3. Kiến trúc Mật mã & Blockchain Next-Gen

### Định dạng Container Tệp Mã hóa `.aegis`
Mỗi tệp tin sau khi mã hóa được đóng gói theo cấu trúc nhị phân chuẩn:
```text
+-------------------+--------------------+-------------------+--------------------+
| MAGIC (8 Bytes)   | SALT (16 Bytes)    | IV (12 Bytes)     | SHA256 (32 Bytes)  |
| "AEGIS_V1"        | PBKDF2 CSPRNG Salt | AES-GCM Nonce     | Original File Hash |
+-------------------+--------------------+-------------------+--------------------+
| META_LEN (4 Bytes)| METADATA (N Bytes) | CIPHERTEXT + TAG  |
| Big-Endian Int    | JSON File Metadata | AES-GCM Payload   |
+-------------------+--------------------+-------------------+
```

### Cấu trúc Khối Sổ cái Blockchain
```json
{
  "index": 1,
  "timestamp": 1775001200000,
  "action": "FILE_ENCRYPT",
  "file_hash": "a8f5c3...",
  "prev_hash": "000000...",
  "merkle_root": "b7e21a...",
  "state_root": "c49d8f...",
  "dual_hash": "d130ae...",
  "nonce": 42,
  "hash": "0e8912...",
  "signatures": [
    { "role": "WINDOWS_TPM_2_0", "key_id": "tpm-chip-0x89a" },
    { "role": "USER_ENCLAVE_MASTER", "key_id": "enclave-aes-256" }
  ]
}
```

---

## 4. Hướng dẫn Cài đặt & Triển khai trên Windows

Ứng dụng hỗ trợ 3 phương thức triển khai linh hoạt:

### Cách 1: Cài đặt Desktop App (PWA Khuyên dùng)
1. Mở ứng dụng trên trình duyệt **Microsoft Edge** hoặc **Google Chrome**.
2. Bấm vào nút **"Cài đặt Desktop App"** ở góc phải trên thanh Header.
3. Hoặc bấm vào biểu tượng **"App Available" / "Cài đặt AegisVault"** trên thanh URL trình duyệt.
4. Chọn **Install**. Ứng dụng sẽ:
   - Tạo biểu tượng trên **Desktop** và **Start Menu**.
   - Chạy trong cửa sổ riêng biệt không thanh URL trình duyệt.
   - Ghim trực tiếp vào thanh **Taskbar Windows**.

---

### Cách 2: Chạy ngầm dưới dạng Windows Service (24/7)
Dành cho máy tính văn phòng, doanh nghiệp cần bảo vệ tệp tự động liên tục ngay cả khi chưa đăng nhập giao diện:

1. Mở thư mục `python_core`.
2. Nhấp chuột phải vào tệp `install_windows_service.bat` $\rightarrow$ Chọn **Run as Administrator**.
3. Tập lệnh sẽ tự động:
   - Cài đặt các thư viện cần thiết: `cryptography`, `watchdog`, `pystray`, `pywin32`.
   - Tạo thư mục tự động bảo vệ: `%USERPROFILE%\AegisVault\AutoProtect`.
   - Tạo kho lưu trữ mã hóa: `%USERPROFILE%\AegisVault\EncryptedVault`.
   - Đăng ký và kích hoạt Windows Background Service: `AegisVaultSvc`.
4. Kiểm tra trạng thái dịch vụ trong Command Prompt (Admin):
   ```cmd
   sc query AegisVaultSvc
   ```
   *(Trạng thái mong đợi: `STATE : 4 RUNNING`)*

---

### Cách 3: Đóng gói Tệp Thực thi Độc lập (.exe)
Nếu muốn chạy trực tiếp mà không cần cài đặt Python trên máy đích:
```bash
# 1. Cài đặt PyInstaller & thư viện giao diện
pip install pyinstaller cryptography watchdog pystray pillow pywin32

# 2. Biên dịch thành tệp AegisVault.exe độc lập (Đã đính kèm Web UI dist & Máy chủ HTTP tự hành):
pyinstaller --onefile --noconsole --name "AegisVault" --add-data "dist;dist" --add-data "aegis_server.py;." python_core/windows_tray.py

# 3. Tệp dist\AegisVault.exe được tạo ra sẵn sàng chạy trực tiếp!
```

> 💡 **Khắc phục lỗi `localhost đã từ chối kết nối / ERR_CONNECTION_REFUSED`**:
> Khi mở khay hệ thống mà trình duyệt báo không thể kết nối tới `localhost`, hãy khởi chạy bằng tập lệnh **`python_core\run_app.bat`** hoặc **`python python_core\aegis_server.py`**. Tập lệnh này tích hợp sẵn máy chủ HTTP nhị phân cục bộ trên cổng `8080`, đảm bảo tự động lắng nghe kết nối trước khi mở trình duyệt.

---

## 5. Cấu trúc Thư mục Dự án

```text
├── index.html                   # Entry point giao diện web & PWA meta tags
├── public/                      # Thư mục tài sản PWA (icon.svg, PNG icons)
│   ├── icon.svg                 # Logo SVG độ phân giải cao
│   ├── pwa-192x192.png          # Biểu tượng PWA cho Windows Start Menu
│   ├── pwa-512x512.png          # Biểu tượng PWA kích thước lớn
│   └── apple-touch-icon.png     # Biểu tượng tương thích hệ thống
├── python_core/                 # Bộ công cụ mã hóa cốt lõi & dịch vụ Windows
│   ├── aegis_server.py          # Máy chủ HTTP nhị phân cục bộ (Chống lỗi ERR_CONNECTION_REFUSED)
│   ├── aegis_crypto.py          # Lõi mã hóa AES-256-GCM & Tiêu hủy DoD
│   ├── blockchain_ledger.py     # Sổ cái Blockchain Next-Gen & SMT Proofs
│   ├── windows_service.py       # Dịch vụ Windows Background Service (pywin32)
│   ├── windows_tray.py          # Khay thông báo Taskbar Windows tự động bật Web Server
│   ├── run_app.bat              # Tập lệnh 1-Click khởi chạy máy chủ & mở giao diện
│   ├── build_windows_exe.bat    # Tập lệnh đóng gói AegisVault.exe với PyInstaller
│   ├── install_windows_service.bat # Tập lệnh cài đặt dịch vụ chạy ngầm 24/7 (Admin)
│   ├── setup_service.ps1        # Script cài đặt PowerShell
│   └── requirements.txt         # Danh mục thư viện Python yêu cầu
├── src/                         # Giao diện người dùng React 19 + TypeScript
│   ├── components/              # Các thành phần giao diện
│   │   ├── Header.tsx           # Thanh điều hướng chuẩn mực & Nút cài đặt
│   │   ├── VaultView.tsx        # Kho tệp, Widget 5 GB, Mã hóa/Giải mã
│   │   ├── BlockchainView.tsx   # Trình khám phá Blockchain & Bằng chứng SMT
│   │   ├── PythonCoreView.tsx   # Trình xem mã nguồn & Mô phỏng Terminal
│   │   ├── TamperAuditView.tsx  # Kiểm tra giả mạo & Phòng thí nghiệm ZK
│   │   ├── WindowsAppDeployView.tsx # Quy trình hoàn thiện cài đặt Desktop App
│   │   ├── SettingsView.tsx     # Cấu hình khóa bí mật & Cụm từ 12 từ
│   │   └── UnlockModal.tsx      # Cửa sổ mở khóa mật khẩu chủ
│   ├── services/                # Các dịch vụ logic nghiệp vụ
│   │   ├── webCrypto.ts         # Web Crypto API AES-256-GCM & KDF 600k rounds
│   │   ├── blockchain.ts        # Quản lý Sổ cái, State Root & ZK Proofs
│   │   └── pythonBundle.ts      # Bộ xuất gói mã nguồn Python hoàn chỉnh
│   └── hooks/
│       └── usePWAInstall.ts     # Hook quản lý cài đặt Desktop App
├── vite.config.ts               # Cấu hình Vite & vite-plugin-pwa
└── tsconfig.json                # Cấu hình TypeScript 5+
```

---

## 6. Hướng dẫn Sử dụng CLI & Giao diện

### Các lệnh CLI Python thông dụng

1. **Mã hóa một tệp tin**:
   ```bash
   python python_core/aegis_crypto.py encrypt secret.pdf secret.pdf.aegis "MatKhauBaoMat@2026"
   ```

2. **Giải mã tệp `.aegis`**:
   ```bash
   python python_core/aegis_crypto.py decrypt secret.pdf.aegis output.pdf "MatKhauBaoMat@2026"
   ```

3. **Tiêu hủy tệp theo chuẩn DoD 5220.22-M**:
   ```bash
   python python_core/aegis_crypto.py shred du_lieu_nhay_cam.txt
   ```

4. **Kiểm toán tính toàn vẹn của Sổ cái Blockchain**:
   ```bash
   python python_core/blockchain_ledger.py verify
   ```

5. **Tạo Bằng chứng Merkle Inclusion cho khối số 2**:
   ```bash
   python python_core/blockchain_ledger.py proof 2
   ```

---

## 7. Cam kết An toàn Zero-Knowledge

1. **100% On-Device**: Không có bất kỳ tệp tin, khóa bí mật hay mã băm nào bị gửi ra máy chủ từ xa. Toàn bộ tính toán diễn ra ngay trên CPU / RAM của máy tính bạn.
2. **Không Lưu Khóa Thô**: Mật khẩu chủ chỉ dùng để dẫn xuất khóa đối xứng tạm thời trong RAM và bị hủy ngay khi khóa kho (Lock Vault) hoặc hết thời gian chờ tự động khóa (Auto-Lock Timeout).
3. **Chống Giả Mạo Tuyệt Đối**: Cấu trúc liên kết mã băm của Sổ cái Blockchain và chữ ký số TPM 2.0 bảo đảm rằng bất kỳ một byte nào bị ransomware hay phần mềm gián điệp sửa đổi sẽ bị hệ thống phát hiện và cô lập tức khắc.

---
*Phát triển bởi đội ngũ kỹ sư bảo mật AegisVault - Tối ưu cho hệ điều hành Windows.*
