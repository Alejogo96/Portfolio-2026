#!/usr/bin/env python3
"""Comprueba que fr/en/es tienen las mismas claves y que cada data-i18n* de los HTML existe.

Uso:  python3 tools/i18n-check.py      (sale con código 1 si hay problemas)
"""
import glob, json, re, sys
d = {l: json.load(open(f"i18n/{l}.json", encoding="utf8")) for l in ("fr", "en", "es")}
bad = 0
for a in ("en", "es"):
    for k in sorted(set(d["fr"]) ^ set(d[a])):
        print(f"clave desalineada fr/{a}: {k}"); bad += 1
for f in ["index.html"] + sorted(glob.glob("projects/*/index.html")):
    s = open(f, encoding="utf8").read()
    for k in set(re.findall(r'data-i18n(?:-html|-alt)?="([^"]+)"', s)):
        if k not in d["fr"]:
            print(f"{f}: clave sin definir: {k}"); bad += 1
for l, dic in d.items():
    for k, v in dic.items():
        if not str(v).strip():
            print(f"{l}: valor vacío: {k}"); bad += 1
print("OK" if not bad else f"{bad} problemas"); sys.exit(1 if bad else 0)
