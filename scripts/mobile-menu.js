/**
 * mobile-menu.js — accessible burger menu for the header on mobile (≤768px).
 * Builds the panel from the desktop dropdown links (same names and order = Jakob),
 * grouped like the desktop menu: Expériences professionnelles / Projets personnels / Profil (Hick + Miller: ≤7 per group).
 * a11y: aria-expanded/controls, X with "Fermer le menu", Esc + tap outside + link closes,
 * focus enters the panel and returns to the burger, Tab stays inside, background scroll locked.
 */
const MQ = window.matchMedia("(max-width: 768px)");
const EXPERIENCES = ["qualnet", "iridian", "freelance"];

const T = {
  fr: { open: "Ouvrir le menu", close: "Fermer le menu", menu: "Menu", projects: "Projets personnels", exp: "Expériences professionnelles", profile: "Profil", current: "Page actuelle" },
  en: { open: "Open menu", close: "Close menu", menu: "Menu", projects: "Personal projects", exp: "Professional experience", profile: "Profile", current: "Current page" },
  es: { open: "Abrir el menú", close: "Cerrar el menú", menu: "Menú", projects: "Proyectos personales", exp: "Experiencia profesional", profile: "Perfil", current: "Página actual" },
};
const t = () => T[document.documentElement.lang] || T.fr;

const norm = (href) => {
  try {
    const u = new URL(href, location.href);
    return u.pathname.replace(/index\.html$/, "").replace(/\/$/, "") + u.hash;
  } catch (_) {
    return href;
  }
};

function init() {
  const wrapper = document.querySelector(".navbar-menu-wrapper");
  const dropdown = wrapper && wrapper.querySelector(".navbar-dropdown");
  const navbar = document.querySelector(".navbar");
  if (!wrapper || !dropdown || !navbar) return;

  // Burger button (shown only on mobile via CSS)
  const burger = document.createElement("button");
  burger.type = "button";
  burger.className = "nav-burger";
  burger.setAttribute("aria-expanded", "false");
  burger.setAttribute("aria-controls", "mobile-menu");
  burger.innerHTML = '<span class="nav-burger__box" aria-hidden="true"><span></span><span></span><span></span></span>';
  wrapper.prepend(burger);

  // Panel
  const panel = document.createElement("div");
  panel.id = "mobile-menu";
  panel.className = "mobile-menu";
  panel.hidden = true;
  const backdrop = document.createElement("div");
  backdrop.className = "mobile-menu__backdrop";
  backdrop.hidden = true;

  // Canonical list (same order as the Home cards) so every page shows all 10 entries,
  // even where the desktop dropdown is incomplete. Home / CV come from the dropdown (i18n).
  const brand = document.querySelector(".capa-1-parent");
  const root = new URL(brand ? brand.getAttribute("href") : "./index.html", location.href);
  const page = (slug) => new URL(`projects/${slug}/index.html`, root).href;
  const item = (slug, name) => ({ href: page(slug), name });
  const groups = {
    exp: [
      item("qualnet", "Qualnet"),
      item("andy-electric", "Andy Electric"),
      item("ublo", "Ublo"),
      item("iridian", "Iridian"),
      item("bellpi", "Bellpi"),
      item("freelance", "Freelance"),
    ],
    projects: [
      item("jumbomana", "JumboMana"),
      item("bnf", "Musée de la BnF"),
      item("spotify", "Spotify"),
      item("paramo", "ParamoTotem"),
    ],
    profile: [],
  };
  dropdown.querySelectorAll("a.navbar-dropdown-item").forEach((a) => {
    const href = a.getAttribute("href");
    if (!/#(home|cv)$/.test(href)) return;
    groups.profile.push({ href, nameEl: a.querySelector(".navbar-dropdown-item__name") });
  });

  const here = norm(location.href);
  const links = [];
  const titles = {};
  for (const key of ["exp", "projects", "profile"]) {
    if (!groups[key].length) continue;
    const sec = document.createElement("nav");
    sec.className = "mobile-menu__group";
    const h = document.createElement("h2");
    h.className = "mobile-menu__title";
    h.id = `mobile-menu-${key}`;
    sec.setAttribute("aria-labelledby", h.id);
    titles[key] = h;
    const ul = document.createElement("ul");
    for (const { href, nameEl, name: fixed } of groups[key]) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "mobile-menu__link";
      a.href = href;
      /* Same per-project icon as the desktop dropdown (Figma "Iconos 2026", 1px stroke) */
      const src = [...dropdown.querySelectorAll("a.navbar-dropdown-item")].find((d) => norm(d.href) === norm(href));
      const srcIcon = src && src.querySelector(".navbar-dropdown-item__icon");
      if (srcIcon) {
        const ic = srcIcon.cloneNode(true);
        ic.className = "mobile-menu__icon";
        ic.alt = "";
        a.append(ic);
      }
      const name = document.createElement("span");
      name.className = "mobile-menu__name";
      name.textContent = nameEl ? nameEl.textContent : fixed;
      a.append(name);
      const isCurrent = !/#/.test(href) && norm(href) === here;
      const aside = document.createElement("span");
      aside.className = isCurrent ? "mobile-menu__current" : "mobile-menu__arrow";
      aside.setAttribute("aria-hidden", "true");
      aside.textContent = isCurrent ? "" : "→";
      if (isCurrent) a.setAttribute("aria-current", "page");
      a.append(aside);
      a._src = nameEl || null;
      li.append(a);
      ul.append(li);
      links.push(a);
    }
    sec.append(h, ul);
    panel.append(sec);
  }
  document.querySelector(".navbar-wrapper").append(backdrop, panel);

  function label() {
    const s = t();
    const open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-label", open ? s.close : s.open);
    panel.setAttribute("aria-label", s.menu);
    titles.projects && (titles.projects.textContent = s.projects);
    titles.exp && (titles.exp.textContent = s.exp);
    titles.profile && (titles.profile.textContent = s.profile);
    panel.querySelectorAll(".mobile-menu__current").forEach((el) => (el.textContent = s.current));
    links.forEach((a) => {
      if (a._src) a.querySelector(".mobile-menu__name").textContent = a._src.textContent;
    });
  }

  let lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    panel.hidden = false;
    backdrop.hidden = false;
    burger.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("mobile-menu-open");
    label();
    requestAnimationFrame(() => panel.classList.add("is-open"));
    (panel.querySelector("[aria-current]") || links[0])?.focus();
  }
  function close(restore = true) {
    if (burger.getAttribute("aria-expanded") !== "true") return;
    burger.setAttribute("aria-expanded", "false");
    panel.classList.remove("is-open");
    panel.hidden = true;
    backdrop.hidden = true;
    document.documentElement.classList.remove("mobile-menu-open");
    label();
    if (restore) burger.focus();
  }

  burger.addEventListener("click", (e) => {
    e.stopPropagation();
    burger.getAttribute("aria-expanded") === "true" ? close() : open();
  });
  backdrop.addEventListener("click", () => close());
  links.forEach((a) => a.addEventListener("click", () => close(false)));
  document.addEventListener("keydown", (e) => {
    if (burger.getAttribute("aria-expanded") !== "true") return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      // keep focus inside burger + panel
      const items = [burger, ...links];
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });
  MQ.addEventListener("change", (e) => { if (!e.matches) close(false); });
  document.addEventListener("i18n:applied", label);

  // language options: lang attribute on each option (screen-reader pronunciation)
  document.querySelectorAll(".lang-btn[data-lang]").forEach((b) => b.setAttribute("lang", b.dataset.lang));
  label();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
