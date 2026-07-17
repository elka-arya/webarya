#!/usr/bin/env python3
"""
Rewrite HTML/JS image references to use optimized assets/images/web copies.
Also normalizes article galleries to PhotoSwipe-ready <a> markup.
Never touches assets/images/originals/.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'assets' / 'images' / 'manifest.json'
SKIP = {'.git', 'scrape-data', 'assets', 'node_modules', 'vendor', 'scripts'}

URL_RE = re.compile(
    r'https://framerusercontent\.com/images/([A-Za-z0-9]+)\.(jpeg|jpg|png|webp|gif)(?:\?[^"\'\s>]*)?',
    re.I,
)


def prefix_for(path: Path) -> str:
    rel = path.relative_to(ROOT)
    depth = len(rel.parts) - 1
    return '../' * depth


def pick_variant(entry: dict, preferred: int) -> dict:
    variants = entry['variants']
    # closest >= preferred, else largest
    larger = [v for v in variants if v['width'] >= preferred]
    return larger[0] if larger else variants[-1]


def picture_html(entry: dict, *, alt: str, preferred: int, sizes: str, prefix: str, lazy: bool = True, full: bool = False) -> str:
    variants = entry['variants']
    display = pick_variant(entry, preferred)
    full_v = entry['full']
    srcset_webp = ', '.join(f'{prefix}{v["webp"]} {v["width"]}w' for v in variants)
    srcset_jpg = ', '.join(f'{prefix}{v["jpg"]} {v["width"]}w' for v in variants)
    loading = 'lazy' if lazy else 'eager'
    fetch = ' fetchpriority="high"' if not lazy else ''
    full_attrs = (
        f' data-full="{prefix}{full_v["webp"]}"'
        f' data-full-width="{full_v["width"]}"'
        f' data-full-height="{full_v["height"]}"'
    )
    return (
        f'<picture>'
        f'<source type="image/webp" srcset="{srcset_webp}" sizes="{sizes}" />'
        f'<source type="image/jpeg" srcset="{srcset_jpg}" sizes="{sizes}" />'
        f'<img src="{prefix}{display["jpg"]}" '
        f'width="{display["width"]}" height="{display["height"]}" '
        f'alt="{alt}" loading="{loading}" decoding="async"{fetch}{full_attrs} />'
        f'</picture>'
    )


def gallery_item_html(entry: dict, *, alt: str, index: int, prefix: str) -> str:
    full = entry['full']
    thumb = pick_variant(entry, 800)
    variants = entry['variants']
    srcset_webp = ', '.join(f'{prefix}{v["webp"]} {v["width"]}w' for v in variants)
    srcset_jpg = ', '.join(f'{prefix}{v["jpg"]} {v["width"]}w' for v in variants)
    sizes = '(max-width: 600px) 100vw, 33vw'
    return (
        f'<a class="article-gallery__item" href="{prefix}{full["webp"]}" '
        f'data-pswp-width="{full["width"]}" data-pswp-height="{full["height"]}" '
        f'aria-label="Zvětšit fotografii {index}: {alt}">'
        f'<picture>'
        f'<source type="image/webp" srcset="{srcset_webp}" sizes="{sizes}" />'
        f'<img src="{prefix}{thumb["jpg"]}" srcset="{srcset_jpg}" sizes="{sizes}" '
        f'width="{thumb["width"]}" height="{thumb["height"]}" '
        f'alt="{alt}" loading="lazy" decoding="async" '
        f'data-full="{prefix}{full["webp"]}" data-full-width="{full["width"]}" data-full-height="{full["height"]}" />'
        f'</picture>'
        f'</a>'
    )


def replace_simple_img(match: re.Match, manifest: dict, prefix: str, *, preferred: int, sizes: str, lazy: bool) -> str:
    image_id = match.group(1)
    entry = manifest.get(image_id)
    if not entry:
        return match.group(0)
    # Try to preserve surrounding alt from context — caller handles full tags
    return f'{prefix}{pick_variant(entry, preferred)["webp"]}'


def rewrite_file(path: Path, manifest: dict) -> bool:
    text = path.read_text(encoding='utf-8')
    original = text
    prefix = prefix_for(path)

    # 1) Normalize galleries first (arya + blog)
    def repl_gallery(m: re.Match) -> str:
        block = m.group(0)
        class_attr = m.group(1) or ''
        imgs = list(URL_RE.finditer(block))
        if not imgs:
            return block
        items = []
        for i, im in enumerate(imgs, 1):
            entry = manifest.get(im.group(1))
            if not entry:
                continue
            items.append(gallery_item_html(entry, alt=f'Fotografie {i}', index=i, prefix=prefix))
        if not items:
            return block
        return f'<div class="article-gallery{class_attr}">\n        ' + '\n        '.join(items) + '\n    </div>'

    text = re.sub(
        r'<div class="article-gallery([^"]*)">[\s\S]*?</div>',
        repl_gallery,
        text,
    )

    # 2) Replace remaining <img ... src="framer..."> with picture where possible
    def repl_img_tag(m: re.Match) -> str:
        tag = m.group(0)
        url_m = URL_RE.search(tag)
        if not url_m:
            return tag
        entry = manifest.get(url_m.group(1))
        if not entry:
            return tag
        alt_m = re.search(r'alt="([^"]*)"', tag)
        alt = alt_m.group(1) if alt_m else ''
        # Heuristics for size
        preferred = 800
        sizes = '(max-width: 768px) 100vw, 50vw'
        lazy = 'loading="eager"' not in tag and 'hero' not in tag
        if 'nav__logo' in tag or 'footer__logo' in tag or 'height="40"' in tag:
            preferred = 200
            sizes = '140px'
            lazy = False
        if 'arya-page-hero' in text[max(0, m.start()-200):m.start()] or 'hero__bg' in text[max(0, m.start()-300):m.start()]:
            preferred = 1600
            sizes = '100vw'
            lazy = False
        if 'article-arya__avatar' in tag:
            preferred = 200
            sizes = '44px'
        return picture_html(entry, alt=alt, preferred=preferred, sizes=sizes, prefix=prefix, lazy=lazy)

    text = re.sub(r'<img\b[^>]*src="https://framerusercontent\.com/images/[^"]+"[^>]*>', repl_img_tag, text)

    # 3) Any leftover bare URLs in JS strings (arya-data etc.)
    def repl_url(m: re.Match) -> str:
        entry = manifest.get(m.group(1))
        if not entry:
            return m.group(0)
        # For JS data files at root js/, prefix is ../
        pfx = prefix_for(path)
        return pfx + entry['full']['webp']

    if path.suffix == '.js':
        # Build richer image objects in arya-data separately
        text = URL_RE.sub(repl_url, text)

    # 4) Ensure gallery.js is loaded after app.js
    if path.suffix == '.html' and 'js/app.js' in text and 'js/gallery.js' not in text:
        text = text.replace(
            f'<script src="{prefix}js/app.js"></script>',
            f'<script src="{prefix}js/app.js"></script>\n  <script src="{prefix}js/gallery.js" type="module"></script>',
        )
        # Also handle without prefix variable mistakes
        text = text.replace(
            '<script src="js/app.js"></script>\n  <script src="js/gallery.js"',
            '<script src="js/app.js"></script>\n  <script src="js/gallery.js"',
        )
        if 'js/gallery.js' not in text:
            text = text.replace(
                '<script src="js/app.js"></script>',
                '<script src="js/app.js"></script>\n  <script src="js/gallery.js" type="module"></script>',
            )
            text = text.replace(
                '<script src="../js/app.js"></script>',
                '<script src="../js/app.js"></script>\n  <script src="../js/gallery.js" type="module"></script>',
            )

    if text != original:
        path.write_text(text, encoding='utf-8')
        return True
    return False


def rewrite_arya_data(manifest: dict) -> None:
    path = ROOT / 'js' / 'arya-data.js'
    text = path.read_text(encoding='utf-8')

    def repl(m: re.Match) -> str:
        entry = manifest.get(m.group(1))
        if not entry:
            return m.group(0)
        # Card images on arya.html (root) — use 800w webp path
        v = pick_variant(entry, 800)
        return v['webp']

    new = URL_RE.sub(repl, text)

    # Enhance renderPreviewCard to output responsive picture
    if 'function optimizedImg' not in new:
        helper = r'''
function pickVariant(entry, preferred) {
  if (!entry || !entry.variants) return null;
  const larger = entry.variants.filter(v => v.width >= preferred);
  return (larger[0] || entry.variants[entry.variants.length - 1]);
}

function optimizedPicture(imagePathOrId, alt, preferred = 800) {
  // imagePathOrId may already be an optimized path like assets/images/web/ID/ID-800.webp
  const m = String(imagePathOrId || '').match(/assets\/images\/web\/([^/]+)\//);
  const id = m ? m[1] : null;
  const prefix = (typeof location !== 'undefined' && (location.pathname.includes('/arya/') || location.pathname.includes('/articles-blog/'))) ? '../' : '';
  if (!id || typeof IMAGE_MANIFEST === 'undefined' || !IMAGE_MANIFEST[id]) {
    return `<div class="arya-preview__img"><img src="${prefix}${imagePathOrId}" alt="${alt}" loading="lazy" decoding="async" /></div>`;
  }
  const entry = IMAGE_MANIFEST[id];
  const display = pickVariant(entry, preferred);
  const srcsetWebp = entry.variants.map(v => `${prefix}${v.webp} ${v.width}w`).join(', ');
  const srcsetJpg = entry.variants.map(v => `${prefix}${v.jpg} ${v.width}w`).join(', ');
  return `<div class="arya-preview__img"><picture>
    <source type="image/webp" srcset="${srcsetWebp}" sizes="(max-width: 900px) 100vw, 360px" />
    <img src="${prefix}${display.jpg}" srcset="${srcsetJpg}" sizes="(max-width: 900px) 100vw, 360px"
      width="${display.width}" height="${display.height}" alt="${alt}" loading="lazy" decoding="async" />
  </picture></div>`;
}

'''
        new = new.replace('/** Relative path prefix when called from arya/*.html */', helper + '/** Relative path prefix when called from arya/*.html */')
        new = new.replace(
            '''  const img = article.image
    ? `<div class="arya-preview__img"><img src="${article.image}" alt="${article.title}" loading="lazy" /></div>`
    : `<div class="arya-preview__img arya-preview__img--empty"></div>`;''',
            '''  const img = article.image
    ? optimizedPicture(article.image, article.title, 800)
    : `<div class="arya-preview__img arya-preview__img--empty"></div>`;'''
        )

    path.write_text(new, encoding='utf-8')


def write_manifest_js(manifest: dict) -> None:
    path = ROOT / 'js' / 'image-manifest.js'
    path.write_text(
        '/* Auto-generated by scripts/rewrite-image-refs.py — do not edit */\n'
        'const IMAGE_MANIFEST = '
        + json.dumps(manifest, indent=2)
        + ';\n',
        encoding='utf-8',
    )


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    write_manifest_js(manifest)
    changed = 0
    for p in ROOT.rglob('*'):
        if any(s in p.parts for s in SKIP):
            continue
        if p.suffix.lower() not in {'.html', '.js'}:
            continue
        if p.name in {'optimize-images.py', 'rewrite-image-refs.py', 'image-manifest.js'}:
            continue
        if p.name == 'arya-data.js':
            continue
        if rewrite_file(p, manifest):
            print('updated', p.relative_to(ROOT))
            changed += 1

    rewrite_arya_data(manifest)
    print('updated js/arya-data.js')

    # Ensure arya.html loads image-manifest before arya-data
    arya = ROOT / 'arya.html'
    t = arya.read_text(encoding='utf-8')
    if 'image-manifest.js' not in t:
        t = t.replace(
            '<script src="js/arya-data.js"></script>',
            '<script src="js/image-manifest.js"></script>\n  <script src="js/arya-data.js"></script>',
        )
        arya.write_text(t, encoding='utf-8')
        print('wired image-manifest into arya.html')

    # Article pages that use renderRecommended need manifest too
    for folder in ('arya', 'articles-blog'):
        for p in (ROOT / folder).glob('*.html'):
            t = p.read_text(encoding='utf-8')
            if 'arya-data.js' in t and 'image-manifest.js' not in t:
                t = t.replace(
                    '<script src="../js/arya-data.js"></script>',
                    '<script src="../js/image-manifest.js"></script>\n  <script src="../js/arya-data.js"></script>',
                )
                p.write_text(t, encoding='utf-8')
                print('wired manifest', p.relative_to(ROOT))

    print(f'Done. Files changed: {changed}+')


if __name__ == '__main__':
    main()
