/**
 * AMZ Prints shop — cart (localStorage), auth, checkout → ERP orders.
 */
(function () {
  'use strict';

  var cfg = window.amzShop || {};
  var STORAGE_CART = 'amz_prints_cart_v1';
  var STORAGE_AUTH = 'amz_prints_customer_v1';

  function money(n) {
    var v = Number(n) || 0;
    return 'Rs ' + v.toLocaleString('en-PK', { maximumFractionDigits: 2 });
  }

  function readCart() {
    try {
      var raw = localStorage.getItem(STORAGE_CART);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(STORAGE_CART, JSON.stringify(items || []));
    updateCartBadges();
    document.dispatchEvent(new CustomEvent('amz:cart-updated', { detail: { items: items || [] } }));
  }

  function readAuth() {
    try {
      var raw = localStorage.getItem(STORAGE_AUTH);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeAuth(payload) {
    if (!payload) localStorage.removeItem(STORAGE_AUTH);
    else localStorage.setItem(STORAGE_AUTH, JSON.stringify(payload));
    updateAuthUI();
  }

  function cartCount(items) {
    return (items || readCart()).reduce(function (sum, row) {
      return sum + (Number(row.quantity) || 0);
    }, 0);
  }

  function cartTotals(items) {
    items = items || readCart();
    var subtotal = items.reduce(function (s, row) {
      return s + (Number(row.quantity) || 0) * (Number(row.rate) || 0);
    }, 0);
    var discount = Math.max(0, Number(cfg.discount || 0));
    var delivery = Math.max(0, Number(cfg.deliveryCharges || 0));
    if (discount > subtotal) discount = subtotal;
    return {
      subtotal: subtotal,
      discount: discount,
      delivery: delivery,
      total: Math.max(0, subtotal - discount + delivery),
    };
  }

  function updateCartBadges() {
    var count = cartCount();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = String(count);
      el.hidden = count < 1;
    });
  }

  function updateAuthUI() {
    var auth = readAuth();
    document.querySelectorAll('[data-auth-name]').forEach(function (el) {
      el.textContent = auth && auth.customer ? (auth.customer.name || 'Account') : 'Login';
    });
    document.querySelectorAll('[data-auth-logged-in]').forEach(function (el) {
      el.hidden = !auth;
    });
    document.querySelectorAll('[data-auth-logged-out]').forEach(function (el) {
      el.hidden = !!auth;
    });
  }

  function addToCart(product, qty) {
    if (!product || !product.id) return;
    qty = Math.max(1, Number(qty) || Number(product.minQuantity) || 1);
    var variationId = String(product.variationId || '');
    var variationName = String(product.variationName || '');
    var rate = Number(
      product.selectedPrice != null ? product.selectedPrice
        : (product.basePrice != null ? product.basePrice : product.rate)
    ) || 0;
    var lineName = product.name || '';
    if (variationName) lineName = lineName + ' — ' + variationName;
    var items = readCart();
    var idx = items.findIndex(function (r) {
      return String(r.id) === String(product.id)
        && String(r.variationId || '') === variationId;
    });
    if (idx >= 0) {
      items[idx].quantity = (Number(items[idx].quantity) || 0) + qty;
      items[idx].rate = rate;
      items[idx].name = lineName;
    } else {
      items.push({
        id: String(product.id),
        name: lineName,
        rate: rate,
        quantity: qty,
        image: product.image || '',
        unit: product.unit || '',
        minQuantity: Number(product.minQuantity) || 1,
        variationId: variationId,
        variationName: variationName,
      });
    }
    writeCart(items);
    return items;
  }

  function setQty(id, qty) {
    var items = readCart();
    var idx = items.findIndex(function (r) { return String(r.id) === String(id); });
    if (idx < 0) return;
    var minQ = Number(items[idx].minQuantity) || 1;
    qty = Math.max(minQ, Number(qty) || minQ);
    items[idx].quantity = qty;
    writeCart(items);
  }

  function removeItem(id) {
    writeCart(readCart().filter(function (r) { return String(r.id) !== String(id); }));
  }

  function ajax(action, data) {
    var body = new FormData();
    body.append('action', action);
    body.append('nonce', cfg.nonce || '');
    Object.keys(data || {}).forEach(function (k) {
      body.append(k, data[k]);
    });
    return fetch(cfg.ajaxUrl, { method: 'POST', body: body, credentials: 'same-origin' })
      .then(function (r) { return r.json(); });
  }

  function renderCartPage() {
    var root = document.querySelector('[data-cart-root]');
    if (!root) return;
    var items = readCart();
    var totals = cartTotals(items);
    if (!items.length) {
      root.innerHTML = '<div class="shop-empty"><p>Your cart is empty.</p><a class="btn btn--primary" href="' + (cfg.productsUrl || '/products/') + '">Browse products</a></div>';
      return;
    }
    var rows = items.map(function (row) {
      var img = row.image
        ? '<img src="' + row.image.replace(/"/g, '&quot;') + '" alt="" loading="lazy">'
        : '<span class="shop-thumb-ph">' + (row.name || '?').charAt(0) + '</span>';
      return (
        '<article class="shop-line" data-id="' + row.id + '">' +
          '<div class="shop-line__media">' + img + '</div>' +
          '<div class="shop-line__body">' +
            '<h3>' + (row.name || '') + '</h3>' +
            '<p class="shop-line__price">' + money(row.rate) + (row.unit ? ' / ' + row.unit : '') + '</p>' +
            '<div class="shop-qty">' +
              '<button type="button" data-qty-minus aria-label="Decrease">−</button>' +
              '<input type="number" min="1" value="' + row.quantity + '" data-qty-input>' +
              '<button type="button" data-qty-plus aria-label="Increase">+</button>' +
            '</div>' +
            '<button type="button" class="shop-remove" data-remove>Remove</button>' +
          '</div>' +
          '<div class="shop-line__total">' + money((Number(row.quantity) || 0) * (Number(row.rate) || 0)) + '</div>' +
        '</article>'
      );
    }).join('');

    root.innerHTML =
      '<div class="shop-cart-layout">' +
        '<div class="shop-cart-lines">' + rows + '</div>' +
        '<aside class="shop-summary">' +
          '<h3>Order summary</h3>' +
          '<div class="shop-summary__row"><span>Subtotal</span><strong>' + money(totals.subtotal) + '</strong></div>' +
          '<div class="shop-summary__row"><span>Discount</span><strong>' + money(totals.discount) + '</strong></div>' +
          '<div class="shop-summary__row"><span>Delivery</span><strong>' + money(totals.delivery) + '</strong></div>' +
          '<div class="shop-summary__row shop-summary__row--total"><span>Total</span><strong>' + money(totals.total) + '</strong></div>' +
          '<a class="btn btn--primary btn--block" href="' + (cfg.checkoutUrl || '/checkout/') + '">Proceed to checkout</a>' +
        '</aside>' +
      '</div>';

    root.querySelectorAll('.shop-line').forEach(function (line) {
      var id = line.getAttribute('data-id');
      var input = line.querySelector('[data-qty-input]');
      line.querySelector('[data-qty-minus]').addEventListener('click', function () {
        setQty(id, (Number(input.value) || 1) - 1);
        renderCartPage();
      });
      line.querySelector('[data-qty-plus]').addEventListener('click', function () {
        setQty(id, (Number(input.value) || 1) + 1);
        renderCartPage();
      });
      input.addEventListener('change', function () {
        setQty(id, input.value);
        renderCartPage();
      });
      line.querySelector('[data-remove]').addEventListener('click', function () {
        removeItem(id);
        renderCartPage();
      });
    });
  }

  function renderCheckoutPage() {
    var root = document.querySelector('[data-checkout-root]');
    if (!root) return;
    var items = readCart();
    var totals = cartTotals(items);
    var auth = readAuth();
    var policy = cfg.policy || '';

    if (!items.length) {
      root.innerHTML = '<div class="shop-empty"><p>Your cart is empty.</p><a class="btn btn--primary" href="' + (cfg.productsUrl || '/products/') + '">Browse products</a></div>';
      return;
    }

    var lines = items.map(function (row) {
      return '<li><span>' + row.name + ' × ' + row.quantity + '</span><strong>' + money(row.quantity * row.rate) + '</strong></li>';
    }).join('');

    var authBox = auth && auth.customer
      ? '<div class="shop-auth-card is-ok"><p>Logged in as <strong>' + (auth.customer.name || '') + '</strong> (' + (auth.customer.email || auth.customer.phone || '') + ')</p><button type="button" class="btn btn--ghost btn--sm" data-logout>Logout</button></div>'
      : '<div class="shop-auth-card"><p><strong>Login required</strong> to place your order. Guests can browse and fill the cart, but checkout needs an account.</p><a class="btn btn--primary btn--sm" href="' + (cfg.accountUrl || '/account/') + '?redirect=checkout">Login / Register</a></div>';

    root.innerHTML =
      '<div class="shop-checkout-layout">' +
        '<div class="shop-checkout-main">' +
          authBox +
          '<form class="shop-checkout-form" data-checkout-form>' +
            '<label>Delivery address<textarea name="address" rows="3" required>' + ((auth && auth.customer && auth.customer.address) || '') + '</textarea></label>' +
            '<label>Order notes (optional)<textarea name="notes" rows="2"></textarea></label>' +
            '<fieldset class="shop-pay">' +
              '<legend>Payment method</legend>' +
              '<label class="shop-pay__opt"><input type="radio" name="payment_method" value="Cash on Delivery" checked> Cash on Delivery <span>(COD terms apply)</span></label>' +
              '<label class="shop-pay__opt"><input type="radio" name="payment_method" value="Online Payment"> Online Payment <span>(order placed first — pay when instructed; status: Payment Pending)</span></label>' +
            '</fieldset>' +
            '<div class="shop-policy">' +
              '<h3>Order Processing Policy</h3>' +
              '<p>' + policy + '</p>' +
              '<label class="shop-policy__accept"><input type="checkbox" name="accept_policy" value="1" required> I have read and accept this policy</label>' +
            '</div>' +
            '<button type="submit" class="btn btn--primary btn--lg" data-place-order ' + (auth ? '' : 'disabled') + '>Place order</button>' +
            '<p class="shop-form-msg" data-checkout-msg hidden></p>' +
          '</form>' +
        '</div>' +
        '<aside class="shop-summary">' +
          '<h3>Your order</h3>' +
          '<ul class="shop-summary__list">' + lines + '</ul>' +
          '<div class="shop-summary__row"><span>Subtotal</span><strong>' + money(totals.subtotal) + '</strong></div>' +
          '<div class="shop-summary__row"><span>Discount</span><strong>' + money(totals.discount) + '</strong></div>' +
          '<div class="shop-summary__row"><span>Delivery</span><strong>' + money(totals.delivery) + '</strong></div>' +
          '<div class="shop-summary__row shop-summary__row--total"><span>Total</span><strong>' + money(totals.total) + '</strong></div>' +
        '</aside>' +
      '</div>';

    var logoutBtn = root.querySelector('[data-logout]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        writeAuth(null);
        renderCheckoutPage();
      });
    }

    var form = root.querySelector('[data-checkout-form]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = root.querySelector('[data-checkout-msg]');
      var authNow = readAuth();
      if (!authNow || !authNow.token) {
        msg.hidden = false;
        msg.textContent = 'Please login before placing an order.';
        window.location.href = (cfg.accountUrl || '/account/') + '?redirect=checkout';
        return;
      }
      if (!form.accept_policy.checked) {
        msg.hidden = false;
        msg.textContent = 'Please accept the Order Processing Policy.';
        return;
      }
      var btn = form.querySelector('[data-place-order]');
      btn.disabled = true;
      btn.textContent = 'Placing order…';
      ajax('amz_prints_place_order', {
        token: authNow.token,
        items: JSON.stringify(items.map(function (r) {
          return {
            productId: r.id,
            name: r.name,
            quantity: r.quantity,
            rate: r.rate,
            variationId: r.variationId || '',
            variationName: r.variationName || '',
          };
        })),
        payment_method: form.payment_method.value,
        discount: String(totals.discount),
        delivery_charges: String(totals.delivery),
        address: form.address.value,
        notes: form.notes.value,
        accept_policy: '1',
      }).then(function (res) {
        if (!res || !res.success) {
          throw new Error((res && res.data && res.data.message) || 'Order failed');
        }
        var order = (res.data && res.data.order) || res.data || {};
        writeCart([]);
        var track = order.trackingNumber || order.orderId || '';
        root.innerHTML =
          '<div class="shop-success">' +
            '<h2>Order placed successfully</h2>' +
            '<p>Order <strong>' + (order.orderId || '') + '</strong> is now in the ERP Orders system.</p>' +
            '<p>Payment method: <strong>' + (order.paymentMethod || '') + '</strong></p>' +
            '<p>Payment status: <strong>' + (order.paymentStatus || '') + '</strong></p>' +
            (track ? '<p><a class="btn btn--primary" href="' + (cfg.trackUrl || '/track-order/') + '?code=' + encodeURIComponent(track) + '">Track order</a></p>' : '') +
            '<p><a class="btn btn--ghost" href="' + (cfg.productsUrl || '/products/') + '">Continue shopping</a></p>' +
          '</div>';
      }).catch(function (err) {
        msg.hidden = false;
        msg.textContent = err.message || 'Could not place order';
        btn.disabled = false;
        btn.textContent = 'Place order';
      });
    });
  }

  function bindAccountForms() {
    var loginForm = document.querySelector('[data-login-form]');
    var regForm = document.querySelector('[data-register-form]');
    var msg = document.querySelector('[data-account-msg]');

    function showMsg(text, ok) {
      if (!msg) return;
      msg.hidden = false;
      msg.textContent = text;
      msg.classList.toggle('is-ok', !!ok);
    }

    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        ajax('amz_prints_customer_login', {
          email: loginForm.email.value,
          password: loginForm.password.value,
        }).then(function (res) {
          if (!res || !res.success) throw new Error((res && res.data && res.data.message) || 'Login failed');
          writeAuth({ token: res.data.token, customer: res.data.customer });
          showMsg('Logged in successfully', true);
          var redirect = new URLSearchParams(window.location.search).get('redirect');
          window.location.href = redirect === 'checkout' ? (cfg.checkoutUrl || '/checkout/') : (cfg.accountUrl || '/account/');
        }).catch(function (err) {
          showMsg(err.message || 'Login failed', false);
        });
      });
    }

    if (regForm) {
      regForm.addEventListener('submit', function (e) {
        e.preventDefault();
        ajax('amz_prints_customer_register', {
          name: regForm.name.value,
          phone: regForm.phone.value,
          email: regForm.email.value,
          password: regForm.password.value,
          address: regForm.address ? regForm.address.value : '',
        }).then(function (res) {
          if (!res || !res.success) throw new Error((res && res.data && res.data.message) || 'Registration failed');
          writeAuth({ token: res.data.token, customer: res.data.customer });
          showMsg('Account created — you are logged in', true);
          var redirect = new URLSearchParams(window.location.search).get('redirect');
          window.location.href = redirect === 'checkout' ? (cfg.checkoutUrl || '/checkout/') : (cfg.accountUrl || '/account/');
        }).catch(function (err) {
          showMsg(err.message || 'Registration failed', false);
        });
      });
    }

    var logout = document.querySelector('[data-account-logout]');
    if (logout) {
      logout.addEventListener('click', function () {
        writeAuth(null);
        window.location.reload();
      });
    }

    var panel = document.querySelector('[data-account-panel]');
    if (panel) {
      var auth = readAuth();
      if (auth && auth.customer) {
        panel.innerHTML =
          '<div class="shop-auth-card is-ok">' +
            '<h2>Welcome, ' + (auth.customer.name || 'Customer') + '</h2>' +
            '<p>' + (auth.customer.email || '') + ' · ' + (auth.customer.phone || '') + '</p>' +
            '<p><a class="btn btn--primary" href="' + (cfg.cartUrl || '/cart/') + '">View cart</a> ' +
            '<button type="button" class="btn btn--ghost" data-account-logout>Logout</button></p>' +
          '</div>';
        var lo = panel.querySelector('[data-account-logout]');
        if (lo) lo.addEventListener('click', function () { writeAuth(null); window.location.reload(); });
      }
    }
  }

  function bindAddToCartButtons() {
    document.querySelectorAll('[data-add-to-cart]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var product = {
          id: btn.getAttribute('data-id'),
          name: btn.getAttribute('data-name'),
          basePrice: btn.getAttribute('data-price'),
          selectedPrice: btn.getAttribute('data-selected-price') || btn.getAttribute('data-price'),
          image: btn.getAttribute('data-image') || '',
          unit: btn.getAttribute('data-unit') || '',
          minQuantity: btn.getAttribute('data-min') || 1,
          variationId: btn.getAttribute('data-variation-id') || '',
          variationName: btn.getAttribute('data-variation-name') || '',
        };
        var qtyInput = document.querySelector('[data-product-qty]');
        var qty = qtyInput ? qtyInput.value : product.minQuantity;
        addToCart(product, qty);
        btn.classList.add('is-added');
        btn.textContent = 'Added';
        setTimeout(function () {
          btn.classList.remove('is-added');
          btn.textContent = btn.getAttribute('data-label') || 'Add to cart';
        }, 1200);
      });
    });
  }

  function initPopup() {
    var popup = document.querySelector('[data-promo-popup]');
    if (!popup) return;
    var key = 'amz_popup_seen_' + (popup.getAttribute('data-popup-key') || 'v1');
    try {
      if (sessionStorage.getItem(key) === '1') return;
    } catch (e) { /* ignore */ }
    var delay = Number(popup.getAttribute('data-delay') || 1200);
    setTimeout(function () {
      popup.hidden = false;
      popup.classList.add('is-open');
      document.documentElement.classList.add('promo-popup-open');
    }, delay);
    function close() {
      popup.classList.remove('is-open');
      popup.hidden = true;
      document.documentElement.classList.remove('promo-popup-open');
      try { sessionStorage.setItem(key, '1'); } catch (e2) { /* ignore */ }
    }
    popup.querySelectorAll('[data-popup-close]').forEach(function (el) {
      el.addEventListener('click', close);
    });
  }

  function initHeroGallery() {
    var gallery = document.querySelector('[data-hero-gallery]');
    if (!gallery) return;
    var slides = gallery.querySelectorAll('[data-hero-slide]');
    if (slides.length < 2) return;
    var i = 0;
    var mq = window.matchMedia('(max-width: 760px)');
    function show(n) {
      slides.forEach(function (s, idx) {
        s.classList.toggle('is-active', idx === n);
      });
    }
    function tick() {
      if (!mq.matches) return;
      i = (i + 1) % slides.length;
      show(i);
    }
    setInterval(tick, 3500);
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateCartBadges();
    updateAuthUI();
    bindAddToCartButtons();
    bindAccountForms();
    renderCartPage();
    renderCheckoutPage();
    initPopup();
    initHeroGallery();
  });

  window.amzShopApi = {
    addToCart: addToCart,
    readCart: readCart,
    readAuth: readAuth,
    cartTotals: cartTotals,
  };
})();
