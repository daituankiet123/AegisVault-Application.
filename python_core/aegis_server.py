#!/usr/bin/env python3
"""
AegisVault Embedded Local Web Server
====================================
Serves the AegisVault compiled Web Console locally on 127.0.0.1.
Guarantees NO ERR_CONNECTION_REFUSED when opening the dashboard from Windows.
Supports PyInstaller bundled assets (_MEIPASS) and SPA routing.
"""

import os
import sys
import socket
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn


def find_dist_directory():
    """Locate the dist or web assets folder whether running in dev, prod, or PyInstaller exe."""
    # 1. PyInstaller single-file bundle extraction dir
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        bundle_dist = os.path.join(sys._MEIPASS, 'dist')
        if os.path.exists(bundle_dist):
            return bundle_dist
        bundle_web = os.path.join(sys._MEIPASS, 'web_ui')
        if os.path.exists(bundle_web):
            return bundle_web
        return sys._MEIPASS

    # 2. Local relative directories
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(base_dir, '..', 'dist'),
        os.path.join(base_dir, 'dist'),
        os.path.join(base_dir, 'web_ui'),
        os.path.join(os.getcwd(), 'dist'),
        base_dir
    ]
    for c in candidates:
        if os.path.exists(c) and os.path.exists(os.path.join(c, 'index.html')):
            return os.path.abspath(c)

    return os.path.abspath(base_dir)


def find_free_port(preferred_port=8080):
    """Check if preferred_port is open, otherwise find an available dynamic port."""
    for port in [preferred_port, 3000, 8081, 8888, 5173, 0]:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return s.getsockname()[1]
        except OSError:
            continue
    return preferred_port


class SPAHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Serves static files, with fallback to index.html for Single Page Application client-side routing."""
    
    def __init__(self, *args, directory=None, **kwargs):
        self.dist_dir = directory or find_dist_directory()
        super().__init__(*args, directory=self.dist_dir, **kwargs)

    def do_GET(self):
        # Translate request path to file path
        path = self.translate_path(self.path)
        
        # If requested path does not exist and has no file extension, serve index.html (SPA Fallback)
        if not os.path.exists(path) and '.' not in os.path.basename(self.path):
            index_path = os.path.join(self.dist_dir, 'index.html')
            if os.path.exists(index_path):
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                with open(index_path, 'rb') as f:
                    self.wfile.write(f.read())
                return

        return super().do_GET()

    def end_headers(self):
        # Enable CORS and caching headers for local app
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, format, *args):
        # Silent logging in production
        pass


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


_server_instance = None
_server_url = None


def start_embedded_server(port=8080):
    """Starts the embedded HTTP server in a background daemon thread."""
    global _server_instance, _server_url

    if _server_url:
        return _server_url

    actual_port = find_free_port(port)
    dist_dir = find_dist_directory()

    def handler_factory(*args, **kwargs):
        return SPAHTTPRequestHandler(*args, directory=dist_dir, **kwargs)

    try:
        httpd = ThreadedHTTPServer(('127.0.0.1', actual_port), handler_factory)
        _server_instance = httpd
        _server_url = f"http://127.0.0.1:{actual_port}"

        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        print(f"[AegisVault Web Server] Dang chay tai: {_server_url} (Thu muc: {dist_dir})")
        return _server_url
    except Exception as e:
        print(f"[AegisVault Web Server] Loi khoi dong server: {e}")
        return f"http://127.0.0.1:{actual_port}"


def open_browser():
    """Start server if not already running, then open the default browser."""
    url = start_embedded_server()
    webbrowser.open(url)
    return url


if __name__ == "__main__":
    url = start_embedded_server()
    print(f"Mo trinh duyet: {url}")
    webbrowser.open(url)
    try:
        while True:
            threading.Event().wait(1)
    except KeyboardInterrupt:
        print("Dung server.")
