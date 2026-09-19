/**
 * Real flip-book via StPageFlip — PDF page images or HTML chapters.
 */
(function () {
  'use strict';

  var bookEl = document.getElementById('amz-flipbook');
  if (!bookEl || !window.St || !St.PageFlip) {
    console.error('StPageFlip missing');
    return;
  }

  var pages = bookEl.querySelectorAll('.page');
  var imageUrls = (window.amzFlipbook && Array.isArray(window.amzFlipbook.images))
    ? window.amzFlipbook.images
    : [];
  if (!pages.length && !imageUrls.length) return;

  var source = document.getElementById('amz-page-source');
  if (!source && pages.length) {
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
  var booted = false;

  function pageSize() {
    var maxW = Math.min(460, Math.floor(window.innerWidth * 0.4));
    if (window.innerWidth < 720) {
      maxW = Math.min(340, Math.floor(window.innerWidth * 0.86));
    }
    var h = Math.round(maxW * 1.414);
    var maxH = Math.floor(window.innerHeight * 0.74);
    if (h > maxH) {
      h = maxH;
      maxW = Math.round(h / 1.414);
    }
    return { width: Math.max(260, maxW), height: Math.max(380, h) };
  }

  function preloadImages(urls, done) {
    if (!urls.length) {
      done();
      return;
    }
    var left = urls.length;
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      done();
    }
    urls.forEach(function (url) {
      var img = new Image();
      img.onload = img.onerror = function () {
        left -= 1;
        if (left <= 0) finish();
      };
      img.src = url;
    });
    window.setTimeout(finish, 12000);
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
      minWidth: 260,
      maxWidth: 520,
      minHeight: 380,
      maxHeight: 900,
      drawShadow: true,
      flippingTime: 850,
      usePortrait: window.innerWidth < 780,
      startPage: 0,
      autoSize: false,
      maxShadowOpacity: 0.4,
      showCover: true,
      mobileScrollSupport: true,
      clickEventForward: true,
      useMouseEvents: true,
      swipeDistance: 30,
      showPageCorners: false,
      disableFlipByClick: false
    });

    if (imageUrls.length) {
      while (bookEl.firstChild) {
        bookEl.removeChild(bookEl.firstChild);
      }
      pageFlip.loadFromImages(imageUrls);
    } else {
      pageFlip.loadFromHTML(bookEl.querySelectorAll('.page'));
    }
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

  function boot() {
    if (booted) {
      init();
      return;
    }
    booted = true;
    if (imageUrls.length) {
      preloadImages(imageUrls, init);
    } else {
      window.setTimeout(init, 120);
    }
  }

  boot();

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
