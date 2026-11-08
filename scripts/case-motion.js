/**
 * case-motion.js — Motion de las páginas de proyecto (inspirado en spykercars.com).
 * - Scroll suave (Lenis).
 * - Títulos con máscara, párrafos/listas/métricas en cascada.
 * - Imágenes: apertura con clip-path + zoom y parallax ligados al scroll.
 * Sin JS o con prefers-reduced-motion todo queda visible y estático.
 */
import Lenis from "lenis";
import { initCaseBg } from "./case-bg.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function wrapImages() {
  const medias = [];
  document
    .querySelectorAll(".cs-img-box img, .cs-img-grid img, .cs-img-full img")
    .forEach((img) => {
      const wrap = document.createElement("span");
      wrap.className = "cs-media";
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
      medias.push(wrap);
    });
  return medias;
}

function tagText() {
  const root = document.querySelector("main.cs-frame");
  if (!root) return [];
  const els = [];
  root.querySelectorAll(".cs-title, .cs-heading").forEach((el) => {
    el.classList.add("cm-title");
    els.push(el);
  });
  root.querySelectorAll(
    ".cs-kicker, .cs-role, .cs-body, .cs-list li, .cs-metric, .cs-stat, .cs-card, .cs-soon, .cs-tools, .project-nav"
  ).forEach((el) => {
    el.classList.add("cm-fade");
    els.push(el);
  });
  /* cascada dentro de cada contenedor */
  root.querySelectorAll(".cs-header, .cs-block, .cs-metrics, .cs-list, .cs-cards").forEach((box) => {
    let i = 0;
    box.querySelectorAll(":scope > .cm-title, :scope > .cm-fade, :scope > * > .cm-fade").forEach((el) => {
      if (!el.style.getPropertyValue("--d")) {
        el.style.setProperty("--d", Math.min(i, 8) * 0.09 + "s");
        i++;
      }
    });
  });
  document.querySelectorAll(".cs-sep").forEach((el) => els.push(el));
  return els;
}

/* Ondas luminosas en la primera sección, como el hero del Home,
   con los colores del proyecto (--cs-accent, --cs-accent2, --cs-text). */
function waves() {
  const header = document.querySelector(".cs-header");
  if (!header) return;
  const canvas = document.createElement("canvas");
  canvas.className = "cs-waves";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0, t = 0, cols = [];
  const mouse = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  const shape = [
    { o: 0, a: 70, f: 0.003, k: 0, op: 0.55 },
    { o: Math.PI / 2, a: 90, f: 0.0026, k: 1, op: 0.42 },
    { o: Math.PI, a: 60, f: 0.0034, k: 2, op: 0.22 },
    { o: Math.PI * 1.5, a: 80, f: 0.0022, k: 0, op: 0.3 },
    { o: Math.PI * 2, a: 55, f: 0.004, k: 1, op: 0.2 },
  ];
  function colours() {
    const cs = getComputedStyle(document.body);
    cols = ["--cs-accent", "--cs-accent2", "--cs-text"].map((v) => cs.getPropertyValue(v).trim() || "#ff5f3a");
  }
  function resize() {
    w = window.innerWidth;
    h = Math.max(window.innerHeight, header.getBoundingClientRect().bottom + window.scrollY);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mouse.x = target.x = w / 2;
    mouse.y = target.y = window.innerHeight / 2;
    colours();
  }
  const mid = () => Math.min(window.innerHeight * 0.42, h / 2);
  function draw() {
    ctx.clearRect(0, 0, w, h);
    const light = document.documentElement.getAttribute("data-theme") === "light";
    const step = w < 600 ? 6 : 4;
    shape.forEach((s) => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += step) {
        const dx = x - mouse.x, dy = mid() - mouse.y;
        const infl = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 320);
        const y = mid()
          + Math.sin(x * s.f + t * 0.002 + s.o) * s.a
          + Math.sin(x * s.f * 0.4 + t * 0.003) * s.a * 0.45
          + infl * 70 * Math.sin(t * 0.001 + x * 0.01 + s.o);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = cols[s.k];
      ctx.globalAlpha = s.op * (light ? 1.15 : 1);
      ctx.shadowBlur = light ? 12 : 35;
      ctx.shadowColor = cols[s.k];
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });
  new MutationObserver(colours).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (reduced) { draw(); return; }
  window.addEventListener("mousemove", (e) => { target.x = e.clientX; target.y = e.clientY + window.scrollY; }, { passive: true });
  let on = false, running = false;
  new IntersectionObserver(([en]) => {
    on = en.isIntersecting;
    if (on && !running) { running = true; requestAnimationFrame(loop); }
  }).observe(canvas);
  function loop() {
    if (!on) { running = false; return; }
    t += 1;
    mouse.x += (target.x - mouse.x) * 0.1;
    mouse.y += (target.y - mouse.y) * 0.1;
    draw();
    requestAnimationFrame(loop);
  }
}

function init() {
  const medias = wrapImages();
  waves();
  initCaseBg();
  if (reduced) return;
  document.documentElement.classList.add("cm-on");

  const targets = tagText();

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  /* Titles are clipped when hidden, and IntersectionObserver ignores clipped
     targets, so they are revealed from the scroll position instead. */
  const titles = new Set(targets.filter((el) => el.classList.contains("cm-title")));
  targets.filter((el) => !titles.has(el)).forEach((el) => io.observe(el));

  /* Imágenes: progreso de entrada + parallax, solo mientras son visibles */
  const visible = new Set();
  const mio = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => (en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)));
      update();
    },
    { rootMargin: "20% 0px 20% 0px" }
  );
  medias.forEach((m) => mio.observe(m));

  function update() {
    const vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    document.documentElement.style.setProperty("--sp", clamp(window.scrollY / max, 0, 1).toFixed(4));
    titles.forEach((t) => {
      if (t.getBoundingClientRect().top < vh * 0.9) {
        t.classList.add("is-in");
        titles.delete(t);
      }
    });
    visible.forEach((m) => {
      const r = m.getBoundingClientRect();
      const p = clamp((vh * 0.98 - r.top) / (vh * 0.55), 0, 1);
      const off = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
      m.style.setProperty("--p", p.toFixed(3));
      m.style.setProperty("--py", (off * -3).toFixed(2));
    });
  }

  /* Scroll suave */
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
  lenis.on("scroll", update);
  function raf(t) {
    lenis.raf(t);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  window.addEventListener("resize", update, { passive: true });

  /* El lightbox bloquea el scroll de la página */
  new MutationObserver(() => {
    const open = !!document.querySelector(".lb-overlay");
    open ? lenis.stop() : lenis.start();
  }).observe(document.body, { childList: true });

  /* Enlaces ancla internos */
  document.querySelectorAll('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const t = document.querySelector(a.getAttribute("href"));
      if (t) {
        e.preventDefault();
        lenis.scrollTo(t);
      }
    })
  );
  update();
}

document.addEventListener("DOMContentLoaded", init);
