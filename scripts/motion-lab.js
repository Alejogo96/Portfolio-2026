/**
 * motion-lab.js — Laboratorio de motion + storytelling (Andy Electric).
 *
 * Siete conceptos, cada uno conmutable desde el panel "Motion lab"
 * (se activan con clases html.ml-c1 … html.ml-c7):
 *   1 Capítulos de scroll      — contexto → problema → solución → resultado,
 *                                cada uno con su transición y un índice lateral.
 *   2 Antes / después          — cortina ligada al scroll sobre la portada del sitio.
 *   3 Hilo conductor           — línea de 1 px que se dibuja y enciende hitos.
 *   4 Cámara y zoom narrativo  — de la página completa al detalle.
 *   5 Ritmo emocional          — lento en la reflexión, rápido en la resolución.
 *   6 Datos que se cuentan     — las cifras cuentan al entrar en vista.
 *   7 Estado que evoluciona    — el acento pasa de gris a rojo y la paleta se invierte.
 *
 * Con prefers-reduced-motion: sin animaciones; cada concepto muestra su
 * versión estática (cortina manual, imagen completa, cifras finales…).
 * Selección por URL: ?c=1,3,6 (o ?c=none). Se recuerda en localStorage.
 */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const docY = (el) => el.getBoundingClientRect().top + window.scrollY;
const KEY = "pf:motionlab";

const CONCEPTS = [
  { id: 1, name: "Capítulos de scroll", go: "#ch-1" },
  { id: 2, name: "Antes / después", go: "#c2" },
  { id: 3, name: "Hilo conductor", go: "#ch-2" },
  { id: 4, name: "Cámara y zoom", go: "#c4" },
  { id: 5, name: "Ritmo emocional", go: "#ch-1" },
  { id: 6, name: "Datos que se cuentan", go: "#ch-2" },
  { id: 7, name: "Estado que evoluciona", go: "#ch-4" },
];

const on = new Set(CONCEPTS.map((c) => c.id));
const is = (id) => on.has(id);

function readState() {
  const q = new URLSearchParams(location.search).get("c");
  let list = null;
  if (q) list = q === "none" ? [] : q.split(",").map(Number);
  else {
    try {
      const s = localStorage.getItem(KEY);
      if (s) list = JSON.parse(s);
    } catch (e) {}
  }
  if (Array.isArray(list)) {
    on.clear();
    list.filter((n) => n >= 1 && n <= 7).forEach((n) => on.add(n));
  }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify([...on])); } catch (e) {}
}

function apply() {
  CONCEPTS.forEach(({ id }) => root.classList.toggle("ml-c" + id, is(id)));
  const count = document.querySelector(".ml-panel__count");
  if (count) count.textContent = on.size + "/7";
  document.querySelectorAll(".ml-switch").forEach((b) =>
    b.setAttribute("aria-checked", String(is(+b.dataset.id)))
  );
  /* los conceptos que cambian la altura de la página necesitan medir de nuevo */
  requestAnimationFrame(() => {
    measure();
    tick(true);
  });
}

/* ───────── Panel ───────── */
function panel() {
  const box = document.querySelector(".ml-panel");
  if (!box) return;
  const toggle = box.querySelector(".ml-panel__toggle");
  const body = box.querySelector(".ml-panel__body");
  const list = box.querySelector(".ml-panel__list");
  CONCEPTS.forEach((c) => {
    const li = document.createElement("li");
    li.innerHTML =
      `<button type="button" role="switch" class="ml-switch" data-id="${c.id}" aria-checked="true">` +
      `<span class="ml-switch__n">${c.id}</span><span>${c.name}</span><span class="ml-switch__track" aria-hidden="true"></span></button>` +
      `<a class="ml-go" href="${c.go}" aria-label="Ver ${c.name}">Ver</a>`;
    list.appendChild(li);
  });
  list.addEventListener("click", (e) => {
    const sw = e.target.closest(".ml-switch");
    if (sw) {
      const id = +sw.dataset.id;
      is(id) ? on.delete(id) : on.add(id);
      save();
      apply();
      return;
    }
    const go = e.target.closest(".ml-go");
    if (go) {
      const id = +go.closest("li").querySelector(".ml-switch").dataset.id;
      if (!is(id)) { on.add(id); save(); apply(); }
    }
  });
  box.querySelectorAll("[data-all]").forEach((b) =>
    b.addEventListener("click", () => {
      on.clear();
      if (b.dataset.all === "1") CONCEPTS.forEach((c) => on.add(c.id));
      save();
      apply();
    })
  );
  const tags = box.querySelector(".ml-panel__tags");
  root.classList.toggle("ml-tags", tags.checked);
  tags.addEventListener("change", () => root.classList.toggle("ml-tags", tags.checked));
  if (reduced) box.querySelector(".ml-panel__rm").hidden = false;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    body.hidden = !open;
    try { localStorage.setItem(KEY + ":open", open ? "1" : "0"); } catch (e) {}
  };
  let open = false;
  try {
    const s = localStorage.getItem(KEY + ":open");
    if (s) open = s === "1";
  } catch (e) {}
  setOpen(open);
  toggle.addEventListener("click", () => setOpen(body.hidden));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !body.hidden) { setOpen(false); toggle.focus(); }
  });
}

/* ───────── Medidas ───────── */
const main = document.querySelector(".ml-main");
const chapters = [...document.querySelectorAll(".ml-chapter")];
const ba = document.querySelector(".ml-ba");
const zoom = document.querySelector(".ml-zoom");
const thread = document.querySelector(".ml-thread");
let nodes = [];
let geo = { mainTop: 0, t0: 0, t1: 1, ch: [], ba: [0, 1], zoom: [0, 1] };

function measure() {
  if (!main) return;
  geo.mainTop = docY(main);
  geo.ch = chapters.map((c) => docY(c));
  const first = chapters[0], last = chapters[chapters.length - 1];
  geo.t0 = docY(first) - geo.mainTop;
  geo.t1 = docY(last) + last.offsetHeight - geo.mainTop;
  if (ba) geo.ba = [docY(ba), ba.offsetHeight];
  if (zoom) geo.zoom = [docY(zoom), zoom.offsetHeight];
  if (thread) {
    thread.style.setProperty("--t0", geo.t0 + "px");
    thread.style.setProperty("--th", geo.t1 - geo.t0 + "px");
    nodes.forEach((n) => {
      n.y = docY(n.target) + n.target.offsetHeight / 2 - geo.mainTop - geo.t0;
      n.el.style.top = n.y + "px";
    });
  }
}

/* ───────── C3 · nodos del hilo ───────── */
function buildThread() {
  if (!thread) return;
  const targets = [];
  chapters.forEach((c) => {
    const head = c.querySelector(".cs-heading");
    if (head) targets.push({ target: head, label: c.dataset.milestone });
    c.querySelectorAll(".cs-heading").forEach((h, i) => { if (i > 0) targets.push({ target: h, label: "" }); });
  });
  [ba, zoom].forEach((el) => el && targets.push({ target: el.querySelector(".ml-stage"), label: el === ba ? "Avant → Après" : "Le détail" }));
  nodes = targets.map((t) => {
    const el = document.createElement("span");
    el.className = "ml-node";
    if (t.label) el.innerHTML = `<span class="ml-node__label">${t.label}</span>`;
    thread.appendChild(el);
    return { ...t, el, y: 0 };
  });
}

/* ───────── C5 · frases de reflexión palabra a palabra ───────── */
function splitWords(p) {
  const strong = p.querySelector("strong");
  if (!strong || p.classList.contains("is-split")) return;
  const text = strong.textContent;
  strong.setAttribute("aria-label", text);
  strong.innerHTML = text
    .split(/(\s+)/)
    .map((w, i) => (w.trim() ? `<span class="ml-w" aria-hidden="true" style="--i:${i / 2}">${w}</span>` : w))
    .join("");
  p.classList.add("is-split");
}

/* ───────── C6 · contadores ───────── */
const fmt = (n, sep) => {
  const s = String(Math.round(n));
  return sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : s;
};

function prepMetric(el) {
  if (el._ml) return el._ml;
  const text = el.textContent.trim();
  const m = text.match(/^([^\d]*)(\d[\d\s  .,]*\d|\d)(.*)$/);
  if (!m) return (el._ml = { text });
  const sepMatch = m[2].match(/[\s  .,]/);
  const value = parseInt(m[2].replace(/[^\d]/g, ""), 10);
  const pct = /%/.test(m[3]);
  const info = { text, pre: m[1], value, post: m[3], sep: sepMatch ? sepMatch[0] : "", pct };
  if (pct) {
    const bar = document.createElement("span");
    bar.className = "ml-bar";
    bar.setAttribute("aria-hidden", "true");
    bar.innerHTML = "<i></i>";
    el.after(bar);
    info.bar = bar;
  }
  return (el._ml = info);
}

function countUp(el, delay, fast) {
  const info = prepMetric(el);
  if (info.value === undefined) return;
  const finalText = el.textContent;
  el.setAttribute("aria-label", finalText.trim());
  /* "0 %" baja desde 100: el vacío se nota */
  const from = info.value === 0 ? 100 : 0;
  const dur = fast ? 900 : 1700;
  const bar = info.bar && info.bar.firstElementChild;
  let start = 0;
  const step = (t) => {
    if (!start) start = t + delay;
    const k = clamp((t - start) / dur, 0, 1);
    const e = 1 - Math.pow(1 - k, 3);
    const v = lerp(from, info.value, e);
    el.textContent = info.pre + fmt(v, info.sep) + info.post;
    if (bar) bar.style.setProperty("--v", (v / 100).toFixed(3));
    if (k < 1) requestAnimationFrame(step);
    else el.textContent = finalText;
  };
  el.textContent = info.pre + fmt(from, info.sep) + info.post;
  if (bar) bar.style.setProperty("--v", from / 100);
  requestAnimationFrame(step);
}

function metrics() {
  const boxes = [...document.querySelectorAll(".ml-main .cs-metrics")];
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting || !is(6)) return;
        io.unobserve(en.target);
        const nums = [...en.target.querySelectorAll(".cs-metric-num")];
        const fast = is(5) && en.target.closest('[data-tempo="fast"]');
        nums.forEach((n, i) => {
          if (reduced) {
            const info = prepMetric(n);
            if (info.bar) info.bar.firstElementChild.style.setProperty("--v", (info.value / 100).toFixed(3));
            return;
          }
          countUp(n, i * (fast ? 90 : 220), fast);
        });
      });
    },
    { threshold: 0.35 }
  );
  boxes.forEach((b) => io.observe(b));
}

/* ───────── C4 · cámara ───────── */
/* Puntos de interés sobre images-header (fracciones de la imagen) */
const SHOTS = [
  { x: 0.5, y: 0.5, s: 1 },
  { x: 0.37, y: 0.33, s: 1.9 },
  { x: 0.25, y: 0.56, s: 3.4 },
  { x: 0.83, y: 0.54, s: 2.3 },
];
const zoomImg = zoom && zoom.querySelector(".ml-zoom__img");
const caps = zoom ? [...zoom.querySelectorAll(".ml-zoom__caps li")] : [];
let dots = [];
function buildZoomDots() {
  if (!zoom) return;
  const d = document.createElement("div");
  d.className = "ml-zoom__dots";
  d.setAttribute("aria-hidden", "true");
  d.innerHTML = SHOTS.map(() => "<i></i>").join("");
  zoom.querySelector(".ml-sticky").appendChild(d);
  dots = [...d.children];
}

function cam(p) {
  /* p 0→1: cada plano se mantiene un momento antes de viajar al siguiente */
  const n = SHOTS.length - 1;
  const f = clamp(p, 0, 0.999) * n;
  const i = Math.floor(f);
  const local = f - i;
  const hold = 0.35;
  const k = ease(clamp((local - hold) / (1 - hold), 0, 1));
  const a = SHOTS[i], b = SHOTS[Math.min(i + 1, n)];
  const s = lerp(a.s, b.s, k), x = lerp(a.x, b.x, k), y = lerp(a.y, b.y, k);
  /* que el borde de la imagen nunca entre en el encuadre */
  const lim = (v) => clamp(v, 0.5 / s, 1 - 0.5 / s);
  const tx = (0.5 - lim(x)) * 100 * s, ty = (0.5 - lim(y)) * 100 * s;
  zoomImg.style.transform = `translate3d(${tx.toFixed(2)}%, ${ty.toFixed(2)}%, 0) scale(${s.toFixed(3)})`;
  const active = Math.round(f);
  caps.forEach((c, j) => c.classList.toggle("is-on", j === active));
  dots.forEach((d, j) => d.classList.toggle("is-on", j === active));
}

/* ───────── C7 · estados ───────── */
const STATES = ["Avant · 0 % digital", "Diagnostic", "En conception", "Lancé · +30 RDV"];
const stateText = document.querySelector(".ml-state__text");
const tempoText = document.querySelector(".ml-tempo__text");
const railLinks = [...document.querySelectorAll(".ml-rail__list a")];

/* ───────── Bucle de scroll ───────── */
let lastY = -1, lastCh = -1;
function tick(force) {
  const y = window.scrollY;
  if (!force && y === lastY) return;
  lastY = y;
  const vh = window.innerHeight;

  /* capítulo actual */
  let cur = 0;
  geo.ch.forEach((top, i) => { if (y + vh * 0.5 >= top) cur = i; });

  /* C1: capítulos que ya entraron + índice */
  chapters.forEach((c, i) => {
    if (y + vh * 0.85 >= geo.ch[i]) c.classList.add("is-entered");
  });
  if (cur !== lastCh || force) {
    lastCh = cur;
    railLinks.forEach((a, i) => (i === cur ? a.setAttribute("aria-current", "step") : a.removeAttribute("aria-current")));
    const tempo = chapters[cur].dataset.tempo;
    if (tempoText) tempoText.textContent = tempo === "fast" ? "Tempo rapide" : "Tempo lent";
    document.querySelector(".ml-tempo__bars")?.style.setProperty("--beat", tempo === "fast" ? "0.5s" : "1.6s");
    if (stateText) stateText.textContent = STATES[cur];
  }

  /* C7: --ml-s sigue el avance de forma continua entre capítulos */
  if (is(7)) {
    const sTo = (i) => parseFloat(chapters[i].dataset.state || "0");
    let s = sTo(cur);
    if (cur < chapters.length - 1) {
      const span = geo.ch[cur + 1] - geo.ch[cur];
      const k = clamp((y + vh * 0.5 - geo.ch[cur]) / span, 0, 1);
      s = lerp(sTo(cur), sTo(cur + 1), clamp((k - 0.6) / 0.4, 0, 1));
    }
    root.style.setProperty("--ml-s", s.toFixed(3));
    const res = chapters[chapters.length - 1];
    const inv = y + vh * 0.65 >= geo.ch[chapters.length - 1];
    res.classList.toggle("is-inverted", inv);
    /* la barra flotante (abajo) se invierte cuando la banda pasa por detrás */
    const barY = y + vh - 36;
    root.classList.toggle("ml-inv", inv && barY >= geo.ch[chapters.length - 1] && barY < geo.ch[chapters.length - 1] + res.offsetHeight);
    document.querySelector(".ml-state")?.style.setProperty("--ml-state-c", "var(--ml-live)");
  } else {
    chapters.forEach((c) => c.classList.remove("is-inverted"));
    root.classList.remove("ml-inv");
  }

  /* C3: hilo */
  if (is(3) && thread) {
    const drawn = clamp(y + vh * 0.6 - geo.mainTop - geo.t0, 0, geo.t1 - geo.t0);
    thread.style.setProperty("--tp", reduced ? 1 : (drawn / Math.max(1, geo.t1 - geo.t0)).toFixed(4));
    nodes.forEach((n) => n.el.classList.toggle("is-on", reduced || n.y <= drawn));
  }

  /* C2: cortina */
  if (is(2) && ba && !reduced) {
    const [top, h] = geo.ba;
    const p = clamp((y - top) / Math.max(1, h - vh), 0, 1);
    const cut = ease(clamp((p - 0.15) / 0.7, 0, 1)) * 100;
    ba.style.setProperty("--cut", cut.toFixed(2) + "%");
  }

  /* C4: cámara */
  if (is(4) && zoom && !reduced) {
    const [top, h] = geo.zoom;
    cam(clamp((y - top) / Math.max(1, h - vh), 0, 1));
  } else if (zoomImg) {
    zoomImg.style.transform = "";
  }

  /* C5: frases de reflexión */
  if (is(5) && !reduced) {
    document.querySelectorAll(".ml-reflect").forEach((p) => {
      if (p.getBoundingClientRect().top < vh * 0.8) {
        splitWords(p);
        requestAnimationFrame(() => p.classList.add("is-read"));
      }
    });
  }
}

function loop() {
  tick(false);
  requestAnimationFrame(loop);
}

/* Sin movimiento: cortina manual */
function manualCurtain() {
  const input = ba && ba.querySelector(".ml-ba__range input");
  if (!input) return;
  const set = () => ba.style.setProperty("--cut", input.value + "%");
  input.addEventListener("input", set);
  set();
}

function init() {
  if (!main) return;
  readState();
  if (reduced) root.classList.add("ml-rm");
  panel();
  buildThread();
  buildZoomDots();
  metrics();
  manualCurtain();
  apply();
  window.addEventListener("resize", () => { measure(); tick(true); }, { passive: true });
  window.addEventListener("load", () => { measure(); tick(true); });
  /* las imágenes lazy cambian la altura de la página al cargar */
  new ResizeObserver(() => { measure(); tick(true); }).observe(main);
  if (reduced) { tick(true); return; }
  requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", init);
