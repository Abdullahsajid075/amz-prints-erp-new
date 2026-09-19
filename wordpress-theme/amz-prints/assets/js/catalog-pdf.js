/**
 * Portrait A4 PDF export — one page per sheet.
 */
(function () {
  'use strict';

  var btn = document.getElementById('amz-catalog-download');
  var statusEl = document.getElementById('amz-catalog-status');
  var book = document.getElementById('amz-flipbook');
  var exportRoot = document.getElementById('amz-pdf-export');
  var busy = false;
  var fileName = (window.amzCatalogPdf && window.amzCatalogPdf.filename) || 'AMZ-Prints-Company-Profile.pdf';
  var staticPdf = window.amzCatalogPdf && window.amzCatalogPdf.pdfUrl;

  if (staticPdf && btn) {
    btn.addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = staticPdf;
      a.download = fileName;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (statusEl) statusEl.textContent = 'Download started — ' + fileName;
    });
    if (document.body.classList.contains('catalog-download-mode')) {
      window.setTimeout(function () { btn.click(); }, 400);
    }
    return;
  }
  var HARD_TIMEOUT_MS = 180000;

  // Portrait A4 ~150dpi
  var SHEET_W = 794;
  var SHEET_H = 1123;

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

    var pageSource = document.getElementById('amz-page-source') || book;
    var sourcePages = pageSource.querySelectorAll('.page');
    if (!sourcePages.length && book) {
      sourcePages = book.querySelectorAll('.page');
    }
    var sheets = [];

    for (var i = 0; i < sourcePages.length; i += 1) {
      var sheet = document.createElement('div');
      sheet.className = 'pdf-sheet pdf-sheet--portrait';
      sheet.style.width = SHEET_W + 'px';
      sheet.style.height = SHEET_H + 'px';
      var half = document.createElement('div');
      half.className = 'pdf-sheet__page';
      half.appendChild(sourcePages[i].cloneNode(true));
      sheet.appendChild(half);
      exportRoot.appendChild(sheet);
      sheets.push(sheet);
    }
    return sheets;
  }

  function captureSheet(sheet) {
    return html2canvas(sheet, {
      scale: 1.35,
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
      return canvas.toDataURL('image/jpeg', 0.92);
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
    setStatus('Building portrait PDF…');

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
        var pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
        var i = 0;

        function next() {
          if (timedOut) return Promise.resolve(null);
          if (i >= sheets.length) return Promise.resolve(pdf);
          var n = i + 1;
          setStatus('Rendering page ' + n + ' of ' + sheets.length + '…');
          if (btn) btn.textContent = 'PDF ' + n + '/' + sheets.length;
          var sheet = sheets[i];
          i += 1;
          return captureSheet(sheet)
            .then(function (dataUrl) {
              if (timedOut) return null;
              if (n > 1) pdf.addPage();
              pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
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
