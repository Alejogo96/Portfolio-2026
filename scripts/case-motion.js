/**
 * case-motion.js — Motion de las páginas de proyecto (inspirado en spykercars.com).
 * - Scroll suave (Lenis).
 * - Títulos con máscara, párrafos/listas/métricas en cascada.
 * - Imágenes: apertura con clip-path + zoom y parallax ligados al scroll.
 * Sin JS o con prefers-reduced-motion todo queda visible y estático.
 */
import Lenis from "lenis";

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

function init() {
  const medias = wrapImages();
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
    document.documentElement.style.setProperty("--sy", Math.round(window.scrollY));
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
