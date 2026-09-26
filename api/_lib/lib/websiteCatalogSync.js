/**
 * Browser script for amzprints.com (theme 3.12.0 shop-cards).
 * Always reads the live ERP catalog and hides anything without a real photo.
 * Same rule for old rows and newly saved products.
 */
function websiteCatalogSyncScript() {
  return `(function () {
  'use strict';
  var API = 'https://amz-prints-api.vercel.app/api?path=' + encodeURIComponent('/public/products') + '&_=' + Date.now();

  function realPhoto(src) {
    var s = String(src || '').trim();
    return s.length >= 12 && (/^data:image\\//i.test(s) || /^https?:\\/\\//i.test(s));
  }

  function ready(p) {
    if (!p || p.active === false) return false;
    var images = Array.isArray(p.images) ? p.images.slice() : [];
    if (p.image) images.unshift(p.image);
    if (p.photo) images.unshift(p.photo);
    var desc = String(p.description || p.fullDescription || '')
      .replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ').trim();
    return images.some(realPhoto) && desc.length >= 3;
  }

  function listed(p) {
    return ready(p) && p.showOnWebsite !== false;
  }

  function apply(products) {
    products = (products || []).filter(listed);
    var allow = {};
    products.forEach(function (p) {
      allow[String(p.id || '').toLowerCase()] = p;
      allow[String(p.name || '').trim().toLowerCase()] = p;
    });
    var el = document.getElementById('amz-products-data');
    if (el) el.textContent = JSON.stringify(products);
    if (window.amzCommerce) window.amzCommerce.products = products;

    document.querySelectorAll('[data-product-id], .shop-card').forEach(function (card) {
      var id = String(card.getAttribute('data-product-id') || card.getAttribute('data-id') || '').toLowerCase();
      var titleNode = card.querySelector('.shop-card__title, h3, h2');
      var title = titleNode ? String(titleNode.textContent || '').trim().toLowerCase() : '';
      if (!id && !title) return;
      if ((id && allow[id]) || (title && allow[title])) {
        card.hidden = false;
        card.style.removeProperty('display');
        card.removeAttribute('data-amz-delisted');
        return;
      }
      card.hidden = true;
      card.style.display = 'none';
      card.setAttribute('data-amz-delisted', '1');
    });
  }

  fetch(API, { cache: 'no-store', credentials: 'omit' })
    .then(function (r) { return r.json(); })
    .then(function (data) { apply(data && data.products ? data.products : []); })
    .catch(function () { /* keep server markup if API is unreachable */ });
})();`;
}

module.exports = { websiteCatalogSyncScript };
