#!/usr/bin/env python3
"""Inline each stylesheet into its pages and update the CSP hashes in _headers.

Stylesheets are inlined so they don't block the first render. Edit the .css file, then run:
    python3 tools/inline-css.py

  assets/styles.css  ->  interactive/index.html   (the interactive version)
  assets/site.css    ->  index.html, projects.html   (the normal portfolio)
"""
import base64, hashlib, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
PAGES = {
    "assets/styles.css": ["interactive/index.html"],
    "assets/site.css": ["index.html", "projects.html"],
}

hashes = []
for css_file, pages in PAGES.items():
    css = (root / css_file).read_text().strip()
    body = "\n" + css + "\n  "
    for page in pages:
        path = root / page
        html = path.read_text()
        html, n = re.subn(r"<style>.*?</style>", lambda _: f"<style>{body}</style>", html, count=1, flags=re.S)
        if n != 1:
            raise SystemExit(f"{page}: no <style> block found")
        path.write_text(html)
    digest = base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()
    hashes.append(f"'sha256-{digest}'")
    print(f"{css_file}: {len(css)} bytes -> {', '.join(pages)}")

headers_path = root / "_headers"
headers = headers_path.read_text()
headers, n = re.subn(r"style-src [^;]*;", f"style-src {' '.join(hashes)};", headers, count=1)
if n != 1:
    raise SystemExit("_headers: no style-src directive found")
headers_path.write_text(headers)
print("style-src", " ".join(hashes))
