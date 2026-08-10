/**
 * Promo popup — show on configured pages; cookie suppresses repeats.
 * Use /?show_popup=1 to force open (ignores cookie/session).
 */
(function () {
  'use strict';
  var root = document.getElementById('amz-promo-popup') || document.querySelector('[data-popup]');
  if (!root) return;

  var key = 'amz_promo_popup_dismissed_v254';
  var days = parseInt(root.getAttribute('data-cookie-days') || '1', 10);
  if (isNaN(days) || days < 0) days = 1;
  var delay = parseInt(root.getAttribute('data-delay') || '600', 10);
  if (isNaN(delay)) delay = 600;
  var force = root.getAttribute('data-force') === '1'
    || /(?:\?|&)show_popup=1(?:&|$)/.test(window.location.search);

  function readCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  function writeCookie(name, value, dayCount) {
    if (dayCount <= 0) return;
    var maxAge = Math.max(1, dayCount) * 24 * 60 * 60;
    document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
  }

  function close() {
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('popup-open');
    if (!force) {
      try { sessionStorage.setItem(key, '1'); } catch (e) { /* ignore */ }
      writeCookie(key, '1', days);
    }
  }

  function open() {
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('popup-open');
  }

  root.querySelectorAll('[data-popup-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('is-open')) close();
  });

  var dismissed = false;
  try {
    dismissed = !force && (readCookie(key) === '1' || sessionStorage.getItem(key) === '1');
  } catch (e) {
    dismissed = !force && readCookie(key) === '1';
  }

  if (dismissed) return;

  window.setTimeout(open, Math.max(0, delay));
})();
