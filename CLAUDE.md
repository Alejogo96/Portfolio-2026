# CLAUDE.md — Portfolio 2026

## Flujo de trabajo (rige sobre cualquier otra regla)

- **`main` = producción** (Vercel publica `main`; GitHub Pages también). **Nunca** se hace push directo a `main`.
- Todo cambio va a la rama **`ajustes`** (se reutiliza siempre; no crear otras salvo que Alejandro lo pida). Cada push genera una vista previa de Vercel:
  https://portfolio-2026-git-ajustes-alejogo96s-projects.vercel.app
- Se publica solo cuando Alejandro lo pide: PR `ajustes` → `main`, merge, y `ajustes` vuelve a quedar igual que `main`.
- Si el cambio toca textos o cifras de un caso, no se inventan datos: se marcan «À compléter» y se avisa.

## Automatización (usar siempre)

- `npm run verify` = `lint` + `build` + `check`. Es lo único que hace falta correr antes de subir.
- `npm run lint`: `tools/i18n-check.py` (claves en fr/en/es) y `tools/lint-content.py` (sin guiones largos `—` `–` ni ` - ` en i18n y HTML; `<img>` de los casos con `width`/`height`; sin `border-radius` ni sombra en imágenes de los casos).
- `npm run check` (Playwright, tarda ~2 min: lanzarlo en segundo plano): textos que no quedan invisibles tras las animaciones, y en 1440 y 390 px sin scroll horizontal, sin imágenes recortadas (proporción distinta a la real) ni ampliadas por encima de su tamaño real.
- Si una petición de Alejandro se repite (una regla de estilo, un patrón de imagen), se convierte en un check en `tools/` y se anota aquí.
- Publicar: commit en `ajustes`, `git push`, PR `ajustes` → `main` con las herramientas de GitHub (`gh pr create` falla), merge, y luego `git fetch && git reset --hard origin/main && git push --force-with-lease origin ajustes`.

## Reglas visuales ya decididas

- Imágenes de los casos limpias: sin marco, sombra ni bordes redondeados.
- Series de más de 2 imágenes seguidas: carrusel horizontal (desktop y mobile), sin pasar del tamaño real. Zoom al clic con el lightbox.
- Menú sin iconos de proyecto. CV sin índice flotante ni cards.
- Funcionalidades presentadas como en Behance: tablero `cs-board` (título + fila de pantallas `cs-phones`, con pantalla grande `cs-board__lead` opcional). Alto fijo y ancho auto, sin pasar del tamaño real; en móvil la fila hace scroll horizontal. Ejemplo: `projects/spotify`.
- Un tablero con varios grupos de pantallas va en una sola fila (`cs-board--groups`); los textos complementarios van junto a las pantallas (`cs-board__note`), como en Behance.
- Secciones con varias piezas (p. ej. el sistema de diseño) usan scroll horizontal fijo `cs-hscroll` (`data-hscroll`): solo `transform`, en móvil y con `prefers-reduced-motion` es scroll nativo con snap. Ejemplo: `projects/spotify`.

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
