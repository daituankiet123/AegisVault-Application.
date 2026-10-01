#!/usr/bin/env python3
"""
AegisVault Windows System Tray Application
=========================================
Minimalist notification tray icon for Windows taskbar.
Provides quick actions: Lock/Unlock Vault, Audit Blockchain, Open Protected Folders.
"""

import os
import sys
import webbrowser

try:
    import pystray
    from PIL import Image, ImageDraw
    HAS_TRAY = True
except ImportError:
    HAS_TRAY = False


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
    from blockchain_ledger import BlockchainLedger
    ledger = BlockchainLedger()
    valid, _, msg = ledger.verify_ledger_integrity()
    title = "AegisVault - Kiểm tra Blockchain"
    notification_msg = f"Tình trạng sổ cái: {'AN TOÀN (100% Khớp)' if valid else 'PHÁT HIỆN LỖI'}\n{msg}"
    icon.notify(notification_msg, title)


def open_web_console(icon, item):
    webbrowser.open("http://localhost:3000")


def exit_action(icon, item):
    icon.stop()


def main():
    if not HAS_TRAY:
        print("Vui lòng cài đặt pystray & Pillow để chạy System Tray: pip install pystray pillow")
        return

    icon_image = create_tray_icon()
    menu = pystray.Menu(
        pystray.MenuItem("AegisVault - Bảo vệ Dữ liệu Cục bộ", lambda: None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Mở Bảng điều khiển Web", open_web_console),
        pystray.MenuItem("Mở Thư mục Kho an toàn", open_vault_folder),
        pystray.MenuItem("Kiểm tra Sổ cái Blockchain", audit_blockchain_action),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Thoát", exit_action)
    )

    icon = pystray.Icon("AegisVault", icon_image, "AegisVault Local Protection", menu)
    print("AegisVault System Tray đang chạy trên thanh Taskbar Windows...")
    icon.run()


if __name__ == "__main__":
    main()
