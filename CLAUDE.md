# CLAUDE.md — Portfolio 2026

## Flujo de trabajo (rige sobre cualquier otra regla)

- **`main` = producción** (Vercel publica `main`; GitHub Pages también). **Nunca** se hace push directo a `main`.
- Todo cambio va a la rama **`ajustes`** (se reutiliza siempre; no crear otras salvo que Alejandro lo pida). Cada push genera una vista previa de Vercel:
  https://portfolio-2026-git-ajustes-alejogo96s-projects.vercel.app
- Se publica solo cuando Alejandro lo pide: PR `ajustes` → `main`, merge, y `ajustes` vuelve a quedar igual que `main`.
- Si el cambio toca textos o cifras de un caso, no se inventan datos: se marcan «À compléter» y se avisa.

## Antes de subir cualquier cambio

1. `npm run build` sin errores.
2. `npm run check` (requiere Playwright): ningún texto de los casos puede quedar invisible tras las animaciones.
3. Revisar en navegador desktop (1440) y mobile (390), tema claro y oscuro, y con `prefers-reduced-motion`.
4. Textos nuevos en los tres idiomas (`i18n/fr.json`, `en.json`, `es.json`).
5. Commit pequeño y descriptivo; un tema por commit.

## Buenas prácticas de código

- Estilos con los tokens del caso (`--cs-*`, `--cs-gap`, `--cs-section`); nada de colores o medidas sueltas por proyecto. Un patrón común se define una vez y lo usan todos los casos.
- Animaciones: solo `opacity`/`transform`; respetar `prefers-reduced-motion` (versión estática); **no usar `clip-path` en elementos que se revelan con IntersectionObserver** (los ignora y el texto queda invisible).
- Accesibilidad: contraste AA, objetivos táctiles ≥ 44 px, foco visible, `aria-label` donde un texto se transforma (p. ej. palabra a palabra).
- Rendimiento: imágenes en WebP con `width`/`height`, `loading="lazy"` salvo la portada; no añadir dependencias sin necesidad.
- Contenido en HTML/i18n, comportamiento en `scripts/`, presentación en `styles/`.

## Stack técnico

- Bundler: Parcel (`npm run dev` puerto 1234, `npm run build` → `build/`)
- CSS: custom properties en `styles/global.css` y `styles/case-theme.css`; storytelling en `styles/case-story.css`
- i18n: `scripts/i18n.js` con diccionarios en `i18n/`; idioma por defecto francés (`fr`)
- Casos: `projects/<caso>/index.html`; capítulos por caso en `scripts/case-story.js` (`CHAPTERS`); fondo en `scripts/case-bg.js` (por defecto G1 Grille)
- Deploy: Vercel (`main` y vista previa de `ajustes`) y GitHub Actions → GitHub Pages en cada push a `main`

## Páginas

- Producción: https://portfolio-alejandroguevara.vercel.app/
- Motion lab (comparador de conceptos, sin enlace): `/projects/andy-electric/motion.html`
