/**
 * Customer portal — login, signup, Google, email password reset
 */
(function () {
  'use strict';

  var cfg = window.amzCustomer || {};
  var pendingGoogleCredential = '';
  var currentTab = 'login';

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

  function setTab(tab) {
    currentTab = tab === 'register' || tab === 'forgot' ? tab : 'login';
    var root = document.querySelector('[data-auth-root]');
    var tabs = document.querySelector('[data-auth-tabs]');
    var googleBox = document.querySelector('[data-auth-google]');
    if (root) root.setAttribute('data-auth-tab', currentTab);

    document.querySelectorAll('[data-auth-panel]').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-auth-panel') !== currentTab;
    });
    if (tabs) {
      tabs.hidden = currentTab === 'forgot';
      tabs.querySelectorAll('[data-auth-tab]').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-auth-tab') === currentTab);
      });
    }
    if (googleBox) googleBox.hidden = currentTab === 'forgot';
    document.querySelectorAll('[data-google-login-copy]').forEach(function (el) {
      el.hidden = currentTab !== 'login';
    });
    document.querySelectorAll('[data-google-register-copy]').forEach(function (el) {
      el.hidden = currentTab !== 'register';
    });
    var title = document.querySelector('.page-hero h1');
    if (title) {
      title.textContent = currentTab === 'register' ? 'Sign up' : (currentTab === 'forgot' ? 'Reset password' : 'Customer login');
    }
    var lead = document.querySelector('.page-hero__lead');
    if (lead) {
      lead.textContent = currentTab === 'register'
        ? 'Create an account with email, or continue with Google (Google verifies your email).'
        : (currentTab === 'forgot'
          ? 'We will send a verification code to your email so you can set a new password.'
          : 'Log in with your email and password, or continue with Google if you already have an account.');
    }
    try {
      var url = new URL(window.location.href);
      if (currentTab === 'login') url.searchParams.delete('tab');
      else url.searchParams.set('tab', currentTab);
      window.history.replaceState({}, '', url.pathname + url.search);
    } catch (err) { /* ignore */ }
  }

  var root = document.querySelector('[data-auth-root]');
  if (root) currentTab = root.getAttribute('data-auth-tab') || 'login';
  setTab(currentTab);

  document.querySelectorAll('button[data-auth-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTab(btn.getAttribute('data-auth-tab'));
    });
  });

  var loginForm = document.getElementById('amz-customer-login-form');
  var registerForm = document.getElementById('amz-customer-register-form');

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
        password: fd.get('password') || '',
        redirect: fd.get('redirect') || ''
      }).then(function (res) {
        if (btn) btn.disabled = false;
        if (!res || !res.success) {
          msg(out, (res && res.data && res.data.message) || 'Login failed', true);
          return;
        }
        msg(out, 'Success — redirecting…', false);
        window.location.href = fd.get('redirect') || (res.data && res.data.redirect) || cfg.accountUrl;
      }).catch(function () {
        if (btn) btn.disabled = false;
        msg(out, 'Network error. Try again.', true);
      });
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(registerForm);
      var out = document.getElementById('amz-customer-register-msg');
      var btn = registerForm.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      msg(out, 'Creating account…', false);
      post('amz_prints_customer_register', {
        name: fd.get('name') || '',
        email: fd.get('email') || '',
        phone: fd.get('phone') || '',
        password: fd.get('password') || '',
        address: fd.get('address') || '',
        redirect: fd.get('redirect') || ''
      }).then(function (res) {
        if (btn) btn.disabled = false;
        if (!res || !res.success) {
          msg(out, (res && res.data && res.data.message) || 'Sign up failed', true);
          return;
        }
        msg(out, (res.data && res.data.message) || 'Account created — redirecting…', false);
        window.location.href = fd.get('redirect') || (res.data && res.data.redirect) || cfg.accountUrl;
      }).catch(function () {
        if (btn) btn.disabled = false;
        msg(out, 'Network error. Try again.', true);
      });
    });
  }

  /* Forgot password — email verification code */
  var forgotForm = document.getElementById('amz-customer-forgot-form');
  var resetConfirm = document.getElementById('amz-customer-reset-confirm-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(forgotForm);
      var out = document.getElementById('amz-customer-forgot-msg');
      var btn = forgotForm.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      msg(out, 'Sending verification code…', false);
      post('amz_prints_customer_reset_request', { email: fd.get('email') || '' }).then(function (res) {
        if (btn) btn.disabled = false;
        if (!res || !res.success) {
          msg(out, (res && res.data && res.data.message) || 'Could not send code', true);
          return;
        }
        msg(out, (res.data && res.data.message) || 'Code sent. Check your email.', false);
        if (resetConfirm) {
          resetConfirm.hidden = false;
          var hiddenEmail = resetConfirm.querySelector('[name="email"]');
          if (hiddenEmail) hiddenEmail.value = fd.get('email') || '';
        }
      }).catch(function () {
        if (btn) btn.disabled = false;
        msg(out, 'Network error. Try again.', true);
      });
    });
  }
  if (resetConfirm) {
    resetConfirm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(resetConfirm);
      var out = document.getElementById('amz-customer-reset-msg');
      var btn = resetConfirm.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      msg(out, 'Saving new password…', false);
      post('amz_prints_customer_reset_confirm', {
        email: fd.get('email') || '',
        code: fd.get('code') || '',
        new_password: fd.get('new_password') || '',
        redirect: (document.querySelector('#amz-customer-login-form [name="redirect"]') || {}).value || ''
      }).then(function (res) {
        if (btn) btn.disabled = false;
        if (!res || !res.success) {
          msg(out, (res && res.data && res.data.message) || 'Reset failed', true);
          return;
        }
        msg(out, 'Password saved — redirecting…', false);
        window.location.href = (res.data && res.data.redirect) || cfg.accountUrl;
      }).catch(function () {
        if (btn) btn.disabled = false;
        msg(out, 'Network error. Try again.', true);
      });
    });
  }

  /* Google Identity */
  function finishGoogle() {
    var out = document.getElementById('amz-customer-google-msg');
    var redirectField = document.querySelector('[name="redirect"]');
    var redirect = (redirectField && redirectField.value) || '';
    var isSignup = currentTab === 'register';
    msg(out, isSignup ? 'Google verified. Creating your account…' : 'Verifying your Google account…', false);
    post('amz_prints_customer_google', {
      id_token: pendingGoogleCredential,
      create_if_missing: isSignup ? '1' : '',
      redirect: redirect
    }).then(function (res) {
      if (!res || !res.success) {
        msg(out, (res && res.data && res.data.message) || 'Google login failed', true);
        return;
      }
      msg(out, (res.data && res.data.created) ? 'Account created. Redirecting…' : 'Signed in. Redirecting…', false);
      window.location.href = redirect || (res.data && res.data.redirect) || cfg.accountUrl;
    }).catch(function () {
      msg(out, 'Network error. Try again.', true);
    });
  }

  function handleGoogleCredential(response) {
    pendingGoogleCredential = (response && response.credential) || '';
    var out = document.getElementById('amz-customer-google-msg');
    if (!pendingGoogleCredential) {
      msg(out, 'Google verification failed.', true);
      return;
    }
    finishGoogle();
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

  var logoutBtn = document.getElementById('amz-customer-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      post('amz_prints_customer_logout', {}).then(function (res) {
        window.location.href = (res && res.data && res.data.redirect) || cfg.loginUrl;
      });
    });
  }

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
