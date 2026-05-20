/**
 * i18n.js — Sistema multilenguaje vanilla
 *
 * - Importa los diccionarios estáticamente (Parcel los empaqueta).
 * - Lee `data-i18n="key"` y reemplaza `textContent`.
 * - Lee `data-i18n-html="key"` y reemplaza `innerHTML` (para texto con <br/>).
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

function applyDictionary(dict) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] != null) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (dict[key] != null) el.innerHTML = dict[key];
  });
}

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
