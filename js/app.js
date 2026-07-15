/* =========================================================
   ARYA – app.js
   - Sticky nav scroll effect
   - Mobile nav toggle
   - FAQ accordion
   - Back to top button
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Sticky Nav ---- */
  const nav = document.getElementById('nav');

  /* ---- Mobile Toggle ---- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav__links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const expanded = navLinks.classList.contains('open');
      navToggle.setAttribute('aria-expanded', expanded);
    });

    // Close menu on link click
    navLinks.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }

  /* ---- Back to Top ---- */
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    if (backToTop) {
      if (window.scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }
  }, { passive: true });

  /* ---- FAQ Accordion ---- */
  document.querySelectorAll('[data-faq]').forEach(item => {
    const btn = item.querySelector('.faq__question');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('[data-faq].open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---- Scroll Reveal ---- */
  const revealEls = document.querySelectorAll(
    '.expertise__card, .about-station__inner, .map-section__inner, .faq__item'
  );

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    revealObserver.observe(el);
  });

});
