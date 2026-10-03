#!/usr/bin/env python3
"""
AegisVault Windows System Tray Application
=========================================
Minimalist notification tray icon for Windows taskbar.
Provides quick actions: Lock/Unlock Vault, Audit Blockchain, Open Protected Folders,
and automatically serves the Web Console locally (No ERR_CONNECTION_REFUSED).
"""

import os
import sys
import webbrowser
import threading

# Import embedded server
try:
    from aegis_server import start_embedded_server, open_browser
except ImportError:
    try:
        from .aegis_server import start_embedded_server, open_browser
    except Exception:
        start_embedded_server = None
        open_browser = None

try:
    import pystray
    from PIL import Image, ImageDraw
    HAS_TRAY = True
except ImportError:
    HAS_TRAY = False


_active_url = "http://127.0.0.1:8080"


def create_tray_icon():
    # Draw a minimalist shield icon programmatically
    width = 64
    height = 64
    image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Cyan shield
    draw.polygon([(32, 4), (58, 16), (52, 48), (32, 60), (12, 48), (6, 16)], fill=(6, 182, 212, 255))
    # Inner dark lock
    draw.ellipse((26, 22, 38, 34), fill=(15, 23, 42, 255))
    draw.rectangle((24, 32, 40, 46), fill=(15, 23, 42, 255))
    return image


def open_vault_folder(icon, item):
    vault_path = os.path.join(os.path.expanduser("~"), "AegisVault")
    os.makedirs(vault_path, exist_ok=True)
    if sys.platform == "win32":
        os.startfile(vault_path)
    else:
        print(f"Opening folder: {vault_path}")


def audit_blockchain_action(icon, item):
    try:
        from blockchain_ledger import BlockchainLedger
        ledger = BlockchainLedger()
        valid, _, msg = ledger.verify_ledger_integrity()
        title = "AegisVault - Kiểm tra Blockchain"
        notification_msg = f"Tình trạng sổ cái: {'AN TOÀN (100% Khớp)' if valid else 'PHÁT HIỆN LỖI'}\n{msg}"
        icon.notify(notification_msg, title)
    except Exception as e:
        icon.notify(f"Lỗi kiểm toán: {e}", "AegisVault")


def open_web_console(icon, item):
    global _active_url
    if open_browser:
        _active_url = open_browser()
    else:
        webbrowser.open(_active_url)


def exit_action(icon, item):
    icon.stop()


def main():
    global _active_url

    # 1. Start embedded web server in background thread so localhost NEVER refuses connection
    if start_embedded_server:
        _active_url = start_embedded_server(8080)
        print(f"[AegisVault] May chu cuc bo khoi chay thanh cong tai: {_active_url}")

    if not HAS_TRAY:
        print(f"AegisVault dang chay khong co khay he thong. Mo trinh duyet tai: {_active_url}")
        if open_browser:
            open_browser()
        else:
            webbrowser.open(_active_url)
        print("Nhan Ctrl+C de dung.")
        try:
            while True:
                threading.Event().wait(1)
        except KeyboardInterrupt:
            return

    icon_image = create_tray_icon()
    menu = pystray.Menu(
        pystray.MenuItem("AegisVault - Bảo vệ Dữ liệu Cục bộ", lambda: None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Mở Bảng điều khiển Web (Localhost)", open_web_console, default=True),
        pystray.MenuItem("Mở Thư mục Kho an toàn", open_vault_folder),
        pystray.MenuItem("Kiểm tra Sổ cái Blockchain", audit_blockchain_action),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Thoát", exit_action)
    )

    icon = pystray.Icon("AegisVault", icon_image, f"AegisVault ({_active_url})", menu)
    print(f"AegisVault System Tray dang chay tren Taskbar Windows ({_active_url})...")
    
    # Auto-open web console on initial launch
    if open_browser:
        open_browser()

    icon.run()


if __name__ == "__main__":
    main()
