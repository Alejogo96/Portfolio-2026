/* =====================================================
   home.js — Home interactions
   - Theme toggle (dark / light), persisted in localStorage `pf:theme`
   - Hero title: word-by-word rise on load
   - Bio (under the chips): its words appear on the user's first scroll down
   - Cards: hovered card's image bleeds into the page background
  
   ===================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Theme ─────────────────────────────────────── */
  function setTheme(theme) {
    root.dataset.theme = theme;
    var t = document.getElementById('theme-toggle');
    if (t) t.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
    try { localStorage.setItem('pf:theme', theme); } catch (_) { /* ignore */ }
  }

  function initTheme() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.setAttribute('aria-checked', root.dataset.theme === 'dark' ? 'true' : 'false');
    btn.addEventListener('click', function () {
      setTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
    });
  }

  /* ── Word splitting (re-run after each language change) ── */
  function splitWords(el, wrapClass, innerClass) {
    var text = el.textContent.trim();
    if (!text) return [];
    el.setAttribute('aria-label', text);
    el.textContent = '';
    var spans = [];
    text.split(/\s+/).forEach(function (word, i, arr) {
      var outer = document.createElement('span');
      outer.setAttribute('aria-hidden', 'true');
      var inner = outer;
      if (wrapClass) {
        outer.className = wrapClass;
        inner = document.createElement('span');
        inner.className = innerClass;
        outer.appendChild(inner);
      } else {
        outer.className = innerClass;
      }
      inner.style.setProperty('--i', i);
      inner.textContent = word;
      el.appendChild(outer);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
      spans.push(outer);
    });
    return spans;
  }

  var bioWords = [];
  var bioShown = false;

  function showBio() {
    if (bioShown) return;
    bioShown = true;
    var bio = document.getElementById('bio');
    if (bio) bio.classList.add('is-on');
    ['wheel', 'touchmove', 'keydown', 'scroll'].forEach(function (ev) {
      window.removeEventListener(ev, onFirstScroll);
    });
  }

  /* The first scroll-down gesture "activates" the text */
  function onFirstScroll(e) {
    if (e.type === 'wheel' && e.deltaY <= 0) return;
    if (e.type === 'keydown' &&
        ['ArrowDown', 'PageDown', ' ', 'End', 'Spacebar'].indexOf(e.key) === -1) return;
    showBio();
  }

  function setupText() {
    var title = document.getElementById('hero-title');
    if (title) splitWords(title, 'w', 'wi');
    bioWords = [];
    document.querySelectorAll('#bio .bio__p').forEach(function (p) {
      bioWords = bioWords.concat(splitWords(p, null, 'sw'));
    });
    /* continuous index across both paragraphs for the stagger */
    bioWords.forEach(function (w, i) { w.style.setProperty('--i', Math.min(i, 60)); });
  }

  /* ── Cards: stagger + hover background ───────── */
  function initCards() {
    document.querySelectorAll('[data-grid]').forEach(function (grid) {
      Array.prototype.forEach.call(grid.children, function (card, i) {
        card.style.setProperty('--i', i);
      });
    });

    var bg = document.getElementById('hover-bg');
    var canHover = window.matchMedia('(hover: hover)').matches;
    if (!canHover || reduced) return;

    document.querySelectorAll('.pcard').forEach(function (card) {
      var src = card.getAttribute('data-bg');

      card.addEventListener('pointerenter', function () {
        if (bg && src) {
          bg.style.backgroundImage = 'url("' + src + '")';
          bg.classList.add('is-on');
        }
      });

      card.addEventListener('pointerleave', function () {
        if (bg) bg.classList.remove('is-on');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initCards();
    setupText();
    if (reduced || window.scrollY > 40) {
      showBio();
    } else {
      ['wheel', 'touchmove', 'keydown', 'scroll'].forEach(function (ev) {
        window.addEventListener(ev, onFirstScroll, { passive: true });
      });
    }
  });

  /* Language changed → text was replaced; split again */
  document.addEventListener('i18n:applied', function () {
    setupText();
  });
})();
