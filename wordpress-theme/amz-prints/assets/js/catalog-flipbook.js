/**
 * Real flip-book via StPageFlip — hover fold, click to turn, auto-open.
 */
(function () {
  'use strict';

  var bookEl = document.getElementById('amz-flipbook');
  if (!bookEl || !window.St || !St.PageFlip) {
    console.error('StPageFlip missing');
    return;
  }

  var pages = bookEl.querySelectorAll('.page');
  if (!pages.length) return;

  // Preserve pristine HTML for PDF export (StPageFlip wraps/mutates live nodes).
  var source = document.getElementById('amz-page-source');
  if (!source) {
    source = document.createElement('div');
    source.id = 'amz-page-source';
    source.setAttribute('aria-hidden', 'true');
    source.style.cssText = 'position:absolute;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;';
    Array.prototype.forEach.call(pages, function (p) {
      source.appendChild(p.cloneNode(true));
    });
    document.body.appendChild(source);
  }

  var counter = document.getElementById('amz-flip-counter');
  var pageFlip = null;

  function pageSize() {
    var maxW = Math.min(520, Math.floor(window.innerWidth * 0.42));
    if (window.innerWidth < 720) {
      maxW = Math.min(360, Math.floor(window.innerWidth * 0.88));
    }
    var h = Math.round(maxW * 1.414); // A4 portrait ratio
    var maxH = Math.floor(window.innerHeight * 0.72);
    if (h > maxH) {
      h = maxH;
      maxW = Math.round(h / 1.414);
    }
    return { width: maxW, height: h };
  }

  function init() {
    var size = pageSize();
    if (pageFlip) {
      try { pageFlip.destroy(); } catch (e) {}
      pageFlip = null;
    }

    pageFlip = new St.PageFlip(bookEl, {
      width: size.width,
      height: size.height,
      size: 'fixed',
      minWidth: 280,
      maxWidth: 600,
      minHeight: 400,
      maxHeight: 850,
      drawShadow: true,
      flippingTime: 900,
      usePortrait: window.innerWidth < 720,
      startPage: 0,
      autoSize: false,
      maxShadowOpacity: 0.45,
      showCover: true,
      mobileScrollSupport: true,
      clickEventForward: true,
      useMouseEvents: true,
      swipeDistance: 30,
      showPageCorners: true,
      disableFlipByClick: false
    });

    pageFlip.loadFromHTML(bookEl.querySelectorAll('.page'));
    window.amzPageFlip = pageFlip;

    function syncCounter() {
      if (!counter || !pageFlip) return;
      var cur = pageFlip.getCurrentPageIndex() + 1;
      var total = pageFlip.getPageCount();
      counter.textContent = cur + ' / ' + total;
    }

    pageFlip.on('flip', syncCounter);
    pageFlip.on('changeState', syncCounter);
    syncCounter();

    document.body.classList.add('flipbook-ready', 'flipbook-open');
  }

  // Wait fonts/images briefly so first paint is clean
  window.setTimeout(init, 120);

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 250);
  });

  document.addEventListener('keydown', function (e) {
    if (!pageFlip) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      pageFlip.flipNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      pageFlip.flipPrev();
    }
  });
})();
