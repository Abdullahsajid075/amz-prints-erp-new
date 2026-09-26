/**
 * AMZ Prints portal scripts:
 *  - Hero product parts rotator (every 5s)
 *  - CV portal advertisement rotator (every 10s)
 *  - Free CV builder (wizard, photo upload, live preview, submit to ERP, print/download)
 */
(function () {
  'use strict';

  var cfg = window.amzPrints || {};

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ───────── Hero product parts rotator (5s) ───────── */
  function initHeroParts() {
    document.querySelectorAll('[data-hero-parts]').forEach(function (wrap) {
      var parts = Array.prototype.slice.call(wrap.querySelectorAll('.hero-part'));
      if (parts.length < 2) return;
      var interval = parseInt(wrap.getAttribute('data-hero-parts-interval'), 10) || 5000;
      var i = 0;
      setInterval(function () {
        parts[i].classList.remove('is-active');
        i = (i + 1) % parts.length;
        parts[i].classList.add('is-active');
      }, interval);
    });
  }

  /* ───────── CV advertisement rotator (10s) ───────── */
  function initAdRotator() {
    document.querySelectorAll('[data-cv-ad]').forEach(function (ad) {
      var img = ad.querySelector('[data-cv-ad-img]');
      var images = [];
      try { images = JSON.parse(ad.getAttribute('data-cv-ad-images') || '[]'); } catch (e) { images = []; }
      if (!img || images.length < 2) return;
      var interval = parseInt(ad.getAttribute('data-cv-ad-interval'), 10) || 10000;
      var i = 0;
      setInterval(function () {
        i = (i + 1) % images.length;
        img.classList.add('is-fading');
        setTimeout(function () {
          img.src = images[i];
          img.classList.remove('is-fading');
        }, 250);
      }, interval);
    });
  }

  /* ───────── Free CV builder ───────── */
  function initCvBuilder() {
    var form = document.getElementById('amz-cv-form');
    var portal = document.querySelector('[data-cv-portal]');
    if (!form || !portal) return;

    var photoDataUrl = '';
    var currentStep = 1;
    var completed = false;

    var steps = Array.prototype.slice.call(form.querySelectorAll('.cv-step'));
    var dots = Array.prototype.slice.call(portal.querySelectorAll('[data-step-dot]'));
    var preview = form.querySelector('[data-cv-preview]');
    var msgBox = form.querySelector('[data-cv-msg]');
    var doneBox = form.querySelector('[data-cv-done]');

    function showStep(n) {
      currentStep = n;
      steps.forEach(function (s) { s.classList.toggle('is-active', parseInt(s.getAttribute('data-step'), 10) === n); });
      dots.forEach(function (d) {
        var dn = parseInt(d.getAttribute('data-step-dot'), 10);
        d.classList.toggle('is-active', dn === n);
        d.classList.toggle('is-done', dn < n);
      });
      if (n === 3) renderPreview();
      var top = portal.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }

    function validateStep1() {
      var name = form.querySelector('[name="fullName"]');
      if (name && !name.value.trim()) {
        name.focus();
        name.reportValidity && name.reportValidity();
        return false;
      }
      return true;
    }

    form.querySelectorAll('[data-cv-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (currentStep === 1 && !validateStep1()) return;
        showStep(Math.min(3, currentStep + 1));
      });
    });
    form.querySelectorAll('[data-cv-prev]').forEach(function (btn) {
      btn.addEventListener('click', function () { showStep(Math.max(1, currentStep - 1)); });
    });
    dots.forEach(function (d) {
      d.addEventListener('click', function () {
        var dn = parseInt(d.getAttribute('data-step-dot'), 10);
        if (dn < currentStep || (currentStep === 1 ? validateStep1() : true)) showStep(dn);
      });
    });

    /* Photo upload */
    var photoInput = form.querySelector('[data-cv-photo]');
    var photoImg = form.querySelector('[data-cv-photo-img]');
    var photoEmpty = form.querySelector('[data-cv-photo-empty]');
    var photoRemove = form.querySelector('[data-cv-photo-remove]');
    if (photoInput) {
      photoInput.addEventListener('change', function () {
        var file = photoInput.files && photoInput.files[0];
        if (!file) return;
        if (file.size > 3.5 * 1024 * 1024) {
          alert('Image is too large. Please choose an image under 3MB.');
          photoInput.value = '';
          return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
          photoDataUrl = String(e.target.result || '');
          if (photoImg) { photoImg.src = photoDataUrl; photoImg.hidden = false; }
          if (photoEmpty) photoEmpty.hidden = true;
          if (photoRemove) photoRemove.hidden = false;
          if (currentStep === 3) renderPreview();
        };
        reader.readAsDataURL(file);
      });
    }
    if (photoRemove) {
      photoRemove.addEventListener('click', function () {
        photoDataUrl = '';
        if (photoInput) photoInput.value = '';
        if (photoImg) { photoImg.hidden = true; photoImg.src = ''; }
        if (photoEmpty) photoEmpty.hidden = false;
        photoRemove.hidden = true;
        if (currentStep === 3) renderPreview();
      });
    }

    /* Repeatable rows (experience / education) */
    form.querySelectorAll('[data-cv-add]').forEach(function (addBtn) {
      var key = addBtn.getAttribute('data-cv-add');
      var container = form.querySelector('[data-cv-repeat="' + key + '"]');
      var tpl = container ? container.querySelector('[data-cv-template]') : null;
      function addRow() {
        if (!tpl) return;
        var node = tpl.content ? tpl.content.cloneNode(true) : null;
        if (!node) return;
        var item = node.querySelector('.cv-repeat__item');
        container.appendChild(node);
        var removeBtn = item.querySelector('[data-cv-remove]');
        if (removeBtn) removeBtn.addEventListener('click', function () { item.remove(); });
        item.querySelectorAll('input').forEach(function (inp) {
          inp.addEventListener('input', function () { if (currentStep === 3) renderPreview(); });
        });
      }
      addBtn.addEventListener('click', addRow);
      // start with one empty row for convenience
      addRow();
    });

    /* Template + color pickers */
    form.querySelectorAll('[data-cv-templates] .cv-tpl').forEach(function (btn) {
      btn.addEventListener('click', function () {
        form.querySelectorAll('[data-cv-templates] .cv-tpl').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        if (preview) preview.setAttribute('data-template', btn.getAttribute('data-template'));
        renderPreview();
      });
    });
    form.querySelectorAll('[data-cv-colors] .cv-swatch').forEach(function (btn) {
      btn.addEventListener('click', function () {
        form.querySelectorAll('[data-cv-colors] .cv-swatch').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        if (preview) preview.style.setProperty('--cv-accent', btn.getAttribute('data-color'));
        renderPreview();
      });
    });

    // Live preview on any field change.
    form.addEventListener('input', function (e) {
      if (currentStep === 3 && e.target && e.target.name) renderPreview();
    });

    function val(name) {
      var el = form.querySelector('[name="' + name + '"]');
      return el ? el.value.trim() : '';
    }
    function list(name) {
      return val(name).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    }
    function collectRepeat(key, fields) {
      var container = form.querySelector('[data-cv-repeat="' + key + '"]');
      if (!container) return [];
      var out = [];
      container.querySelectorAll('.cv-repeat__item').forEach(function (item) {
        var row = {};
        var has = false;
        fields.forEach(function (f) {
          var inp = item.querySelector('[data-field="' + f + '"]');
          row[f] = inp ? inp.value.trim() : '';
          if (row[f]) has = true;
        });
        if (has) out.push(row);
      });
      return out;
    }

    function collectCv() {
      var activeTpl = form.querySelector('[data-cv-templates] .cv-tpl.is-active');
      var activeColor = form.querySelector('[data-cv-colors] .cv-swatch.is-active');
      return {
        fullName: val('fullName'),
        headline: val('headline'),
        email: val('email'),
        phone: val('phone'),
        city: val('city'),
        summary: val('summary'),
        photo: photoDataUrl,
        template: activeTpl ? activeTpl.getAttribute('data-template') : 'classic',
        accentColor: activeColor ? activeColor.getAttribute('data-color') : '#F26522',
        experience: collectRepeat('experience', ['role', 'company', 'period', 'details']),
        education: collectRepeat('education', ['degree', 'school', 'year']),
        skills: list('skills'),
        languages: list('languages')
      };
    }

    function renderInner(cv) {
      var photo = cv.photo ? '<img class="cvp-photo" src="' + cv.photo + '" alt="photo">' : '';
      var contact = [cv.email, cv.phone, cv.city].filter(Boolean).map(function (v) { return '<span>' + escapeHtml(v) + '</span>'; }).join('');
      var exp = cv.experience.map(function (e) {
        return '<div class="cvp-item"><div class="cvp-item__head"><strong>' + escapeHtml(e.role) + '</strong><span>' + escapeHtml(e.period) + '</span></div>' +
          '<div class="cvp-item__sub">' + escapeHtml(e.company) + '</div>' + (e.details ? '<p>' + escapeHtml(e.details) + '</p>' : '') + '</div>';
      }).join('');
      var edu = cv.education.map(function (e) {
        return '<div class="cvp-item"><div class="cvp-item__head"><strong>' + escapeHtml(e.degree) + '</strong><span>' + escapeHtml(e.year) + '</span></div>' +
          '<div class="cvp-item__sub">' + escapeHtml(e.school) + '</div></div>';
      }).join('');
      var skills = cv.skills.length ? '<div class="cvp-tags">' + cv.skills.map(function (s) { return '<span>' + escapeHtml(s) + '</span>'; }).join('') + '</div>' : '';
      var langs = cv.languages.length ? '<div class="cvp-tags">' + cv.languages.map(function (s) { return '<span>' + escapeHtml(s) + '</span>'; }).join('') + '</div>' : '';
      var sec = function (t, inner) { return inner ? '<section class="cvp-sec"><h2>' + escapeHtml(t) + '</h2>' + inner + '</section>' : ''; };
      return '<div class="cvp-head">' + photo + '<div>' +
        '<h1>' + escapeHtml(cv.fullName || 'Your Name') + '</h1>' +
        '<div class="cvp-role">' + escapeHtml(cv.headline || 'Your professional title') + '</div>' +
        '<div class="cvp-contact">' + contact + '</div></div></div>' +
        (cv.summary ? '<section class="cvp-sec"><h2>Profile</h2><p>' + escapeHtml(cv.summary) + '</p></section>' : '') +
        sec('Experience', exp) + sec('Education', edu) + sec('Skills', skills) + sec('Languages', langs);
    }

    function renderPreview() {
      if (!preview) return;
      var cv = collectCv();
      preview.style.setProperty('--cv-accent', cv.accentColor);
      preview.setAttribute('data-template', cv.template);
      preview.innerHTML = renderInner(cv);
    }

    function buildPrintDoc(cv) {
      var accent = cv.accentColor || '#F26522';
      var inner = renderInner(cv);
      return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + escapeHtml(cv.fullName || 'CV') + '</title><style>' +
        '*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;margin:0;background:#fff}' +
        '.cvdoc{max-width:800px;margin:0 auto;padding:40px}' +
        '.cvp-head{display:flex;gap:20px;align-items:center;border-bottom:4px solid ' + accent + ';padding-bottom:16px;margin-bottom:8px}' +
        '.cvp-photo{width:96px;height:96px;border-radius:12px;object-fit:cover;border:3px solid ' + accent + '}' +
        '.cvp-head h1{margin:0;font-size:28px}.cvp-role{color:' + accent + ';font-weight:700;margin:4px 0}' +
        '.cvp-contact{display:flex;flex-wrap:wrap;gap:14px;color:#555;font-size:13px;margin-top:6px}' +
        '.cvp-sec{margin-top:20px}.cvp-sec h2{font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:' + accent + ';border-bottom:1px solid #eee;padding-bottom:6px;margin:0 0 10px}' +
        '.cvp-item{margin-bottom:12px}.cvp-item__head{display:flex;justify-content:space-between;gap:10px}.cvp-item__head span{color:#777;font-size:13px}' +
        '.cvp-item__sub{color:#555;font-size:14px}.cvp-item p{margin:4px 0 0;font-size:14px;color:#333}' +
        '.cvp-tags{display:flex;flex-wrap:wrap;gap:8px}.cvp-tags span{background:' + accent + '1a;color:' + accent + ';padding:5px 12px;border-radius:999px;font-size:13px;font-weight:600}' +
        '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.cvdoc{padding:20px}}' +
        '</style></head><body><div class="cvdoc">' + inner + '</div></body></html>';
    }

    function downloadPdf() {
      var cv = collectCv();
      var w = window.open('', '_blank');
      if (!w) { alert('Please allow popups to download/print your CV.'); return; }
      w.document.write(buildPrintDoc(cv));
      w.document.close();
      w.focus();
      setTimeout(function () { w.print(); }, 400);
    }

    var downloadBtn = form.querySelector('[data-cv-download]');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadPdf);

    /* Submit → ERP */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var cv = collectCv();
      if (!cv.fullName) { showStep(1); return; }
      var submitBtn = form.querySelector('[data-cv-submit]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving…'; }
      if (msgBox) { msgBox.hidden = true; msgBox.className = 'cv-submit-msg'; }

      var body = new FormData();
      body.append('action', 'amz_prints_submit_cv');
      body.append('nonce', cfg.cvNonce || '');
      body.append('cv', JSON.stringify(cv));

      fetch(cfg.ajaxUrl, { method: 'POST', credentials: 'same-origin', body: body })
        .then(function (r) { return r.json().catch(function () { return { success: false, data: { message: 'Unexpected server response.' } }; }); })
        .then(function (res) {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Mark as completed'; }
          if (res && res.success) {
            completed = true;
            var cvId = (res.data && res.data.cvId) ? res.data.cvId : '';
            if (msgBox) {
              msgBox.hidden = false;
              msgBox.className = 'cv-submit-msg cv-submit-msg--ok';
              msgBox.textContent = 'CV saved' + (cvId ? ' (' + cvId + ')' : '') + '. Saved to AMZ Prints. You can download it now.';
            }
            if (doneBox) doneBox.hidden = false;
          } else {
            if (msgBox) {
              msgBox.hidden = false;
              msgBox.className = 'cv-submit-msg cv-submit-msg--err';
              msgBox.textContent = (res && res.data && res.data.message) ? res.data.message : 'Could not save your CV. Please try again.';
            }
          }
        })
        .catch(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Mark as completed'; }
          if (msgBox) {
            msgBox.hidden = false;
            msgBox.className = 'cv-submit-msg cv-submit-msg--err';
            msgBox.textContent = 'Network error. Please try again.';
          }
        });
    });

    renderPreview();
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    initHeroParts();
    initAdRotator();
    initCvBuilder();
  });
})();
