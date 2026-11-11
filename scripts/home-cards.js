/* =====================================================
   home-cards.js — Hover de las cards de proyectos (Home)
   Mismo patrón que el fondo de los casos (G1 Grille, scripts/case-bg.js):
   cuadrícula de puntos de 1 px en el color de acento que se desliza con
   el scroll; cerca del cursor los puntos crecen un poco (lupa).
   Solo se dibuja mientras la card está en hover o con foco.
   Reduced motion: trama estática, sin lupa.
   ===================================================== */
(function () {
  'use strict';

  var TONE = { alpha: 0.4, dotZ: 0.6 }; /* = TONE de case-bg.js */
  var GAP = 18;
  var R = 110;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  function accent() {
    return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff5f3a';
  }

  function setup(card) {
    var canvas = document.createElement('canvas');
    canvas.className = 'pcard__grid';
    canvas.setAttribute('aria-hidden', 'true');
    card.prepend(canvas);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, col = accent(), running = false, raf = 0;
    var mouse = { x: -9999, y: -9999 }, lens = { x: -9999, y: -9999 };

    function layout() {
      W = card.clientWidth; H = card.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = col;
      var oy = -((window.scrollY * 0.2) % GAP);
      for (var y = oy + GAP / 2; y < H + GAP; y += GAP) {
        for (var x = GAP / 2; x < W; x += GAP) {
          var dx = x - lens.x, dy = y - lens.y, d = Math.sqrt(dx * dx + dy * dy);
          var k = d < R ? 1 - d / R : 0;
          ctx.globalAlpha = TONE.alpha * (0.7 + k * 0.6);
          ctx.beginPath();
          ctx.arc(x + (k ? (dx / (d + 0.1)) * k * 3 : 0), y + (k ? (dy / (d + 0.1)) * k * 3 : 0),
            0.9 + k * TONE.dotZ * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    function frame() {
      lens.x += (mouse.x - lens.x) * 0.14;
      lens.y += (mouse.y - lens.y) * 0.14;
      draw();
      if (running) raf = requestAnimationFrame(frame);
    }

    function start(e) {
      col = accent();
      layout();
      if (e && e.clientX != null && !reduced) {
        var r = card.getBoundingClientRect();
        lens.x = mouse.x = e.clientX - r.left;
        lens.y = mouse.y = e.clientY - r.top;
      } else {
        lens.x = mouse.x = lens.y = mouse.y = -9999;
      }
      if (reduced) { draw(); return; }
      if (!running) { running = true; raf = requestAnimationFrame(frame); }
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    if (canHover) {
      card.addEventListener('pointerenter', start);
      card.addEventListener('pointerleave', stop);
      card.addEventListener('pointermove', function (e) {
        if (reduced) return;
        var r = card.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = e.clientY - r.top;
      });
    }
    card.addEventListener('focus', function () { start(null); if (!reduced) setTimeout(stop, 600); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('#main a.pcard').forEach(setup);
  });
})();
