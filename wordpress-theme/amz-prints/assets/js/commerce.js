/**
 * Cart + checkout + product detail popup
 */
(function () {
  'use strict';

  var cfg = window.amzCommerce || {};

  function money(n) {
    n = Number(n) || 0;
    var dec = Math.floor(n) === n ? 0 : 2;
    return 'Rs. ' + n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  function post(action, data) {
    if (!cfg.ajaxUrl) {
      return Promise.reject(new Error('Cart is not available right now'));
    }
    var body = new FormData();
    body.append('action', action);
    body.append('nonce', cfg.nonce || '');
    Object.keys(data || {}).forEach(function (k) {
      body.append(k, data[k]);
    });
    return fetch(cfg.ajaxUrl, { method: 'POST', body: body, credentials: 'same-origin' })
      .then(function (r) { return r.json(); });
  }

  function updateBadge(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = String(count || 0);
      el.hidden = !count;
    });
  }

  function renderTotals(summary) {
    var root = document.querySelector('[data-cart-totals]');
    if (!root || !summary) return;
    var map = {
      subtotal: summary.subtotal,
      discount: summary.discount,
      delivery: summary.deliveryCharges,
      total: summary.total
    };
    Object.keys(map).forEach(function (k) {
      var el = root.querySelector('[data-total="' + k + '"]');
      if (el) el.textContent = money(map[k]);
    });
  }

  function cartUpdate(productId, quantity, cartAction) {
    if ((cartAction || 'set') === 'add' && !cfg.profileComplete) {
      if (cfg.profileUrl) window.location.href = cfg.profileUrl;
      var blocked = new Error('Complete your profile before adding to cart.');
      blocked.code = 'profile_required';
      return Promise.reject(blocked);
    }
    return post('amz_prints_cart_update', {
      product_id: productId,
      quantity: quantity,
      cart_action: cartAction || 'set'
    }).then(function (res) {
      if (!res || !res.success) {
        var code = res && res.data && res.data.code;
        var next = res && res.data && (res.data.profileUrl || res.data.loginUrl);
        if ((code === 'profile_required' || code === 'login_required') && next) {
          window.location.href = next;
        }
        var err = new Error((res && res.data && res.data.message) || 'Cart update failed');
        err.code = code || '';
        throw err;
      }
      updateBadge(res.data.count);
      renderTotals(res.data);
      return res.data;
    });
  }

  function loadProducts() {
    if (Array.isArray(cfg.products) && cfg.products.length) {
      return cfg.products.slice();
    }
    var el = document.getElementById('amz-products-data');
    if (el) {
      try {
        var parsed = JSON.parse(el.textContent || '[]');
        if (Array.isArray(parsed)) return parsed;
      } catch (err) { /* ignore */ }
    }
    return [];
  }

  updateBadge(cfg.cartCount || 0);

  var products = loadProducts();
  var activeProduct = null;
  var modal = document.querySelector('[data-product-modal]');

  function findProduct(id) {
    id = String(id || '');
    for (var i = 0; i < products.length; i++) {
      if (String(products[i].id) === id) return products[i];
    }
    return null;
  }

  function productFromButton(btn) {
    if (!btn) return null;
    var id = btn.getAttribute('data-open-product') || '';
    var existing = findProduct(id);
    var cardImg = btn.querySelector('img');
    var cardSrc = cardImg ? (cardImg.currentSrc || cardImg.src || '') : '';

    if (existing) {
      var copy = Object.assign({}, existing);
      var imgs = Array.isArray(copy.images) ? copy.images.slice() : [];
      if (!copy.image && cardSrc) copy.image = cardSrc;
      if (copy.image && imgs.indexOf(copy.image) < 0) imgs.unshift(copy.image);
      if (!imgs.length && cardSrc) imgs = [cardSrc];
      copy.images = imgs;
      return copy;
    }

    return {
      id: id,
      name: btn.getAttribute('data-product-name') || (btn.querySelector('.shop-card__title') && btn.querySelector('.shop-card__title').textContent) || '',
      category: btn.getAttribute('data-product-category') || '',
      description: btn.getAttribute('data-product-desc') || '',
      basePrice: parseFloat(btn.getAttribute('data-product-price') || '0') || 0,
      unit: btn.getAttribute('data-product-unit') || '',
      material: btn.getAttribute('data-product-material') || '',
      size: btn.getAttribute('data-product-size') || '',
      minQuantity: Math.max(1, parseInt(btn.getAttribute('data-product-min') || '1', 10) || 1),
      image: cardSrc,
      images: cardSrc ? [cardSrc] : []
    };
  }

  function moneyLabel(product) {
    var price = Number(product.basePrice || 0);
    if (price <= 0) return 'Get a quote';
    var label = money(price);
    return product.unit ? (label + ' / ' + product.unit) : label;
  }

  function setModalImage(src, name) {
    if (!modal) return;
    var img = modal.querySelector('[data-pm-image]');
    var ph = modal.querySelector('[data-pm-placeholder]');
    var letter = modal.querySelector('[data-pm-letter]');
    if (src) {
      img.src = src;
      img.alt = name || '';
      img.hidden = false;
      if (ph) ph.hidden = true;
    } else {
      img.removeAttribute('src');
      img.hidden = true;
      if (ph) ph.hidden = false;
      if (letter) letter.textContent = (name || '?').charAt(0);
    }
  }

  function openProductModal(product) {
    if (!modal || !product) return;
    activeProduct = product;
    var images = Array.isArray(product.images) && product.images.length
      ? product.images.filter(Boolean)
      : (product.image ? [product.image] : []);
    modal.querySelector('[data-pm-title]').textContent = product.name || '';
    modal.querySelector('[data-pm-category]').textContent = product.category || '';
    modal.querySelector('[data-pm-price]').textContent = moneyLabel(product);
    modal.querySelector('[data-pm-desc]').textContent = product.description || product.category || '';
    modal.querySelector('[data-pm-material]').textContent = product.material || '';
    modal.querySelector('[data-pm-size]').textContent = product.size || '';
    modal.querySelector('[data-pm-unit]').textContent = product.unit || '';
    modal.querySelector('[data-pm-min]').textContent = String(product.minQuantity || 1);
    modal.querySelector('[data-pm-row="material"]').hidden = !product.material;
    modal.querySelector('[data-pm-row="size"]').hidden = !product.size;
    modal.querySelector('[data-pm-row="unit"]').hidden = !product.unit;

    setModalImage(images[0] || '', product.name);
    var thumbs = modal.querySelector('[data-pm-thumbs]');
    thumbs.innerHTML = '';
    if (images.length > 1) {
      images.forEach(function (src, idx) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'product-modal__thumb' + (idx === 0 ? ' is-active' : '');
        b.innerHTML = '<img alt="">';
        b.querySelector('img').src = src;
        b.addEventListener('click', function () {
          setModalImage(src, product.name);
          thumbs.querySelectorAll('.product-modal__thumb').forEach(function (t) {
            t.classList.toggle('is-active', t === b);
          });
        });
        thumbs.appendChild(b);
      });
    }

    var minQ = Math.max(1, parseInt(product.minQuantity, 10) || 1);
    var qtyInput = modal.querySelector('[data-pm-qty-input]');
    qtyInput.min = String(minQ);
    qtyInput.value = String(minQ);

    var orderable = Number(product.basePrice || 0) > 0;
    modal.querySelector('[data-pm-actions]').hidden = !orderable;
    modal.querySelector('[data-pm-quote]').hidden = orderable;
    var qLink = modal.querySelector('[data-pm-quote-link]');
    if (qLink) {
      var base = cfg.quoteUrl || '/quote/';
      qLink.href = base + (base.indexOf('?') >= 0 ? '&' : '?') + 'service=' + encodeURIComponent(product.name || '');
    }
    var fb = modal.querySelector('[data-pm-feedback]');
    if (fb) { fb.hidden = true; fb.textContent = ''; }

    var more = modal.querySelector('[data-pm-more]');
    var moreRow = modal.querySelector('[data-pm-more-row]');
    if (more && moreRow) {
      moreRow.innerHTML = '';
      var others = products.filter(function (p) {
        if (!p || !p.name || String(p.id) === String(product.id)) return false;
        var img = String(p.image || '');
        return img.indexOf('data:image') === 0 || /^https?:\/\//i.test(img);
      }).slice(0, 8);
      more.hidden = !others.length;
      others.forEach(function (p) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'product-modal__more-card';
        b.setAttribute('data-open-product', p.id || '');
        b.setAttribute('data-product-name', p.name || '');
        b.innerHTML = '<img alt=""><span></span>';
        b.querySelector('img').src = p.image;
        b.querySelector('img').alt = p.name || '';
        b.querySelector('span').textContent = p.name || '';
        moreRow.appendChild(b);
      });
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('product-modal-open');
  }

  function closeProductModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('product-modal-open');
    activeProduct = null;
  }

  if (modal) {
    modal.querySelectorAll('[data-product-modal-close]').forEach(function (el) {
      el.addEventListener('click', closeProductModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeProductModal();
    });
    modal.addEventListener('click', function (e) {
      var step = e.target.closest('[data-pm-qty]');
      if (step) {
        var input = modal.querySelector('[data-pm-qty-input]');
        var min = parseInt(input.min || '1', 10) || 1;
        input.value = String(Math.max(min, (parseInt(input.value, 10) || min) + parseInt(step.getAttribute('data-pm-qty'), 10)));
        return;
      }
      var add = e.target.closest('[data-pm-add-cart]');
      if (add && activeProduct) {
        var qty = Math.max(1, parseInt(modal.querySelector('[data-pm-qty-input]').value, 10) || 1);
        add.disabled = true;
        cartUpdate(activeProduct.id, qty, 'add')
          .then(function () {
            var fb = modal.querySelector('[data-pm-feedback]');
            if (fb) { fb.hidden = false; fb.textContent = 'Added to cart'; }
            add.textContent = 'Added';
            setTimeout(function () { add.textContent = 'Add to cart'; }, 1200);
          })
          .catch(function (err) {
            if (err && (err.code === 'profile_required' || err.code === 'login_required')) return;
            var fb = modal.querySelector('[data-pm-feedback]');
            if (fb) { fb.hidden = false; fb.textContent = err.message || 'Could not add to cart'; }
          })
          .finally(function () { add.disabled = false; });
      }
    });
  }

  document.addEventListener('click', function (e) {
    var openBtn = e.target.closest('[data-open-product]');
    if (openBtn) {
      e.preventDefault();
      e.stopPropagation();
      var product = productFromButton(openBtn);
      if (product && product.name) openProductModal(product);
      return;
    }

    var addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn) {
      var wrap = addBtn.closest('[data-add-cart]');
      var pid = wrap ? wrap.getAttribute('data-add-cart') : addBtn.getAttribute('data-product-id');
      var qtyInput = wrap ? wrap.querySelector('[data-pd-qty-input]') : null;
      var qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
      if (!pid) return;
      addBtn.disabled = true;
      cartUpdate(pid, qty, 'add')
        .then(function () {
          var fb = wrap && wrap.parentElement ? wrap.parentElement.querySelector('[data-cart-feedback]') : null;
          if (fb) {
            fb.hidden = false;
            fb.textContent = 'Added to cart';
          }
          addBtn.textContent = 'Added';
          setTimeout(function () { addBtn.textContent = 'Add to cart'; }, 1200);
        })
        .catch(function (err) {
          if (err && (err.code === 'profile_required' || err.code === 'login_required')) return;
          alert(err.message || 'Could not add to cart');
        })
        .finally(function () { addBtn.disabled = false; });
      return;
    }

    var qd = e.target.closest('[data-pd-qty]');
    if (qd) {
      var box = qd.closest('[data-add-cart]');
      var input = box && box.querySelector('[data-pd-qty-input]');
      if (!input) return;
      var min = parseInt(input.min || '1', 10) || 1;
      var next = (parseInt(input.value, 10) || min) + parseInt(qd.getAttribute('data-pd-qty'), 10);
      input.value = Math.max(min, next);
    }

    var thumb = e.target.closest('[data-thumb-src]');
    if (thumb) {
      var gallery = thumb.closest('.product-detail__gallery');
      var main = gallery && gallery.querySelector('[data-main-image]');
      if (main) main.src = thumb.getAttribute('data-thumb-src');
      gallery.querySelectorAll('.product-thumb').forEach(function (t) {
        t.classList.toggle('is-active', t === thumb);
      });
    }
  });

  var cartRoot = document.querySelector('[data-amz-cart]');
  if (cartRoot) {
    cartRoot.addEventListener('click', function (e) {
      var line = e.target.closest('.cart-line');
      if (!line) return;
      var pid = line.getAttribute('data-product-id');
      var input = line.querySelector('[data-cart-qty-input]');
      if (e.target.closest('[data-cart-remove]')) {
        cartUpdate(pid, 0, 'remove').then(function (res) {
          if (!res || !res.success) throw new Error((res && res.data && res.data.message) || 'Could not remove item');
          window.location.reload();
        }).catch(function (err) { alert(err.message || 'Could not remove item'); });
        return;
      }
      var step = e.target.closest('[data-cart-qty]');
      if (step && input) {
        var min = parseInt(input.min || '1', 10) || 1;
        var n = (parseInt(input.value, 10) || min) + parseInt(step.getAttribute('data-cart-qty'), 10);
        n = Math.max(min, n);
        input.value = n;
        cartUpdate(pid, n, 'set').then(function () { window.location.reload(); });
      }
    });
    cartRoot.addEventListener('change', function (e) {
      var input = e.target.closest('[data-cart-qty-input]');
      if (!input) return;
      var line = input.closest('.cart-line');
      if (!line) return;
      var min = parseInt(input.min || '1', 10) || 1;
      var n = Math.max(min, parseInt(input.value, 10) || min);
      cartUpdate(line.getAttribute('data-product-id'), n, 'set').then(function () { window.location.reload(); });
    });
  }

  var form = document.getElementById('amz-checkout-form');
  if (form) {
    var root = document.querySelector('[data-amz-checkout]');
    var subtotal = root ? Number(root.getAttribute('data-subtotal')) || 0 : 0;
    var discount = root ? Number(root.getAttribute('data-discount')) || 0 : 0;
    var placing = false;
    var lastOrder = null;

    function phoneOk(value, required) {
      var raw = String(value || '').replace(/[\s\-().]/g, '');
      if (raw.indexOf('00') === 0) raw = '+' + raw.slice(2);
      if (!raw) return !required;
      return /^\+[1-9]\d{7,14}$/.test(raw);
    }

    function selectedPayType() {
      var picked = form.querySelector('input[name="payment_method"]:checked');
      return picked ? (picked.getAttribute('data-pay-type') || '') : '';
    }

    function quote() {
      var method = (form.querySelector('input[name="delivery_method"]:checked') || {}).value || '';
      var zone = (form.querySelector('input[name="delivery_zone"]:checked') || {}).value || '';
      var goods = Math.max(0, subtotal - discount);
      var delivery = null;
      if (method === 'pickup') delivery = 0;
      if (method === 'home' && zone === 'inside') delivery = 250;
      var total = delivery == null ? goods : Math.round((goods + delivery) * 100) / 100;
      var advance = Math.round(total * 50) / 100;
      return { method: method, zone: zone, delivery: delivery, total: total, advance: advance, balance: Math.round((total - advance) * 100) / 100 };
    }

    function paintQuote() {
      var q = quote();
      var deliveryText = q.delivery == null ? 'Select a method' : money(q.delivery);
      var map = {
        delivery: deliveryText,
        'delivery-side': deliveryText,
        grand: money(q.total),
        'grand-side': money(q.total),
        advance: money(q.advance),
        'advance-side': money(q.advance),
        balance: money(q.balance)
      };
      Object.keys(map).forEach(function (key) {
        document.querySelectorAll('[data-quote="' + key + '"]').forEach(function (el) {
          el.textContent = map[key];
        });
      });
      var amount = form.querySelector('[data-advance-amount]');
      if (amount && document.activeElement !== amount) {
        var current = Number(amount.value);
        if (!amount.value || current < q.advance) amount.value = q.advance ? String(q.advance) : '';
        amount.min = String(q.advance || 0);
      }
      return q;
    }

    function syncPanels() {
      var method = (form.querySelector('input[name="delivery_method"]:checked') || {}).value || '';
      var zone = (form.querySelector('input[name="delivery_zone"]:checked') || {}).value || '';
      document.querySelectorAll('[data-delivery-panel]').forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-delivery-panel') !== method;
      });
      var outside = document.querySelector('[data-outside-note]');
      if (outside) outside.hidden = !(method === 'home' && zone === 'outside');
      var pay = selectedPayType();
      var bank = document.querySelector('[data-bank-fields]');
      var cod = document.querySelector('[data-cod-note]');
      if (bank) bank.hidden = pay !== 'bank';
      if (cod) cod.hidden = pay !== 'cod';
    }

    function blockers() {
      var q = paintQuote();
      var reasons = [];
      var name = (form.querySelector('[name="customer_name"]') || {}).value || '';
      if (name.trim().length < 2) reasons.push('Enter your full name.');
      if (!phoneOk((form.querySelector('[name="customer_phone"]') || {}).value, true)) reasons.push('Enter a WhatsApp number with country code.');
      var alt = (form.querySelector('[name="alt_phone"]') || {}).value || '';
      if (alt.trim() && !phoneOk(alt, true)) reasons.push('The alternative number needs a country code.');
      if (!q.method) reasons.push('Select home delivery or store pickup.');
      if (q.method === 'home' && q.zone !== 'inside') {
        reasons.push(q.zone === 'outside'
          ? 'Home delivery is not available outside 10 km.'
          : 'Confirm that the address is within 10 km.');
      }
      if (q.method === 'home') {
        var address = (form.querySelector('[name="delivery_address"]') || {}).value || '';
        if (address.trim().length < 8) reasons.push('Enter the complete delivery address.');
      }
      var pay = selectedPayType();
      if (!pay) reasons.push('Select a payment method.');
      if (pay === 'bank') {
        var paid = Number((form.querySelector('[name="advance_amount"]') || {}).value);
        if (!(paid + 0.001 >= q.advance)) reasons.push('The advance must be at least 50% of the total.');
        if (!((form.querySelector('[name="payment_date"]') || {}).value)) reasons.push('Enter the payment date.');
        var file = form.querySelector('[name="payment_receipt"]');
        if (!file || !file.files || !file.files.length) reasons.push('Upload the payment receipt.');
      }
      if (!(form.querySelector('[name="policy_accepted"]') || {}).checked) reasons.push('Accept the declaration to continue.');
      return reasons;
    }

    function syncButton() {
      syncPanels();
      var btn = form.querySelector('[data-place-order]');
      var reasons = blockers();
      if (btn && !placing) btn.disabled = reasons.length > 0;
    }

    form.addEventListener('input', syncButton);
    form.addEventListener('change', syncButton);
    syncButton();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.querySelector('[data-checkout-msg]');
      var btn = form.querySelector('[data-place-order]');
      var reasons = blockers();
      if (reasons.length) {
        if (msg) { msg.hidden = false; msg.textContent = reasons[0]; }
        syncButton();
        return;
      }
      if (placing) return;
      placing = true;
      if (btn) btn.disabled = true;
      if (msg) msg.hidden = true;
      var fd = new FormData(form);
      fd.append('action', 'amz_prints_place_order');
      fd.append('nonce', cfg.nonce || '');
      fetch(cfg.ajaxUrl, { method: 'POST', body: fd, credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !res.success) {
            var err = (res && res.data && res.data.message) || 'Could not place order';
            if (res && res.data && (res.data.profileUrl || res.data.loginUrl)) {
              window.location.href = res.data.profileUrl || res.data.loginUrl;
              return;
            }
            throw new Error(err);
          }
          lastOrder = res.data || {};
          form.hidden = true;
          var aside = document.querySelector('.commerce-aside');
          if (aside) aside.hidden = true;
          var ok = document.querySelector('[data-checkout-success]');
          if (ok) {
            ok.hidden = false;
            var set = function (sel, text) {
              var el = ok.querySelector(sel);
              if (el) el.textContent = text;
            };
            set('[data-success-order]', lastOrder.orderId || '');
            set('[data-success-pay]', lastOrder.paymentStatus || 'Pending Verification');
            set('[data-success-delivery]', lastOrder.deliveryMethod || '');
            set('[data-success-fee]', money(lastOrder.deliveryCharges));
            set('[data-success-total]', money(lastOrder.totalAmount));
            set('[data-success-advance]', money(lastOrder.declaredAdvance));
            set('[data-success-balance]', money(lastOrder.balanceAmount));
            var list = ok.querySelector('[data-success-items]');
            if (list) {
              list.innerHTML = '';
              (lastOrder.items || []).forEach(function (item) {
                var li = document.createElement('li');
                li.innerHTML = '<span><strong></strong><em></em></span><strong></strong>';
                li.querySelector('strong').textContent = item.name || '';
                li.querySelector('em').textContent = '× ' + (item.quantity || 1);
                var totals = li.querySelectorAll('strong');
                if (totals[1]) totals[1].textContent = money(item.lineTotal);
                list.appendChild(li);
              });
            }
            var st = ok.querySelector('[data-success-track]');
            if (st && lastOrder.trackUrl) st.href = lastOrder.trackUrl;
            ok.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          updateBadge(0);
        })
        .catch(function (err) {
          placing = false;
          if (msg) { msg.hidden = false; msg.textContent = err.message || 'Order failed'; }
          syncButton();
        });
    });

    var downloadBtn = document.querySelector('[data-download-summary]');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function () {
        if (!lastOrder) return;
        var lines = [
          'AMZ Prints — Order summary',
          '',
          'Thank you for your order.',
          'Order number: ' + (lastOrder.orderId || ''),
          'Status: Order Received',
          'Payment verification: ' + (lastOrder.paymentStatus || 'Pending Verification'),
          'Payment method: ' + (lastOrder.paymentMethod || ''),
          'Delivery: ' + (lastOrder.deliveryMethod || ''),
          'Products subtotal: ' + money(lastOrder.subtotal),
          'Delivery charges: ' + money(lastOrder.deliveryCharges),
          'Total amount: ' + money(lastOrder.totalAmount),
          'Declared advance: ' + money(lastOrder.declaredAdvance),
          'Remaining balance: ' + money(lastOrder.balanceAmount),
          '',
          'Products:'
        ];
        (lastOrder.items || []).forEach(function (item) {
          lines.push('- ' + (item.name || '') + ' × ' + (item.quantity || 1) + ' — ' + money(item.lineTotal));
        });
        lines.push('', 'Your order will be confirmed after verification of the required advance payment.');
        var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'AMZ-Prints-' + (lastOrder.orderId || 'order') + '.txt';
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
    }
  }

  // Expose for hero product tiles
  window.amzOpenProduct = function (idOrProduct) {
    if (typeof idOrProduct === 'object' && idOrProduct) {
      openProductModal(idOrProduct);
      return;
    }
    var p = findProduct(idOrProduct);
    if (p) openProductModal(p);
  };
})();
