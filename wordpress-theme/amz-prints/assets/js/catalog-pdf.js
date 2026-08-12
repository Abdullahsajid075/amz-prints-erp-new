/**
 * Reliable landscape A4 catalog PDF — page-by-page (no hang).
 */
(function () {
  'use strict';

  var btn = document.getElementById('amz-catalog-download');
  var statusEl = document.getElementById('amz-catalog-status');
  var book = document.getElementById('amz-catalog-book');
  var busy = false;
  var fileName = (window.amzCatalogPdf && window.amzCatalogPdf.filename) || 'AMZ-Prints-Company-Profile.pdf';
  var HARD_TIMEOUT_MS = 90000;

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function resetBtn(label) {
    busy = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = label || 'Download PDF';
    }
  }

  function corsProxy(url) {
    if (!url || url.indexOf('data:') === 0 || url.indexOf('blob:') === 0) return url;
    try {
      var u = new URL(url, window.location.href);
      if (u.origin === window.location.origin) return url;
      return 'https://wsrv.nl/?url=' + encodeURIComponent(u.href) + '&output=jpg';
    } catch (e) {
      return url;
    }
  }

  function prepImages(root) {
    var imgs = root.querySelectorAll('img');
    var jobs = [];
    imgs.forEach(function (img) {
      var src = img.getAttribute('src') || '';
      if (!src) return;
      var proxied = corsProxy(src);
      if (proxied !== src) {
        img.setAttribute('crossorigin', 'anonymous');
        img.src = proxied;
      } else {
        img.setAttribute('crossorigin', 'anonymous');
      }
      jobs.push(
        new Promise(function (resolve) {
          if (img.complete && img.naturalWidth) return resolve();
          var done = function () { resolve(); };
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', function () {
            img.style.visibility = 'hidden';
            resolve();
          }, { once: true });
          setTimeout(done, 6000);
        })
      );
    });
    return Promise.all(jobs);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }

  function ensureLibs() {
    var tasks = [];
    if (typeof html2canvas === 'undefined') {
      tasks.push(loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'));
    }
    if (!(window.jspdf && window.jspdf.jsPDF)) {
      tasks.push(loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'));
    }
    return Promise.all(tasks);
  }

  function capturePage(pageEl) {
    pageEl.classList.add('is-capturing');
    return html2canvas(pageEl, {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 8000,
      removeContainer: true,
      foreignObjectRendering: false
    }).then(function (canvas) {
      return canvas.toDataURL('image/jpeg', 0.86);
    }).finally(function () {
      pageEl.classList.remove('is-capturing');
    });
  }

  function downloadPdf() {
    if (busy || !book) return;
    busy = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Preparing PDF…';
    }
    setStatus('Loading PDF tools…');
    document.body.classList.add('catalog-pdf-capture');

    var timedOut = false;
    var timer = setTimeout(function () {
      timedOut = true;
      document.body.classList.remove('catalog-pdf-capture');
      setStatus('PDF is taking too long. Opening print dialog — choose Save as PDF (A4 Landscape).');
      resetBtn('Download PDF');
      try { window.print(); } catch (e) {}
    }, HARD_TIMEOUT_MS);

    ensureLibs()
      .then(function () {
        if (timedOut) return null;
        if (typeof html2canvas === 'undefined' || !(window.jspdf && window.jspdf.jsPDF)) {
          throw new Error('PDF libraries missing');
        }
        setStatus('Preparing images…');
        return prepImages(book);
      })
      .then(function () {
        if (timedOut) return null;
        var pages = book.querySelectorAll('.catalog-page');
        if (!pages.length) throw new Error('No catalog pages found');

        var JsPDF = window.jspdf.jsPDF;
        var pdf = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
        var i = 0;

        function next() {
          if (timedOut) return Promise.resolve(null);
          if (i >= pages.length) return Promise.resolve(pdf);
          var n = i + 1;
          setStatus('Building page ' + n + ' of ' + pages.length + '…');
          if (btn) btn.textContent = 'Page ' + n + '/' + pages.length;
          var page = pages[i];
          i += 1;
          return capturePage(page)
            .then(function (dataUrl) {
              if (timedOut) return null;
              if (n > 1) pdf.addPage();
              pdf.addImage(dataUrl, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
              return next();
            })
            .catch(function () {
              if (n > 1) pdf.addPage();
              return next();
            });
        }

        return next();
      })
      .then(function (pdf) {
        clearTimeout(timer);
        document.body.classList.remove('catalog-pdf-capture');
        if (timedOut || !pdf) return;
        setStatus('Saving ' + fileName + '…');
        pdf.save(fileName);
        setStatus('Download started — check your Downloads folder.');
        resetBtn('Download PDF');
      })
      .catch(function (err) {
        clearTimeout(timer);
        document.body.classList.remove('catalog-pdf-capture');
        if (timedOut) return;
        console.error(err);
        setStatus('Auto PDF failed. Opening print dialog — choose Save as PDF, A4 Landscape.');
        resetBtn('Download PDF');
        window.print();
      });
  }

  if (btn) btn.addEventListener('click', downloadPdf);

  var printBtn = document.getElementById('amz-catalog-print');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }

  if (document.body.classList.contains('catalog-download-mode')) {
    setStatus('Starting automatic PDF download…');
    window.setTimeout(downloadPdf, 600);
  }
})();
