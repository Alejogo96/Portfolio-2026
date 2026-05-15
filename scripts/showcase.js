/* =====================================================
   showcase.js — Project list with lerp image preview
   ===================================================== */
(function () {
  const showcase = document.getElementById('ps-showcase');
  if (!showcase) return;

  const preview  = document.getElementById('ps-preview');
  const rows     = showcase.querySelectorAll('.ps-row');
  const imgs     = preview.querySelectorAll('.ps-preview__img');

  let targetX = 0, targetY = 0;
  let smoothX = 0, smoothY = 0;
  let rafId   = null;
  let active  = false;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    smoothX = lerp(smoothX, targetX, 0.14);
    smoothY = lerp(smoothY, targetY, 0.14);
    preview.style.left = (smoothX + 24) + 'px';
    preview.style.top  = (smoothY - 110) + 'px';
    rafId = requestAnimationFrame(tick);
  }

  document.addEventListener('mousemove', function (e) {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  rows.forEach(function (row) {
    var idx = parseInt(row.dataset.psIndex, 10);

    row.addEventListener('mouseenter', function () {
      active = true;
      preview.classList.add('is-visible');

      imgs.forEach(function (img, i) {
        img.classList.toggle('is-active', i === idx);
      });

      if (!rafId) rafId = requestAnimationFrame(tick);
    });

    row.addEventListener('mouseleave', function () {
      active = false;
      preview.classList.remove('is-visible');
    });
  });

  /* Stop rAF when mouse leaves the entire showcase */
  showcase.addEventListener('mouseleave', function () {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });

  showcase.addEventListener('mouseenter', function () {
    if (!rafId) rafId = requestAnimationFrame(tick);
  });
})();
