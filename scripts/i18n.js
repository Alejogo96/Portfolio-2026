/**
 * i18n.js — Sistema multilenguaje vanilla
 *
 * - Importa los diccionarios estáticamente (Parcel los empaqueta).
 * - Lee `data-i18n="key"` y reemplaza `textContent`.
 * - Lee `data-i18n-html="key"` y reemplaza `innerHTML` (para texto con <br/>).
 * - Lee `data-i18n-alt="key"` y reemplaza el atributo `alt` de las imágenes.
 * - Lee `data-i18n-aria-label="key"` y reemplaza el atributo `aria-label`.
 * - Emite el evento `i18n:applied` en `document` tras aplicar un idioma.
 * - Traduce <title> y meta description con las claves `meta.<data-page>.title|desc`.
 * - Persiste el idioma en localStorage (`pf:lang`).
 * - Lenguajes soportados: fr (default), en, es.
 */

import es from "../i18n/es.json";
import en from "../i18n/en.json";
import fr from "../i18n/fr.json";

const DICTS = { es, en, fr };
const SUPPORTED = ["es", "en", "fr"];
const DEFAULT_LANG = "fr";
const STORAGE_KEY = "pf:lang";

function resolveLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch (_) {
    /* localStorage puede no estar disponible */
  }
  return DEFAULT_LANG;
}

function applyDictionary(dict, root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] != null) el.textContent = dict[key];
  });
  root.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (dict[key] != null) el.innerHTML = dict[key];
  });
  root.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.getAttribute("data-i18n-alt");
    if (dict[key] != null) el.setAttribute("alt", dict[key]);
  });
  root.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    if (dict[key] != null) el.setAttribute("aria-label", dict[key]);
  });
  const page = document.body.getAttribute("data-page");
  if (page && root === document) {
    if (dict[`meta.${page}.title`] != null) document.title = dict[`meta.${page}.title`];
    const desc = document.querySelector('meta[name="description"]');
    if (desc && dict[`meta.${page}.desc`] != null) desc.setAttribute("content", dict[`meta.${page}.desc`]);
  }
}

/* Other modules (navbar.js) create labels at runtime and ask for them to be translated. */
document.addEventListener("i18n:refresh", (e) => {
  const lang = document.documentElement.lang;
  const root = (e.detail && e.detail.root) || document;
  applyDictionary(DICTS[lang] || DICTS[DEFAULT_LANG], root);
});

function updateActiveButtons(lang) {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.dataset.active = btn.dataset.lang === lang ? "true" : "false";
  });
}

function updateLangTrigger(lang) {
  document.querySelectorAll(".navbar-lang-current").forEach((el) => {
    el.textContent = lang.toUpperCase();
  });
}

function updateHtmlLang(lang) {
  document.documentElement.setAttribute("lang", lang);
}

function setLanguage(lang) {
  if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
  const dict = DICTS[lang];
  if (!dict) {
    console.error("[i18n] Diccionario no encontrado para:", lang);
    return;
  }
  document.body.classList.add("i18n-loading");
  try {
    applyDictionary(dict);
    updateActiveButtons(lang);
    updateLangTrigger(lang);
    updateHtmlLang(lang);
    document.dispatchEvent(new CustomEvent("i18n:applied", { detail: { lang } }));
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {
      /* ignore */
    }
  } finally {
    document.body.classList.remove("i18n-loading");
  }
}

function bindLanguageButtons() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const lang = btn.dataset.lang;
      if (lang) {
        setLanguage(lang);
        const wrapper = btn.closest(".navbar-lang-wrapper");
        if (wrapper) wrapper.dataset.open = "false";
      }
    });
  });
}

function closeLangDropdowns() {
  document.querySelectorAll(".navbar-lang-wrapper").forEach((w) => {
    w.dataset.open = "false";
    const t = w.querySelector(".navbar-lang-trigger");
    if (t) t.setAttribute("aria-expanded", "false");
  });
}

function bindLangDropdown() {
  document.querySelectorAll(".navbar-lang-wrapper").forEach((wrapper) => {
    const trigger = wrapper.querySelector(".navbar-lang-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = wrapper.dataset.open === "true";
      closeLangDropdowns();
      if (!isOpen) {
        wrapper.dataset.open = "true";
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("click", closeLangDropdowns);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLangDropdowns();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindLanguageButtons();
  bindLangDropdown();
  setLanguage(resolveLang());
});

// Exponer para debugging desde consola
window.__i18n = { setLanguage, DICTS };
