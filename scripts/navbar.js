/**
 * navbar.js — Header menu (burger on mobile, dropdown on desktop).
 * - aria-expanded / aria-controls on the trigger, label "Ouvrir / Fermer le menu".
 * - Mobile: tap toggles the list; desktop: the link still goes to #projects (hover/focus opens the dropdown).
 * - Esc closes and returns focus to the trigger; tap outside closes; Tab leaving the menu closes.
 * - Body scroll is locked while the mobile list is open.
 * - Marks the current page with aria-current="page" + a visible "Page actuelle" label.
 */
/* Translations are applied by i18n.js (data-i18n / data-i18n-aria-label); here we only
   switch keys and ask it to refresh the navbar. */
const refresh = (root) => document.dispatchEvent(new CustomEvent("i18n:refresh", { detail: { root } }));

function init() {
  const wrap = document.querySelector(".navbar-menu-wrapper");
  const trigger = wrap && wrap.querySelector(".layout-grid-parent");
  const panel = document.getElementById("nav-menu");
  const navbar = document.querySelector(".navbar");
  if (!wrap || !trigger || !panel || !navbar) return;

  const mq = window.matchMedia("(max-width: 768px)");
  const isOpen = () => wrap.getAttribute("data-open") === "true";

  function label() {
    trigger.setAttribute("data-i18n-aria-label", isOpen() ? "nav.closeMenu" : "nav.open");
    refresh(trigger.parentElement);
  }

  function place() {
    const b = navbar.getBoundingClientRect().bottom;
    document.documentElement.style.setProperty("--nav-bottom", Math.round(b + 8) + "px");
  }

  function open() {
    place();
    wrap.setAttribute("data-open", "true");
    trigger.setAttribute("aria-expanded", "true");
    label();
    if (mq.matches) {
      document.body.style.overflow = "hidden";
      const first = panel.querySelector("a");
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
    }
  }

  function close(returnFocus) {
    wrap.removeAttribute("data-open");
    trigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    label();
    if (returnFocus) trigger.focus();
  }

  trigger.addEventListener("click", (e) => {
    if (!mq.matches) return; /* desktop: normal link */
    e.preventDefault();
    isOpen() ? close(false) : open();
  });

  /* desktop dropdown opens on hover/focus: keep aria-expanded in sync */
  wrap.addEventListener("mouseenter", () => {
    wrap.removeAttribute("data-dismissed");
    if (!mq.matches) trigger.setAttribute("aria-expanded", "true");
  });
  wrap.addEventListener("mouseleave", () => {
    wrap.removeAttribute("data-dismissed");
    if (!mq.matches) trigger.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (isOpen()) {
      close(true);
    } else if (!mq.matches && trigger.getAttribute("aria-expanded") === "true") {
      wrap.setAttribute("data-dismissed", "");
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (isOpen() && !wrap.contains(e.target)) close(false);
  });

  wrap.addEventListener("focusout", (e) => {
    if (!wrap.contains(e.relatedTarget)) {
      wrap.removeAttribute("data-dismissed");
      if (isOpen()) close(false);
    }
  });

  panel.addEventListener("click", (e) => {
    if (e.target.closest("a") && isOpen()) close(false);
  });

  mq.addEventListener("change", () => close(false));
  window.addEventListener("resize", () => isOpen() && place(), { passive: true });

  /* current page */
  function markCurrent() {
    const here = new URL(location.href);
    const norm = (p) => p.replace(/index\.html$/, "").replace(/\/+$/, "");
    panel.querySelectorAll("a").forEach((a) => {
      a.removeAttribute("aria-current");
      a.querySelector(".navbar-dropdown-item__current")?.remove();
      const u = new URL(a.getAttribute("href"), location.href);
      const same = norm(u.pathname) === norm(here.pathname);
      const isHomeItem = u.hash === "#home" || u.pathname === here.pathname;
      /* home items point to the Home page; project items to their own page */
      if (same && (here.pathname.includes("/projects/") || u.hash === "#home")) {
        if (here.pathname.includes("/projects/") || !here.hash || here.hash === "#home") {
          a.setAttribute("aria-current", "page");
          const s = document.createElement("span");
          s.className = "navbar-dropdown-item__current";
          s.setAttribute("data-i18n", "nav.current");
          a.querySelector(".navbar-dropdown-item__header")?.appendChild(s);
          refresh(a);
        }
      }
    });
  }
  markCurrent();
  label();
  document.addEventListener("i18n:applied", () => {
    markCurrent();
    label();
  });
}

document.addEventListener("DOMContentLoaded", init);
