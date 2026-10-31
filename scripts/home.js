/* =====================================================
   home.js — Home interactions
   - Theme toggle (dark / light), persisted in localStorage `pf:theme`
   - Hero title: word-by-word rise; hero fades/lifts while scrolling
   - Bio: words light up progressively with scroll (scrub)
   - Cards: hovered card's image bleeds into the page background
     (+ small pointer parallax on the card image)
   ===================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Theme ─────────────────────────────────────── */
  function setTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem('pf:theme', theme); } catch (_) { /* ignore */ }
  }

  function initTheme() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
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

  var scrubWords = [];

  function setupText() {
    var title = document.getElementById('hero-title');
    if (title) {
      /* Re-trigger the CSS animation after a language switch */
      splitWords(title, 'w', 'wi');
    }
    scrubWords = [];
    document.querySelectorAll('#scrub .scrub__p').forEach(function (p) {
      scrubWords = scrubWords.concat(splitWords(p, null, 'sw'));
    });
    updateScrub();
  }

  /* ── Scroll-driven motion ─────────────────────── */
  var ticking = false;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function updateScrub() {
    var scrub = document.getElementById('scrub');
    if (!scrub || !scrubWords.length) return;
    if (reduced) {
      scrubWords.forEach(function (w) { w.classList.add('is-on'); });
      return;
    }
    var vh = window.innerHeight;
    var r = scrub.getBoundingClientRect();
    /* 0 when the block's top reaches 85% of the viewport, 1 when its bottom reaches 55% */
    var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.3), 0, 1);
    var lit = Math.round(p * scrubWords.length);
    for (var i = 0; i < scrubWords.length; i++) {
      scrubWords[i].classList.toggle('is-on', i < lit);
    }
  }

  function updateHero() {
    var inner = document.getElementById('hero-inner');
    if (!inner || reduced) return;
    var p = clamp(window.scrollY / (window.innerHeight * 0.7), 0, 1);
    inner.style.transform = 'translate3d(0,' + (-p * 60).toFixed(1) + 'px,0)';
    inner.style.opacity = (1 - p * 0.85).toFixed(3);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateHero();
      updateScrub();
      ticking = false;
    });
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
      var img = card.querySelector('.pcard__img');
      var src = card.getAttribute('data-bg');

      card.addEventListener('pointerenter', function () {
        if (bg && src) {
          bg.style.backgroundImage = 'url("' + src + '")';
          bg.classList.add('is-on');
        }
        if (img) img.style.setProperty('--s', '1.06');
      });

      card.addEventListener('pointermove', function (e) {
        if (!img) return;
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        img.style.setProperty('--tx', (-x * 14).toFixed(1) + 'px');
        img.style.setProperty('--ty', (-y * 10).toFixed(1) + 'px');
      });

      card.addEventListener('pointerleave', function () {
        if (bg) bg.classList.remove('is-on');
        if (img) {
          img.style.setProperty('--s', '1');
          img.style.setProperty('--tx', '0px');
          img.style.setProperty('--ty', '0px');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initCards();
    setupText();
    updateHero();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  });

  /* Language changed → text was replaced; split again */
  document.addEventListener('i18n:applied', function () {
    setupText();
  });
})();
