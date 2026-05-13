# Alejandro Guevara — Portfolio 2026

Sitio web del portafolio profesional de Alejandro Guevara (UX/UI Designer & Product Designer).
Monorepo estático con **Parcel** + **HTML/CSS** + un sistema **i18n vanilla** para Español, Inglés y Francés.

## Estructura

```
BOOK2026/
├── index.html                  # Home (hero, proyectos, CV, contacto)
├── styles/
│   ├── global.css              # Tokens, reset, utilidades compartidas
│   └── home.css                # Estilos del home (originalmente index.css)
├── public/                     # Assets del home
├── projects/
│   ├── ublo/
│   │   ├── index.html          # Caso de estudio Ublo
│   │   ├── styles.css
│   │   └── public/             # Assets propios del caso
│   ├── bellpi/
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── public/
│   └── andy-electric/
│       ├── index.html
│       ├── styles.css
│       └── public/
├── scripts/
│   └── i18n.js                 # Sistema multilenguaje
├── i18n/
│   ├── es.json                 # Diccionario español (default)
│   ├── en.json                 # Diccionario inglés
│   └── fr.json                 # Diccionario francés
├── package.json
└── README.md
```

## Cómo ejecutar

Requisitos: Node.js 18+.

```bash
npm install
npm run dev
```

Abre <http://localhost:1234>.

Para compilar a producción:

```bash
npm run build
```

El sitio compilado se genera en `build/`.

## Sistema de idiomas

El sitio incluye un selector de idioma en la cabecera del home (ES / EN / FR).
La preferencia se guarda en `localStorage` (`pf:lang`) y se aplica en todas las páginas.

Para añadir una nueva clave traducible:
1. Marca el elemento HTML: `<h2 data-i18n="mi.clave">Texto fallback</h2>`.
2. Añade la clave en `i18n/es.json`, `i18n/en.json`, `i18n/fr.json`.

Si necesitas que la traducción contenga HTML (por ejemplo `<br>`), usa `data-i18n-html`.

## Convenciones

- **CSS**: cada página tiene su `styles.css` aislado; los tokens y el reset viven en `styles/global.css`.
- **Assets**: cada caso de estudio mantiene su carpeta `public/` para evitar colisiones.
- **Accesibilidad**: navegación con landmarks (`nav`, `main`, `header`), `aria-label` en links de nav, focus visible global.
- **Performance**: `loading="lazy"` en imágenes secundarias, `prefers-reduced-motion` respetado.

## Estado de los proyectos

| Proyecto       | Detalle                              | Tags                              |
|----------------|--------------------------------------|-----------------------------------|
| Ublo           | `projects/ublo/index.html`           | UX research / UX design / UI      |
| Bellpi         | `projects/bellpi/index.html`         | Service / UX research / UX / UI   |
| Andy Electric  | `projects/andy-electric/index.html`  | Brand / UX / UI                   |
| Musée BnF      | _Próximamente_                       | UX research / UX / UI             |
| JumboMana      | _Próximamente_                       | AI / UX research / UX             |
| ParamoTotem    | _Próximamente_                       | AI / UX research / UX             |
