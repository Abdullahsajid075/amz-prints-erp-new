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

  // Product listing / detail add to cart
  document.addEventListener('click', function (e) {
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
