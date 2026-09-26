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
    currentTab = (tab === 'register' || tab === 'forgot' || tab === 'email') ? tab : 'login';
    var root = document.querySelector('[data-auth-root]');
    var googleBox = document.querySelector('[data-auth-google]');
    if (root) root.setAttribute('data-auth-tab', currentTab);

    document.querySelectorAll('[data-auth-panel]').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-auth-panel') !== currentTab;
    });
    if (googleBox) googleBox.hidden = currentTab === 'forgot' || currentTab === 'email';
    document.querySelectorAll('[data-google-login-copy]').forEach(function (el) {
      el.hidden = currentTab !== 'login';
    });
    document.querySelectorAll('[data-google-register-copy]').forEach(function (el) {
      el.hidden = currentTab !== 'register';
    });
    if (currentTab === 'login' || currentTab === 'register') {
      window.setTimeout(function () { if (typeof initGoogle === 'function') initGoogle(); }, 40);
    }
  }

  var root = document.querySelector('[data-auth-root]');
  if (root) currentTab = root.getAttribute('data-auth-tab') || 'login';
  setTab(currentTab);

  document.querySelectorAll('button[data-auth-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTab(btn.getAttribute('data-auth-tab'));
    });
  });

  var emailForm = document.getElementById('amz-customer-email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(emailForm);
      var email = String(fd.get('email') || '').trim();
      var out = document.getElementById('amz-customer-email-msg');
      var btn = emailForm.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      msg(out, 'Checking this email…', false);
      post('amz_prints_customer_lookup', { email: email }).then(function (res) {
        if (btn) btn.disabled = false;
        if (!res || !res.success) {
          msg(out, (res && res.data && res.data.message) || 'Could not check this email', true);
          return;
        }
        var exists = !!(res.data && res.data.exists);
        var target = exists ? 'login' : 'register';
        ['#amz-customer-login-form [name="email"]', '#amz-customer-register-form [name="email"]', '#amz-customer-forgot-form [name="email"]'].forEach(function (sel) {
          var input = document.querySelector(sel);
          if (input) input.value = email;
        });
        setTab(target);
        var note = document.getElementById(exists ? 'amz-customer-login-msg' : 'amz-customer-register-msg');
        msg(note, exists
          ? 'This email already has an account. Log in — we will not create a second one.'
          : 'No account for this email. Create one with your name, mobile number, and delivery address.', false);
      }).catch(function () {
        if (btn) btn.disabled = false;
        msg(out, 'Network error. Try again.', true);
      });
    });
  }

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
          var code = res && res.data && res.data.code;
          if (code === 'need_signup') {
            var emailVal = fd.get('email') || '';
            var hint = document.getElementById('amz-login-signup-hint');
            var link = document.getElementById('amz-login-signup-link');
            if (link) {
              var base = cfg.signupUrl || '/customer-signup/';
              link.href = base + (base.indexOf('?') >= 0 ? '&' : '?') + 'email=' + encodeURIComponent(emailVal);
            }
            msg(out, (res.data && res.data.message) || 'No account for this email. Use Create an account.', true);
            return;
          }
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

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function normalizePhone(value) {
    var phone = String(value || '').replace(/[\s\-().]/g, '');
    if (phone.indexOf('00') === 0) phone = '+' + phone.slice(2);
    return phone;
  }

  function validPhone(value) {
    return /^\+[1-9]\d{7,14}$/.test(normalizePhone(value));
  }

  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(registerForm);
      var out = document.getElementById('amz-customer-register-msg');
      var btn = registerForm.querySelector('[type="submit"]');
      if (!validEmail(fd.get('email'))) {
        msg(out, 'Enter a correct email address.', true);
        return;
      }
      if (!validPhone(fd.get('phone'))) {
        msg(out, 'Enter a mobile number with country code, for example +923001234567.', true);
        return;
      }
      if (String(fd.get('address') || '').trim().length < 8) {
        msg(out, 'Enter a complete delivery address (street, area, and city).', true);
        return;
      }
      if (btn) btn.disabled = true;
      msg(out, 'Creating account…', false);
      post('amz_prints_customer_register', {
        name: fd.get('name') || '',
        email: fd.get('email') || '',
        phone: normalizePhone(fd.get('phone') || ''),
        password: fd.get('password') || '',
        address: fd.get('address') || '',
        redirect: fd.get('redirect') || ''
      }).then(function (res) {
        if (btn) btn.disabled = false;
        if (!res || !res.success) {
          var code = res && res.data && res.data.code;
          if (code === 'need_login') {
            var emailVal = fd.get('email') || '';
            var hint = document.getElementById('amz-signup-login-hint');
            var link = document.getElementById('amz-signup-login-link');
            if (link) {
              var base = cfg.loginUrl || '/customer-login/';
              link.href = base + (base.indexOf('?') >= 0 ? '&' : '?') + 'email=' + encodeURIComponent(emailVal);
            }
            msg(out, (res.data && res.data.message) || 'This email already has an account. Please sign in.', true);
            return;
          }
          msg(out, (res && res.data && res.data.message) || 'Sign up failed', true);
          return;
        }
        if (res.data && res.data.needsVerification) {
          msg(out, res.data.message || 'Check your email and open the verification link, then log in.', false);
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
    var nameField = document.querySelector('#amz-customer-register-form [name="name"]');
    var phoneField = document.querySelector('#amz-customer-register-form [name="phone"]');
    var passField = document.querySelector('#amz-customer-register-form [name="password"]');
    post('amz_prints_customer_google', {
      id_token: pendingGoogleCredential,
      create_if_missing: isSignup ? '1' : '',
      name: nameField ? nameField.value : '',
      phone: phoneField ? phoneField.value : '',
      password: passField ? passField.value : '',
      redirect: redirect
    }).then(function (res) {
      if (!res || !res.success) {
        var gmsg = (res && res.data && res.data.message) || 'Google login failed';
        msg(out, gmsg, true);
        if (!isSignup && /sign up/i.test(gmsg)) {
          var hint = document.getElementById('amz-login-signup-hint');
          if (hint) hint.hidden = false;
        }
        if (isSignup && /already|log in|sign in/i.test(gmsg)) {
          var hintIn = document.getElementById('amz-signup-login-hint');
          if (hintIn) hintIn.hidden = false;
        }
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
    if (!host || host.getAttribute('data-ready') || host.offsetWidth < 40) return;
    host.setAttribute('data-ready', '1');
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

  var profileForm = document.getElementById('amz-customer-profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(profileForm);
      var out = document.getElementById('amz-customer-profile-msg');
      var btn = profileForm.querySelector('[type="submit"]');
      if (!validPhone(fd.get('phone'))) {
        msg(out, 'Enter a mobile number with country code, for example +923001234567.', true);
        return;
      }
      if (String(fd.get('address') || '').trim().length < 8) {
        msg(out, 'Enter a complete delivery address (street, area, and city).', true);
        return;
      }
      if (btn) btn.disabled = true;
      post('amz_prints_customer_profile', {
        name: fd.get('name') || '',
        phone: normalizePhone(fd.get('phone') || ''),
        address: fd.get('address') || ''
      }).then(function (res) {
        if (btn) btn.disabled = false;
        if (!res || !res.success) {
          msg(out, (res && res.data && res.data.message) || 'Could not save your profile', true);
          return;
        }
        msg(out, (res.data && res.data.message) || 'Profile saved.', false);
        window.setTimeout(function () { window.location.reload(); }, 500);
      }).catch(function () {
        if (btn) btn.disabled = false;
        msg(out, 'Network error. Try again.', true);
      });
    });
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

  var cardBtn = document.getElementById('amz-download-card');
  if (cardBtn) {
    cardBtn.addEventListener('click', function () {
      var card = document.getElementById('amz-member-card');
      if (!card) return;
      var prev = document.title;
      document.title = (card.getAttribute('data-card-name') || 'AMZ') + ' — Customer Card';
      document.body.classList.add('amz-print-card');
      window.print();
      setTimeout(function () {
        document.body.classList.remove('amz-print-card');
        document.title = prev;
      }, 400);
    });
  }

  var pngBtn = document.getElementById('amz-download-card-png');
  if (pngBtn) {
    pngBtn.addEventListener('click', function () {
      var card = document.getElementById('amz-member-card');
      if (!card) return;
      var name = card.getAttribute('data-card-name') || 'customer';
      function loadScript(src) {
        return new Promise(function (resolve, reject) {
          if (document.querySelector('script[data-amz-lib="' + src + '"]')) { resolve(); return; }
          var s = document.createElement('script');
          s.src = src;
          s.async = true;
          s.setAttribute('data-amz-lib', src);
          s.onload = function () { resolve(); };
          s.onerror = function () { reject(new Error('lib')); };
          document.head.appendChild(s);
        });
      }
      pngBtn.disabled = true;
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
        .then(function () {
          return html2canvas(card, { scale: 2, useCORS: true, backgroundColor: '#0747a3' });
        })
        .then(function (canvas) {
          var a = document.createElement('a');
          a.href = canvas.toDataURL('image/png');
          a.download = 'AMZ-Prints-Card-' + name.replace(/\s+/g, '-') + '.png';
          a.click();
        })
        .catch(function () {
          cardBtn && cardBtn.click();
        })
        .finally(function () { pngBtn.disabled = false; });
    });
  }
})();
