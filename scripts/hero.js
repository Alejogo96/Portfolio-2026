/* =====================================================
   hero.js — Glowy Waves Canvas Animation
   Adapted from GlowyWavesHero React component (vanilla JS)
   ===================================================== */
(function () {
  'use strict';

  function init() {
    var canvas = document.getElementById('waves-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var time = 0;
    var animId;
    var mouse = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var mouseInfluence  = reduced ? 10  : 70;
    var influenceRadius = reduced ? 160 : 320;
    var smoothing       = reduced ? 0.04 : 0.1;

    /* Wave palette — warm tones matching --color-accent #ff5f3a */
    var waves = [
      { offset: 0,              amplitude: 70, frequency: 0.003,  color: 'rgba(255, 95, 58, 1)',     opacity: 0.55 },
      { offset: Math.PI / 2,   amplitude: 90, frequency: 0.0026, color: 'rgba(255, 148, 80, 0.95)', opacity: 0.42 },
      { offset: Math.PI,       amplitude: 60, frequency: 0.0034, color: 'rgba(210, 210, 210, 1)',    opacity: 0.30 },
      { offset: Math.PI * 1.5, amplitude: 80, frequency: 0.0022, color: 'rgba(255, 70, 30, 1)',      opacity: 0.27 },
      { offset: Math.PI * 2,   amplitude: 55, frequency: 0.004,  color: 'rgba(185, 185, 185, 1)',    opacity: 0.20 },
    ];

    function recenter() {
      mouse.x = canvas.width / 2;
      mouse.y = canvas.height / 2;
      target.x = mouse.x;
      target.y = mouse.y;
    }

    function resize() {
      var section = canvas.closest ? canvas.closest('section') : canvas.parentElement;
      canvas.width  = window.innerWidth;
      canvas.height = section
        ? Math.max(section.offsetHeight, window.innerHeight)
        : window.innerHeight;
      recenter();
    }

    function onMouseMove(e) {
      var rect = canvas.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
    }

    function onMouseLeave() { recenter(); }

    function drawWave(wave) {
      ctx.save();
      ctx.beginPath();
      var w = canvas.width, h = canvas.height;
      for (var x = 0; x <= w; x += 4) {
        var dx   = x - mouse.x;
        var dy   = h / 2 - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var infl = Math.max(0, 1 - dist / influenceRadius);
        var me   = infl * mouseInfluence * Math.sin(time * 0.001 + x * 0.01 + wave.offset);
        var y    = h / 2
          + Math.sin(x * wave.frequency + time * 0.002 + wave.offset) * wave.amplitude
          + Math.sin(x * wave.frequency * 0.4 + time * 0.003) * (wave.amplitude * 0.45)
          + me;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineWidth   = 2.5;
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.opacity;
      ctx.shadowBlur  = 35;
      ctx.shadowColor = wave.color;
      ctx.stroke();
      ctx.restore();
    }

    function animate() {
      time += 1;
      mouse.x += (target.x - mouse.x) * smoothing;
      mouse.y += (target.y - mouse.y) * smoothing;

      var grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0a0a0a');
      grad.addColorStop(1, '#141414');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
      for (var i = 0; i < waves.length; i++) drawWave(waves[i]);

      animId = requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize',     resize);
    window.addEventListener('mousemove',  onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
