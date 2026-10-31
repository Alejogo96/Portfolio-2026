/**
 * navbar.js — Desktop dropdown of the header (the mobile burger menu lives in mobile-menu.js).
 * - aria-expanded stays in sync with the hover/focus-opened dropdown.
 * - Esc dismisses it (until the pointer or focus leaves) and returns focus to the trigger.
 * - Marks the current page with aria-current="page" + a visible "Page actuelle" label.
 * Translations are applied by i18n.js (data-i18n); here we only ask it to refresh.
 */
const refresh = (root) => document.dispatchEvent(new CustomEvent("i18n:refresh", { detail: { root } }));

function init() {
  const wrap = document.querySelector(".navbar-menu-wrapper");
  const trigger = wrap && wrap.querySelector(".layout-grid-parent");
  const panel = document.getElementById("nav-menu");
  if (!wrap || !trigger || !panel) return;

  const desktop = window.matchMedia("(min-width: 769px)");

  const setExpanded = (v) => trigger.setAttribute("aria-expanded", v ? "true" : "false");

  wrap.addEventListener("mouseenter", () => {
    wrap.removeAttribute("data-dismissed");
    if (desktop.matches) setExpanded(true);
  });
  wrap.addEventListener("mouseleave", () => {
    wrap.removeAttribute("data-dismissed");
    setExpanded(false);
  });
  wrap.addEventListener("focusin", (e) => {
    if (desktop.matches && !wrap.hasAttribute("data-dismissed") && e.target.matches(":focus-visible")) setExpanded(true);
  });
  wrap.addEventListener("focusout", (e) => {
    if (!wrap.contains(e.relatedTarget)) {
      wrap.removeAttribute("data-dismissed");
      setExpanded(false);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && desktop.matches && trigger.getAttribute("aria-expanded") === "true") {
      wrap.setAttribute("data-dismissed", "");
      setExpanded(false);
      trigger.focus();
    }
  });

  function markCurrent() {
    const here = new URL(location.href);
    const norm = (p) => p.replace(/index\.html$/, "").replace(/\/+$/, "");
    const inProject = here.pathname.includes("/projects/");
    panel.querySelectorAll("a").forEach((a) => {
      a.removeAttribute("aria-current");
      a.querySelector(".navbar-dropdown-item__current")?.remove();
      const u = new URL(a.getAttribute("href"), location.href);
      if (norm(u.pathname) !== norm(here.pathname)) return;
      if (!inProject && u.hash !== "#home") return; /* on the Home only the Home entry is current */
      a.setAttribute("aria-current", "page");
      const s = document.createElement("span");
      s.className = "navbar-dropdown-item__current";
      s.setAttribute("data-i18n", "nav.current");
      a.querySelector(".navbar-dropdown-item__header")?.appendChild(s);
      refresh(a);
    });
  }
  markCurrent();
  document.addEventListener("i18n:applied", markCurrent);
}

document.addEventListener("DOMContentLoaded", init);
