/**
 * theme.js — dark / light switch for the project pages (same behaviour as the Home).
 * The initial theme is set by an inline script in <head>; preference in localStorage `pf:theme`.
 */
const root = document.documentElement;

function setTheme(theme) {
  root.dataset.theme = theme;
  const t = document.getElementById("theme-toggle");
  if (t) t.setAttribute("aria-checked", theme === "dark" ? "true" : "false");
  try {
    localStorage.setItem("pf:theme", theme);
  } catch (_) {
    /* ignore */
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.setAttribute("aria-checked", root.dataset.theme === "dark" ? "true" : "false");
  btn.addEventListener("click", () => setTheme(root.dataset.theme === "light" ? "dark" : "light"));
});
