/**
 * AMZ Prints — interactions
 */
(function () {
  'use strict';

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

  /* Mega menu */
  var mega = document.getElementById('mega-menu-services');
  var megaTrigger = document.querySelector('.mega-trigger');
  if (mega && megaTrigger) {
    mega.hidden = false;
    function openMega(on) {
      mega.classList.toggle('is-open', on);
      megaTrigger.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    megaTrigger.addEventListener('click', function (e) {
      if (window.innerWidth <= 860) {
        e.preventDefault();
        openMega(!mega.classList.contains('is-open'));
      }
    });
    megaTrigger.addEventListener('mouseenter', function () {
      if (window.innerWidth > 860) openMega(true);
    });
    var hasMega = megaTrigger.closest('.has-mega');
    if (hasMega) {
      hasMega.addEventListener('mouseleave', function () {
        if (window.innerWidth > 860) openMega(false);
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') openMega(false);
    });
  }

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

  /* Hero slideshow — 3s */
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
      if (slides.length > 1) {
        timer = window.setInterval(function () { goTo(index + 1); }, interval);
      }
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

  /* AI Chatbot */
  var chatToggle = document.getElementById('ai-chat-toggle');
  var chatClose = document.getElementById('ai-chat-close');
  var chatPanel = document.getElementById('ai-chat-panel');
  var chatForm = document.getElementById('ai-chat-form');
  var chatInput = document.getElementById('ai-chat-input');
  var chatMessages = document.getElementById('ai-chat-messages');
  var cfg = (window.amzPrints && window.amzPrints.chat) ? window.amzPrints.chat : { replies: [] };

  function setChatOpen(on) {
    if (!chatPanel || !chatToggle) return;
    chatPanel.hidden = !on;
    chatToggle.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  if (chatToggle) chatToggle.addEventListener('click', function () { setChatOpen(chatPanel.hidden); });
  if (chatClose) chatClose.addEventListener('click', function () { setChatOpen(false); });

  function botReply(text) {
    var lower = (text || '').toLowerCase();
    var replies = cfg.replies || [];
    var found = null;
    for (var i = 0; i < replies.length; i++) {
      var row = replies[i];
      if (!row.keys || row.keys[0] === 'default') continue;
      for (var k = 0; k < row.keys.length; k++) {
        if (lower.indexOf(String(row.keys[k]).toLowerCase()) !== -1) {
          found = row.reply;
          break;
        }
      }
      if (found) break;
    }
    if (!found) {
      for (var d = 0; d < replies.length; d++) {
        if (replies[d].keys && replies[d].keys[0] === 'default') {
          found = replies[d].reply;
          break;
        }
      }
    }
    return found || 'How can I help with printing services?';
  }

  function addBubble(text, who) {
    if (!chatMessages) return;
    var div = document.createElement('div');
    div.className = 'ai-chat__bubble ai-chat__bubble--' + who;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = chatInput.value.trim();
      if (!msg) return;
      addBubble(msg, 'user');
      chatInput.value = '';
      window.setTimeout(function () {
        addBubble(botReply(msg), 'bot');
      }, 450);
    });
  }

  if (window.location.search.indexOf('sent=1') !== -1) {
    var note = document.createElement('div');
    note.className = 'toast-success';
    note.textContent = 'Thanks — we received your message.';
    document.body.appendChild(note);
    setTimeout(function () { note.classList.add('is-show'); }, 50);
    setTimeout(function () {
      note.classList.remove('is-show');
      setTimeout(function () { note.remove(); }, 400);
    }, 4200);
  }
})();
