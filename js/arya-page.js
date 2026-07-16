/* =========================================================
   ARYA listing page – categories, Load more, heading focus
   ========================================================= */

(function () {
  const INITIAL_VISIBLE = 2;
  const LOAD_STEP = 2;

  const content = document.getElementById('aryaContent');
  const searchInput = document.getElementById('searchInput');
  const noResults = document.getElementById('noResults');
  const filterBtns = document.querySelectorAll('.arya-filter-btn');

  /** @type {Record<string, number>} visible count per section */
  const visibleCount = {};
  /** @type {string[]} section order */
  let sectionOrder = ARYA_SECTIONS.map(s => s.id);
  let focusedSection = null;
  let searchQuery = '';

  ARYA_SECTIONS.forEach(s => {
    visibleCount[s.id] = INITIAL_VISIBLE;
  });

  function articlesFor(sectionId) {
    return ARTICLES.filter(a => a.section === sectionId && !a.listingHidden);
  }

  function filteredArticles(sectionId) {
    const q = searchQuery.trim().toLowerCase();
    return articlesFor(sectionId).filter(a => {
      if (!q) return true;
      const hay = `${a.title} ${(a.tags || []).join(' ')} ${a.excerpt || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function setFilterActive(sectionId) {
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === sectionId);
    });
  }

  function focusSection(sectionId) {
    focusedSection = sectionId;
    visibleCount[sectionId] = filteredArticles(sectionId).length; // show all
    // Move focused section to top; keep relative order of the rest
    sectionOrder = [sectionId, ...ARYA_SECTIONS.map(s => s.id).filter(id => id !== sectionId)];
    setFilterActive(sectionId);
    render();
    const el = document.getElementById(`sec-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function loadMore(sectionId) {
    visibleCount[sectionId] = (visibleCount[sectionId] || INITIAL_VISIBLE) + LOAD_STEP;
    render();
  }

  function renderSection(section) {
    const all = filteredArticles(section.id);
    const limit = focusedSection === section.id
      ? all.length
      : Math.min(visibleCount[section.id] || INITIAL_VISIBLE, all.length);
    const shown = all.slice(0, limit);
    const hasMore = limit < all.length;
    const single = shown.length === 1 ? ' arya-grid--single' : '';

    const cards = shown.map(a => renderPreviewCard(a)).join('');

    return `
      <section class="arya-section" id="sec-${section.id}" data-section="${section.id}">
        <button type="button" class="arya-section__heading" data-focus="${section.id}" aria-expanded="${focusedSection === section.id}">
          ${section.heading}
        </button>
        <div class="arya-grid${single}" id="grid-${section.id}">
          ${cards}
        </div>
        ${hasMore ? `<button type="button" class="arya-load-more" data-load="${section.id}">Load More</button>` : ''}
      </section>`;
  }

  function render() {
    if (!content) return;

    const sectionsHtml = sectionOrder
      .map(id => ARYA_SECTIONS.find(s => s.id === id))
      .filter(Boolean)
      .map(section => {
        const all = filteredArticles(section.id);
        if (searchQuery && all.length === 0) return '';
        return renderSection(section);
      })
      .join('');

    content.innerHTML = sectionsHtml + `
      <div class="arya-no-results" id="noResults">Žádné články neodpovídají vyhledávání.</div>`;

    const anyVisible = sectionOrder.some(id => filteredArticles(id).length > 0);
    const nr = document.getElementById('noResults');
    if (nr) nr.classList.toggle('visible', !anyVisible);

    // Bind heading clicks
    content.querySelectorAll('[data-focus]').forEach(btn => {
      btn.addEventListener('click', () => focusSection(btn.dataset.focus));
    });

    // Bind Load more
    content.querySelectorAll('[data-load]').forEach(btn => {
      btn.addEventListener('click', () => loadMore(btn.dataset.load));
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.filter;
      if (focusedSection === id) {
        // Reset to default overview
        focusedSection = null;
        sectionOrder = ARYA_SECTIONS.map(s => s.id);
        ARYA_SECTIONS.forEach(s => { visibleCount[s.id] = INITIAL_VISIBLE; });
        filterBtns.forEach(b => b.classList.remove('active'));
        render();
      } else {
        focusSection(id);
      }
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      // When searching, show all matches in each section
      ARYA_SECTIONS.forEach(s => {
        visibleCount[s.id] = filteredArticles(s.id).length || INITIAL_VISIBLE;
      });
      render();
    });
  }

  // Deep-link: arya.html#zkousky / #volny-cas / #zavody
  const hash = (location.hash || '').replace('#', '');
  if (hash && ARYA_SECTIONS.some(s => s.id === hash)) {
    focusSection(hash);
  } else {
    render();
  }
})();
