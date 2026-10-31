#!/usr/bin/env python3
"""Convierte PNG/JPG nuevos a WebP (ancho máx. 2000 px, calidad 80) y actualiza referencias.

Uso:  python3 tools/optimize-images.py [carpeta]   (por defecto: .)
- Las tarjetas `card-*.png` también generan un JPG de 1200 px para Open Graph.
- Borra el original tras convertirlo y reescribe las referencias en .html/.css/.js/.json.
Requiere: pip install pillow
"""
import glob, os, sys
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
root = sys.argv[1] if len(sys.argv) > 1 else "."
SKIP = ("/node_modules/", "/build/", "/.git/", "/.parcel-cache/")
conv = {}
for f in glob.glob(root + "/**/*", recursive=True):
    if not f.lower().endswith((".png", ".jpg", ".jpeg")) or any(s in f for s in SKIP):
        continue
    try:
        im = Image.open(f); im.load()
    except Exception:
        continue  # p. ej. SVG con extensión .png
    base = os.path.basename(f)
    card = base.startswith("card-")
    if card and f.lower().endswith((".jpg", ".jpeg")):
        continue  # JPG de Open Graph, se mantiene
    maxw = 1600 if card else 2000
    if card:
        og = im.convert("RGB"); og = og.resize((1200, round(og.height * 1200 / og.width)), Image.LANCZOS)
        og.save(os.path.splitext(f)[0] + ".jpg", "JPEG", quality=82, optimize=True, progressive=True)
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA")
    out = os.path.splitext(f)[0] + ".webp"
    im.save(out, "WEBP", quality=80, method=6)
    if os.path.abspath(out) != os.path.abspath(f):
        os.remove(f)
        conv[base] = os.path.basename(out)
for p in glob.glob(root + "/**/*", recursive=True):
    if not p.endswith((".html", ".css", ".js", ".json")) or any(s in p for s in SKIP) or "package-lock" in p:
        continue
    s = open(p, encoding="utf8").read(); o = s
    for a, b in conv.items():
        s = s.replace(a, b)
    if s != o:
        open(p, "w", encoding="utf8").write(s)
print(f"{len(conv)} imágenes convertidas")
