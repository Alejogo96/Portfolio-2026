# CLAUDE.md — Portfolio 2026

## Regla de despliegue automático

**Después de cada cambio de código, siempre:**
1. Hacer `git add` de los archivos modificados
2. Hacer `git commit` con un mensaje descriptivo
3. Hacer `git push origin main`
4. Mostrar el link del sitio publicado:
   - Home: https://alejogo96.github.io/Portfolio-2026/
   - Ublo: https://alejogo96.github.io/Portfolio-2026/projects/ublo/
   - Bellpi: https://alejogo96.github.io/Portfolio-2026/projects/bellpi/
   - Andy Electric: https://alejogo96.github.io/Portfolio-2026/projects/andy-electric/
5. Avisar que el deploy tarda ~1–2 min en reflejarse (GitHub Actions)

No esperar confirmación del usuario para hacer push. El push es parte del flujo normal de cada cambio.

## Stack técnico

- Bundler: Parcel (`npm run dev` puerto 1234, `npm run build` → `build/`)
- CSS: custom properties en `styles/global.css`, estilos por página en cada proyecto
- i18n: `scripts/i18n.js` con diccionarios en `i18n/fr.json`, `en.json`, `es.json`
- Deploy: GitHub Actions en cada push a `main` → GitHub Pages

## Idioma por defecto

Francés (`fr`). El switcher FR | EN | ES aparece en el navbar de todas las páginas.

## Proyectos

- `projects/ublo/` — Fondo #f6f4ff, acento #3f22aa
- `projects/bellpi/` — Fondo claro
- `projects/andy-electric/` — Fondo dark gradient, acento #ff0020
