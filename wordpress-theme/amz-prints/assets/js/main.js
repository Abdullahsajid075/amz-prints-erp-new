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

  /* Hero slider */
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

  document.querySelectorAll('[data-wa-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      openWhatsApp(buildWaMessage(form));
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
})();
