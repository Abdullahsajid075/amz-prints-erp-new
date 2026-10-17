/**
 * Studio Portfolio — Main JavaScript
 * Portfolio hover auto-scroll, navigation, animations
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

  /* ── Portfolio Hover Auto-Scroll ── */
  var portfolioContainer = document.querySelector('.portfolio-scroll-container');
  var portfolioTrack = document.querySelector('.portfolio-scroll-track');

  if (portfolioContainer && portfolioTrack) {
    var scrollSpeed = 2.5;
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
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    });

    /* Drag to scroll */
    portfolioContainer.addEventListener('mousedown', function (e) {
      isDragging = true;
      portfolioContainer.classList.add('is-dragging');
      startX = e.pageX - portfolioContainer.offsetLeft;
      scrollLeft = portfolioContainer.scrollLeft;
    });

    portfolioContainer.addEventListener('mouseleave', function () {
      isDragging = false;
      portfolioContainer.classList.remove('is-dragging');
    });

    portfolioContainer.addEventListener('mouseup', function () {
      isDragging = false;
      portfolioContainer.classList.remove('is-dragging');
    });

    portfolioContainer.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      e.preventDefault();
      var x = e.pageX - portfolioContainer.offsetLeft;
      var walk = (x - startX) * 1.5;
      portfolioContainer.scrollLeft = scrollLeft - walk;
    });

    /* Touch support */
    var touchStartX = 0;
    var touchScrollLeft = 0;

    portfolioContainer.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].pageX;
      touchScrollLeft = portfolioContainer.scrollLeft;
    }, { passive: true });

    portfolioContainer.addEventListener('touchmove', function (e) {
      var x = e.touches[0].pageX;
      portfolioContainer.scrollLeft = touchScrollLeft - (x - touchStartX);
    }, { passive: true });
  }

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
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
