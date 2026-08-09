/**
 * Customer portal — login, Google verify, track, logout
 */
(function () {
  'use strict';

  var cfg = window.amzCustomer || {};
  var pendingGoogleCredential = '';

  function msg(el, text, isError) {
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || '';
    el.style.color = isError ? '#B91C1C' : '#0B7A3E';
  }

  function post(action, data) {
    var body = new FormData();
    body.append('action', action);
    body.append('nonce', cfg.nonce || '');
    Object.keys(data || {}).forEach(function (k) {
      body.append(k, data[k] == null ? '' : data[k]);
    });
    return fetch(cfg.ajaxUrl, { method: 'POST', body: body, credentials: 'same-origin' })
      .then(function (r) { return r.json(); });
  }

  /* Email / password login */
  var loginForm = document.getElementById('amz-customer-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(loginForm);
      var out = document.getElementById('amz-customer-login-msg');
      var btn = loginForm.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      msg(out, 'Signing in…', false);
      post('amz_prints_customer_login', {
        email: fd.get('email') || '',
        password: fd.get('password') || ''
      }).then(function (res) {
        if (btn) btn.disabled = false;
        if (!res || !res.success) {
          msg(out, (res && res.data && res.data.message) || 'Login failed', true);
          return;
        }
        msg(out, 'Success — redirecting…', false);
        var redirect = fd.get('redirect') || (res.data && res.data.redirect) || cfg.accountUrl;
        window.location.href = redirect;
      }).catch(function () {
        if (btn) btn.disabled = false;
        msg(out, 'Network error. Try again.', true);
      });
    });
  }

  /* Google Identity */
  function handleGoogleCredential(response) {
    pendingGoogleCredential = (response && response.credential) || '';
    var resetForm = document.getElementById('amz-customer-reset-form');
    var out = document.getElementById('amz-customer-google-msg');
    if (!pendingGoogleCredential) {
      msg(out, 'Google verification failed.', true);
      return;
    }
    // Ask for optional new password, or login directly
    if (resetForm) {
      resetForm.hidden = false;
      msg(out, 'Google verified. Set a new password (or leave and click Save to only sign in).', false);
      var passInput = resetForm.querySelector('[name="new_password"]');
      if (passInput) passInput.required = false;
    } else {
      finishGoogle('');
    }
  }

  function finishGoogle(newPassword) {
    var out = document.getElementById('amz-customer-google-msg');
    var redirectField = document.querySelector('[name="redirect"]');
    var redirect = (redirectField && redirectField.value) || '';
    msg(out, 'Verifying with your customer account…', false);
    post('amz_prints_customer_google', {
      id_token: pendingGoogleCredential,
      new_password: newPassword || '',
      redirect: redirect
    }).then(function (res) {
      if (!res || !res.success) {
        msg(out, (res && res.data && res.data.message) || 'Google login failed', true);
        return;
      }
      msg(out, res.data && res.data.passwordUpdated ? 'Password saved. Redirecting…' : 'Signed in. Redirecting…', false);
      window.location.href = redirect || (res.data && res.data.redirect) || cfg.accountUrl;
    }).catch(function () {
      msg(out, 'Network error. Try again.', true);
    });
  }

  var resetForm = document.getElementById('amz-customer-reset-form');
  if (resetForm) {
    resetForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(resetForm);
      finishGoogle(fd.get('new_password') || '');
    });
  }

  function initGoogle() {
    if (!cfg.googleClientId || !window.google || !google.accounts || !google.accounts.id) return;
    var host = document.getElementById('amz-google-btn');
    if (!host) return;
    google.accounts.id.initialize({
      client_id: cfg.googleClientId,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    google.accounts.id.renderButton(host, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
      shape: 'rectangular'
    });
  }

  if (document.getElementById('amz-google-btn')) {
    if (window.google && google.accounts) initGoogle();
    else {
      var tries = 0;
      var t = setInterval(function () {
        tries += 1;
        if (window.google && google.accounts) {
          clearInterval(t);
          initGoogle();
        } else if (tries > 40) clearInterval(t);
      }, 150);
    }
  }

  /* Logout */
  var logoutBtn = document.getElementById('amz-customer-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      post('amz_prints_customer_logout', {}).then(function (res) {
        window.location.href = (res && res.data && res.data.redirect) || cfg.loginUrl;
      });
    });
  }

  /* Account track */
  var trackForm = document.getElementById('amz-customer-track-form');
  if (trackForm) {
    trackForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(trackForm);
      var box = document.getElementById('amz-customer-track-result');
      if (box) {
        box.hidden = false;
        box.innerHTML = '<p class="form-note">Looking up your order…</p>';
      }
      post('amz_prints_customer_track', { code: fd.get('code') || '' }).then(function (res) {
        if (!box) return;
        if (!res || !res.success) {
          box.innerHTML = '<div class="track-alert track-alert--error">' +
            ((res && res.data && res.data.message) || 'Order not found on your account') +
            '</div>';
          return;
        }
        var d = res.data || {};
        var items = (d.products || []).map(function (p) { return p.name; }).filter(Boolean).join(', ');
        var timeline = (d.timeline || []).map(function (step) {
          var cls = 'track-timeline__item';
          if (step.current) cls += ' is-current';
          else if (step.done) cls += ' is-done';
          return '<li class="' + cls + '"><span class="track-timeline__dot"></span><span class="track-timeline__label">' +
            (step.status || '') + '</span></li>';
        }).join('');
        box.innerHTML =
          '<div class="track-card">' +
          '<div class="track-card__top"><div><p class="track-card__label">Order</p><h3>' + (d.orderId || d.trackingNumber || '') +
          '</h3></div><span class="track-status-pill">' + (d.status || '') + '</span></div>' +
          (d.customerName ? '<p class="track-meta">Customer: ' + d.customerName + '</p>' : '') +
          (items ? '<p class="track-items">' + items + '</p>' : '') +
          (timeline ? '<ol class="track-timeline">' + timeline + '</ol>' : '') +
          '</div>';
      }).catch(function () {
        if (box) box.innerHTML = '<div class="track-alert track-alert--error">Network error</div>';
      });
    });
  }
})();
