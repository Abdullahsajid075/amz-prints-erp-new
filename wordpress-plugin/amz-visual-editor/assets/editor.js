(function () {
  'use strict';

  var cfg = window.amzVisualEditor || {};
  var changes = { global: [], page: [], order: null };
  var hot = null;
  var pop = null;
  var moverBlock = null;
  var chain = Promise.resolve();
  var TEXT = 'h1,h2,h3,h4,h5,h6,p,a,button,figcaption,li,span,strong,em,label,td,th,blockquote';
  var LOCK = '.shop-card, .product-tile, .product-card, .amz-prodrail, .product-modal, [data-product-id], .shop-card__media, .product-tile__media';
  var BANNER = '.stage__photo, .service-pillar__media, .ds-hero__photo, .price-card__media, .amz-banners__slide, .hero__bg-photo, [role="img"]';

  document.body.classList.add('amz-ve-on');

  var bar = document.createElement('div');
  bar.className = 'amz-ve-bar amz-ve-ui';
  bar.innerHTML = '<strong>Edit site</strong><p>Click a paragraph or banner. Product names and product photos stay locked. Up and Down move a section.</p><span class="amz-ve-status" data-ve-status></span><button type="button" class="amz-ve-save" data-ve-save>Save</button><button type="button" class="amz-ve-exit" data-ve-exit>Exit</button>';
  document.body.appendChild(bar);

  var mover = document.createElement('div');
  mover.className = 'amz-ve-mover amz-ve-ui';
  mover.hidden = true;
  mover.innerHTML = '<button type="button" data-ve-up>Up</button><button type="button" data-ve-down>Down</button>';
  document.body.appendChild(mover);

  function status(text) {
    var el = bar.querySelector('[data-ve-status]');
    if (el) el.textContent = text || '';
  }

  function inEditor(node) {
    return !!(node && node.closest && node.closest('.amz-ve-ui, #wpadminbar, .nav-toggle, [contenteditable="true"]'));
  }

  function locked(node) {
    return !!(node && node.closest && node.closest(LOCK));
  }

  function scopeOf(el) {
    return el.closest('header, footer, .site-header, .site-footer, .amz-dock, .float-stack') ? 'global' : 'page';
  }

  function nthPath(el, stop) {
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && node !== stop) {
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

  function cssPath(el) {
    var block = el.closest ? el.closest('[data-amz-block]') : null;
    if (block && block !== el && block.contains(el)) {
      var rel = nthPath(el, block);
      if (rel) return 'block:' + block.getAttribute('data-amz-block') + ' > ' + rel;
    }
    return nthPath(el, null);
  }

  function canEditText(el) {
    if (!el || inEditor(el) || locked(el) || el.closest('.cv-portal')) return false;
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

  function bannerTarget(node) {
    if (!node || !node.closest || locked(node) || inEditor(node)) return null;
    var img = node.closest('img');
    if (img && !locked(img) && !img.closest('.cv-portal')) return img;
    var box = node.closest(BANNER);
    if (box && !locked(box)) return box;
    var styled = node.closest('[style*="background-image"]');
    if (styled && !locked(styled) && /url\(\s*['"]?https?:/i.test(styled.getAttribute('style') || '')) return styled;
    return null;
  }

  function clearHot() {
    if (hot) hot.classList.remove('amz-ve-hot');
    hot = null;
  }

  function placeMover(block) {
    if (!block) {
      mover.hidden = true;
      moverBlock = null;
      return;
    }
    moverBlock = block;
    var rect = block.getBoundingClientRect();
    mover.hidden = false;
    mover.style.top = Math.max(8, rect.top + 8) + 'px';
    mover.style.left = Math.max(8, rect.right - mover.offsetWidth - 8) + 'px';
  }

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest && e.target.closest('.amz-ve-ui')) return;
    var block = e.target.closest ? e.target.closest('[data-amz-block]') : null;
    if (block) placeMover(block);
    var img = bannerTarget(e.target);
    var el = img || (e.target.closest ? e.target.closest(TEXT) : null);
    var ok = img || canEditText(el);
    clearHot();
    if (ok && el && !locked(el)) {
      hot = el;
      el.classList.add('amz-ve-hot');
    }
  }, true);

  window.addEventListener('scroll', function () {
    if (moverBlock) placeMover(moverBlock);
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
    status('Saving…');
    return save();
  }

  function readStyle(el) {
    return {
      align: el.style.textAlign || '',
      font: (el.style.fontFamily || '').replace(/["']/g, '').split(',')[0].trim(),
      size: parseInt(el.style.fontSize, 10) || '',
      weight: el.style.fontWeight === 'bold' ? '700' : (el.style.fontWeight || ''),
      italic: el.style.fontStyle || ''
    };
  }

  function paintStyle(el, style) {
    if (!style) return;
    if (style.align) el.style.textAlign = style.align;
    if (style.font) el.style.fontFamily = "'" + style.font + "',sans-serif";
    if (style.weight) el.style.fontWeight = style.weight;
    if (style.italic) el.style.fontStyle = style.italic;
    if (style.size) el.style.fontSize = style.size + 'px';
  }

  function styleFromPop() {
    var style = {};
    var align = pop.querySelector('[data-ve-align]').value;
    var font = pop.querySelector('[data-ve-font]').value;
    var size = pop.querySelector('[data-ve-size]').value;
    var look = pop.querySelector('[data-ve-look]').value;
    if (align) style.align = align;
    if (font) style.font = font;
    if (size) style.size = size;
    if (look === 'bold') style.weight = '700';
    if (look === 'italic') style.italic = 'italic';
    if (look === 'bold-italic') {
      style.weight = '700';
      style.italic = 'italic';
    }
    if (look === 'normal') {
      style.weight = '400';
      style.italic = 'normal';
    }
    return style;
  }

  function styleFields(current) {
    var look = '';
    if (current.weight === '700' && current.italic === 'italic') look = 'bold-italic';
    else if (current.weight === '700') look = 'bold';
    else if (current.italic === 'italic') look = 'italic';
    else if (current.weight === '400' || current.italic === 'normal') look = 'normal';
    function opt(value, label, selected) {
      return '<option value="' + value + '"' + (selected ? ' selected' : '') + '>' + label + '</option>';
    }
    var sizes = ['', '14', '16', '18', '22', '28', '36', '48', '60'];
    var sizeHtml = sizes.map(function (size) {
      var label = size ? size + ' px' : 'Theme size';
      return opt(size, label, String(current.size || '') === size);
    }).join('');
    return '<label>Alignment<select data-ve-align>' +
      opt('', 'Theme', !current.align) +
      opt('left', 'Left', current.align === 'left') +
      opt('center', 'Center', current.align === 'center') +
      opt('right', 'Right', current.align === 'right') +
      opt('justify', 'Justify', current.align === 'justify') +
      '</select></label>' +
      '<label>Font<select data-ve-font>' +
      opt('', 'Theme font', !current.font || current.font === 'inherit') +
      opt('Manrope', 'Manrope', current.font === 'Manrope') +
      opt('Arial', 'Arial', current.font === 'Arial') +
      opt('Georgia', 'Georgia', current.font === 'Georgia') +
      opt('Times New Roman', 'Times New Roman', current.font === 'Times New Roman') +
      '</select></label>' +
      '<label>Style<select data-ve-look>' +
      opt('', 'Theme style', !look) +
      opt('normal', 'Normal', look === 'normal') +
      opt('bold', 'Bold', look === 'bold') +
      opt('italic', 'Italic', look === 'italic') +
      opt('bold-italic', 'Bold italic', look === 'bold-italic') +
      '</select></label>' +
      '<label>Size<select data-ve-size>' + sizeHtml + '</select></label>';
  }

  function openText(el) {
    closePop();
    pop = document.createElement('div');
    pop.className = 'amz-ve-pop amz-ve-ui';
    var isLink = el.tagName === 'A';
    var current = readStyle(el);
    pop.innerHTML = '<h3>' + (isLink ? 'Edit link' : 'Edit text') + '</h3>' +
      '<label>Text<textarea data-ve-text></textarea></label>' +
      (isLink ? '<label>Link address<input type="text" data-ve-href></label>' : '') +
      styleFields(current) +
      '<div class="amz-ve-pop__actions"><button type="button" class="amz-ve-cancel" data-ve-cancel>Cancel</button><button type="button" class="amz-ve-apply" data-ve-apply>Apply</button></div>';
    document.body.appendChild(pop);
    pop.querySelector('[data-ve-text]').value = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (isLink) pop.querySelector('[data-ve-href]').value = el.getAttribute('href') || '';
    placePop(el);
    pop.querySelector('[data-ve-cancel]').addEventListener('click', closePop);
    pop.querySelector('[data-ve-apply]').addEventListener('click', function () {
      var text = pop.querySelector('[data-ve-text]').value;
      var style = styleFromPop();
      var item = { type: 'text', text: text };
      if (style.align || style.font || style.weight || style.italic || style.size) item.style = style;
      el.textContent = text;
      paintStyle(el, style);
      if (isLink) {
        var href = pop.querySelector('[data-ve-href]').value.trim();
        if (href) {
          el.setAttribute('href', href);
          item.href = href;
        }
      }
      var target = el;
      closePop();
      remember(target, item);
    });
  }

  function paintPhoto(el, url) {
    if (el.tagName === 'IMG') {
      el.setAttribute('src', url);
      el.removeAttribute('srcset');
      el.removeAttribute('data-src');
      return;
    }
    el.style.backgroundImage = "url('" + String(url).replace(/'/g, '') + "')";
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
      var url = file.url || (file.sizes && file.sizes.full && file.sizes.full.url) || (file.sizes && file.sizes.large && file.sizes.large.url);
      if (!url) {
        status('That photo has no file address');
        return;
      }
      paintPhoto(img, url);
      if (file.alt && img.tagName === 'IMG') img.setAttribute('alt', file.alt);
      remember(img, { type: 'image', src: url, id: file.id || 0, alt: file.alt || img.getAttribute('alt') || '' });
    });
    frame.open();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.amz-ve-ui, #wpadminbar')) return;
    if (locked(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    var img = bannerTarget(e.target);
    if (img) {
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
    if (e.target.closest && e.target.closest('.amz-ve-ui')) return;
    e.preventDefault();
  }, true);

  function currentOrder() {
    var main = document.querySelector('main');
    if (!main) return null;
    return Array.prototype.map.call(main.children, function (el) {
      return el.getAttribute && el.getAttribute('data-amz-block');
    }).filter(Boolean);
  }

  function moveBlock(dir) {
    if (!moverBlock || !moverBlock.parentNode) return;
    var parent = moverBlock.parentNode;
    var blocks = Array.prototype.filter.call(parent.children, function (el) {
      return el.getAttribute && el.getAttribute('data-amz-block');
    });
    var index = blocks.indexOf(moverBlock);
    var next = index + dir;
    if (index < 0 || next < 0 || next >= blocks.length) return;
    if (dir < 0) parent.insertBefore(moverBlock, blocks[next]);
    else parent.insertBefore(blocks[next], moverBlock);
    changes.order = currentOrder();
    placeMover(moverBlock);
    status('Saving…');
    save();
  }

  mover.querySelector('[data-ve-up]').addEventListener('click', function () { moveBlock(-1); });
  mover.querySelector('[data-ve-down]').addEventListener('click', function () { moveBlock(1); });

  function snapshot() {
    return {
      path: cfg.path || '/',
      global: changes.global.slice(),
      page: changes.page.slice(),
      order: changes.order ? changes.order.slice() : null
    };
  }

  function sameItem(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function save() {
    var shot = snapshot();
    if (!shot.global.length && !shot.page.length && !shot.order) {
      status('Saved');
      return Promise.resolve();
    }
    var run = function () {
      status('Saving…');
      var body = new FormData();
      var payload = { path: shot.path, global: shot.global, page: shot.page };
      if (shot.order) payload.order = shot.order;
      body.append('action', 'amz_ve_save');
      body.append('nonce', cfg.nonce || '');
      body.append('changes', JSON.stringify(payload));
      return fetch(cfg.ajaxUrl, { method: 'POST', body: body, credentials: 'same-origin' })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (res) {
          if (!res.ok || !res.data || !res.data.success) {
            throw new Error((res.data && res.data.data && res.data.data.message) || 'Save failed');
          }
          changes.global = changes.global.filter(function (row) {
            return !shot.global.some(function (old) { return old.path === row.path && sameItem(old, row); });
          });
          changes.page = changes.page.filter(function (row) {
            return !shot.page.some(function (old) { return old.path === row.path && sameItem(old, row); });
          });
          if (shot.order && changes.order && sameItem(shot.order, changes.order)) changes.order = null;
          var left = changes.global.length || changes.page.length || changes.order;
          status(left ? 'Saving…' : 'Saved');
        })
        .catch(function (err) {
          status(err.message || 'Save failed');
        });
    };
    chain = chain.then(run, run);
    return chain;
  }

  bar.querySelector('[data-ve-save]').addEventListener('click', function () { save(); });
  bar.querySelector('[data-ve-exit]').addEventListener('click', function () {
    var dirty = changes.global.length || changes.page.length || changes.order;
    if (dirty && !window.confirm('Leave without saving these changes?')) return;
    changes.global = [];
    changes.page = [];
    changes.order = null;
    window.location.href = cfg.exitUrl || '/';
  });

  window.addEventListener('beforeunload', function (e) {
    if (!changes.global.length && !changes.page.length && !changes.order) return;
    e.preventDefault();
    e.returnValue = '';
  });
})();
