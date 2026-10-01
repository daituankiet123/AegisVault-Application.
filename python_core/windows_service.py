#!/usr/bin/env python3
"""
AegisVault Windows Background Daemon & System Service
===================================================
Runs transparently as a native Windows Background Service.
Monitors a local folder (e.g. C:\\Users\\<User>\\AegisVault\\Protected),
automatically encrypts new unencrypted files using AES-256-GCM,
records tamper-proof blocks to the local Blockchain ledger, and shreds plaintext copies.
"""

import os
import sys
import time
import threading
import logging
from pathlib import Path

# Local Aegis modules
try:
    from aegis_crypto import encrypt_file, secure_shred_file, compute_file_sha256
    from blockchain_ledger import BlockchainLedger
except ImportError:
    from .aegis_crypto import encrypt_file, secure_shred_file, compute_file_sha256
    from .blockchain_ledger import BlockchainLedger

# Setup logging
LOG_DIR = os.path.join(os.path.expanduser("~"), ".aegis_vault", "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "aegis_service.log")

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [AegisSvc] %(message)s"
)

DEFAULT_WATCH_DIR = os.path.join(os.path.expanduser("~"), "AegisVault", "AutoProtect")
DEFAULT_VAULT_DIR = os.path.join(os.path.expanduser("~"), "AegisVault", "EncryptedVault")


class AegisVaultDaemon:
    def __init__(self, watch_dir: str = DEFAULT_WATCH_DIR, vault_dir: str = DEFAULT_VAULT_DIR):
        self.watch_dir = watch_dir
        self.vault_dir = vault_dir
        self.running = False
        self.passphrase = "DEFAULT_LOCAL_VAULT_KEY_CHANGE_IN_SETTINGS"
        self.ledger = BlockchainLedger()
        
        os.makedirs(self.watch_dir, exist_ok=True)
        os.makedirs(self.vault_dir, exist_ok=True)
        logging.info(f"Initialized AegisVault daemon. Watching: {self.watch_dir}")

    def start(self):
        self.running = True
        logging.info("AegisVault Windows Service started successfully.")
        
        # Monitor thread
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()

    def stop(self):
        logging.info("Stopping AegisVault Windows Service...")
        self.running = False

    def _monitor_loop(self):
        """Continuously check watched directory for unencrypted files."""
        processed_files = set()
        
        while self.running:
            try:
                for entry in os.scandir(self.watch_dir):
                    if entry.is_file() and not entry.name.endswith(".aegis") and not entry.name.startswith("."):
                        file_path = entry.path
                        if file_path not in processed_files:
                            time.sleep(0.5) # Wait for file write to complete
                            self._protect_file(file_path)
                            processed_files.add(file_path)
            except Exception as e:
                logging.error(f"Error in monitor loop: {e}")

            time.sleep(2.0)

    def _protect_file(self, file_path: str):
        try:
            file_name = os.path.basename(file_path)
            logging.info(f"New sensitive file detected: {file_name}. Beginning protection workflow...")
            
            # Target output path in EncryptedVault
            out_name = f"{file_name}.aegis"
            out_path = os.path.join(self.vault_dir, out_name)
            
            # 1. Encrypt with AES-256-GCM
            result = encrypt_file(file_path, out_path, self.passphrase)
            
            # 2. Record to local Blockchain
            self.ledger.record_event(
                action="FILE_ENCRYPT",
                file_path=out_path,
                file_hash=result["encrypted_hash"],
                file_size=result["encrypted_size"],
                details=f"Tự động mã hóa tệp từ thư mục giám sát: {file_name}"
            )
            logging.info(f"Block added to blockchain for file: {file_name} (Hash: {result['encrypted_hash'][:16]}...)")
            
            # 3. Securely shred original plaintext file (DoD 5220.22-M)
            secure_shred_file(file_path)
            logging.info(f"Original plaintext {file_name} securely wiped using DoD 5220.22-M 3-pass overwrite.")
            
        except Exception as e:
            logging.error(f"Failed to protect file {file_path}: {e}")


# Windows Service Framework Integration (pywin32)
try:
    import win32serviceutil
    import win32service
    import win32event
    import servicemanager

    class AegisWindowsService(win32serviceutil.ServiceFramework):
        _svc_name_ = "AegisVaultSvc"
        _svc_display_name_ = "AegisVault Local Data Protection Service"
        _svc_description_ = "Cung cấp mã hóa đầu cuối AES-256-GCM và sổ cái Blockchain bảo vệ tệp tin Windows."

        def __init__(self, args):
            win32serviceutil.ServiceFramework.__init__(self, args)
            self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
            self.daemon = AegisVaultDaemon()

        def SvcStop(self):
            self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
            win32event.SetEvent(self.hWaitStop)
            self.daemon.stop()

        def SvcDoRun(self):
            servicemanager.LogMsg(
                servicemanager.EVENTLOG_INFORMATION_TYPE,
                servicemanager.PKEY_INFO_APPLICATION_STARTING,
                (self._svc_name_, "")
            )
            self.daemon.start()
            win32event.WaitForSingleObject(self.hWaitStop, win32event.INFINITE)

except ImportError:
    # Running outside Windows or pywin32 not installed - standalone daemon fallback
    AegisWindowsService = None


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--daemon":
        print("Starting AegisVault Standalone Daemon...")
        daemon = AegisVaultDaemon()
        daemon.start()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            daemon.stop()
            print("Daemon stopped.")
    elif AegisWindowsService is not None:
        win32serviceutil.HandleCommandLine(AegisWindowsService)
    else:
        print("AegisVault Windows Service")
        print("Usage:")
        print("  python windows_service.py --daemon   (Run background daemon directly)")
