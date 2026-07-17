/**
 * Reusable PhotoSwipe 5 gallery for all article pages.
 * Auto-initializes every `.article-gallery` on the page.
 * Future galleries only need the same markup — no per-page JS.
 */
(function () {
  const GALLERY_SELECTOR = '.article-gallery';
  const ITEM_SELECTOR = 'a.article-gallery__item';

  function assetPrefix() {
    // Root pages vs nested arya/ or articles-blog/
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    // pathname like /arya/foo.html => depth 2 => ../
    // pathname like /arya.html => depth 1 => ''
    const path = window.location.pathname;
    if (path.includes('/arya/') || path.includes('/articles-blog/')) return '../';
    return '';
  }

  function resolvePath(path) {
    if (!path) return path;
    if (/^https?:\/\//i.test(path) || path.startsWith('/')) return path;
    return assetPrefix() + path.replace(/^\.\.\//, '');
  }

  /** Ensure gallery items are PhotoSwipe-ready anchors */
  function normalizeGallery(gallery) {
    const items = [...gallery.querySelectorAll('.article-gallery__item, a.article-gallery__item, button.article-gallery__item')];
    items.forEach((el, index) => {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      if (!img) return;

      let anchor = el;
      if (el.tagName !== 'A') {
        anchor = document.createElement('a');
        anchor.className = 'article-gallery__item';
        // Move img into anchor and replace original node
        el.replaceWith(anchor);
        anchor.appendChild(img);
      }

      const fullSrc =
        anchor.getAttribute('href') ||
        img.currentSrc ||
        img.getAttribute('data-full') ||
        img.getAttribute('src');

      if (!anchor.getAttribute('href') || anchor.getAttribute('href') === '#') {
        anchor.setAttribute('href', fullSrc);
      }

      // Dimensions for PhotoSwipe (required for correct open animation)
      const w = img.naturalWidth || parseInt(img.getAttribute('width'), 10) || 1600;
      const h = img.naturalHeight || parseInt(img.getAttribute('height'), 10) || 1200;
      if (!anchor.dataset.pswpWidth) anchor.dataset.pswpWidth = String(w);
      if (!anchor.dataset.pswpHeight) anchor.dataset.pswpHeight = String(h);

      if (!img.alt) {
        img.alt = `Fotografie ${index + 1}`;
      }
      if (!anchor.getAttribute('aria-label')) {
        anchor.setAttribute('aria-label', `Zvětšit fotografii ${index + 1}: ${img.alt}`);
      }
      anchor.setAttribute('role', 'button');

      // Prefer highest optimized src for lightbox if provided
      const full = img.getAttribute('data-full') || img.getAttribute('data-pswp-src');
      if (full) {
        anchor.setAttribute('href', resolvePath(full));
        if (img.dataset.fullWidth) anchor.dataset.pswpWidth = img.dataset.fullWidth;
        if (img.dataset.fullHeight) anchor.dataset.pswpHeight = img.dataset.fullHeight;
      }
    });
  }

  async function init() {
    const galleries = document.querySelectorAll(GALLERY_SELECTOR);
    if (!galleries.length) return;

    galleries.forEach(normalizeGallery);

    // Wait for images so naturalWidth/Height are accurate when possible
    await Promise.all(
      [...document.querySelectorAll(`${GALLERY_SELECTOR} img`)].map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
              })
      )
    );
    galleries.forEach(normalizeGallery);

    const prefix = assetPrefix();
    const [{ default: PhotoSwipeLightbox }, { default: PhotoSwipe }] = await Promise.all([
      import(`${prefix}vendor/photoswipe/photoswipe-lightbox.esm.min.js`),
      import(`${prefix}vendor/photoswipe/photoswipe.esm.min.js`),
    ]);

    // Inject CSS once
    if (!document.getElementById('photoswipe-css')) {
      const link = document.createElement('link');
      link.id = 'photoswipe-css';
      link.rel = 'stylesheet';
      link.href = `${prefix}vendor/photoswipe/photoswipe.css`;
      document.head.appendChild(link);
    }

    const lightbox = new PhotoSwipeLightbox({
      gallery: GALLERY_SELECTOR,
      children: ITEM_SELECTOR,
      pswpModule: PhotoSwipe,
      loop: true,
      showHideAnimationType: 'fade',
      bgOpacity: 0.92,
      padding: { top: 40, bottom: 40, left: 40, right: 40 },
      wheelToZoom: true,
      // Accessibility / UX defaults in PhotoSwipe 5:
      // Esc closes, arrows navigate, swipe works, focus trap built-in
    });

    lightbox.on('uiRegister', function () {
      // Ensure close / prev / next have aria labels (PhotoSwipe defaults are OK;
      // reinforce for screen readers)
      lightbox.pswp?.element?.setAttribute('aria-label', 'Galerie fotografií');
    });

    lightbox.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init().catch((err) => console.error('[gallery]', err));
    });
  } else {
    init().catch((err) => console.error('[gallery]', err));
  }
})();
