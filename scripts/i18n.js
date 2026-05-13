/**
 * i18n.js — Sistema multilenguaje vanilla
 *
 * - Importa los diccionarios estáticamente (Parcel los empaqueta).
 * - Lee `data-i18n="key"` y reemplaza `textContent`.
 * - Lee `data-i18n-html="key"` y reemplaza `innerHTML` (para texto con <br/>).
 * - Persiste el idioma en localStorage (`pf:lang`).
 * - Lenguajes soportados: es (default), en, fr.
 */

import es from "../i18n/es.json";
import en from "../i18n/en.json";
import fr from "../i18n/fr.json";

const DICTS = { es, en, fr };
const SUPPORTED = ["es", "en", "fr"];
const DEFAULT_LANG = "es";
const STORAGE_KEY = "pf:lang";

function resolveLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch (_) {
    /* localStorage puede no estar disponible */
  }
  const nav = (navigator.language || "").slice(0, 2).toLowerCase();
  if (SUPPORTED.includes(nav)) return nav;
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
      const lang = btn.dataset.lang;
      if (lang) setLanguage(lang);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindLanguageButtons();
  setLanguage(resolveLang());
});

// Exponer para debugging desde consola
window.__i18n = { setLanguage, DICTS };
