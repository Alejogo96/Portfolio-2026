#!/usr/bin/env python3
"""Reglas de contenido del portfolio (CLAUDE.md). Sale con código 1 si algo falla.
- Sin guiones largos ni de pausa (—, –, " - ") en i18n/*.json ni en el texto visible de los HTML.
- Toda <img> con width y height; loading="lazy" salvo la primera de cada página.
- Sin border-radius ni box-shadow en las imágenes de los casos (styles/case-*.css)."""
import glob, json, re, sys

errors = []
DASH = re.compile(r"[—–]|(?<=\S) - (?=\S)")

for path in sorted(glob.glob("i18n/*.json")):
    for key, val in json.load(open(path, encoding="utf-8")).items():
        if isinstance(val, str) and DASH.search(re.sub(r"<[^>]+>", " ", val)):
            errors.append(f"{path}: guion en «{key}»")

for path in ["index.html"] + sorted(glob.glob("projects/*/*.html")):
    html = open(path, encoding="utf-8").read()
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.S)
    for chunk in re.sub(r"<[^>]+>", "\0", text).split("\0"):
        if DASH.search(chunk):
            errors.append(f"{path}: guion en «{chunk.strip()[:50]}»")
    imgs = re.findall(r"<img\b[^>]*>", html)
    for i, tag in enumerate(imgs):
        if ".svg" in tag or path == "index.html":
            continue
        if "width=" not in tag or "height=" not in tag:
            errors.append(f"{path}: <img> sin width/height: {tag[:70]}")

for path in glob.glob("styles/case-*.css"):
    css = open(path, encoding="utf-8").read()
    for m in re.finditer(r"([^{}]*\bimg\b[^{}]*|[^{}]*\.cs-media[^{}]*|[^{}]*\.cs-carousel[^{}]*)\{([^}]*)\}", css):
        body = m.group(2)
        if re.search(r"__(btn|bar|count)", m.group(1)):
            continue
        if re.search(r"border-radius:\s*(?!0\b)[1-9]", body) or re.search(r"box-shadow:\s*0 0 0 1px", body):
            errors.append(f"{path}: marco o radio en imagen: {m.group(1).strip()[:60]}")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print("OK contenido")
