#!/usr/bin/env python3
"""
Builds a crawlable, JS-optional version of the Design-Canvas-published pages.

The canvas (claude.ai/design) remains the only place the site is designed and
edited. Every publish from the canvas overwrites index.html / impressum.html /
datenschutz.html in this repo with a self-contained "bundled" page: raw HTML
is just an SVG splash + "Unpacking..." spinner, and the real content only
exists after a large inline JS blob decodes and renders it client-side. That
means search engines, link-unfurl bots (Slack/LinkedIn/iMessage previews),
and any visitor whose JS fails to run see nothing real, and the page title/
meta description never get set at all.

This script does NOT touch those source files. It reads them, boots a real
headless browser to let their own existing JS render the default first-visit
state (same runtime, same output a visitor gets), captures that rendered
markup, and writes a *patched copy* into dist/ with:
  - a real <title>, meta description, canonical link, Open Graph / Twitter
    Card tags (pulled from PAGES metadata below)
  - the real rendered content sitting in <body> in place of the placeholder,
    so it is visible with zero JS
  - the exact final <style> rules the app itself injects at runtime, so the
    fallback is styled identically
  - the original bundler <script> left completely unmodified, so once JS
    successfully boots it wipes this fallback and mounts the live
    interactive app exactly as it does today (verified: the runtime replaces
    <body> wholesale with a single #dc-root element)

Run: python3 scripts/prerender.py <src_dir> <dist_dir>
Requires: pip install playwright && playwright install --with-deps chromium
"""
import http.server
import re
import shutil
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

SITE_ORIGIN = "https://shruggie.consulting"

PAGES = [
    {
        "file": "index.html",
        "url_path": "/",
        "lang": "en",
        "title": "Shruggie Consulting — Client Service & Account Leadership for Agencies",
        "description": (
            "I help small and mid-size agencies run client service properly: "
            "account leads who own the relationship, meetings clients look "
            "forward to, and no surprises before a renewal."
        ),
        "og_locale": "en_US",
        "noindex": False,
        "og_image": "og-index.png",
    },
    {
        "file": "impressum.html",
        "url_path": "/impressum.html",
        "lang": "de",
        "title": "Impressum — Shruggie Consulting",
        "description": (
            "Impressum und Anbieterkennzeichnung gemäß § 5 DDG für Shruggie "
            "Consulting, Benjamin Birkelbach, München."
        ),
        "og_locale": "de_DE",
        "noindex": True,
        "og_image": "og-impressum.png",
    },
    {
        "file": "datenschutz.html",
        "url_path": "/datenschutz.html",
        "lang": "de",
        "title": "Datenschutz — Shruggie Consulting",
        "description": (
            "Datenschutzerklärung von Shruggie Consulting: welche Daten "
            "erhoben werden, Google Analytics mit Consent-Steuerung, und "
            "Ihre Rechte."
        ),
        "og_locale": "de_DE",
        "noindex": True,
        "og_image": "og-datenschutz.png",
    },
]

THUMBNAIL_BLOCK_RE = re.compile(
    r'<div id="__bundler_thumbnail">.*?<div id="__bundler_loading">Unpacking\.\.\.</div>',
    re.DOTALL,
)
THUMBNAIL_SVG_RE = re.compile(
    r'<div id="__bundler_thumbnail">\s*(<svg.*?</svg>)\s*</div>', re.DOTALL
)
TITLE_TAG_RE = re.compile(r"<title>.*?</title>", re.DOTALL)
NOSCRIPT_RE = re.compile(r"<noscript>.*?</noscript>", re.DOTALL)

GOOGLE_FONTS_HREF = (
    "https://fonts.googleapis.com/css2?family=Archivo+Black"
    "&family=Space+Grotesk:wght@400;500;600;700&display=swap"
)
# The runtime's own bundler inlines Google Fonts as base64 @font-face blocks
# (~280KB each, duplicated) so the page works with zero external requests.
# For the static fallback that's wasted weight for zero benefit (crawlers and
# no-JS visitors don't need pixel-identical webfonts) — link the real Google
# Fonts stylesheet instead, and drop any captured style tag over this size.
INLINE_FONT_BYTES_CUTOFF = 20_000


def escape_attr(s: str) -> str:
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve_dir(directory: Path, port: int):
    handler = lambda *a, **kw: QuietHandler(*a, directory=str(directory), **kw)
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd


def build_head_extra(page: dict, styles_css: str) -> str:
    canonical = SITE_ORIGIN + page["url_path"]
    og_image = SITE_ORIGIN + "/" + page["og_image"]
    robots = (
        '\n  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">'
        if page["noindex"]
        else ""
    )
    return f'''
  <meta name="description" content="{escape_attr(page["description"])}">
  <link rel="canonical" href="{canonical}">{robots}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="{GOOGLE_FONTS_HREF}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Shruggie Consulting">
  <meta property="og:title" content="{escape_attr(page["title"])}">
  <meta property="og:description" content="{escape_attr(page["description"])}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{og_image}">
  <meta property="og:locale" content="{page["og_locale"]}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{escape_attr(page["title"])}">
  <meta name="twitter:description" content="{escape_attr(page["description"])}">
  <meta name="twitter:image" content="{og_image}">
  <style>
{styles_css}
  </style>
'''


def patch_html(original: str, page: dict, root_html: str, styles_css: str) -> str:
    if not TITLE_TAG_RE.search(original):
        raise RuntimeError(f"{page['file']}: <title> marker not found — canvas output format changed")
    if not THUMBNAIL_BLOCK_RE.search(original):
        raise RuntimeError(f"{page['file']}: placeholder block not found — canvas output format changed")
    if not NOSCRIPT_RE.search(original):
        raise RuntimeError(f"{page['file']}: <noscript> block not found — canvas output format changed")
    if "<html>" not in original:
        raise RuntimeError(f"{page['file']}: bare <html> tag not found — canvas output format changed")

    out = TITLE_TAG_RE.sub(
        f"<title>{page['title']}</title>" + build_head_extra(page, styles_css), original, count=1
    )
    out = out.replace("<html>", f'<html lang="{page["lang"]}">', 1)
    # The noscript "requires JavaScript" notice is no longer true once the
    # fallback content below is in place — drop it rather than leave a
    # message that contradicts the content right next to it.
    out = NOSCRIPT_RE.sub("", out, count=1)

    replacement = (
        '<div id="__bundler_thumbnail" style="display:none"></div>\n'
        '  <div id="__bundler_loading" style="display:none">Unpacking...</div>\n'
        f'  {root_html}'
    )
    out = THUMBNAIL_BLOCK_RE.sub(lambda _: replacement, out, count=1)
    return out


def render_og_image(page_pw, original_html: str, svg_match: re.Match, dist: Path, page: dict):
    svg = svg_match.group(1)
    html = (
        "<!DOCTYPE html><html><head><meta charset=utf-8>"
        "<style>*{margin:0}svg{display:block;width:1200px;height:800px}</style>"
        f"</head><body>{svg}</body></html>"
    )
    page_pw.set_content(html)
    page_pw.set_viewport_size({"width": 1200, "height": 800})
    el = page_pw.query_selector("svg")
    el.screenshot(path=str(dist / page["og_image"]))


def main():
    if len(sys.argv) != 3:
        print("usage: prerender.py <src_dir> <dist_dir>", file=sys.stderr)
        sys.exit(1)

    src = Path(sys.argv[1]).resolve()
    dist = Path(sys.argv[2]).resolve()

    if dist.exists():
        shutil.rmtree(dist)
    shutil.copytree(
        src,
        dist,
        ignore=shutil.ignore_patterns(
            ".git", ".github", "scripts", ".gitignore", "dist"
        ),
    )

    httpd = serve_dir(dist, 8943)

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context()
        render_page = ctx.new_page()

        for page in PAGES:
            src_file = src / page["file"]
            original = src_file.read_text(encoding="utf-8")

            svg_match = THUMBNAIL_SVG_RE.search(original)
            if not svg_match:
                raise RuntimeError(f"{page['file']}: could not find placeholder SVG for og:image")
            render_og_image(render_page, original, svg_match, dist, page)

            p = ctx.new_page()
            p.goto(f"http://127.0.0.1:8943/{page['file']}", wait_until="networkidle")
            p.wait_for_selector("#dc-root", timeout=20000)
            p.wait_for_timeout(300)  # let webfonts/late layout settle

            root_html = p.eval_on_selector("#dc-root", "el => el.outerHTML")
            style_texts = p.eval_on_selector_all(
                "head style", "els => els.map(e => e.textContent)"
            )
            # Drop huge inlined-font @font-face blocks (see GOOGLE_FONTS_HREF
            # above) and de-duplicate identical blocks the runtime repeats.
            seen = set()
            kept = []
            for t in style_texts:
                if len(t) > INLINE_FONT_BYTES_CUTOFF or t in seen:
                    continue
                seen.add(t)
                kept.append(t)
            styles_css = "\n".join(kept)
            p.close()

            patched = patch_html(original, page, root_html, styles_css)
            (dist / page["file"]).write_text(patched, encoding="utf-8")
            print(f"patched {page['file']} ({len(patched)} bytes, root {len(root_html)} bytes)")

        browser.close()

    httpd.shutdown()
    print(f"done -> {dist}")


if __name__ == "__main__":
    main()
