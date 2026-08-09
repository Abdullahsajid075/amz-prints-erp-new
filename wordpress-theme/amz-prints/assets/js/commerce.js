/**
 * Cart + checkout + add-to-cart
 */
(function () {
  'use strict';

  var cfg = window.amzCommerce || {};
  if (!cfg.ajaxUrl) return;

  function money(n) {
    n = Number(n) || 0;
    var dec = Math.floor(n) === n ? 0 : 2;
    return 'Rs. ' + n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  function post(action, data) {
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
    return post('amz_prints_cart_update', {
      product_id: productId,
      quantity: quantity,
      cart_action: cartAction || 'set'
    }).then(function (res) {
      if (!res || !res.success) {
        throw new Error((res && res.data && res.data.message) || 'Cart update failed');
      }
      updateBadge(res.data.count);
      renderTotals(res.data);
      return res.data;
    });
  }

  // Header badge bootstrap
  updateBadge(cfg.cartCount || 0);

  var products = Array.isArray(cfg.products) ? cfg.products : [];
  var activeProduct = null;
  var modal = document.querySelector('[data-product-modal]');

  function findProduct(id) {
    id = String(id || '');
    for (var i = 0; i < products.length; i++) {
      if (String(products[i].id) === id) return products[i];
    }
    return null;
  }

  function moneyLabel(product) {
    var price = Number(product.basePrice || 0);
    if (price <= 0) return 'Get a quote';
    var label = money(price);
    return product.unit ? (label + ' / ' + product.unit) : label;
  }

  function setModalImage(src, name) {
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
      ? product.images
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
            var fb = modal.querySelector('[data-pm-feedback]');
            if (fb) { fb.hidden = false; fb.textContent = err.message || 'Could not add to cart'; }
          })
          .finally(function () { add.disabled = false; });
      }
    });
  }

  // Product listing / detail add to cart + open detail popup
  document.addEventListener('click', function (e) {
    var openBtn = e.target.closest('[data-open-product]');
    if (openBtn) {
      e.preventDefault();
      var product = findProduct(openBtn.getAttribute('data-open-product'));
      if (product) openProductModal(product);
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

  // Cart page qty / remove
  var cartRoot = document.querySelector('[data-amz-cart]');
  if (cartRoot) {
    cartRoot.addEventListener('click', function (e) {
      var line = e.target.closest('.cart-line');
      if (!line) return;
      var pid = line.getAttribute('data-product-id');
      var input = line.querySelector('[data-cart-qty-input]');
      if (e.target.closest('[data-cart-remove]')) {
        cartUpdate(pid, 0, 'remove').then(function () { window.location.reload(); });
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

  // Checkout place order
  var form = document.getElementById('amz-checkout-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.querySelector('[data-checkout-msg]');
      var btn = form.querySelector('[data-place-order]');
      var fd = new FormData(form);
      if (!fd.get('policy_accepted')) {
        if (msg) { msg.hidden = false; msg.textContent = 'Please accept the Order Processing Policy.'; }
        return;
      }
      if (btn) btn.disabled = true;
      post('amz_prints_place_order', {
        payment_method: fd.get('payment_method') || 'cod',
        policy_accepted: fd.get('policy_accepted') ? '1' : '',
        delivery_address: fd.get('delivery_address') || '',
        customer_phone: fd.get('customer_phone') || '',
        customer_note: fd.get('customer_note') || ''
      }).then(function (res) {
        if (!res || !res.success) {
          var err = (res && res.data && res.data.message) || 'Could not place order';
          if (res && res.data && res.data.loginUrl) {
            window.location.href = res.data.loginUrl;
            return;
          }
          throw new Error(err);
        }
        form.hidden = true;
        var ok = document.querySelector('[data-checkout-success]');
        if (ok) {
          ok.hidden = false;
          var sm = ok.querySelector('[data-success-msg]');
          var so = ok.querySelector('[data-success-order]');
          var sp = ok.querySelector('[data-success-pay]');
          if (sm) sm.textContent = res.data.message || 'Order placed successfully.';
          if (so) so.textContent = res.data.orderId || '';
          if (sp) sp.textContent = (res.data.paymentMethod || '') + (res.data.paymentStatus ? ' · ' + res.data.paymentStatus : '');
        }
        updateBadge(0);
      }).catch(function (err) {
        if (msg) { msg.hidden = false; msg.textContent = err.message || 'Order failed'; }
      }).finally(function () {
        if (btn) btn.disabled = false;
      });
    });
  }
})();
