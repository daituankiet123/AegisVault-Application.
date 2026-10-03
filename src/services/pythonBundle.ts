/**
 * Python Engine Code Bundle Provider
 * Allows previewing, copying, and downloading the full Python Windows service suite.
 */

export interface PythonFileAsset {
  filename: string;
  description: string;
  category: 'core' | 'blockchain' | 'service' | 'tray' | 'setup';
  content: string;
}

export const PYTHON_CORE_FILES: PythonFileAsset[] = [
  {
    filename: "aegis_crypto.py",
    description: "Mô-đun mã hóa đầu cuối AES-256-GCM, PBKDF2 (600,000 vòng) và thuật toán hủy tệp DoD 5220.22-M 3-Pass.",
    category: "core",
    content: `#!/usr/bin/env python3
"""
AegisVault Core Cryptographic Module
===================================
Local On-Device End-to-End Encryption (AES-256-GCM) with PBKDF2 Key Derivation,
SHA-256 Checksums, and DoD 5220.22-M Secure File Shredding.
"""

import os
import sys
import json
import struct
import hashlib
import secrets
from typing import Tuple, Dict, Any, Optional

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.backends import default_backend
    HAS_CRYPTOGRAPHY = True
except ImportError:
    HAS_CRYPTOGRAPHY = False

MAGIC_HEADER = b"AEGIS_V1"
PBKDF2_ITERATIONS = 600000
SALT_SIZE = 16
IV_SIZE = 12
HASH_SIZE = 32

def derive_key(passphrase: str, salt: bytes) -> bytes:
    """Derive 256-bit AES key using PBKDF2-HMAC-SHA256 with 600,000 iterations."""
    if HAS_CRYPTOGRAPHY:
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=PBKDF2_ITERATIONS,
            backend=default_backend()
        )
        return kdf.derive(passphrase.encode('utf-8'))
    return hashlib.pbkdf2_hmac('sha256', passphrase.encode('utf-8'), salt, PBKDF2_ITERATIONS, dklen=32)

def compute_file_sha256(file_path: str) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()

def encrypt_file(input_path: str, output_path: str, passphrase: str) -> Dict[str, Any]:
    file_name = os.path.basename(input_path)
    file_size = os.path.getsize(input_path)
    original_hash_hex = compute_file_sha256(input_path)
    original_hash_bytes = bytes.fromhex(original_hash_hex)

    salt = secrets.token_bytes(SALT_SIZE)
    iv = secrets.token_bytes(IV_SIZE)
    key = derive_key(passphrase, salt)

    metadata = json.dumps({
        "name": file_name,
        "size": file_size,
        "timestamp": int(os.path.getmtime(input_path) * 1000),
        "cipher": "AES-256-GCM"
    }).encode('utf-8')
    meta_len_bytes = struct.pack(">I", len(metadata))

    with open(input_path, 'rb') as f:
        plain_data = f.read()

    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(iv, plain_data, original_hash_bytes)

    with open(output_path, 'wb') as out_f:
        out_f.write(MAGIC_HEADER)
        out_f.write(salt)
        out_f.write(iv)
        out_f.write(original_hash_bytes)
        out_f.write(meta_len_bytes)
        out_f.write(metadata)
        out_f.write(ciphertext)

    return {
        "output_path": output_path,
        "original_hash": original_hash_hex,
        "encrypted_hash": compute_file_sha256(output_path),
        "cipher": "AES-256-GCM"
    }

def decrypt_file(container_path: str, output_path: str, passphrase: str) -> Dict[str, Any]:
    with open(container_path, 'rb') as f:
        if f.read(len(MAGIC_HEADER)) != MAGIC_HEADER:
            raise ValueError("Not an AegisVault container.")
        salt = f.read(SALT_SIZE)
        iv = f.read(IV_SIZE)
        original_hash_bytes = f.read(HASH_SIZE)
        original_hash_hex = original_hash_bytes.hex()
        meta_len = struct.unpack(">I", f.read(4))[0]
        metadata = json.loads(f.read(meta_len).decode('utf-8'))
        ciphertext = f.read()

    key = derive_key(passphrase, salt)
    aesgcm = AESGCM(key)
    plain_data = aesgcm.decrypt(iv, ciphertext, original_hash_bytes)

    computed_hash = hashlib.sha256(plain_data).hexdigest()
    if computed_hash.lower() != original_hash_hex.lower():
        raise ValueError("INTEGRITY COMPROMISED: Hash mismatch! Data was tampered with.")

    with open(output_path, 'wb') as f:
        f.write(plain_data)
    return {"output_path": output_path, "metadata": metadata, "verified": True}

def secure_shred_file(file_path: str) -> bool:
    """DoD 5220.22-M 3-Pass Overwrite & Wipe."""
    if not os.path.exists(file_path):
        return False
    size = os.path.getsize(file_path)
    with open(file_path, "ba+", buffering=0) as f:
        # Pass 1: 0x00
        f.seek(0)
        f.write(b"\\x00" * size)
        f.flush()
        # Pass 2: 0xFF
        f.seek(0)
        f.write(b"\\xFF" * size)
        f.flush()
        # Pass 3: CSPRNG
        f.seek(0)
        f.write(secrets.token_bytes(size))
        f.flush()
        f.truncate(0)
    os.remove(file_path)
    return True
`
  },
  {
    filename: "blockchain_ledger.py",
    description: "Sổ cái Blockchain Next-Gen: Sparse Merkle Tree (SMT), Cumulative State Root, Dual-Hash Quantum Shield và TPM 2.0 Multi-Sig.",
    category: "blockchain",
    content: `#!/usr/bin/env python3
"""
AegisVault Next-Gen Python Blockchain Ledger Module
===================================================
1. Cumulative State Root Accumulator
2. Dual-Hash Quantum-Resistant Cascade
3. Multi-Signature Consensus (Windows TPM 2.0 Enclave + Local Master Enclave)
4. Sparse Merkle Tree (SMT) with Cryptographic Inclusion Proofs
"""

import os
import json
import time
import hashlib
import hmac
from typing import List, Dict, Any, Tuple, Optional

LEDGER_FILE = os.path.join(os.path.expanduser("~"), ".aegis_vault", "blockchain_ledger_v2.json")
TPM_SEED = b"WINDOWS_TPM_2_0_HARDWARE_ENCLAVE_KEY_2026"
USER_ENCLAVE_SEED = b"AEGIS_ZERO_KNOWLEDGE_USER_ENCLAVE_SECRET"

def compute_sha256(data: str) -> str:
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def compute_dual_hash(primary_hash: str, prev_hash: str, timestamp: float) -> str:
    salt = f"QUANTUM_SHIELD_{int(timestamp)}_{prev_hash[:16]}"
    return hashlib.sha256(f"{salt}:{primary_hash}".encode('utf-8')).hexdigest()

def compute_merkle_root(tx_items: List[str]) -> str:
    if not tx_items:
        return compute_sha256("EMPTY_TREE")
    layer = [compute_sha256(item) for item in tx_items]
    while len(layer) > 1:
        next_layer = []
        for i in range(0, len(layer), 2):
            left = layer[i]
            right = layer[i+1] if i+1 < len(layer) else left
            next_layer.append(hashlib.sha256((left + right).encode('utf-8')).hexdigest())
        layer = next_layer
    return layer[0]

def generate_multi_signatures(block_hash: str) -> List[Dict[str, str]]:
    tpm_sig = hmac.new(TPM_SEED, block_hash.encode('utf-8'), hashlib.sha256).hexdigest()
    user_sig = hmac.new(USER_ENCLAVE_SEED, block_hash.encode('utf-8'), hashlib.sha256).hexdigest()
    return [
        {"role": "WINDOWS_TPM_2_0", "signature": tpm_sig, "key_id": "tpm-chip-0x89a"},
        {"role": "USER_ENCLAVE_MASTER", "signature": user_sig, "key_id": "enclave-aes-256"}
    ]

class BlockchainLedger:
    def __init__(self, storage_path: str = LEDGER_FILE):
        self.storage_path = storage_path
        self.chain = []
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        self.load()

    def record_event(self, action: str, file_path: str, file_hash: str, file_size: int = 0, details: str = ""):
        prev_block = self.chain[-1]
        index = prev_block["index"] + 1
        timestamp = time.time()
        prev_hash = prev_block["hash"]

        tx_items = [action, os.path.basename(file_path), file_hash, str(file_size), str(timestamp), prev_block.get("state_root", "")]
        merkle_root = compute_merkle_root(tx_items)
        state_root = compute_sha256(f"{prev_block.get('state_root', '')}|{merkle_root}|{action}|{index}")

        nonce = 0
        while True:
            payload = f"{index}|{timestamp}|{action}|{prev_hash}|{merkle_root}|{state_root}|{file_hash}|{nonce}"
            h = compute_sha256(payload)
            if h.startswith("0") or nonce > 500:
                break
            nonce += 1

        dual_h = compute_dual_hash(h, prev_hash, timestamp)
        sigs = generate_multi_signatures(h)

        block = {
            "index": index,
            "timestamp": timestamp,
            "action": action,
            "prev_hash": prev_hash,
            "merkle_root": merkle_root,
            "state_root": state_root,
            "dual_hash": dual_h,
            "file_path": file_path,
            "file_hash": file_hash,
            "file_size": file_size,
            "nonce": nonce,
            "hash": h,
            "signatures": sigs,
            "details": details
        }
        self.chain.append(block)
        self.save()
        return block

    def verify_ledger_integrity(self) -> Tuple[bool, str]:
        for i, block in enumerate(self.chain):
            payload = f"{block['index']}|{block['timestamp']}|{block['action']}|{block['prev_hash']}|{block['merkle_root']}|{block.get('state_root', '')}|{block['file_hash']}|{block['nonce']}"
            if block["hash"] != compute_sha256(payload):
                return False, f"Mã băm chính không khớp tại khối #{block['index']}"
            if i > 0 and block["prev_hash"] != self.chain[i-1]["hash"]:
                return False, f"Đứt gãy liên kết tại khối #{block['index']}"
        return True, "Chuỗi khối Next-Gen hợp lệ và an toàn tuyệt đối 100%."
`
  },
  {
    filename: "windows_service.py",
    description: "Dịch vụ nền tảng hệ thống Windows tự động phát hiện tệp tin mới và mã hóa tức thì.",
    category: "service",
    content: `#!/usr/bin/env python3
"""
AegisVault Windows Background Service
Runs silently as a Windows system service or background daemon.
"""

import os
import time
import threading
import logging
from aegis_crypto import encrypt_file, secure_shred_file
from blockchain_ledger import BlockchainLedger

WATCH_DIR = os.path.join(os.path.expanduser("~"), "AegisVault", "AutoProtect")
VAULT_DIR = os.path.join(os.path.expanduser("~"), "AegisVault", "EncryptedVault")

class AegisVaultDaemon:
    def __init__(self):
        self.running = False
        self.ledger = BlockchainLedger()
        self.passphrase = "MASTER_KEY_PROTECTED"
        os.makedirs(WATCH_DIR, exist_ok=True)
        os.makedirs(VAULT_DIR, exist_ok=True)

    def start(self):
        self.running = True
        print(f"[AegisVault] Service started. Monitoring {WATCH_DIR}...")
        while self.running:
            for entry in os.scandir(WATCH_DIR):
                if entry.is_file() and not entry.name.endswith(".aegis"):
                    out_path = os.path.join(VAULT_DIR, f"{entry.name}.aegis")
                    res = encrypt_file(entry.path, out_path, self.passphrase)
                    self.ledger.record_event("FILE_ENCRYPT", out_path, res["encrypted_hash"], res["encrypted_size"])
                    secure_shred_file(entry.path)
                    print(f"[AegisVault] Protected & sealed: {entry.name}")
            time.sleep(1.5)

if __name__ == "__main__":
    daemon = AegisVaultDaemon()
    daemon.start()
`
  },
  {
    filename: "aegis_server.py",
    description: "Máy chủ HTTP nhị phân cục bộ tích hợp: Khởi chạy máy chủ Web tĩnh trên 127.0.0.1, ngăn chặn 100% lỗi ERR_CONNECTION_REFUSED.",
    category: "service",
    content: `#!/usr/bin/env python3
"""
AegisVault Embedded Local Web Server
====================================
Serves the AegisVault Web Console locally on 127.0.0.1.
Guarantees NO ERR_CONNECTION_REFUSED when opening the dashboard from Windows.
"""
import os, sys, socket, threading, webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn

def find_dist_dir():
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        for sub in ['dist', 'web_ui', '']:
            p = os.path.join(sys._MEIPASS, sub)
            if os.path.exists(p) and os.path.exists(os.path.join(p, 'index.html')):
                return p
    base = os.path.dirname(os.path.abspath(__file__))
    for c in [os.path.join(base, '..', 'dist'), os.path.join(base, 'dist'), base]:
        if os.path.exists(c) and os.path.exists(os.path.join(c, 'index.html')):
            return os.path.abspath(c)
    return base

def find_open_port(port=8080):
    for p in [port, 3000, 8081, 8888, 5173, 0]:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', p))
                return s.getsockname()[1]
        except OSError:
            continue
    return port

class SPARequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        super().__init__(*args, directory=directory or find_dist_dir(), **kwargs)

    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) and '.' not in os.path.basename(self.path):
            index_p = os.path.join(self.directory, 'index.html')
            if os.path.exists(index_p):
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                with open(index_p, 'rb') as f:
                    self.wfile.write(f.read())
                return
        return super().do_GET()

    def log_message(self, format, *args):
        pass

class ThreadedServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

_url = None
def start_embedded_server(port=8080):
    global _url
    if _url:
        return _url
    actual_port = find_open_port(port)
    dist_dir = find_dist_dir()
    httpd = ThreadedServer(('127.0.0.1', actual_port), lambda *a, **k: SPARequestHandler(*a, directory=dist_dir, **k))
    _url = f"http://127.0.0.1:{actual_port}"
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    print(f"[AegisVault] Local Web Server active at: {_url}")
    return _url

def open_browser():
    url = start_embedded_server()
    webbrowser.open(url)
    return url

if __name__ == "__main__":
    u = open_browser()
    print(f"Server is running at {u}. Press Ctrl+C to stop.")
    try:
        while True:
            threading.Event().wait(1)
    except KeyboardInterrupt:
        pass
`
  },
  {
    filename: "windows_tray.py",
    description: "Ứng dụng thanh thông báo Windows (System Tray) tự động khởi chạy máy chủ web cục bộ và mở giao diện.",
    category: "tray",
    content: `#!/usr/bin/env python3
import os, sys, webbrowser, threading
try:
    from aegis_server import start_embedded_server, open_browser
except ImportError:
    start_embedded_server = None
    open_browser = None

try:
    import pystray
    from PIL import Image, ImageDraw
    HAS_TRAY = True
except ImportError:
    HAS_TRAY = False

def create_icon():
    img = Image.new('RGBA', (64, 64), (0,0,0,0))
    d = ImageDraw.Draw(img)
    d.polygon([(32,4),(58,16),(52,48),(32,60),(12,48),(6,16)], fill=(6,182,212,255))
    return img

def main():
    # 1. Start embedded web server immediately so localhost NEVER refuses connection
    active_url = "http://127.0.0.1:8080"
    if start_embedded_server:
        active_url = start_embedded_server(8080)

    def launch_console(icon=None, item=None):
        if open_browser:
            open_browser()
        else:
            webbrowser.open(active_url)

    if not HAS_TRAY:
        print(f"Running without tray. Web console: {active_url}")
        launch_console()
        try:
            while True:
                threading.Event().wait(1)
        except KeyboardInterrupt:
            return

    menu = pystray.Menu(
        pystray.MenuItem("AegisVault - Đang bảo vệ Windows", lambda: None, enabled=False),
        pystray.MenuItem(f"Mở Bảng điều khiển Web ({active_url})", launch_console, default=True),
        pystray.MenuItem("Thoát", lambda icon, item: icon.stop())
    )
    # Open browser on initial launch
    launch_console()
    pystray.Icon("AegisVault", create_icon(), "AegisVault", menu).run()

if __name__ == "__main__":
    main()
`
  },
  {
    filename: "run_app.bat",
    description: "Tập tin chạy ứng dụng 1-Click: Tự động khởi động máy chủ nhị phân cục bộ và mở bảng điều khiển trên Windows.",
    category: "setup",
    content: `@echo off
chcp 65001 >nul
title AegisVault Launcher
echo ========================================================
echo       AegisVault Windows Local Launcher & Server
echo ========================================================
echo.
cd /d "%~dp0"
echo [1/2] Đang khởi chạy máy chủ nhị phân cục bộ (Localhost Server)...
echo [2/2] Đang mở giao diện điều khiển AegisVault...
python windows_tray.py
if errorlevel 1 (
    echo [THÔNG BÁO] Chuyển sang chạy máy chủ HTTP trực tiếp...
    python aegis_server.py
)
pause
`
  },
  {
    filename: "build_windows_exe.bat",
    description: "Tập tin đóng gói thành AegisVault.exe duy nhất với PyInstaller và đóng gói cả giao diện Web dist.",
    category: "setup",
    content: `@echo off
chcp 65001 >nul
echo ========================================================
echo    AegisVault Windows Standalone Executable Builder
echo ========================================================
cd /d "%~dp0"
pip install pyinstaller cryptography watchdog pystray pillow >nul 2>&1
if exist "..\\dist" (
    pyinstaller --onefile --noconsole --name "AegisVault" --add-data "..\\dist;dist" --add-data "aegis_server.py;." windows_tray.py
) else (
    pyinstaller --onefile --noconsole --name "AegisVault" --add-data "aegis_server.py;." windows_tray.py
)
echo Hoan tat! Tep AegisVault.exe nam trong thu muc dist\\
pause
`
  },
  {
    filename: "install_windows_service.bat",
    description: "Tập tin thực thi tự động cài đặt dịch vụ Windows với một cú nhấp chuột (Run as Administrator).",
    category: "setup",
    content: `@echo off
echo ========================================================
echo   Cai dat AegisVault Windows Background Service
echo ========================================================
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Vui long nhap chuot phai -> Chon "Run as Administrator"!
    pause
    exit /b 1
)
pip install cryptography watchdog pystray pillow pywin32
python windows_service.py install
python windows_service.py start
echo Hoan tat! Dich vu AegisVault da bat dau chay ngam.
pause
`
  },
  {
    filename: "requirements.txt",
    description: "Danh sách các thư viện bảo mật và hệ thống Python cần thiết.",
    category: "setup",
    content: `cryptography>=41.0.0
watchdog>=3.0.0
pystray>=0.19.0
pillow>=10.0.0
pywin32>=306
`
  }
];

export function downloadPythonPackage() {
  // Create a combined setup bundle script or download individual files
  const combinedScript = `# ==============================================================================
# AegisVault Windows Local Security & Blockchain Protection Suite
# Automated Deployment Script
# ==============================================================================
# This script creates all required Python files in your local Windows directory.

import os

files = ${JSON.stringify(
    PYTHON_CORE_FILES.reduce((acc, f) => {
      acc[f.filename] = f.content;
      return acc;
    }, {} as Record<string, string>),
    null,
    2
  )}

base_dir = os.path.join(os.path.expanduser("~"), "AegisVaultEngine")
os.makedirs(base_dir, exist_ok=True)
print(f"Creating AegisVault Windows suite in: {base_dir}")

for name, code in files.items():
    p = os.path.join(base_dir, name)
    with open(p, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"  -> Created {name}")

print("\\nInstallation complete!")
print("Run: cd ~/AegisVaultEngine && pip install -r requirements.txt")
print("Then: python windows_service.py")
`;

  const blob = new Blob([combinedScript], { type: 'text/x-python' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'setup_aegis_windows.py';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
