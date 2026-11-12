/**
 * cv.js — Interacción de la página CV (projects/cv).
 * - Experiencias como acordeón (botón con aria-expanded), "Tout ouvrir / Tout fermer".
 * - Índice fijo con la sección activa (scroll-spy).
 * - La línea de tiempo se dibuja con el scroll (solo transform).
 * Sin JS o con prefers-reduced-motion todo queda abierto/visible y estático.
 */
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setOpen(item, open) {
  const btn = item.querySelector(".cv-item__btn");
  const panel = item.querySelector(".cv-item__panel");
  if (!btn || !panel || item.classList.contains("cv-item--static")) return;
  btn.setAttribute("aria-expanded", String(open));
  item.classList.toggle("is-open", open);
  panel.hidden = !open;
}

function initAccordion() {
  const items = [...document.querySelectorAll(".cv-item:not(.cv-item--static)")];
  const toggle = document.querySelector(".cv-toggle");
  const sync = () => {
    const all = items.every((i) => i.classList.contains("is-open"));
    toggle?.setAttribute("aria-pressed", String(all));
  };
  items.forEach((item) => {
    item.querySelector(".cv-item__btn").addEventListener("click", () => {
      setOpen(item, !item.classList.contains("is-open"));
      sync();
    });
  });
  toggle?.addEventListener("click", () => {
    const openAll = toggle.getAttribute("aria-pressed") !== "true";
    items.forEach((i) => setOpen(i, openAll));
    sync();
  });
  sync();
}

function initTimeline() {
  const tl = document.querySelector(".cv-timeline");
  if (!tl || reduced) return;
  const update = () => {
    const r = tl.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / Math.max(1, r.height)));
    tl.style.setProperty("--tl", p.toFixed(3));
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}

function init() {
  initAccordion();
  initTimeline();
}

document.addEventListener("DOMContentLoaded", init);
