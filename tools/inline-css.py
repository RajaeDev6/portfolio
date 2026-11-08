#!/usr/bin/env python3
"""Inline assets/styles.css into index.html and update the CSP hash in _headers.

The stylesheet is inlined so it doesn't block the first render. Edit
assets/styles.css, then run:  python3 tools/inline-css.py
"""
import base64, hashlib, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
css = (root / "assets/styles.css").read_text().strip()
body = "\n" + css + "\n  "

html_path = root / "index.html"
html = html_path.read_text()
html, n = re.subn(r"<style>.*?</style>", lambda _: f"<style>{body}</style>", html, count=1, flags=re.S)
if n != 1:
    raise SystemExit("index.html: no <style> block found")
html_path.write_text(html)

digest = base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()
headers_path = root / "_headers"
headers = headers_path.read_text()
headers, n = re.subn(r"style-src [^;]*;", f"style-src 'sha256-{digest}';", headers, count=1)
if n != 1:
    raise SystemExit("_headers: no style-src directive found")
headers_path.write_text(headers)
print(f"Inlined {len(css)} bytes of CSS; style-src 'sha256-{digest}'")
