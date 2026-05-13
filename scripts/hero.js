/* =====================================================
   hero.js — Canvas trail animation + Typewriter
   Adapted from designali hero component (vanilla JS)
   ===================================================== */

// ─── Canvas interactive color trails ─────────────────

(function () {
  var ctx, colorOsc, e = 0, pos = { x: 0, y: 0 }, lines = [];
  var E = { friction: 0.5, trails: 80, size: 50, dampening: 0.025, tension: 0.99 };

  function Oscillator(opts) {
    this.phase = opts.phase || 0;
    this.offset = opts.offset || 0;
    this.frequency = opts.frequency || 0.001;
    this.amplitude = opts.amplitude || 1;
  }
  Oscillator.prototype.update = function () {
    this.phase += this.frequency;
    e = this.offset + Math.sin(this.phase) * this.amplitude;
    return e;
  };

  function Node() { this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; }

  function Line(spring) {
    this.spring = spring + 0.1 * Math.random() - 0.05;
    this.friction = E.friction + 0.01 * Math.random() - 0.005;
    this.nodes = [];
    for (var i = 0; i < E.size; i++) {
      var n = new Node();
      n.x = pos.x; n.y = pos.y;
      this.nodes.push(n);
    }
  }
  Line.prototype.update = function () {
    var sp = this.spring, t = this.nodes[0];
    t.vx += (pos.x - t.x) * sp;
    t.vy += (pos.y - t.y) * sp;
    for (var n, i = 0, a = this.nodes.length; i < a; i++) {
      t = this.nodes[i];
      if (i > 0) {
        n = this.nodes[i - 1];
        t.vx += (n.x - t.x) * sp;
        t.vy += (n.y - t.y) * sp;
        t.vx += n.vx * E.dampening;
        t.vy += n.vy * E.dampening;
      }
      t.vx *= this.friction;
      t.vy *= this.friction;
      t.x += t.vx;
      t.y += t.vy;
      sp *= E.tension;
    }
  };
  Line.prototype.draw = function () {
    var n, t, x = this.nodes[0].x, y = this.nodes[0].y;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (var i = 1, a = this.nodes.length - 2; i < a; i++) {
      n = this.nodes[i]; t = this.nodes[i + 1];
      x = 0.5 * (n.x + t.x); y = 0.5 * (n.y + t.y);
      ctx.quadraticCurveTo(n.x, n.y, x, y);
    }
    n = this.nodes[i]; t = this.nodes[i + 1];
    ctx.quadraticCurveTo(n.x, n.y, t.x, t.y);
    ctx.stroke();
    ctx.closePath();
  };

  function initLines() {
    lines = [];
    for (var i = 0; i < E.trails; i++) {
      lines.push(new Line(0.45 + (i / E.trails) * 0.025));
    }
  }

  function onMove(ev) {
    if (ev.touches) {
      pos.x = ev.touches[0].pageX;
      pos.y = ev.touches[0].pageY;
    } else {
      pos.x = ev.clientX;
      pos.y = ev.clientY;
    }
    ev.preventDefault();
  }

  function onTouchStart(ev) {
    if (ev.touches.length === 1) {
      pos.x = ev.touches[0].pageX;
      pos.y = ev.touches[0].pageY;
    }
  }

  function onFirstMove(ev) {
    document.removeEventListener('mousemove', onFirstMove);
    document.removeEventListener('touchstart', onFirstMove);
    document.addEventListener('mousemove', onMove, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchstart', onTouchStart);
    onMove(ev);
    initLines();
    render();
  }

  function render() {
    if (!ctx || !ctx.running) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'hsla(' + Math.round(colorOsc.update()) + ',100%,50%,0.025)';
    ctx.lineWidth = 10;
    for (var i = 0; i < E.trails; i++) {
      lines[i].update();
      lines[i].draw();
    }
    ctx.frame++;
    window.requestAnimationFrame(render);
  }

  function resizeCanvas() {
    if (!ctx) return;
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
  }

  function initCanvas() {
    var canvas = document.getElementById('canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    ctx.running = true;
    ctx.frame = 1;
    colorOsc = new Oscillator({
      phase: Math.random() * 2 * Math.PI,
      amplitude: 85,
      frequency: 0.0015,
      offset: 285,
    });
    document.addEventListener('mousemove', onFirstMove);
    document.addEventListener('touchstart', onFirstMove);
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('focus', function () {
      if (!ctx.running) { ctx.running = true; render(); }
    });
    window.addEventListener('blur', function () { ctx.running = true; });
    resizeCanvas();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvas);
  } else {
    initCanvas();
  }
})();

// ─── Typewriter effect ────────────────────────────────

(function () {
  var strings = [
    'UX Research',
    'UX Design',
    'Service Design',
    'Product Design',
    'UI Design',
    'Branding',
  ];

  function init() {
    var el = document.getElementById('typewriter');
    if (!el) return;

    var cursor = document.createElement('span');
    cursor.className = 'hero-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    el.insertAdjacentElement('afterend', cursor);

    var idx = 0, charIdx = 0, deleting = false;
    var TYPE_SPEED = 80, BACK_SPEED = 40, PAUSE = 1500;

    function tick() {
      var word = strings[idx % strings.length];
      if (deleting) {
        el.textContent = word.substring(0, charIdx - 1);
        charIdx--;
        if (charIdx === 0) {
          deleting = false;
          idx++;
          setTimeout(tick, 250);
          return;
        }
        setTimeout(tick, BACK_SPEED);
      } else {
        el.textContent = word.substring(0, charIdx + 1);
        charIdx++;
        if (charIdx === word.length) {
          deleting = true;
          setTimeout(tick, PAUSE);
          return;
        }
        setTimeout(tick, TYPE_SPEED);
      }
    }

    setTimeout(tick, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
