/**
 * Premium flip-book viewer for company profile catalogs.
 * Left half click = previous page, right half = next page.
 */
(function () {
  'use strict';

  var stage = document.getElementById('amz-flipbook');
  if (!stage) return;

  var pages = Array.prototype.slice.call(stage.querySelectorAll('.catalog-page'));
  if (!pages.length) return;

  var idx = 0;
  var flipping = false;
  var counter = document.getElementById('amz-flip-counter');
  var btnPrev = document.getElementById('amz-flip-prev');
  var btnNext = document.getElementById('amz-flip-next');
  var hitLeft = document.getElementById('amz-flip-hit-left');
  var hitRight = document.getElementById('amz-flip-hit-right');

  function updateUI() {
    pages.forEach(function (p, i) {
      p.classList.toggle('is-active', i === idx);
      p.classList.toggle('is-passed', i < idx);
      p.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
    });
    if (counter) {
      counter.textContent = (idx + 1) + ' / ' + pages.length;
    }
    if (btnPrev) btnPrev.disabled = idx <= 0;
    if (btnNext) btnNext.disabled = idx >= pages.length - 1;
  }

  function go(to, dir) {
    if (flipping) return;
    if (to < 0 || to >= pages.length || to === idx) return;
    flipping = true;
    var current = pages[idx];
    var next = pages[to];
    var outClass = dir < 0 ? 'flip-out-right' : 'flip-out-left';
    var inClass = dir < 0 ? 'flip-in-left' : 'flip-in-right';

    current.classList.add(outClass);
    next.classList.add('is-active', inClass);

    window.setTimeout(function () {
      current.classList.remove('is-active', outClass);
      next.classList.remove(inClass);
      idx = to;
      flipping = false;
      updateUI();
    }, 520);
  }

  function next() { go(idx + 1, 1); }
  function prev() { go(idx - 1, -1); }

  if (hitLeft) hitLeft.addEventListener('click', prev);
  if (hitRight) hitRight.addEventListener('click', next);
  if (btnPrev) btnPrev.addEventListener('click', prev);
  if (btnNext) btnNext.addEventListener('click', next);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      next();
    }
  });

  // Touch swipe
  var touchX = null;
  stage.addEventListener('touchstart', function (e) {
    touchX = e.changedTouches[0].screenX;
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].screenX - touchX;
    touchX = null;
    if (Math.abs(dx) < 40) return;
    if (dx > 0) prev();
    else next();
  }, { passive: true });

  // Open cover animation once
  document.body.classList.add('flipbook-ready');
  window.setTimeout(function () {
    document.body.classList.add('flipbook-open');
  }, 80);

  updateUI();
})();
