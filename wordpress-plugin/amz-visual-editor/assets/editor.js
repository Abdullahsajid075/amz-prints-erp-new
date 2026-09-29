(function () {
  'use strict';

  var cfg = window.amzVisualEditor || {};
  var changes = { global: [], page: [] };
  var dirty = false;
  var hot = null;
  var pop = null;
  var TEXT = 'h1,h2,h3,h4,h5,h6,p,a,button,figcaption,li,span,strong,em,label,td,th,blockquote';

  document.body.classList.add('amz-ve-on');

  var bar = document.createElement('div');
  bar.className = 'amz-ve-bar amz-ve-ui';
  bar.innerHTML = '<strong>Edit site</strong><p>Click text or a photo. Header and footer changes show on every page.</p><span class="amz-ve-status" data-ve-status></span><button type="button" class="amz-ve-save" data-ve-save>Save</button><button type="button" class="amz-ve-exit" data-ve-exit>Exit</button>';
  document.body.appendChild(bar);

  function status(text) {
    var el = bar.querySelector('[data-ve-status]');
    if (el) el.textContent = text || '';
  }

  function inEditor(node) {
    return !!(node && node.closest && node.closest('.amz-ve-ui, #wpadminbar, .nav-toggle, [contenteditable="true"]'));
  }

  function scopeOf(el) {
    return el.closest('header, footer, .site-header, .site-footer, .amz-dock, .float-stack') ? 'global' : 'page';
  }

  function cssPath(el) {
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement.parentNode) {
      var parent = node.parentNode;
      if (!parent || (parent.nodeType !== 1 && node !== document.documentElement)) break;
      var tag = node.tagName.toLowerCase();
      var same = 0;
      var index = 0;
      var kids = parent.children || [];
      for (var i = 0; i < kids.length; i++) {
        if (kids[i].tagName === node.tagName) {
          same += 1;
          if (kids[i] === node) index = same;
        }
      }
      parts.unshift(tag + ':nth-of-type(' + (index || 1) + ')');
      if (node === document.documentElement) break;
      node = parent;
    }
    return parts.join(' > ');
  }

  function canEditText(el) {
    if (!el || inEditor(el) || el.closest('.cv-portal')) return false;
    if (el.hasAttribute && el.hasAttribute('data-cart-count')) return false;
    if (el.closest('svg, script, style, textarea, input, select')) return false;
    var kids = el.children || [];
    for (var i = 0; i < kids.length; i++) {
      var tag = kids[i].tagName;
      if (['SVG', 'IMG', 'UL', 'OL', 'DIV', 'SECTION', 'NAV', 'FORM', 'PICTURE', 'VIDEO', 'IFRAME', 'HEADER', 'FOOTER', 'ARTICLE', 'TABLE'].indexOf(tag) !== -1) {
        return false;
      }
    }
    var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return text.length > 0 && text.length < 1500;
  }

  function clearHot() {
    if (hot) hot.classList.remove('amz-ve-hot');
    hot = null;
  }

  document.addEventListener('mouseover', function (e) {
    var img = e.target.closest ? e.target.closest('img') : null;
    var el = img || (e.target.closest ? e.target.closest(TEXT) : null);
    var ok = img ? (img && !inEditor(img) && !img.closest('.cv-portal')) : canEditText(el);
    clearHot();
    if (ok && el) {
      hot = el;
      el.classList.add('amz-ve-hot');
    }
  }, true);

  function closePop() {
    if (pop && pop.parentNode) pop.parentNode.removeChild(pop);
    pop = null;
  }

  function placePop(anchor) {
    var rect = anchor.getBoundingClientRect();
    var top = Math.min(window.innerHeight - pop.offsetHeight - 16, rect.bottom + 8);
    var left = Math.min(window.innerWidth - pop.offsetWidth - 12, Math.max(12, rect.left));
    if (top < 12) top = 12;
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
  }

  function remember(el, item) {
    item.path = cssPath(el);
    item.scope = scopeOf(el);
    var bucket = item.scope === 'global' ? changes.global : changes.page;
    var replaced = false;
    bucket.forEach(function (row, index) {
      if (row.path === item.path) {
        bucket[index] = item;
        replaced = true;
      }
    });
    if (!replaced) bucket.push(item);
    dirty = true;
    status('Not saved yet');
  }

  function openText(el) {
    closePop();
    pop = document.createElement('div');
    pop.className = 'amz-ve-pop amz-ve-ui';
    var isLink = el.tagName === 'A';
    pop.innerHTML = '<h3>' + (isLink ? 'Edit link' : 'Edit text') + '</h3>' +
      '<label>Text<textarea data-ve-text></textarea></label>' +
      (isLink ? '<label>Link address<input type="text" data-ve-href></label>' : '') +
      '<div class="amz-ve-pop__actions"><button type="button" class="amz-ve-cancel" data-ve-cancel>Cancel</button><button type="button" class="amz-ve-apply" data-ve-apply>Apply</button></div>';
    document.body.appendChild(pop);
    pop.querySelector('[data-ve-text]').value = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (isLink) pop.querySelector('[data-ve-href]').value = el.getAttribute('href') || '';
    placePop(el);
    pop.querySelector('[data-ve-cancel]').addEventListener('click', closePop);
    pop.querySelector('[data-ve-apply]').addEventListener('click', function () {
      var text = pop.querySelector('[data-ve-text]').value;
      var item = { type: 'text', text: text };
      el.textContent = text;
      if (isLink) {
        var href = pop.querySelector('[data-ve-href]').value.trim();
        if (href) {
          el.setAttribute('href', href);
          item.href = href;
        }
      }
      remember(el, item);
      closePop();
    });
  }

  function openImage(img) {
    if (!window.wp || !wp.media) {
      window.alert('The photo library is not available. Reload this page and try again.');
      return;
    }
    var frame = wp.media({
      title: 'Choose photo',
      button: { text: 'Use this photo' },
      multiple: false,
      library: { type: 'image' }
    });
    frame.on('select', function () {
      var file = frame.state().get('selection').first().toJSON();
      var url = (file.sizes && file.sizes.large && file.sizes.large.url) || file.url;
      if (!url) return;
      img.setAttribute('src', url);
      img.removeAttribute('srcset');
      remember(img, { type: 'image', src: url, alt: file.alt || img.getAttribute('alt') || '' });
      if (file.alt) img.setAttribute('alt', file.alt);
    });
    frame.open();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.amz-ve-ui, #wpadminbar')) return;
    var img = e.target.closest ? e.target.closest('img') : null;
    if (img && !inEditor(img) && !img.closest('.cv-portal')) {
      e.preventDefault();
      e.stopPropagation();
      openImage(img);
      return;
    }
    var el = e.target.closest ? e.target.closest(TEXT) : null;
    if (!canEditText(el)) return;
    e.preventDefault();
    e.stopPropagation();
    openText(el);
  }, true);

  document.addEventListener('submit', function (e) {
    e.preventDefault();
  }, true);

  function save() {
    status('Saving…');
    var body = new FormData();
    body.append('action', 'amz_ve_save');
    body.append('nonce', cfg.nonce || '');
    body.append('changes', JSON.stringify({
      path: cfg.path || '/',
      global: changes.global,
      page: changes.page
    }));
    return fetch(cfg.ajaxUrl, { method: 'POST', body: body, credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (!res || !res.success) throw new Error((res && res.data && res.data.message) || 'Save failed');
        changes.global = [];
        changes.page = [];
        dirty = false;
        status('Saved');
      })
      .catch(function (err) {
        status(err.message || 'Save failed');
      });
  }

  bar.querySelector('[data-ve-save]').addEventListener('click', save);
  bar.querySelector('[data-ve-exit]').addEventListener('click', function () {
    if (dirty && !window.confirm('Leave without saving these changes?')) return;
    dirty = false;
    window.location.href = cfg.exitUrl || '/';
  });

  window.addEventListener('beforeunload', function (e) {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = '';
  });
})();
