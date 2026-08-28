/**
 * Studio Portfolio — Main JavaScript
 * Portfolio hover auto-scroll, category filter, navigation
 */
(function () {
  'use strict';

  /* ── Header scroll effect ── */
  var header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  /* ── Mobile nav toggle ── */
  var navToggle = document.querySelector('.nav-toggle');
  var mobileNav = document.querySelector('.mobile-nav');
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', mobileNav.classList.contains('open'));
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
      });
    });
  }

  /* ── Portfolio Hover Auto-Scroll (all scroll containers) ── */
  document.querySelectorAll('.portfolio-scroll-container').forEach(function (portfolioContainer) {
    var scrollSpeed = 3;
    var scrollDirection = 1;
    var animationId = null;
    var isHovering = false;
    var isDragging = false;
    var startX = 0;
    var scrollLeft = 0;

    function autoScroll() {
      if (!isHovering || isDragging) {
        animationId = null;
        return;
      }

      var maxScroll = portfolioContainer.scrollWidth - portfolioContainer.clientWidth;
      if (maxScroll <= 0) {
        animationId = null;
        return;
      }

      portfolioContainer.scrollLeft += scrollSpeed * scrollDirection;

      if (portfolioContainer.scrollLeft >= maxScroll - 2) {
        scrollDirection = -1;
      } else if (portfolioContainer.scrollLeft <= 2) {
        scrollDirection = 1;
      }

      animationId = requestAnimationFrame(autoScroll);
    }

    portfolioContainer.addEventListener('mouseenter', function () {
      isHovering = true;
      if (!animationId) {
        animationId = requestAnimationFrame(autoScroll);
      }
    });

    portfolioContainer.addEventListener('mouseleave', function () {
      isHovering = false;
      isDragging = false;
      portfolioContainer.classList.remove('is-dragging');
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    });

    portfolioContainer.addEventListener('mousedown', function (e) {
      isDragging = true;
      portfolioContainer.classList.add('is-dragging');
      startX = e.pageX - portfolioContainer.offsetLeft;
      scrollLeft = portfolioContainer.scrollLeft;
    });

    portfolioContainer.addEventListener('mouseup', function () {
      isDragging = false;
      portfolioContainer.classList.remove('is-dragging');
    });

    portfolioContainer.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      e.preventDefault();
      var x = e.pageX - portfolioContainer.offsetLeft;
      portfolioContainer.scrollLeft = scrollLeft - (x - startX) * 1.5;
    });

    var touchStartX = 0;
    var touchScrollLeft = 0;

    portfolioContainer.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].pageX;
      touchScrollLeft = portfolioContainer.scrollLeft;
    }, { passive: true });

    portfolioContainer.addEventListener('touchmove', function (e) {
      portfolioContainer.scrollLeft = touchScrollLeft - (e.touches[0].pageX - touchStartX);
    }, { passive: true });
  });

  /* ── Portfolio category tabs (portfolio page) ── */
  document.querySelectorAll('.portfolio-category-tabs').forEach(function (filterBar) {
    var section = filterBar.closest('.portfolio-section');
    var cards = section ? section.querySelectorAll('.portfolio-card') : [];
    var track = section ? section.querySelector('.portfolio-scroll-track') : null;

    filterBar.querySelectorAll('.portfolio-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');

        filterBar.querySelectorAll('.portfolio-tab-btn').forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');

        cards.forEach(function (card) {
          if (filter === 'all') {
            card.classList.remove('is-hidden');
            return;
          }
          var cats = (card.getAttribute('data-categories') || '').split(/\s+/);
          card.classList.toggle('is-hidden', cats.indexOf(filter) === -1);
        });

        if (track) {
          var container = section.querySelector('.portfolio-scroll-container');
          if (container) container.scrollLeft = 0;
        }
      });
    });
  });

  /* ── Legacy work page filter buttons ── */
  document.querySelectorAll('.portfolio-category-filter').forEach(function (filterBar) {
    var cards = filterBar.closest('.portfolio-section') ?
      filterBar.closest('.portfolio-section').querySelectorAll('.portfolio-card') : [];

    filterBar.querySelectorAll('.portfolio-filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');

        filterBar.querySelectorAll('.portfolio-filter-btn').forEach(function (b) {
          b.classList.remove('is-active');
        });
        btn.classList.add('is-active');

        cards.forEach(function (card) {
          if (filter === 'all') {
            card.classList.remove('is-hidden');
            return;
          }
          var cats = (card.getAttribute('data-categories') || '').split(/\s+/);
          card.classList.toggle('is-hidden', cats.indexOf(filter) === -1);
        });
      });
    });
  });

  /* ── Smooth scroll for same-page anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── Fade-in on scroll ── */
  var fadeElements = document.querySelectorAll('.fade-in');
  if (fadeElements.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    fadeElements.forEach(function (el) {
      observer.observe(el);
    });
  }
})();
