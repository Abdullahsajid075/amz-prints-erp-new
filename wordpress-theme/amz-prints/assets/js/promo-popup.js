/**
 * Promo popup — session/cookie suppression
 */
(function () {
  'use strict';
  var root = document.querySelector('[data-popup]');
  if (!root) return;

  var key = 'amz_promo_popup_dismissed';
  var days = parseInt(root.getAttribute('data-cookie-days') || '3', 10) || 3;
  var delay = parseInt(root.getAttribute('data-delay') || '800', 10) || 0;

  function readCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  function writeCookie(name, value, dayCount) {
    var maxAge = Math.max(1, dayCount) * 24 * 60 * 60;
    document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
  }

  if (readCookie(key) === '1' || sessionStorage.getItem(key) === '1') {
    return;
  }

  function close() {
    root.hidden = true;
    root.classList.remove('is-open');
    document.body.classList.remove('popup-open');
    sessionStorage.setItem(key, '1');
    writeCookie(key, '1', days);
  }

  function open() {
    root.hidden = false;
    requestAnimationFrame(function () {
      root.classList.add('is-open');
      document.body.classList.add('popup-open');
    });
  }

  root.querySelectorAll('[data-popup-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('is-open')) close();
  });

  setTimeout(open, Math.max(0, delay));
})();
