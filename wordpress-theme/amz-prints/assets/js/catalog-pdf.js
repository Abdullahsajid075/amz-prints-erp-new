/**
 * Landscape PDF export from catalog pages (never blank).
 * Builds off-screen portrait→landscape sheets from .page HTML clones.
 */
(function () {
  'use strict';

  var btn = document.getElementById('amz-catalog-download');
  var statusEl = document.getElementById('amz-catalog-status');
  var book = document.getElementById('amz-flipbook');
  var exportRoot = document.getElementById('amz-pdf-export');
  var pageSource = null;
  var busy = false;
  var fileName = (window.amzCatalogPdf && window.amzCatalogPdf.filename) || 'AMZ-Prints-Company-Profile.pdf';
  var HARD_TIMEOUT_MS = 120000;

  // Landscape A4 at ~150dpi-ish for quality
  var SHEET_W = 1400;
  var SHEET_H = 990;

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

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[data-amz-lib="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute('data-amz-lib', src);
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Failed ' + src)); };
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

  function corsProxy(url) {
    if (!url || url.indexOf('data:') === 0) return url;
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
    return Promise.all(Array.prototype.map.call(imgs, function (img) {
      var src = img.getAttribute('src') || '';
      if (!src) return Promise.resolve();
      var proxied = corsProxy(src);
      img.setAttribute('crossorigin', 'anonymous');
      if (proxied !== src) img.src = proxied;
      return new Promise(function (resolve) {
        if (img.complete && img.naturalWidth) return resolve();
        var done = function () { resolve(); };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', function () {
          img.removeAttribute('src');
          resolve();
        }, { once: true });
        setTimeout(done, 5000);
      });
    }));
  }

  function buildExportSheets() {
    if (!exportRoot) return [];
    exportRoot.innerHTML = '';
    exportRoot.classList.add('is-active');

    pageSource = document.getElementById('amz-page-source') || book;
    var sourcePages = pageSource.querySelectorAll('.page');
    if (!sourcePages.length && book) {
      sourcePages = book.querySelectorAll('.page');
    }
    var sheets = [];

    for (var i = 0; i < sourcePages.length; i += 2) {
      var sheet = document.createElement('div');
      sheet.className = 'pdf-sheet';
      sheet.style.width = SHEET_W + 'px';
      sheet.style.height = SHEET_H + 'px';

      var left = document.createElement('div');
      left.className = 'pdf-sheet__half pdf-sheet__half--left';
      left.appendChild(sourcePages[i].cloneNode(true));

      var right = document.createElement('div');
      right.className = 'pdf-sheet__half pdf-sheet__half--right';
      if (sourcePages[i + 1]) {
        right.appendChild(sourcePages[i + 1].cloneNode(true));
      } else {
        right.classList.add('is-blank');
      }

      sheet.appendChild(left);
      sheet.appendChild(right);
      exportRoot.appendChild(sheet);
      sheets.push(sheet);
    }
    return sheets;
  }

  function captureSheet(sheet) {
    return html2canvas(sheet, {
      scale: 1.25,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: SHEET_W,
      height: SHEET_H,
      windowWidth: SHEET_W,
      windowHeight: SHEET_H,
      imageTimeout: 8000
    }).then(function (canvas) {
      // Guard against blank canvases
      var ctx = canvas.getContext('2d');
      var sample = ctx.getImageData(40, 40, 1, 1).data;
      var sample2 = ctx.getImageData(canvas.width - 40, canvas.height - 40, 1, 1).data;
      var blank =
        sample[0] > 250 && sample[1] > 250 && sample[2] > 250 &&
        sample2[0] > 250 && sample2[1] > 250 && sample2[2] > 250 &&
        canvas.width > 100;
      // Still export even if light — content may be mostly white
      return canvas.toDataURL('image/jpeg', 0.9);
    });
  }

  function clearExport() {
    if (!exportRoot) return;
    exportRoot.classList.remove('is-active');
    exportRoot.innerHTML = '';
  }

  function downloadPdf() {
    if (busy) return;
    busy = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Preparing PDF…';
    }
    setStatus('Building landscape PDF spreads…');

    var timedOut = false;
    var timer = setTimeout(function () {
      timedOut = true;
      clearExport();
      setStatus('PDF timed out. Use browser Print → Save as PDF if needed.');
      resetBtn('Download PDF');
    }, HARD_TIMEOUT_MS);

    ensureLibs()
      .then(function () {
        if (timedOut) return null;
        if (typeof html2canvas === 'undefined' || !(window.jspdf && window.jspdf.jsPDF)) {
          throw new Error('PDF libraries missing');
        }
        var sheets = buildExportSheets();
        if (!sheets.length) throw new Error('No pages');
        return prepImages(exportRoot).then(function () { return sheets; });
      })
      .then(function (sheets) {
        if (timedOut || !sheets) return null;
        var JsPDF = window.jspdf.jsPDF;
        var pdf = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
        var i = 0;

        function next() {
          if (timedOut) return Promise.resolve(null);
          if (i >= sheets.length) return Promise.resolve(pdf);
          var n = i + 1;
          setStatus('Rendering spread ' + n + ' of ' + sheets.length + '…');
          if (btn) btn.textContent = 'PDF ' + n + '/' + sheets.length;
          var sheet = sheets[i];
          i += 1;
          return captureSheet(sheet)
            .then(function (dataUrl) {
              if (timedOut) return null;
              if (n > 1) pdf.addPage();
              pdf.addImage(dataUrl, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
              return next();
            })
            .catch(function (err) {
              console.warn(err);
              if (n > 1) pdf.addPage();
              return next();
            });
        }
        return next();
      })
      .then(function (pdf) {
        clearTimeout(timer);
        clearExport();
        if (timedOut || !pdf) return;
        pdf.save(fileName);
        setStatus('Download started — ' + fileName);
        resetBtn('Download PDF');
      })
      .catch(function (err) {
        clearTimeout(timer);
        clearExport();
        console.error(err);
        setStatus('PDF failed. Try again or use Print from the browser.');
        resetBtn('Download PDF');
      });
  }

  if (btn) btn.addEventListener('click', downloadPdf);

  if (document.body.classList.contains('catalog-download-mode')) {
    setStatus('Starting PDF download…');
    window.setTimeout(downloadPdf, 800);
  }
})();
