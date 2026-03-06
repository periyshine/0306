#!/usr/bin/env python3
"""
Simple HTTP server for testing the Fitness Tracker PWA locally.
PWA features require HTTPS or localhost, so use this script instead of opening HTML files directly.
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        # Add Service Worker related headers
        self.send_header('Service-Worker-Allowed', '/')
        super().end_headers()

def start_server():
    """Start the HTTP server and open the browser"""
    # Change to the directory where this script is located
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 Starting Fitness Tracker PWA Server...")
        print(f"📱 Server running at: http://localhost:{PORT}")
        print(f"💡 Open your browser and navigate to: http://localhost:{PORT}")
        print(f"⏹️  Press Ctrl+C to stop the server\n")

        # Automatically open browser after a short delay
        print("Opening browser in 2 seconds...")
        import threading
        def open_browser():
            import time
            time.sleep(2)
            webbrowser.open(f'http://localhost:{PORT}')

        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Server stopped. Thank you for using Fitness Tracker PWA!")
            httpd.shutdown()

if __name__ == "__main__":
    start_server()
