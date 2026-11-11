/* =====================================================
   home-cards.js — Propuestas de cards de proyectos (Home)
   Comparador temporal (pedido de Alejandro, 2026-11-11):

     actuel  Card actual (portada arriba, título, rol, descripción)
     metric  4 · Card con métrica: portada más pequeña + cifra real o rol clave
     list    1 · Lista editorial: filas a ancho completo, número, título
             grande, rol y años; la portada aparece al pasar el cursor
     bleed   2 · Imagen a sangre: portada completa con degradado y texto abajo
     combo   Recomendado: 4 en desktop, 1 en mobile (≤ 768 px)

   La variante se elige con ?cards=… y queda en <html data-cards>.
   El selector flotante solo aparece en local o en el preview de Vercel;
   en producción, sin parámetro, se ve la card actual.
   ===================================================== */
(function () {
  'use strict';

  var VARIANTS = ['actuel', 'metric', 'list', 'bleed', 'combo'];
  var LABELS = {
    actuel: 'Actuelle',
    metric: '4 · Métrique',
    list: '1 · Liste',
    bleed: '2 · Plein cadre',
    combo: '4 + 1 · Reco'
  };

  var root = document.documentElement;
  var mobile = window.matchMedia('(max-width: 768px)');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var choice = 'actuel';

  function isPreview() {
    var h = location.hostname;
    return (/localhost|127\.0\.0\.1|git-ajustes|vercel\.app$/.test(h) &&
      !/portfolio-alejandroguevara/.test(h)) ||
      new URLSearchParams(location.search).has('cards');
  }

  function readChoice() {
    var v = new URLSearchParams(location.search).get('cards');
    return VARIANTS.indexOf(v) > -1 ? v : 'actuel';
  }

  /* "combo" se resuelve según el ancho: métrica en desktop, lista en mobile */
  function apply() {
    var v = choice === 'combo' ? (mobile.matches ? 'list' : 'metric') : choice;
    if (v === 'actuel') delete root.dataset.cards;
    else root.dataset.cards = v;
  }

  function setChoice(v) {
    choice = v;
    apply();
    var u = new URL(location.href);
    if (v === 'actuel') u.searchParams.delete('cards');
    else u.searchParams.set('cards', v);
    history.replaceState(null, '', u.toString());
    document.querySelectorAll('.cards-switch button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.cards === v ? 'true' : 'false');
    });
  }

  function switcher() {
    var box = document.createElement('div');
    box.className = 'cards-switch';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Propositions de cards');
    box.innerHTML = '<span class="cards-switch__label">Cards</span>' +
      VARIANTS.map(function (v) {
        return '<button type="button" data-cards="' + v + '" aria-pressed="' +
          (v === choice) + '">' + LABELS[v] + '</button>';
      }).join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-cards]');
      if (b) setChoice(b.dataset.cards);
    });
    document.body.appendChild(box);
  }

  /* Lista editorial: la portada sigue al cursor en horizontal (solo transform) */
  function followCursor() {
    if (!canHover || reduced) return;
    var W = 300; /* ancho de la portada flotante, igual que en el CSS */
    document.querySelectorAll('#main .pcard').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        if (root.dataset.cards !== 'list') return;
        var r = card.getBoundingClientRect();
        var base = r.width * 0.56; /* left: 56% en el CSS */
        var x = e.clientX - r.left - W / 2;
        x = Math.max(0, Math.min(r.width - W, x));
        card.style.setProperty('--mx', Math.round(x - base) + 'px');
      });
    });
  }

  choice = readChoice();
  apply();
  if (mobile.addEventListener) mobile.addEventListener('change', apply);

  document.addEventListener('DOMContentLoaded', function () {
    followCursor();
    if (isPreview()) switcher();
  });
})();
