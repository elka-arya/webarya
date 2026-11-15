/**
 * In-page photo viewer for article/page galleries only.
 * Listing heroes and article preview cards navigate normally (no lightbox).
 */
(function () {
  var LINK_SELECTOR = 'a.article-gallery__item, a.page-gallery__item';
  var items = [];
  var index = 0;
  var overlay;
  var imgEl;
  var counterEl;
  var prevBtn;
  var nextBtn;

  function srcFrom(item) {
    var img = item.querySelector('img');
    return (
      (img && (img.getAttribute('data-full') || img.getAttribute('data-pswp-src'))) ||
      (item.getAttribute && item.getAttribute('href')) ||
      (img && (img.currentSrc || img.src)) ||
      ''
    );
  }

  function altFrom(item) {
    var img = item.querySelector('img');
    return (img && img.getAttribute('alt')) || 'Fotografie';
  }

  function galleryItemsFor(item) {
    var galleryRoot = item.closest && item.closest('.article-gallery, .page-gallery');
    if (galleryRoot) {
      return Array.prototype.slice.call(galleryRoot.querySelectorAll(LINK_SELECTOR));
    }
    return [item];
  }

  function resolveItem(target) {
    if (!target || !target.closest) return null;
    if (target.closest('.nav, .footer, .article-arya__author, .arya-page-hero, .arya-content, .recommended')) {
      return null;
    }
    var link = target.closest(LINK_SELECTOR);
    if (!link) return null;
    if (link.closest('.arya-page-hero, .arya-card, .arya-preview')) return null;
    return link;
  }

  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'photo-viewer';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Prohlížení fotografie');
    overlay.hidden = true;
    overlay.innerHTML =
      '<button type="button" class="photo-viewer__close" aria-label="Zavřít">&times;</button>' +
      '<button type="button" class="photo-viewer__nav photo-viewer__nav--prev" aria-label="Předchozí fotografie">&#10094;</button>' +
      '<button type="button" class="photo-viewer__nav photo-viewer__nav--next" aria-label="Další fotografie">&#10095;</button>' +
      '<figure class="photo-viewer__stage">' +
      '<img class="photo-viewer__img" alt="" />' +
      '<figcaption class="photo-viewer__counter"></figcaption>' +
      '</figure>';
    document.body.appendChild(overlay);

    imgEl = overlay.querySelector('.photo-viewer__img');
    counterEl = overlay.querySelector('.photo-viewer__counter');
    prevBtn = overlay.querySelector('.photo-viewer__nav--prev');
    nextBtn = overlay.querySelector('.photo-viewer__nav--next');

    overlay.querySelector('.photo-viewer__close').addEventListener('click', close);
    prevBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      show(index - 1);
    });
    nextBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      show(index + 1);
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
  }

  function show(i) {
    if (!items.length) return;
    index = (i + items.length) % items.length;
    var item = items[index];
    imgEl.src = srcFrom(item);
    imgEl.alt = altFrom(item);
    counterEl.textContent = items.length > 1 ? index + 1 + ' / ' + items.length : '';
    var many = items.length > 1;
    prevBtn.hidden = !many;
    nextBtn.hidden = !many;
  }

  function open(item) {
    ensureOverlay();
    items = galleryItemsFor(item);
    var start = items.indexOf(item);
    if (start < 0) {
      items = [item];
      start = 0;
    }
    overlay.hidden = false;
    document.body.classList.add('photo-viewer-open');
    show(start);
  }

  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    imgEl.removeAttribute('src');
    document.body.classList.remove('photo-viewer-open');
  }

  document.addEventListener(
    'click',
    function (e) {
      var item = resolveItem(e.target);
      if (!item) return;
      e.preventDefault();
      e.stopPropagation();
      open(item);
    },
    true
  );

  document.addEventListener(
    'auxclick',
    function (e) {
      if (!resolveItem(e.target)) return;
      e.preventDefault();
    },
    true
  );

  document.addEventListener(
    'keydown',
    function (e) {
      if (!overlay || overlay.hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        show(index - 1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        show(index + 1);
      }
    },
    true
  );
})();
