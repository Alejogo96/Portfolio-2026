/**
 * case-story.js — Motion + storytelling de las páginas de proyecto.
 * Conceptos elegidos por Alejandro en el Motion lab (2026-11-11):
 *   1 Capítulos de scroll  — el caso se lee por capítulos (Contexte, Problème,
 *                            Solution…), cada uno con su transición de entrada,
 *                            y una barra flotante indica el capítulo actual.
 *   3 Hilo conductor       — línea de 1 px en el margen que se dibuja con el
 *                            scroll y enciende un nodo en cada título.
 *   5 Ritmo emocional      — los capítulos de reflexión se mueven lento; los de
 *                            resolución, rápido. Los destacados (.cs-lead) se
 *                            leen palabra a palabra.
 *   6 Cifras que se cuentan — las cifras existentes cuentan al entrar en vista
 *                            (nunca se inventan: solo se animan las del caso).
 * Sin JS o con prefers-reduced-motion: capítulos e hilo visibles y estáticos,
 * cifras finales.
 */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const docY = (el) => el.getBoundingClientRect().top + window.scrollY;

/* Nombres de capítulo (claves i18n story.*) y su tempo */
const LABELS = {
  context: "Contexte",
  problem: "Problème",
  research: "Recherche",
  role: "Mon rôle",
  method: "Méthode",
  concept: "Concept",
  solution: "Solution",
  experience: "Expérience",
  tests: "Tests",
  result: "Résultats",
  projects: "Projets",
  learn: "Apprentissages",
  voice: "Voix et ton",
};
const SLOW = new Set(["context", "problem", "research", "role", "concept", "learn"]);

/* Capítulos por proyecto: [índice del título .cs-heading en la página, capítulo].
   El índice cuenta todos los títulos de sección, incluido "Contexte". */
const CHAPTERS = {
  "andy-electric": [[0, "context"], [1, "problem"], [2, "solution"], [4, "result"]],
  ublo: [[0, "context"], [2, "research"], [3, "solution"]],
  bellpi: [[0, "context"], [2, "research"], [3, "solution"]],
  bnf: [[0, "context"], [1, "research"], [4, "solution"]],
  iridian: [[0, "context"], [2, "method"], [4, "projects"]],
  jumbomana: [[0, "context"], [1, "problem"], [3, "solution"], [4, "tests"]],
  paramo: [[0, "context"], [1, "concept"], [3, "experience"]],
  qualnet: [[0, "context"], [2, "role"], [6, "method"], [7, "projects"]],
  spotify: [[0, "context"], [1, "solution"], [3, "concept"], [5, "tests"], [6, "method"], [8, "research"], [16, "voice"], [17, "learn"]],
};

const pad = (n) => String(n).padStart(2, "0");

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

/* ───────── 1 · Capítulos ───────── */
function buildChapters(main, page) {
  const plan = CHAPTERS[page];
  if (!plan) return [];
  const headings = [...main.querySelectorAll(".cs-heading")];
  const chapters = [];
  plan.forEach(([idx, key], i) => {
    const h = headings[idx];
    if (!h) return;
    const head = el(
      "p",
      "cs-chapter",
      `<span class="cs-chapter__num" aria-hidden="true">${pad(i + 1)}</span>` +
        `<span class="cs-chapter__name" data-i18n="story.${key}">${LABELS[key]}</span>` +
        `<span class="cs-chapter__rule" aria-hidden="true"></span>`
    );
    head.id = "chapitre-" + (i + 1);
    /* "Contexte" va dentro de la cabecera; los demás títulos, en su bloque */
    const inHeader = h.parentElement.classList.contains("cs-header");
    const anchor = inHeader ? h : h.closest(".cs-block") || h;
    anchor.parentNode.insertBefore(head, anchor);
    if (inHeader) head.classList.add("cs-chapter--in-header");
    chapters.push({ key, head, n: i + 1, tempo: SLOW.has(key) ? "slow" : "fast" });
  });
  if (!chapters.length) return chapters;

  /* Marcar cada elemento de main con su capítulo (sin envolver el DOM,
     para no romper el ritmo vertical de case-theme.css) */
  let cur = null;
  const mark = (node, c) => {
    node.dataset.ch = c.n;
    node.dataset.tempo = c.tempo;
  };
  [...main.children].forEach((node) => {
    const starts = chapters.find((c) => c.head === node || node.contains(c.head));
    if (starts && node.classList.contains("cs-header")) {
      /* en la cabecera, solo lo que sigue a "Contexte" entra al capítulo 1 */
      let on = false;
      [...node.children].forEach((child) => {
        if (child === starts.head) on = true;
        if (on) mark(child, starts);
      });
      cur = starts;
      return;
    }
    if (starts) cur = starts;
    if (cur && !node.classList.contains("project-nav")) mark(node, cur);
  });
  chapters.forEach((c) => {
    c.top = 0;
  });
  return chapters;
}

function buildNav(chapters) {
  if (chapters.length < 2) return null;
  const nav = el("nav", "cs-story-nav");
  nav.setAttribute("aria-label", "Chapitres du projet");
  nav.setAttribute("data-i18n-aria-label", "story.nav");
  const ol = el("ol");
  chapters.forEach((c) => {
    const li = el(
      "li",
      null,
      `<a href="#${c.head.id}"><span aria-hidden="true">${pad(c.n)}</span>` +
        `<span class="cs-story-nav__name" data-i18n="story.${c.key}">${LABELS[c.key]}</span></a>`
    );
    ol.appendChild(li);
  });
  nav.appendChild(ol);
  document.querySelector("main.cs-frame").after(nav);
  return [...nav.querySelectorAll("a")];
}

/* ───────── 3 · Hilo conductor ───────── */
function buildThread(main, chapters) {
  if (!chapters.length) return null;
  const thread = el("div", "cs-thread", '<span class="cs-thread__track"></span><span class="cs-thread__line"></span>');
  thread.setAttribute("aria-hidden", "true");
  main.prepend(thread);
  const nodes = [];
  chapters.forEach((c) => {
    nodes.push({ target: c.head, label: c.key });
  });
  main.querySelectorAll(".cs-heading").forEach((h) => nodes.push({ target: h, label: null }));
  return {
    el: thread,
    nodes: nodes.map((n) => {
      const dot = el("span", "cs-thread__node");
      if (n.label) {
        dot.classList.add("cs-thread__node--chapter");
        dot.innerHTML = `<span class="cs-thread__label" data-i18n="story.${n.label}">${LABELS[n.label]}</span>`;
      }
      thread.appendChild(dot);
      return { ...n, dot, y: 0 };
    }),
  };
}

/* ───────── 5 · Destacados palabra a palabra ───────── */
function splitWords(p) {
  if (p.classList.contains("is-split")) return;
  const target = p.querySelector("strong") || p;
  const text = target.textContent;
  target.setAttribute("aria-label", text);
  target.innerHTML = text
    .split(/(\s+)/)
    .map((w, i) => (w.trim() ? `<span class="cs-w" aria-hidden="true" style="--i:${i / 2}">${w}</span>` : w))
    .join("");
  p.classList.add("is-split");
}

/* ───────── 6 · Cifras ───────── */
const fmt = (n, sep) => {
  const s = String(Math.round(n));
  return sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : s;
};

function parseMetric(node) {
  const text = node.textContent.trim();
  const m = text.match(/^([^\d]*)(\d[\d\s  .,]*\d|\d)(.*)$/);
  if (!m) return null;
  const value = parseInt(m[2].replace(/[^\d]/g, ""), 10);
  /* un año (1997, 2013…) no se cuenta: no es una cifra de resultado */
  if (!m[1].trim() && !m[3].trim() && value >= 1900 && value <= 2100) return null;
  if (/[.,]\d{1,2}$/.test(m[2])) return null;
  /* un código o nombre (ISO 9001…) tampoco: solo signos delante de la cifra */
  if (/[a-zA-ZÀ-ÿ]/.test(m[1])) return null; /* decimales: se dejan tal cual */
  const sep = (m[2].match(/[\s  .,]/) || [""])[0];
  return { text, pre: m[1], value, post: m[3], sep, pct: /%/.test(m[3]) };
}

function countUp(node, info, delay, fast) {
  const finalText = node.textContent;
  node.setAttribute("aria-label", finalText.trim());
  const from = info.value === 0 ? 100 : 0; /* "0 %" baja desde 100 */
  const dur = fast ? 900 : 1700;
  const bar = info.bar && info.bar.firstElementChild;
  let start = 0;
  const step = (t) => {
    if (!start) start = t + delay;
    const k = clamp((t - start) / dur, 0, 1);
    const v = lerp(from, info.value, 1 - Math.pow(1 - k, 3));
    node.textContent = info.pre + fmt(v, info.sep) + info.post;
    if (bar) bar.style.setProperty("--v", Math.min(v / 100, 1).toFixed(3));
    if (k < 1) requestAnimationFrame(step);
    else node.textContent = finalText;
  };
  node.textContent = info.pre + fmt(from, info.sep) + info.post;
  if (bar) bar.style.setProperty("--v", from / 100);
  requestAnimationFrame(step);
}

function metrics(main) {
  const boxes = [...main.querySelectorAll(".cs-metrics, .cs-stats")];
  const nums = [...main.querySelectorAll(".cs-metric-num, .cs-stat-num")];
  if (!nums.length) return;
  const infos = new Map();
  nums.forEach((n) => {
    const info = parseMetric(n);
    if (!info) return;
    if (info.pct) {
      const bar = el("span", "cs-metric-bar", "<i></i>");
      bar.setAttribute("aria-hidden", "true");
      n.after(bar);
      info.bar = bar;
      if (reduced) bar.firstElementChild.style.setProperty("--v", Math.min(info.value / 100, 1));
    }
    infos.set(n, info);
  });
  if (reduced) return;
  const groups = boxes.length ? boxes : nums;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const fast = en.target.closest('[data-tempo="fast"]');
        const list = en.target.matches(".cs-metric-num, .cs-stat-num")
          ? [en.target]
          : [...en.target.querySelectorAll(".cs-metric-num, .cs-stat-num")];
        list.forEach((n, i) => {
          const info = infos.get(n);
          if (info) countUp(n, info, i * (fast ? 90 : 220), fast);
        });
      });
    },
    { threshold: 0.35 }
  );
  groups.forEach((b) => io.observe(b));
}

export function initStory() {
  const main = document.querySelector("main.cs-frame");
  const page = document.body.dataset.page;
  if (!main || !page || document.body.classList.contains("ml-page")) return;

  const chapters = buildChapters(main, page);
  const links = buildNav(chapters);
  const thread = buildThread(main, chapters);
  metrics(main);
  document.dispatchEvent(new CustomEvent("i18n:refresh"));
  document.documentElement.classList.add("cs-story");
  if (!chapters.length) return;

  const geo = { main: 0, t0: 0, t1: 1, ch: [] };
  function measure() {
    geo.main = docY(main);
    geo.ch = chapters.map((c) => docY(c.head));
    const last = main.querySelector(".project-nav") || main.lastElementChild;
    geo.t0 = geo.ch[0] - geo.main;
    geo.t1 = docY(last) - geo.main;
    if (thread) {
      thread.el.style.setProperty("--t0", geo.t0 + "px");
      thread.el.style.setProperty("--th", Math.max(0, geo.t1 - geo.t0) + "px");
      thread.nodes.forEach((n) => {
        n.y = docY(n.target) + n.target.offsetHeight / 2 - geo.main - geo.t0;
        n.dot.style.top = n.y + "px";
      });
      /* un título justo debajo de su capítulo no necesita otro nodo */
      const marks = thread.nodes.filter((n) => n.label).map((n) => n.y);
      thread.nodes.forEach((n) => {
        n.dot.hidden = n.target.offsetParent === null || (!n.label && marks.some((y) => Math.abs(y - n.y) < 110));
      });
    }
  }

  const leads = [...main.querySelectorAll(".cs-lead")];
  /* al cambiar de idioma i18n reemplaza el texto: se quita la etiqueta vieja */
  document.addEventListener("i18n:applied", () =>
    leads.forEach((p) => p.querySelectorAll("[aria-label]").forEach((e) => e.removeAttribute("aria-label")))
  );
  let lastY = -1, lastCh = -1;
  function tick(force) {
    const y = window.scrollY;
    if (!force && y === lastY) return;
    lastY = y;
    const vh = window.innerHeight;
    let cur = 0;
    geo.ch.forEach((top, i) => { if (y + vh * 0.5 >= top) cur = i; });
    chapters.forEach((c, i) => {
      if (y + vh * 0.88 >= geo.ch[i]) c.head.classList.add("is-in");
    });
    if (links && (cur !== lastCh || force)) {
      lastCh = cur;
      links.forEach((a, i) => (i === cur ? a.setAttribute("aria-current", "step") : a.removeAttribute("aria-current")));
    }
    if (thread) {
      const span = Math.max(1, geo.t1 - geo.t0);
      const drawn = clamp(y + vh * 0.6 - geo.main - geo.t0, 0, span);
      thread.el.style.setProperty("--tp", reduced ? 1 : (drawn / span).toFixed(4));
      thread.nodes.forEach((n) => n.dot.classList.toggle("is-on", reduced || n.y <= drawn));
    }
    if (!reduced) {
      leads.forEach((p) => {
        if (!p.classList.contains("is-read") && p.getBoundingClientRect().top < vh * 0.8) {
          splitWords(p);
          requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add("is-read")));
        }
      });
    }
  }

  measure();
  tick(true);
  const remeasure = () => { measure(); tick(true); };
  window.addEventListener("resize", remeasure, { passive: true });
  window.addEventListener("load", remeasure);
  new ResizeObserver(remeasure).observe(main);
  if (reduced) {
    chapters.forEach((c) => c.head.classList.add("is-in"));
    window.addEventListener("scroll", () => tick(false), { passive: true });
    return;
  }
  const loop = () => { tick(false); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
