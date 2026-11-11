/**
 * case-bg.js — Propuestas de fondo con storytelling ligado al scroll.
 *
 * Tres conceptos, intercambiables para compararlos en el preview:
 *   A · Chapitres : la página se lee como capítulos. La luz del fondo cambia de
 *       sitio e intensidad en cada sección (contexto tranquilo → resultados
 *       a plena luz) y un índice lateral muestra en qué capítulo estás.
 *   B · Le fil    : las ondas de la cabecera se convierten en un solo hilo que
 *       se dibuja con el scroll, pasa por cada título (nodos que se encienden)
 *       y se cierra en un círculo al final del proyecto.
 *   C · Morph     : partículas con los colores del proyecto que cuentan el
 *       proceso de diseño: dispersas (investigación) → cuadrícula (estructura)
 *       → forma final (resultado) según el avance del scroll.
 *
 * Selección: ?bg=a|b|c…|g1|g2|off (se recuerda en localStorage "pf:bg"). Por defecto: g1.
 * El selector flotante solo aparece en local, en el preview de Vercel o con ?bg.
 */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/* Tono común de las tramas de fondo (puntos y enlaces), igual en todos los
   proyectos: puntos pequeños, un solo color (el acento) y poca opacidad,
   para que la trama acompañe sin competir con el contenido.
   La opacidad final del lienzo se ajusta con --bg-trama-opacity (case-theme.css). */
const TONE = { dot: 1, dotZ: 0.6, alpha: 0.4, link: 0.12, trail: false };

const MODES = ["off", "a", "b", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "g1", "g2"];
const LABELS = {
  off: "Actuel", a: "A · Chapitres", b: "B · Le fil",
  c1: "C1 · Processus", c2: "C2 · Chapitres", c3: "C3 · Ondes", c4: "C4 · Signature", c5: "C5 · Magnétique · par projet", c6: "C6 · Flux", c7: "C7 · Échos",
  g1: "G1 · Grille", g2: "G2 · Lignes",
};
/* En el selector solo se muestran las variantes de Morph (la opción elegida) */
const SWITCH = ["off", "c5", "c6", "g1", "g2"];

function readMode() {
  /* Una página puede fijar su fondo (p. ej. el Motion lab usa data-bg="off") */
  const lock = document.body.dataset.bg;
  if (lock && MODES.includes(lock)) return lock;
  let q = new URLSearchParams(location.search).get("bg");
  if (q === "c") q = "c1";
  if (q && MODES.includes(q)) {
    try { localStorage.setItem("pf:bg", q); } catch (e) {}
    return q;
  }
  try {
    const s = localStorage.getItem("pf:bg");
    if (s && MODES.includes(s)) return s;
  } catch (e) {}
  /* Fondo por defecto en todos los proyectos: G1 Grille (elegido 2026-11-11) */
  return "g1";
}

const isPreview = () =>
  /localhost|127\.0\.0\.1|git-ajustes|vercel\.app$/.test(location.hostname) &&
  !/portfolio-alejandroguevara/.test(location.hostname) ||
  new URLSearchParams(location.search).has("bg");

function chapters() {
  const root = document.querySelector("main.cs-frame");
  if (!root) return [];
  return [...root.querySelectorAll(":scope > .cs-header, :scope > .cs-block")];
}
const colours = () => {
  const cs = getComputedStyle(document.body);
  return ["--cs-accent", "--cs-accent2", "--cs-text", "--cs-bg"].map((v) => cs.getPropertyValue(v).trim());
};
const docY = (el) => el.getBoundingClientRect().top + window.scrollY;

/* ───────────────────────── A · Chapitres ───────────────────────── */
function modeA() {
  const chs = chapters();
  const layer = document.createElement("div");
  layer.className = "bgA";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = '<span class="bgA__glow bgA__glow--1"></span><span class="bgA__glow bgA__glow--2"></span><span class="bgA__veil"></span>';
  document.body.appendChild(layer); // al final: el primer <div> del body es el contenedor de la página

  /* Índice lateral: un punto por capítulo con su título */
  const rail = document.createElement("nav");
  rail.className = "bgA-rail";
  rail.setAttribute("aria-label", "Chapitres");
  const items = chs.map((c, i) => {
    const h = c.querySelector(".cs-title, .cs-heading");
    const a = document.createElement("a");
    a.href = "#";
    a.className = "bgA-rail__item";
    a.innerHTML = `<span class="bgA-rail__num">${String(i + 1).padStart(2, "0")}</span><span class="bgA-rail__txt"></span>`;
    const sync = () => (a.querySelector(".bgA-rail__txt").textContent = h ? h.textContent.trim() : "");
    sync();
    if (h) new MutationObserver(sync).observe(h, { childList: true, characterData: true, subtree: true });
    a.addEventListener("click", (e) => { e.preventDefault(); window.scrollTo({ top: docY(c) - 90, behavior: "smooth" }); });
    rail.appendChild(a);
    return a;
  });
  document.body.appendChild(rail);

  /* Guion: de calma (arriba, suave) a resultado (luz plena abajo) */
  const n = Math.max(1, chs.length - 1);
  const scene = (i) => {
    const t = i / n;
    const side = i % 2 === 0;
    return {
      x1: side ? 82 : 18, y1: lerp(10, 70, t),
      x2: side ? 15 : 85, y2: lerp(85, 30, t),
      g: lerp(0.35, 1, ease(t)),
      r: lerp(28, 46, t),
    };
  };
  let cur = -1;
  function update() {
    const mid = window.innerHeight * 0.45;
    let idx = 0;
    chs.forEach((c, i) => { if (c.getBoundingClientRect().top < mid) idx = i; });
    if (idx === cur) return;
    cur = idx;
    const s = scene(idx);
    const st = layer.style;
    st.setProperty("--x1", s.x1 + "%"); st.setProperty("--y1", s.y1 + "%");
    st.setProperty("--x2", s.x2 + "%"); st.setProperty("--y2", s.y2 + "%");
    st.setProperty("--g", s.g.toFixed(2)); st.setProperty("--r", s.r + "vmax");
    items.forEach((it, i) => it.classList.toggle("is-on", i === idx));
    items.forEach((it, i) => it.classList.toggle("is-past", i < idx));
  }
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}

/* ───────────────────────── B · Le fil ───────────────────────── */
function modeB() {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "bgB");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `
    <defs>
      <linearGradient id="bgB-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="bgB-s1"/><stop offset="1" class="bgB-s2"/>
      </linearGradient>
      <filter id="bgB-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <path class="bgB__ghost"/>
    <path class="bgB__line" stroke="url(#bgB-g)" filter="url(#bgB-glow)"/>
    <g class="bgB__nodes"></g>
    <circle class="bgB__tip" r="6" filter="url(#bgB-glow)"/>`;
  document.body.prepend(svg);
  const ghost = svg.querySelector(".bgB__ghost");
  const line = svg.querySelector(".bgB__line");
  const tip = svg.querySelector(".bgB__tip");
  const nodesG = svg.querySelector(".bgB__nodes");
  let len = 0, table = [], nodes = [];

  function build() {
    const W = document.documentElement.clientWidth;
    const H = document.documentElement.scrollHeight;
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const main = document.querySelector("main.cs-frame");
    const header = document.querySelector(".cs-header");
    if (!main || !header) return;
    const col = header.getBoundingClientRect();
    const mobile = W < 769;
    const left = mobile ? 8 : Math.max(24, col.left - 56);
    const right = mobile ? W - 8 : Math.min(W - 24, col.right + 56);
    const heads = [...main.querySelectorAll(":scope > .cs-block > .cs-heading")]
      .filter((h, i, arr) => arr.indexOf(h) === i && h.offsetParent);
    const startY = Math.min(window.innerHeight * 0.42, header.offsetHeight / 2);
    const title = header.querySelector(".cs-title") || header;
    // el hilo nace de las ondas y baja por el margen izquierdo: nunca cruza el texto
    const pts = [{ x: -40, y: startY }, { x: left, y: docY(title) + title.offsetHeight + 40 }];
    const sway = mobile ? 6 : 28;
    heads.forEach((h, i) => {
      const y = docY(h) + h.offsetHeight / 2;
      const prev = pts[pts.length - 1];
      pts.push({ x: left + (i % 2 === 0 ? -sway : sway), y: (prev.y + y) / 2 });
      pts.push({ x: left, y, node: true });
    });
    // llegada: el hilo termina en la navegación, que se enciende (el siguiente capítulo)
    const navEl = document.querySelector(".project-nav");
    const endY = navEl ? docY(navEl) + Math.min(navEl.offsetHeight / 2, 60) : H - 200;
    pts.push({ x: left, y: endY, node: true, end: true });
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    line.setAttribute("d", d);
    ghost.setAttribute("d", d);
    len = line.getTotalLength();
    line.style.strokeDasharray = `${len} ${len}`;
    table = [];
    const steps = 400;
    for (let i = 0; i <= steps; i++) {
      const l = (len * i) / steps;
      table.push({ l, y: line.getPointAtLength(l).y });
    }
    nodesG.innerHTML = "";
    nodes = pts.filter((p) => p.node).map((p) => {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", 7);
      c.setAttribute("class", "bgB__node");
      nodesG.appendChild(c);
      if (p.end) c.classList.add("bgB__node--end");
      return { el: c, y: p.y, end: !!p.end };
    });
    update();
  }
  function lengthAtY(y) {
    // primer punto del trazo que llega a esa altura (el trazo baja casi siempre)
    let best = 0;
    for (let i = 0; i < table.length; i++) {
      if (table[i].y <= y) best = table[i].l; else if (table[i].y > y + 400) break;
    }
    return best;
  }
  function update() {
    if (!len) return;
    const y = window.scrollY + window.innerHeight * 0.62;
    const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    const l = atEnd ? len : clamp(lengthAtY(y), 0, len);
    line.style.strokeDashoffset = len - l;
    const p = line.getPointAtLength(l);
    tip.setAttribute("cx", p.x); tip.setAttribute("cy", p.y);
    nodes.forEach((n) => n.el.classList.toggle("is-on", n.y <= y || (atEnd && n.end)));
    const nav = document.querySelector(".project-nav");
    if (nav) nav.classList.toggle("bgB-arrive", atEnd || l >= len - 2);
  }
  let raf = 0;
  const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
  window.addEventListener("scroll", schedule, { passive: true });
  let t;
  const rebuild = () => { clearTimeout(t); t = setTimeout(build, 150); };
  window.addEventListener("resize", rebuild, { passive: true });
  new ResizeObserver(rebuild).observe(document.body);
  build();
}

/* ───────────────────────── C · Morph (variantes) ─────────────────────────
   Un mismo motor de partículas; cada variante define la secuencia de formas
   (el guion), cómo avanza (scroll global o por capítulo), densidad, color
   y reacción al cursor.
     c1 · Processus   : dispersas → cuadrícula → anillo (investigación → estructura → resultado)
     c2 · Chapitres   : una forma por sección, el color pasa de accent a accent2
     c3 · Ondes       : nacen como las ondas del Home → espiral → anillo
     c4 · Signature   : dispersas → espiral → el icono del proyecto (su firma)
     c5 · Magnétique  : campo denso que sigue al cursor y se ordena en anillo al final */
const C_VARIANTS = {
  c1: { seq: ["scatter", "grid", "ring"], drive: "page", n: [120, 64], links: 1, cursor: 0.4 },
  c2: { seq: ["scatter", "wave", "grid", "spiral", "ring"], drive: "chapters", n: [130, 70], links: 1, cursor: 0.4, hueShift: true },
  c3: { seq: ["wave", "wave2", "spiral", "ring"], drive: "page", n: [150, 80], links: 0.5, cursor: 0.6, flow: true },
  c4: { seq: ["scatter", "spiral", "letter"], drive: "page", n: [240, 120], links: 0.35, cursor: 0.4, dot: 1.5 },
  c5: { seq: ["field", "field", "ring"], drive: "page", n: [260, 120], links: 0.7, cursor: 1.6, dot: 1.4 },
};

/* C5 por proyecto: la trama del campo, el gesto del cursor y la forma final
   salen de la identidad de cada caso (sus decoraciones de case-theme.css y su icono). */
const C5_PROFILES = {
  "andy-electric": { field: "diag", fx: "spark", end: "icon" },   // diagonales eléctricas · rayo
  ublo: { field: "dots", fx: "soft", end: "icon" },               // trama de puntos del producto
  bellpi: { field: "radial", fx: "orbit", end: "icon" },          // círculos de la marca
  jumbomana: { field: "tilt", fx: "soft", end: "icon" },          // cuadrícula girada 18°, como su cuadrado
  bnf: { field: "columns", fx: "soft", end: "icon" },             // columnas y arcos del museo
  spotify: { field: "radial", fx: "spin", end: "icon" },          // surcos de vinilo que giran
  paramo: { field: "organic", fx: "sway", end: "icon" },          // páramo: trama orgánica que ondea
  qualnet: { field: "grid", fx: "soft", end: "icon" },            // calidad: orden y estructura
  iridian: { field: "hex", fx: "soft", end: "icon" },             // red tecnológica hexagonal
  freelance: { field: "scatter", fx: "soft", end: "icon" },
};

function shapeTargets(name, i, N, ctx) {
  const { W, H, cx, cy, size, mobile, letterPts } = ctx;
  const golden = Math.PI * (3 - Math.sqrt(5));
  switch (name) {
    case "scatter":
      return { x: rnd(i + 1) * W, y: rnd(i + 101) * H };
    case "grid": {
      const cols = Math.ceil(Math.sqrt(N)), gap = (size * 1.4) / (cols - 1);
      return { x: cx - size * 0.7 + (i % cols) * gap, y: cy - size * 0.7 + Math.floor(i / cols) * gap };
    }
    case "ring": {
      const a = (i / N) * Math.PI * 2, r = size * (0.5 + (i % 3) * 0.06);
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    }
    case "spiral": {
      const r = size * 0.72 * Math.sqrt((i + 0.5) / N);
      return { x: cx + Math.cos(i * golden) * r, y: cy + Math.sin(i * golden) * r };
    }
    case "wave":
    case "wave2": {
      // 3 ondas a lo ancho, como el hero del Home
      const lines = 3, li = i % lines, k = Math.floor(i / lines), per = Math.ceil(N / lines);
      const x = (k / (per - 1)) * W;
      const amp = (mobile ? 40 : 70) * (name === "wave2" ? 1.4 : 1);
      const y = H * (name === "wave2" ? 0.55 : 0.5) + (li - 1) * (mobile ? 26 : 38)
        + Math.sin(x * 0.006 + li * 1.6) * amp;
      return { x, y, wave: li };
    }
    case "letter": {
      const pt = letterPts.length ? letterPts[i % letterPts.length] : { x: 0, y: 0 };
      const e = ctx.end || { cx, cy, size: size * 1.5 };
      return { x: e.cx + pt.x * e.size, y: e.cy + pt.y * e.size };
    }
    case "diag": {
      // líneas a 115°, como el fondo de Andy Electric
      const lines = Math.max(6, Math.round(N / 28)), li = i % lines, k = Math.floor(i / lines), per = Math.ceil(N / lines);
      const span = W + H, off = (li / lines) * span - H * 0.6, u = (k / Math.max(1, per - 1));
      return { x: off + u * H * 0.47, y: u * H, g: li };
    }
    case "dots": {
      const cols = Math.ceil(Math.sqrt(N * (W / H))), rows = Math.ceil(N / cols), g = Math.min(W / cols, H / rows);
      const x0 = (W - (cols - 1) * g) / 2, y0 = (H - (rows - 1) * g) / 2;
      return { x: x0 + (i % cols) * g, y: y0 + Math.floor(i / cols) * g };
    }
    case "tilt": {
      const cols = Math.ceil(Math.sqrt(N)), g = (Math.max(W, H) * 1.1) / cols, a = (18 * Math.PI) / 180;
      const gx = (i % cols - cols / 2) * g, gy = (Math.floor(i / cols) - cols / 2) * g;
      return { x: W / 2 + gx * Math.cos(a) - gy * Math.sin(a), y: H / 2 + gx * Math.sin(a) + gy * Math.cos(a) };
    }
    case "radial": {
      const rings = 6, ri = i % rings, k = Math.floor(i / rings), per = Math.ceil(N / rings);
      const R = (Math.max(W, H) * 0.75 * (ri + 1)) / rings, a = (k / per) * Math.PI * 2 + ri * 0.3;
      const ox = mobile ? W * 0.5 : W * 0.8, oy = H * 0.85;
      return { x: ox + Math.cos(a) * R, y: oy + Math.sin(a) * R, ring: true, ox, oy, R, a, g: ri };
    }
    case "columns": {
      const cols = mobile ? 5 : 9, ci = i % cols, k = Math.floor(i / cols), per = Math.ceil(N / cols);
      const x = ((ci + 0.5) / cols) * W, y = (k / Math.max(1, per - 1)) * H * 0.92 + H * 0.04;
      // arcos: la parte alta de cada columna se curva hacia la siguiente
      const top = H * 0.18, arc = y < top ? Math.sin(((top - y) / top) * Math.PI * 0.5) * (W / cols) * 0.5 : 0;
      return { x: x + arc, y, g: ci };
    }
    case "organic":
      return { x: (rnd(i + 11) * 0.8 + 0.1 * Math.sin(i)) * W + rnd(i + 5) * W * 0.1, y: rnd(i + 211) * H };
    case "hex": {
      const cols = Math.ceil(Math.sqrt(N * (W / H)) * 1.1), g = W / cols, row = Math.floor(i / cols);
      return { x: (i % cols) * g + (row % 2 ? g / 2 : 0) + g / 4, y: row * g * 0.866 + g / 2 };
    }
    case "field": {
      const cols = Math.ceil(Math.sqrt(N * (W / H))), rows = Math.ceil(N / cols);
      const gx = W / cols, gy = H / rows;
      return { x: (i % cols) * gx + gx / 2, y: Math.floor(i / cols) * gy + gy / 2 };
    }
  }
  return { x: cx, y: cy };
}
const rnd = (s) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };

/* Firma del proyecto: su icono del menú (SVG de 1 px, se engrosa para muestrearlo).
   Si no hay icono, la inicial del título. Puntos normalizados a [-0.5, 0.5]. */
function samplePoints(draw, N) {
  const c = document.createElement("canvas"), S = 240;
  c.width = c.height = S;
  const g = c.getContext("2d");
  draw(g, S);
  const d = g.getImageData(0, 0, S, S).data, pts = [];
  for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) if (d[(y * S + x) * 4 + 3] > 100) pts.push({ x: x / S - 0.5, y: y / S - 0.5 });
  if (!pts.length) return [];
  const out = [];
  for (let i = 0; i < N; i++) out.push(pts[Math.floor(rnd(i + 31) * pts.length)]);
  return out;
}
function letterPoints(N) {
  const t = (document.querySelector(".cs-title")?.textContent || "P").trim().charAt(0).toUpperCase();
  return samplePoints((g, S) => {
    g.fillStyle = "#000";
    g.font = `800 ${S * 0.9}px Montserrat, system-ui, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(t, S / 2, S / 2 + S * 0.04);
  }, N);
}
async function iconPoints(N) {
  const page = document.body.dataset.page;
  const img = [...document.querySelectorAll("img")].find((i) => new RegExp(`/${page}\\.[^/]*svg$`).test(i.getAttribute("src") || ""));
  if (!img) return null;
  try {
    let svg = await (await fetch(img.src)).text();
    svg = svg.replace(/stroke-width="[^"]*"/g, 'stroke-width="2.2"').replace(/vector-effect="[^"]*"/g, "").replace(/stroke="#[0-9a-fA-F]+"/g, 'stroke="#000"');
    const im = new Image();
    im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    await im.decode();
    const pts = samplePoints((g, S) => g.drawImage(im, S * 0.05, S * 0.05, S * 0.9, S * 0.9), N);
    return pts.length ? pts : null;
  } catch (e) {
    return null;
  }
}

function modeC(variant) {
  let V = C_VARIANTS[variant] || C_VARIANTS.c1;
  const prof = variant === "c5" ? (C5_PROFILES[document.body.dataset.page] || C5_PROFILES.freelance) : null;
  if (prof) V = { ...V, seq: [prof.field, prof.field, "letter"], fx: prof.fx };
  const canvas = document.createElement("canvas");
  canvas.className = "bgC";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const chs = chapters();
  let W = 0, H = 0, N = 0, P = [], col = colours(), mobile = false, icon = null;
  const mouse = { x: -9999, y: -9999 };

  function layout() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mobile = W < 769;
    N = V.n[mobile ? 1 : 0];
    const cx = mobile ? W * 0.5 : W * 0.78, cy = H * 0.5;
    const size = mobile ? Math.min(W, H) * 0.42 : Math.min(W * 0.3, H * 0.62);
    // C5: la firma final aparece en el hueco de la navegación entre proyectos
    // (al final del scroll), donde ninguna imagen la tapa.
    let end = null;
    if (prof) {
      const sz = Math.min(H * 0.5, mobile ? W * 0.75 : 440);
      end = { cx: W / 2, cy: H - sz * 0.5 - (mobile ? 104 : 12), size: sz };
    }
    const sctx = { end, W, H, cx, cy, size, mobile, letterPts: V.seq.includes("letter") ? (icon && icon.length === N ? icon : letterPoints(N)) : [] };
    P = Array.from({ length: N }, (_, i) => ({
      T: V.seq.map((name) => shapeTargets(name, i, N, sctx)),
      ph: rnd(i + 7) * Math.PI * 2,
      k: i % 3 === 0 ? 1 : 0,
      x: W / 2, y: H / 2, vx: 0, vy: 0,
    }));
  }

  /* Posición en el guion: u ∈ [0, seq.length − 1] */
  function story() {
    const K = V.seq.length - 1;
    if (V.drive === "chapters" && chs.length > 1) {
      const mid = window.innerHeight * 0.5;
      let idx = 0, frac = 0;
      chs.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        if (r.top < mid) { idx = i; frac = clamp((mid - r.top) / Math.max(1, r.height), 0, 1); }
      });
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      const u = atEnd ? chs.length - 1 : idx + frac;
      return (u / (chs.length - 1)) * K;
    }
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return clamp(window.scrollY / max, 0, 1) * K;
  }

  let t = 0, shown = 0;
  function frame() {
    t += 1;
    shown += (story() - shown) * 0.08;
    const K = V.seq.length - 1;
    const seg = Math.min(Math.floor(shown), K - 1);
    // retención: la forma se mantiene en el centro de cada tramo, transición entre medias
    const lt = ease(clamp((shown - seg - 0.2) / 0.6, 0, 1));
    const done = clamp(shown / K, 0, 1);
    ctx.clearRect(0, 0, W, H);
    const light = document.documentElement.getAttribute("data-theme") === "light";
    const order = clamp((seg + lt) / K, 0, 1); // 0 = caos, 1 = forma final
    const wob = lerp(16, 3, order);
    const hue = V.hueShift ? done : 0;
    const cur = mobile ? 0 : V.cursor;

    P.forEach((p) => {
      const A = p.T[seg], B = p.T[seg + 1];
      let tx = lerp(A.x, B.x, lt), ty = lerp(A.y, B.y, lt);
      if (V.flow && (A.wave !== undefined || B.wave !== undefined)) {
        // las ondas fluyen como en el hero
        const w = (1 - (B.wave === undefined ? lt : 0));
        ty += Math.sin(tx * 0.006 + t * 0.02 + (A.wave || 0)) * 26 * w;
      }
      // gestos propios de cada proyecto mientras el campo está abierto
      const open = 1 - order;
      if (V.fx === "spin" && A.ring) {
        const a = A.a + t * 0.0025 * (1 + (A.R / W));
        const sx = A.ox + Math.cos(a) * A.R, sy = A.oy + Math.sin(a) * A.R;
        tx = lerp(sx, B.x, lt); ty = lerp(sy, B.y, lt);
      }
      if (V.fx === "sway") tx += Math.sin(ty * 0.012 + t * 0.018) * 22 * open;
      if (V.fx === "spark" && rnd(p.ph * 1000 + Math.floor(t / 6)) > 0.985) { p.vx += (rnd(t + p.ph) - 0.5) * 14; p.vy += (rnd(t * 2 + p.ph) - 0.5) * 14; }
      tx += Math.cos(t * 0.01 + p.ph) * wob;
      ty += Math.sin(t * 0.012 + p.ph) * wob;
      // cursor: empuja suavemente las partículas cercanas
      if (cur) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy, R = 140;
        if (d2 < R * R) {
          const f = (1 - Math.sqrt(d2) / R) * cur * 3;
          const d = Math.sqrt(d2) + 0.1, nx = dx / d, ny = dy / d;
          if (V.fx === "orbit") { p.vx += -ny * f * 1.4 + nx * f * 0.3; p.vy += nx * f * 1.4 + ny * f * 0.3; }
          else if (V.fx === "spark") { p.vx -= nx * f * 0.6 + (rnd(t + p.ph) - 0.5) * f * 3; p.vy -= ny * f * 0.6 + (rnd(t * 3 + p.ph) - 0.5) * f * 3; }
          else { p.vx += nx * f; p.vy += ny * f; }
        }
      }
      p.vx = (p.vx + (tx - p.x) * 0.06) * 0.82;
      p.vy = (p.vy + (ty - p.y) * 0.06) * 0.82;
      p.x += p.vx; p.y += p.vy;
    });

    const link = (mobile ? 60 : 84) * (V.fx ? 1 - order * 0.45 : 0.5 + order * 0.5);
    if (V.links) {
      ctx.lineWidth = 1;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, d2 = dx * dx + dy * dy;
          if (d2 < link * link) {
            ctx.globalAlpha = (1 - Math.sqrt(d2) / link) * TONE.link * V.links;
            ctx.strokeStyle = col[0];
            ctx.beginPath(); ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[j].x, P[j].y); ctx.stroke();
          }
        }
      }
    }
    const r = TONE.dot + order * TONE.dotZ;
    P.forEach((p) => {
      ctx.globalAlpha = TONE.alpha * (0.7 + order * 0.3);
      ctx.fillStyle = col[0];
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (!reduced) requestAnimationFrame(frame);
  }
  layout();
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 150); }, { passive: true });
  window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  new MutationObserver(() => (col = colours())).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  // la inicial depende de la fuente: recalcular cuando esté cargada
  if (V.seq.includes("letter")) {
    const n = () => V.n[window.innerWidth < 769 ? 1 : 0];
    iconPoints(n()).then((pts) => { if (pts) { icon = pts; layout(); } else if (document.fonts) document.fonts.ready.then(layout); });
    window.addEventListener("resize", () => iconPoints(n()).then((pts) => { if (pts) { icon = pts; layout(); } }), { passive: true });
  }
  if (reduced) window.addEventListener("scroll", () => requestAnimationFrame(frame), { passive: true });
  requestAnimationFrame(frame);
}

/* ───────────────────────── C6 / C7 · Trama viva (sin figura final) ─────────────────────────
   Se queda la trama y el gesto de cada proyecto (C5_PROFILES); cambia la relación con el scroll:
     c6 · Flux    : la trama viaja en su propia dirección al hacer scroll (diagonales suben en
                    diagonal, surcos giran, columnas ascienden, el páramo sopla), con 3 capas de
                    profundidad y estelas proporcionales a la velocidad.
     c7 · Échos   : la trama se queda en su sitio; cada título que entra en pantalla lanza una onda
                    que recorre el campo, y la velocidad del scroll la hace respirar.
   Al final no hay forma: el campo se calma y queda en reposo. */
const FLOW_DIR = {
  diag: [-0.43, -0.9], dots: [0, -1], tilt: [-0.31, -0.95], columns: [0, -1],
  organic: [0.55, -0.83], grid: [0, -1], hex: [0, -1], scatter: [0, -1],
};
function modeFlow(variant) {
  const prof = C5_PROFILES[document.body.dataset.page] || C5_PROFILES.freelance;
  const canvas = document.createElement("canvas");
  canvas.className = "bgC";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const heads = [...document.querySelectorAll("main.cs-frame .cs-heading, main.cs-frame .cs-title")];
  let W = 0, H = 0, N = 0, P = [], col = colours(), mobile = false;
  const mouse = { x: -9999, y: -9999 };
  const M = 60; // margen de envoltura

  function layout() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mobile = W < 769;
    N = mobile ? 140 : 300;
    const size = Math.min(W, H) * 0.4;
    P = Array.from({ length: N }, (_, i) => {
      const b = shapeTargets(prof.field, i, N, { W, H, cx: W / 2, cy: H / 2, size, mobile, letterPts: [] });
      const g = b.g !== undefined ? b.g : Math.round(b.y / (mobile ? 90 : 130));
      return { b, z: [0.45, 0.75, 1][g % 3], ph: rnd(i + 7) * Math.PI * 2, k: i % 3 === 0 ? 1 : 0, x: b.x, y: b.y, vx: 0, vy: 0, px: b.x, py: b.y };
    });
  }
  const wrap = (v, size) => ((((v + M) % (size + 2 * M)) + (size + 2 * M)) % (size + 2 * M)) - M;

  let t = 0, sy = window.scrollY, vel = 0, lastY = window.scrollY;
  const ripples = [];
  const fired = new Set();
  function checkRipples() {
    heads.forEach((h, i) => {
      const r = h.getBoundingClientRect();
      const inside = r.top < H * 0.7 && r.bottom > H * 0.2;
      if (inside && !fired.has(i)) { fired.add(i); ripples.push({ x: mobile ? W * 0.2 : r.left, y: r.top + r.height / 2, r: 0 }); }
      if (!inside && fired.has(i) && (r.top > H || r.bottom < 0)) fired.delete(i);
    });
  }

  function frame() {
    t += 1;
    const y = window.scrollY;
    vel += ((y - lastY) - vel) * 0.15;
    lastY = y;
    sy += (y - sy) * 0.12; // scroll suavizado
    const max = Math.max(1, document.documentElement.scrollHeight - H);
    const calm = 1 - ease(clamp((y / max - 0.85) / 0.15, 0, 1)) * 0.7; // al final el campo se calma
    const light = document.documentElement.getAttribute("data-theme") === "light";
    const speed = clamp(Math.abs(vel) / 30, 0, 1);
    if (variant === "c7") checkRipples();
    ripples.forEach((r) => (r.r += mobile ? 9 : 14));
    while (ripples.length && ripples[0].r > Math.hypot(W, H) + 200) ripples.shift();
    const dir = FLOW_DIR[prof.field] || [0, -1];
    const cur = mobile ? 0 : 1.4;

    ctx.clearRect(0, 0, W, H);
    P.forEach((p) => {
      let tx = p.b.x, ty = p.b.y;
      if (variant === "c6") {
        if (p.b.ring) {
          const a = p.b.a + (sy * 0.0012 + t * 0.0006) * (prof.fx === "spin" ? 2 : 1) * p.z;
          tx = p.b.ox + Math.cos(a) * p.b.R; ty = p.b.oy + Math.sin(a) * p.b.R;
        } else {
          const d = sy * 0.35 * p.z;
          tx = wrap(p.b.x + dir[0] * d, W); ty = wrap(p.b.y + dir[1] * d, H);
        }
      } else {
        // c7: respiración con la velocidad del scroll
        const k = 1 + speed * 0.05 * Math.sin(p.ph + t * 0.05);
        tx = W / 2 + (tx - W / 2) * k; ty = H / 2 + (ty - H / 2) * k;
        if (p.b.ring && prof.fx === "spin") {
          const a = p.b.a + t * 0.0015 * p.z;
          tx = p.b.ox + Math.cos(a) * p.b.R; ty = p.b.oy + Math.sin(a) * p.b.R;
        }
      }
      // gestos propios
      if (prof.fx === "sway") tx += Math.sin(ty * 0.012 + t * 0.018) * 18 * calm;
      tx += Math.cos(t * 0.01 + p.ph) * 4 * calm;
      ty += Math.sin(t * 0.012 + p.ph) * 4 * calm;
      if (prof.fx === "spark" && rnd(p.ph * 1000 + Math.floor(t / 6)) > 0.988) { p.vx += (rnd(t + p.ph) - 0.5) * 12; p.vy += (rnd(t * 2 + p.ph) - 0.5) * 12; }
      // ondas de sección (c7)
      ripples.forEach((r) => {
        const dx = p.x - r.x, dy = p.y - r.y, d = Math.hypot(dx, dy) + 0.1, band = 70;
        const w = 1 - Math.abs(d - r.r) / band;
        if (w > 0) { const f = w * 7 * p.z; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
      });
      // cursor
      if (cur) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy, R = 140;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) + 0.1, nx = dx / d, ny = dy / d, f = (1 - d / R) * cur * 3;
          if (prof.fx === "orbit") { p.vx += -ny * f * 1.4 + nx * f * 0.3; p.vy += nx * f * 1.4 + ny * f * 0.3; }
          else if (prof.fx === "spark") { p.vx -= nx * f * 0.6 + (rnd(t + p.ph) - 0.5) * f * 3; p.vy -= ny * f * 0.6 + (rnd(t * 3 + p.ph) - 0.5) * f * 3; }
          else { p.vx += nx * f; p.vy += ny * f; }
        }
      }
      // si la envoltura salta de lado, no arrastrar la partícula por la pantalla
      if (Math.abs(tx - p.x) > W * 0.5 || Math.abs(ty - p.y) > H * 0.5) { p.x = tx; p.y = ty; p.vx = p.vy = 0; }
      p.px = p.x; p.py = p.y;
      p.vx = (p.vx + (tx - p.x) * 0.08) * 0.8;
      p.vy = (p.vy + (ty - p.y) * 0.08) * 0.8;
      p.x += p.vx; p.y += p.vy;
    });

    // enlaces cortos: dibujan la trama
    const link = mobile ? 52 : 70;
    ctx.lineWidth = 1;
    ctx.strokeStyle = col[0];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, d2 = dx * dx + dy * dy;
        if (d2 < link * link) {
          ctx.globalAlpha = (1 - Math.sqrt(d2) / link) * TONE.link * 2 * P[i].z * (0.6 + calm * 0.4);
          ctx.beginPath(); ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[j].x, P[j].y); ctx.stroke();
        }
      }
    }
    // partículas + estela según la velocidad (c6)
    P.forEach((p) => {
      ctx.globalAlpha = TONE.alpha * (0.5 + p.z * 0.5) * (0.75 + calm * 0.25);
      const c = col[0];
      if (TONE.trail && variant === "c6" && speed > 0.05 && !p.b.ring) {
        const len = speed * 40 * p.z;
        ctx.strokeStyle = c; ctx.lineWidth = 1.2 + p.z;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - dir[0] * len * Math.sign(vel), p.y - dir[1] * len * Math.sign(vel)); ctx.stroke();
      }
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(p.x, p.y, TONE.dot + p.z * TONE.dotZ, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (!reduced) requestAnimationFrame(frame);
  }
  layout();
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 150); }, { passive: true });
  window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  new MutationObserver(() => (col = colours())).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (reduced) window.addEventListener("scroll", () => requestAnimationFrame(frame), { passive: true });
  requestAnimationFrame(frame);
}

/* ───────────────────────── Selector (solo preview) ───────────────────────── */
/* G · Patrones genéricos, iguales en todos los proyectos (solo cambia el
   color de acento). Mismo TONE y --bg-trama-opacity que el resto.
   g1 Grille : cuadrícula de puntos de 1 px que se desliza con el scroll;
               cerca del cursor los puntos crecen un poco (lupa).
   g2 Lignes : líneas horizontales de 1 px, como curvas de nivel, que
               ondulan despacio y se desplazan con el scroll. */
function modeGeneric(variant) {
  const canvas = document.createElement("canvas");
  canvas.className = "bgC";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, col = colours(), mobile = false, t = 0;
  const mouse = { x: -9999, y: -9999 }, lens = { x: -9999, y: -9999 };

  function layout() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mobile = W < 769;
  }

  function grid() {
    const gap = mobile ? 26 : 32;
    const oy = -((window.scrollY * 0.2) % gap);
    const R = 150;
    ctx.fillStyle = col[0];
    for (let y = oy; y < H + gap; y += gap) {
      for (let x = gap / 2; x < W; x += gap) {
        const dx = x - lens.x, dy = y - lens.y, d = Math.sqrt(dx * dx + dy * dy);
        const k = d < R ? 1 - d / R : 0;
        ctx.globalAlpha = TONE.alpha * (0.7 + k * 0.6);
        ctx.beginPath();
        ctx.arc(x + (k ? (dx / (d + 0.1)) * k * 4 : 0), y + (k ? (dy / (d + 0.1)) * k * 4 : 0), 0.9 + k * TONE.dotZ * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function lines() {
    const gap = mobile ? 40 : 52;
    const sy = window.scrollY;
    const oy = -((sy * 0.15) % gap);
    ctx.strokeStyle = col[0];
    ctx.lineWidth = 1;
    const step = mobile ? 10 : 8;
    let row = Math.floor((sy * 0.15) / gap);
    for (let y0 = oy - gap; y0 < H + gap; y0 += gap, row++) {
      ctx.globalAlpha = TONE.link * (row % 4 === 0 ? 1.6 : 1);
      ctx.beginPath();
      for (let x = 0; x <= W + step; x += step) {
        const dx = x - lens.x, dy = y0 - lens.y, d = Math.sqrt(dx * dx + dy * dy);
        const bend = d < 160 ? (1 - d / 160) * 14 * Math.sign(dy || 1) : 0;
        const y = y0
          + Math.sin(x * 0.004 + row * 0.5 + t * 0.004) * 10
          + Math.sin(x * 0.0013 - row * 0.3 + sy * 0.002) * 16
          + bend;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function frame() {
    t += 1;
    lens.x += (mouse.x - lens.x) * 0.12;
    lens.y += (mouse.y - lens.y) * 0.12;
    ctx.clearRect(0, 0, W, H);
    variant === "g1" ? grid() : lines();
    ctx.globalAlpha = 1;
    if (!reduced) requestAnimationFrame(frame);
  }
  layout();
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { layout(); if (reduced) frame(); }, 150); }, { passive: true });
  if (!reduced) {
    window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  }
  new MutationObserver(() => { col = colours(); if (reduced) frame(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (reduced) window.addEventListener("scroll", () => requestAnimationFrame(frame), { passive: true });
  requestAnimationFrame(frame);
}

function switcher(mode) {
  const box = document.createElement("div");
  box.className = "bg-switch";
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", "Propositions de fond");
  box.innerHTML = '<span class="bg-switch__label">Fond</span>' +
    SWITCH.map((m) => `<button type="button" data-bg="${m}" aria-pressed="${m === mode}">${LABELS[m]}</button>`).join("");
  box.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-bg]");
    if (!b) return;
    const u = new URL(location.href);
    u.searchParams.set("bg", b.dataset.bg);
    location.href = u.toString();
  });
  document.body.appendChild(box);
}

export function initCaseBg() {
  if (!document.querySelector("main.cs-frame")) return;
  const mode = readMode();
  document.documentElement.dataset.bg = mode;
  if (mode === "a") modeA();
  if (mode === "b") modeB();
  if (mode === "g1" || mode === "g2") modeGeneric(mode);
  else if (mode === "c6" || mode === "c7") modeFlow(mode);
  else if (mode.startsWith("c")) modeC(mode);
  if (isPreview() && !document.body.dataset.bg) switcher(mode);
}
