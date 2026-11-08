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
 * Selección: ?bg=a|b|c|off (se recuerda en localStorage "pf:bg").
 * El selector flotante solo aparece en local, en el preview de Vercel o con ?bg.
 */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const MODES = ["off", "a", "b", "c"];
const LABELS = { off: "Actuel", a: "A · Chapitres", b: "B · Le fil", c: "C · Morph" };

function readMode() {
  const q = new URLSearchParams(location.search).get("bg");
  if (q && MODES.includes(q)) {
    try { localStorage.setItem("pf:bg", q); } catch (e) {}
    return q;
  }
  try {
    const s = localStorage.getItem("pf:bg");
    if (s && MODES.includes(s)) return s;
  } catch (e) {}
  return "off";
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

/* ───────────────────────── C · Morph ───────────────────────── */
function modeC() {
  const canvas = document.createElement("canvas");
  canvas.className = "bgC";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, N = 0, P = [], col = colours();
  const rnd = (s) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };

  function layout() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mobile = W < 769;
    N = mobile ? 64 : 120;
    // zona de la forma: a la derecha en desktop, centrada y tenue en móvil
    const cx = mobile ? W * 0.5 : W * 0.78, cy = H * 0.5;
    const size = mobile ? Math.min(W, H) * 0.42 : Math.min(W * 0.3, H * 0.62);
    const cols = Math.ceil(Math.sqrt(N)), gap = (size * 1.4) / (cols - 1);
    P = Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2;
      const r = size * (0.5 + (i % 3) * 0.06);
      return {
        // 1 · investigación: puntos dispersos por toda la pantalla
        s: { x: rnd(i + 1) * W, y: rnd(i + 101) * H },
        // 2 · estructura: cuadrícula ordenada
        g: { x: cx - (size * 0.7) + (i % cols) * gap, y: cy - (size * 0.7) + Math.floor(i / cols) * gap },
        // 3 · resultado: el anillo del proyecto
        o: { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r },
        ph: rnd(i + 7) * Math.PI * 2,
        k: i % 3 === 0 ? 1 : 0,
        x: 0, y: 0,
      };
    });
  }
  let t = 0, prog = 0, shown = 0;
  function progress() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return clamp(window.scrollY / max, 0, 1);
  }
  function frame() {
    t += 1;
    prog = progress();
    shown += (prog - shown) * 0.08;
    // 0–0.3 dispersos · 0.3–0.6 hacia cuadrícula · 0.6–0.9 hacia anillo
    const a = ease(clamp((shown - 0.18) / 0.3, 0, 1));
    const b = ease(clamp((shown - 0.55) / 0.3, 0, 1));
    ctx.clearRect(0, 0, W, H);
    const light = document.documentElement.getAttribute("data-theme") === "light";
    const wob = (1 - a) * 18 + (1 - b) * a * 4 + b * 3;
    P.forEach((p) => {
      const x1 = lerp(p.s.x, p.g.x, a), y1 = lerp(p.s.y, p.g.y, a);
      p.x = lerp(x1, p.o.x, b) + Math.cos(t * 0.01 + p.ph) * wob;
      p.y = lerp(y1, p.o.y, b) + Math.sin(t * 0.012 + p.ph) * wob;
    });
    // conexiones: aparecen en la fase de estructura, unen la forma final
    const link = (W < 769 ? 70 : 90) * (0.4 + a * 0.6);
    ctx.lineWidth = 1;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, d2 = dx * dx + dy * dy;
        if (d2 < link * link) {
          ctx.globalAlpha = (1 - Math.sqrt(d2) / link) * (0.15 + a * 0.35) * (light ? 0.8 : 1);
          ctx.strokeStyle = col[0];
          ctx.beginPath(); ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[j].x, P[j].y); ctx.stroke();
        }
      }
    }
    P.forEach((p) => {
      ctx.globalAlpha = 0.55 + b * 0.4;
      ctx.fillStyle = col[p.k];
      ctx.beginPath(); ctx.arc(p.x, p.y, 2 + b * 1.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (!reduced) requestAnimationFrame(frame);
  }
  layout();
  window.addEventListener("resize", layout, { passive: true });
  new MutationObserver(() => (col = colours())).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (reduced) window.addEventListener("scroll", () => requestAnimationFrame(frame), { passive: true });
  requestAnimationFrame(frame);
}

/* ───────────────────────── Selector (solo preview) ───────────────────────── */
function switcher(mode) {
  const box = document.createElement("div");
  box.className = "bg-switch";
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", "Propositions de fond");
  box.innerHTML = '<span class="bg-switch__label">Fond</span>' +
    MODES.map((m) => `<button type="button" data-bg="${m}" aria-pressed="${m === mode}">${LABELS[m]}</button>`).join("");
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
  if (mode === "c") modeC();
  if (isPreview()) switcher(mode);
}
