/**
 * Promo popup — reliable open on homepage.
 * Force: /?show_popup=1
 */
(function () {
  'use strict';

  function boot() {
    var root = document.getElementById('amz-promo-popup') || document.querySelector('[data-popup]');
    if (!root || root.getAttribute('data-popup-bound') === '1') return;
    root.setAttribute('data-popup-bound', '1');

    var key = 'amz_promo_popup_v301';
    // Clear legacy dismiss keys from older theme versions.
    ['amz_promo_popup_dismissed', 'amz_promo_popup_dismissed_v254'].forEach(function (old) {
      try { sessionStorage.removeItem(old); } catch (e) { /* ignore */ }
      document.cookie = old + '=; path=/; max-age=0; SameSite=Lax';
    });

    var days = parseInt(root.getAttribute('data-cookie-days') || '1', 10);
    if (isNaN(days) || days < 0) days = 1;
    var delay = parseInt(root.getAttribute('data-delay') || '700', 10);
    if (isNaN(delay)) delay = 700;
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
      // Hard guarantee against CSS specificity fights.
      root.style.opacity = '1';
      root.style.visibility = 'visible';
      root.style.pointerEvents = 'auto';
      root.style.zIndex = '10050';
    }

    root.querySelectorAll('[data-popup-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        root.style.opacity = '';
        root.style.visibility = '';
        root.style.pointerEvents = '';
        close();
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('is-open')) {
        root.style.opacity = '';
        root.style.visibility = '';
        root.style.pointerEvents = '';
        close();
      }
    });

    var dismissed = false;
    try {
      dismissed = !force && (readCookie(key) === '1' || sessionStorage.getItem(key) === '1');
    } catch (e) {
      dismissed = !force && readCookie(key) === '1';
    }
    if (dismissed) return;

    window.setTimeout(open, Math.max(0, delay));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
