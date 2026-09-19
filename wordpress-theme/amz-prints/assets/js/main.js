/**
 * AMZ Prints — mega menu (click stay open), WhatsApp forms, hero, AI
 */
(function () {
  'use strict';

  var cfg = window.amzPrints || {};
  var header = document.getElementById('site-header');
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');

  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('nav-open', open);
    });
  }

  /* More dropdown */
  var moreTrigger = document.querySelector('.more-trigger');
  var moreMenu = document.getElementById('more-menu');
  if (moreTrigger && moreMenu) {
    moreTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var open = !moreMenu.classList.contains('is-open');
      closeMega();
      moreMenu.classList.toggle('is-open', open);
      moreTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* Mega menu — click to open, stays open until outside click */
  var mega = document.getElementById('mega-menu-services');
  var megaTrigger = document.querySelector('.mega-trigger');

  function openMega() {
    if (!mega || !megaTrigger) return;
    if (moreMenu) {
      moreMenu.classList.remove('is-open');
      if (moreTrigger) moreTrigger.setAttribute('aria-expanded', 'false');
    }
    mega.classList.add('is-open');
    header && header.classList.add('mega-open');
    megaTrigger.setAttribute('aria-expanded', 'true');
  }
  function closeMega() {
    if (!mega || !megaTrigger) return;
    mega.classList.remove('is-open');
    header && header.classList.remove('mega-open');
    megaTrigger.setAttribute('aria-expanded', 'false');
  }

  if (mega && megaTrigger) {
    megaTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (mega.classList.contains('is-open')) closeMega();
      else openMega();
    });
    mega.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  }

  document.addEventListener('click', function () {
    closeMega();
    if (moreMenu) {
      moreMenu.classList.remove('is-open');
      if (moreTrigger) moreTrigger.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMega();
      if (moreMenu) moreMenu.classList.remove('is-open');
    }
  });

  /* Reveal */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) {
      el.style.setProperty('--reveal-delay', (i % 6) * 60 + 'ms');
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Shop category filter + carousel */
  (function initShop() {
    var cats = document.querySelector('[data-shop-cats]');
    var track = document.querySelector('[data-shop-track]');
    var grid = document.querySelector('[data-shop-grid]');
    var cardsRoot = track || grid;
    if (!cardsRoot) return;

    function visibleCards() {
      return Array.prototype.slice.call(cardsRoot.querySelectorAll('.shop-card')).filter(function (c) {
        return c.style.display !== 'none';
      });
    }

    if (cats) {
      cats.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-cat]');
        if (!btn) return;
        var cat = btn.getAttribute('data-cat');
        cats.querySelectorAll('[data-cat]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        cardsRoot.querySelectorAll('.shop-card').forEach(function (card) {
          var match = cat === 'all' || card.getAttribute('data-category') === cat;
          card.style.display = match ? '' : 'none';
        });
        if (track) goTo(0);
        buildDots();
      });
    }

    if (!track) return;
    var page = 0;
    var dotsWrap = document.querySelector('[data-shop-dots]');
    var prev = document.querySelector('[data-shop-prev]');
    var next = document.querySelector('[data-shop-next]');

    function perPage() {
      if (window.innerWidth <= 560) return 1;
      if (window.innerWidth <= 900) return 2;
      return 3;
    }

    function maxPage() {
      var n = visibleCards().length;
      return Math.max(0, Math.ceil(n / perPage()) - 1);
    }

    function goTo(p) {
      page = Math.max(0, Math.min(p, maxPage()));
      var card = visibleCards()[0];
      var gap = 18;
      var w = card ? card.getBoundingClientRect().width + gap : 280;
      track.style.transform = 'translateX(' + (-page * perPage() * w) + 'px)';
      if (dotsWrap) {
        Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
          d.classList.toggle('is-active', i === page);
        });
      }
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      var m = maxPage();
      for (var i = 0; i <= m; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'shop-dot' + (i === page ? ' is-active' : '');
        b.setAttribute('data-shop-dot', String(i));
        dotsWrap.appendChild(b);
      }
      goTo(Math.min(page, m));
    }

    if (prev) prev.addEventListener('click', function () { goTo(page - 1); });
    if (next) next.addEventListener('click', function () { goTo(page + 1); });
    if (dotsWrap) {
      dotsWrap.addEventListener('click', function (e) {
        var d = e.target.closest('[data-shop-dot]');
        if (!d) return;
        goTo(parseInt(d.getAttribute('data-shop-dot'), 10) || 0);
      });
    }
    window.addEventListener('resize', function () { buildDots(); });
    buildDots();
  })();

  /* Hero slider (legacy) */
  var heroSlider = document.querySelector('[data-hero-slider]');
  if (heroSlider) {
    var slides = Array.prototype.slice.call(heroSlider.querySelectorAll('.hero__slide'));
    var dots = Array.prototype.slice.call(heroSlider.querySelectorAll('[data-hero-dot]'));
    var interval = parseInt(heroSlider.getAttribute('data-hero-interval'), 10) || 3000;
    var index = 0;
    var timer = null;
    function goTo(next) {
      if (slides.length < 2) return;
      slides[index].classList.remove('is-active');
      slides[index].classList.add('is-leaving');
      var prev = index;
      index = (next + slides.length) % slides.length;
      slides[index].classList.add('is-active');
      dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === index); });
      window.setTimeout(function () { slides[prev].classList.remove('is-leaving'); }, 900);
    }
    function start() {
      stop();
      if (slides.length > 1) timer = window.setInterval(function () { goTo(index + 1); }, interval);
    }
    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var t = parseInt(dot.getAttribute('data-hero-dot'), 10);
        if (!isNaN(t) && t !== index) { goTo(t); start(); }
      });
    });
    heroSlider.addEventListener('mouseenter', stop);
    heroSlider.addEventListener('mouseleave', start);
    start();
  }

  /* Premium hero — 3 independent sliders (5s) + light parallax */
  var heroPremium = document.querySelector('[data-hero-premium]');
  if (heroPremium) {
    var flex = heroPremium.querySelector('[data-hero-flex]');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var slots = Array.prototype.slice.call(heroPremium.querySelectorAll('[data-hero-slot]'));

    slots.forEach(function (slot) {
      var slides = Array.prototype.slice.call(slot.querySelectorAll('[data-hero-slide]'));
      var dots = Array.prototype.slice.call(slot.querySelectorAll('.hero-slot__dot'));
      if (slides.length < 2) return;
      var idx = 0;
      var interval = parseInt(slot.getAttribute('data-interval'), 10) || 5000;
      var startDelay = parseInt(slot.getAttribute('data-delay'), 10) || 0;

      function goTo(next) {
        slides[idx].classList.remove('is-active');
        slides[idx].classList.add('is-leaving');
        var prev = idx;
        idx = (next + slides.length) % slides.length;
        slides[idx].classList.add('is-active');
        dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === idx); });
        window.setTimeout(function () {
          slides[prev].classList.remove('is-leaving');
        }, 700);
      }

      if (!reduce) {
        window.setTimeout(function () {
          window.setInterval(function () { goTo(idx + 1); }, interval);
        }, startDelay);
      }

      slides.forEach(function (slide) {
        slide.addEventListener('keydown', function (e) {
          if ((e.key === 'Enter' || e.key === ' ') && slide.getAttribute('data-open-product')) {
            e.preventDefault();
            slide.click();
          }
        });
      });
    });

    if (!reduce && flex) {
      heroPremium.addEventListener('pointermove', function (e) {
        var rect = heroPremium.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        var y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        flex.style.transform = 'rotateY(' + (x * -4) + 'deg) rotateX(' + (y * 3) + 'deg) translateZ(0)';
      });
      heroPremium.addEventListener('pointerleave', function () {
        flex.style.transform = '';
      });
    }
  }

  /* Build WhatsApp message from form */
  function buildWaMessage(form) {
    var fd = new FormData(form);
    var lines = [];
    lines.push('REQUIRED INFO');
    lines.push('----------------');
    lines.push('Company: Amazon Printings (Pvt) Ltd');
    lines.push('Source: Website Quote Form');
    lines.push('----------------');
    lines.push('Name: ' + (fd.get('name') || ''));
    lines.push('Company: ' + (fd.get('company') || '-'));
    lines.push('Email: ' + (fd.get('email') || ''));
    lines.push('Phone: ' + (fd.get('phone') || ''));
    lines.push('Service: ' + (fd.get('product') || fd.get('service') || ''));
    lines.push('Quantity: ' + (fd.get('quantity') || '-'));
    lines.push('Needed by: ' + (fd.get('needed_by') || '-'));
    lines.push('Details: ' + (fd.get('details') || fd.get('message') || ''));
    lines.push('----------------');
    lines.push('Header image: ' + ((cfg.wa && cfg.wa.headerImage) ? cfg.wa.headerImage : ''));
    return lines.join('\n');
  }

  function openWhatsApp(text) {
    var num = (cfg.wa && cfg.wa.number) ? cfg.wa.number : '';
    if (!num) {
      alert('Please set WhatsApp number in Theme Customizer → Company Info.');
      return;
    }
    var url = 'https://wa.me/' + num + '?text=' + encodeURIComponent(text);
    window.open(url, '_blank', 'noopener');
  }

  function submitLeadThenWhatsApp(form) {
    var fd = new FormData(form);
    var source = form.getAttribute('data-lead-source') || 'website-quote';
    var btn = form.querySelector('[type="submit"]');
    var waText = buildWaMessage(form);

    function finishWa() {
      if (btn) {
        btn.disabled = false;
      }
      openWhatsApp(waText);
    }

    if (!cfg.ajaxUrl || !cfg.leadNonce) {
      finishWa();
      return;
    }

    if (btn) {
      btn.disabled = true;
    }

    var body = new FormData();
    body.append('action', 'amz_prints_submit_lead');
    body.append('nonce', cfg.leadNonce);
    body.append('source', source);
    body.append('name', fd.get('name') || '');
    body.append('company', fd.get('company') || '');
    body.append('email', fd.get('email') || '');
    body.append('phone', fd.get('phone') || '');
    body.append('product', fd.get('product') || fd.get('service') || '');
    body.append('quantity', fd.get('quantity') || '');
    body.append('needed_by', fd.get('needed_by') || '');
    body.append('details', fd.get('details') || fd.get('message') || '');
    body.append('message', fd.get('message') || fd.get('details') || '');

    // CRM first; WhatsApp always opens even if CRM fails.
    fetch(cfg.ajaxUrl, { method: 'POST', body: body, credentials: 'same-origin' })
      .catch(function () { /* ignore */ })
      .then(function () { finishWa(); });
  }

  document.querySelectorAll('[data-wa-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitLeadThenWhatsApp(form);
    });
  });

  document.querySelectorAll('[data-wa-service]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var service = btn.getAttribute('data-wa-service') || '';
      openWhatsApp('REQUIRED INFO\n----------------\nService inquiry: ' + service + '\nCompany: Amazon Printings (Pvt) Ltd\nPlease share package details.');
    });
  });

  /* WhatsApp float panel */
  var waToggle = document.getElementById('wa-flow-toggle');
  var waPanel = document.getElementById('wa-flow-panel');
  function setWaOpen(on) {
    if (!waPanel || !waToggle) return;
    waPanel.hidden = !on;
    waToggle.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  if (waToggle) {
    waToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setWaOpen(waPanel.hidden);
      setChatOpen(false);
    });
  }
  document.querySelectorAll('[data-open-wa]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      if (cfg.wa && cfg.wa.href) window.open(cfg.wa.href, '_blank', 'noopener');
      else setWaOpen(true);
    });
  });

  /* AI Chat */
  var chatToggle = document.getElementById('ai-chat-toggle');
  var chatClose = document.getElementById('ai-chat-close');
  var chatPanel = document.getElementById('ai-chat-panel');
  var chatForm = document.getElementById('ai-chat-form');
  var chatInput = document.getElementById('ai-chat-input');
  var chatMessages = document.getElementById('ai-chat-messages');

  function setChatOpen(on) {
    if (!chatPanel || !chatToggle) return;
    chatPanel.hidden = !on;
    chatToggle.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  if (chatToggle) {
    chatToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setChatOpen(chatPanel.hidden);
      setWaOpen(false);
    });
  }
  if (chatClose) chatClose.addEventListener('click', function () { setChatOpen(false); });

  function addBubble(text, who) {
    if (!chatMessages) return;
    var div = document.createElement('div');
    div.className = 'ai-chat__bubble ai-chat__bubble--' + who;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  function addTyping() {
    var div = document.createElement('div');
    div.className = 'ai-chat__bubble ai-chat__bubble--bot ai-chat__typing';
    div.id = 'ai-typing';
    div.textContent = '...';
    chatMessages.appendChild(div);
  }
  function removeTyping() {
    var t = document.getElementById('ai-typing');
    if (t) t.remove();
  }
  function askAI(message) {
    addBubble(message, 'user');
    addTyping();
    var body = new FormData();
    body.append('action', 'amz_ai_chat');
    body.append('nonce', cfg.nonce || '');
    body.append('message', message);
    fetch(cfg.ajaxUrl, { method: 'POST', body: body, credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        removeTyping();
        addBubble((json && json.data && json.data.reply) ? json.data.reply : 'Please try WhatsApp.', 'bot');
      })
      .catch(function () {
        removeTyping();
        addBubble('Connection error. Please use WhatsApp.', 'bot');
      });
  }
  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = chatInput.value.trim();
      if (!msg) return;
      chatInput.value = '';
      askAI(msg);
    });
  }
  document.querySelectorAll('[data-ai-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var action = btn.getAttribute('data-ai-action');
      var chat = cfg.chat || {};
      if (action === 'quote' && chat.quote) { window.location.href = chat.quote; return; }
      if (action === 'track' && chat.track) { window.location.href = chat.track; return; }
      if (action === 'services' && chat.services) { window.location.href = chat.services; return; }
      if (action === 'whatsapp') {
        if (cfg.wa && cfg.wa.href) window.open(cfg.wa.href, '_blank', 'noopener');
        else setWaOpen(true);
      }
    });
  });

  /* ===== Press Atelier 3.0 motion ===== */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  /* Scroll progress */
  var progress = document.getElementById('amz-progress');
  function updateProgress() {
    if (!progress) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    progress.style.setProperty('--amz-progress', pct.toFixed(2) + '%');
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* Soft cursor orb */
  var cursor = document.getElementById('amz-cursor');
  if (cursor && finePointer && !reduceMotion) {
    var cx = 0, cy = 0, tx = 0, ty = 0, raf = 0;
    function loopCursor() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.left = cx + 'px';
      cursor.style.top = cy + 'px';
      raf = requestAnimationFrame(loopCursor);
    }
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.add('is-on');
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var hot = e.target.closest('a, button, [data-open-product], .shop-card, .mega-card, .btn');
      cursor.classList.toggle('is-hot', !!hot);
    });
    raf = requestAnimationFrame(loopCursor);
  } else if (cursor) {
    cursor.remove();
  }

  /* Magnetic buttons */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.btn--magnetic').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (x * 0.18) + 'px,' + (y * 0.22) + 'px)';
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* 3D tilt cards */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.has-tilt').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (0.5 - py) * 8;
        var ry = (px - 0.5) * 10;
        card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-2px)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* Back to top */
  var backTop = document.getElementById('amz-back-top');
  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* Digital services stage slideshow */
  document.querySelectorAll('[data-ds-stage]').forEach(function (stage) {
    var imgs = Array.prototype.slice.call(stage.querySelectorAll('.ds-stage__img'));
    if (imgs.length < 2) return;
    var i = 0;
    if (reduceMotion) return;
    window.setInterval(function () {
      imgs[i].classList.remove('is-active');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('is-active');
    }, 4500);
  });
})();
