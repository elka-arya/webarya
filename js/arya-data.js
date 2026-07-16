/* =========================================================
   ARYA – Article data & shared helpers (Arya section only)
   ========================================================= */

const ARYA_SECTIONS = [
  { id: 'zkousky', label: 'Zkoušky', heading: 'Dosažené zkoušky' },
  { id: 'volny-cas', label: 'Volný čas', heading: 'výlety a volný čas' },
  { id: 'zavody', label: 'Závody', heading: 'Soutěže a výsledky' }
];

const ARTICLES = [
  {
    id: 'vystava-bonitace-ostrava',
    title: 'Výstava a bonitace Ostrava - Zábřeh',
    slug: 'arya/výstava-a-bonitace-ostrava.html',
    section: 'zkousky',
    tags: ['bonitace', 'výstava', 'uchovnění'],
    excerpt: 'Výstava a bonitace Ostrava – Zábřeh 2026',
    image: 'https://framerusercontent.com/images/1DuBkSUp3k20JIg8gTUj8Ts.jpeg?lossless=1&width=1200',
    date: '2026-05-10'
  },
  {
    id: 'yoga-poses',
    title: '5 Beginner Yoga Poses to Start Your Day',
    slug: 'arya/5-beginner-yoga-poses-to-start-your-day.html',
    section: 'zkousky',
    tags: ['ZVV1'],
    excerpt: 'Learn five easy yoga poses to energize your mornings and create a mindful start to your day.',
    image: 'https://framerusercontent.com/images/pmKRH5or014f9jszAqy0oySR07Q.webp?width=1200',
    date: '2024-12-01'
  },
  {
    id: 'how-mindfulness',
    title: 'How Mindfulness Enhances Your Well-Being',
    slug: 'arya/how-mindfulness-enhances-your-well-being.html',
    section: 'zkousky',
    tags: ['Mindfulness', 'Meditation'],
    excerpt: 'Discover the benefits of mindfulness and simple techniques to incorporate it into your daily life.',
    image: 'https://framerusercontent.com/images/5tSoGdjfrVIloq7lVu4fyikseg.webp?width=1200',
    date: '2024-12-02'
  },
  {
    id: 'provodov-skialp',
    title: 'Provodov skialp',
    slug: 'arya/provodov-skialp.html',
    section: 'volny-cas',
    tags: ['Volný čas'],
    excerpt: 'Nejkrásnější místa máme často za domem...',
    image: 'https://framerusercontent.com/images/xMFYCZ6erWNrsI5nYRiU1FmxqZ4.jpg?width=1200',
    date: '2024-12-03'
  },
  {
    id: 'essential-oils',
    title: 'The Healing Power of Essential Oils',
    slug: 'arya/the-healing-power-of-essential-oils.html',
    section: 'volny-cas',
    tags: ['Aromatherapy', 'Relaxation'],
    excerpt: 'Explore the benefits of essential oils and how to use them for relaxation and rejuvenation.',
    image: 'https://framerusercontent.com/images/27YZ7YC70cRVYnjs2bIdyVDBuVw.webp?width=1200',
    date: '2024-12-04'
  },
  {
    id: 'namester-potak',
    title: 'Náměšťské póťák',
    slug: 'arya/náměšťské-póťák.html',
    section: 'volny-cas',
    tags: ['Volný čas'],
    excerpt: 'Sip your way to calmness with these soothing herbal teas and their incredible benefits.',
    image: 'https://framerusercontent.com/images/vp40Vp5PnNE0AoXC4Hn7Vq3e8Xk.jpg?scale-down-to=1024',
    date: '2024-12-06'
  },
  {
    id: 'zavod-baccoru',
    title: 'Závod O starou bačkoru, ZKO Mladcová',
    slug: 'arya/závod-o-starou-bačkoru.html',
    section: 'zavody',
    tags: ['Soutěže', 'ZKO Mladcová', 'ZVV 1'],
    excerpt: 'Náš historicky první závod na domácí půdě ZKO Zlín Mladcová.',
    image: 'https://framerusercontent.com/images/wh8nUqxzw23FvuL0Fa1YI0OWXvI.jpg?width=1200',
    date: '2023-04-22'
  },
  {
    id: 'pohar-hranice',
    title: 'O putovní pohár starosty města Hranice 2025',
    slug: 'arya/o-putovní-pohár-starosty-města-hranice-2025.html',
    section: 'zavody',
    tags: ['Soutěže', 'ZKO Hranice', 'ZVV 1'],
    excerpt: 'Learn how to practice forest bathing to recharge and reduce stress.',
    image: 'https://framerusercontent.com/images/dZJKxKnuFey88P320coNdIo.jpeg?scale-down-to=1024',
    date: '2024-12-08'
  },
  {
    id: 'hard-dog-race-2023',
    title: 'Hard Dog Race Stříbrnice, Kraličák, Jeseníky',
    slug: 'arya/hard-dog-race-2023.html',
    section: 'zavody',
    tags: ['Soutěže', 'HDR', 'run'],
    excerpt: 'Soutěže nejsou jen o výkonu. Jde o společně strávený čas, budování vztahu a relax.',
    image: 'https://framerusercontent.com/images/O1osYKWJBfR5yGJFKrMyfyAugQI.jpeg?scale-down-to=1024',
    date: '2023-09-02'
  },
  {
    id: 'planovany-vrh-a',
    title: 'Plánovaný vrh "A"',
    slug: 'arya/plánovaný-vrh-a.html',
    section: 'volny-cas',
    tags: ['vrh A'],
    excerpt: 'Informace o plánovaném vrhu "A"',
    image: 'https://framerusercontent.com/images/d9ljyi6WpDwXafHHVrYo8NnmEcg.jpeg?width=1200',
    date: '2026-07-06',
    listingHidden: true
  }
];

/** Relative path prefix when called from arya/*.html */
function articleHref(article, fromArticlePage) {
  if (!fromArticlePage) return article.slug;
  return article.slug.replace(/^arya\//, '');
}

function renderPreviewCard(article, { fromArticlePage = false } = {}) {
  const href = articleHref(article, fromArticlePage);
  const tagsHtml = (article.tags || [])
    .map(t => `<span class="arya-tag">${t}</span>`)
    .join('');
  const img = article.image
    ? `<div class="arya-preview__img"><img src="${article.image}" alt="${article.title}" loading="lazy" /></div>`
    : `<div class="arya-preview__img arya-preview__img--empty"></div>`;

  return `
    <a href="${href}" class="arya-preview" data-id="${article.id}" data-section="${article.section}" data-title="${article.title}" data-tags="${(article.tags || []).join(',')}">
      ${img}
      <div class="arya-preview__body">
        <div class="arya-tags">${tagsHtml}</div>
        <h4 class="arya-preview__title">${article.title}</h4>
        <p class="arya-preview__excerpt">${article.excerpt || ''}</p>
      </div>
    </a>`;
}

/** Suggested: prefer shared tags, then same section, then others */
function getSuggestedArticles(currentId, count = 3) {
  const current = ARTICLES.find(a => a.id === currentId);
  if (!current) return ARTICLES.filter(a => !a.listingHidden).slice(0, count);

  const others = ARTICLES.filter(a => a.id !== currentId && !a.listingHidden);
  const currentTags = new Set((current.tags || []).map(t => t.toLowerCase()));

  const scored = others.map(a => {
    const tags = a.tags || [];
    const shared = tags.filter(t => currentTags.has(t.toLowerCase())).length;
    const sameSection = a.section === current.section ? 5 : 0;
    return { article: a, score: shared * 3 + sameSection };
  });

  scored.sort((a, b) => b.score - a.score || b.article.date.localeCompare(a.article.date));
  return scored.slice(0, count).map(s => s.article);
}

function renderRecommended(currentId, containerId, count = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const suggested = getSuggestedArticles(currentId, count);
  const fromArticlePage = !containerId.includes('listing');
  container.innerHTML = suggested
    .map(a => renderPreviewCard(a, { fromArticlePage: true }))
    .join('');
}
