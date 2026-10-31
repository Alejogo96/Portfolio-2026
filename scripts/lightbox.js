/**
 * lightbox.js — Abre las imágenes de los casos a tamaño completo.
 * En móvil las capturas y diagramas (≈2000 px) se ven a ~350 px y el texto
 * es ilegible; con el lightbox se pueden recorrer a tamaño real.
 * Accesible: role="dialog", foco atrapado en el botón de cierre, Esc para cerrar,
 * foco devuelto a la imagen. Textos traducidos con las claves ui.zoom / ui.close.
 */
import es from "../i18n/es.json";
import en from "../i18n/en.json";
import fr from "../i18n/fr.json";

const DICTS = { es, en, fr };
const t = (key) => {
  const lang = document.documentElement.lang;
  return (DICTS[lang] || fr)[key] || fr[key];
};

let overlay = null;
let lastFocus = null;

function close() {
  if (!overlay) return;
  overlay.remove();
  overlay = null;
  document.body.style.overflow = "";
  document.removeEventListener("keydown", onKey);
  if (lastFocus) lastFocus.focus();
}

function onKey(e) {
  if (e.key === "Escape") close();
  if (e.key === "Tab") {
    e.preventDefault();
    overlay?.querySelector(".lb-close")?.focus();
  }
}

function open(img) {
  lastFocus = img;
  overlay = document.createElement("div");
  overlay.className = "lb-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", img.alt || t("ui.zoom"));
  const bar = document.createElement("div");
  bar.className = "lb-bar";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "lb-close";
  btn.textContent = t("ui.close");
  btn.addEventListener("click", close);
  bar.appendChild(btn);
  const scroll = document.createElement("div");
  scroll.className = "lb-scroll";
  const big = document.createElement("img");
  big.src = img.currentSrc || img.src;
  big.alt = img.alt;
  scroll.appendChild(big);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target === scroll) close();
  });
  overlay.append(bar, scroll);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", onKey);
  btn.focus();
}

function init() {
  document.querySelectorAll("main img").forEach((img) => {
    if (img.closest(".cs-tool, .cs-tools")) return;
    const mark = () => {
      if (img.naturalWidth < 700) return;
      img.setAttribute("data-zoomable", "");
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.setAttribute("aria-haspopup", "dialog");
    };
    img.complete ? mark() : img.addEventListener("load", mark, { once: true });
    img.addEventListener("click", () => img.hasAttribute("data-zoomable") && open(img));
    img.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && img.hasAttribute("data-zoomable")) {
        e.preventDefault();
        open(img);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
