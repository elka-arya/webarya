#!/usr/bin/env python3
"""
Download Framer originals into assets/images/originals/ (archive, never modified after write)
and generate optimized copies into assets/images/web/.

Usage:
  python3 scripts/optimize-images.py
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit('Pillow required: pip3 install Pillow')

ROOT = Path(__file__).resolve().parents[1]
ORIGINALS = ROOT / 'assets' / 'images' / 'originals'
WEB = ROOT / 'assets' / 'images' / 'web'
MANIFEST = ROOT / 'assets' / 'images' / 'manifest.json'

WIDTHS = (400, 800, 1200, 1600, 2400)
QUALITY = 80
HERO_QUALITY = 85
HERO_IDS = {
    'LE0q9A9Jn2mYMdOLUlDrsgHTU',
    'dZJKxKnuFey88P320coNdIo',
    'bBP480lQqun8UcRQHKt3iMr2xM',
}
LOGO_IDS = {
    'gDtBIkSp9fqJEcl9VVGxgFOwPAE', '73QfbTzRbXU8BgaYpgea58C5LWE',
    'mBURVmGZzfTbL81f6o30oZswyvA', 'x4RcMKsB5csPawodZE2qnj2zfl4',
    'uz07HhTMzwJEFjz2PrbKxKp3PI', 'VrnHRh3DsJkDROzr7xg3cLemF4',
    'qyf2qb4vpLMXLdRdHQvHESGtR8',
}

SKIP_DIRS = {'.git', 'scrape-data', 'assets', 'node_modules', 'vendor'}
URL_RE = re.compile(
    r'https://framerusercontent\.com/images/([A-Za-z0-9]+)\.(jpeg|jpg|png|webp|gif)',
    re.I,
)


def collect_sources() -> dict[str, str]:
    """Map image_id -> best download URL (with extension, no query)."""
    sources: dict[str, str] = {}
    for p in ROOT.rglob('*'):
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        if p.suffix.lower() not in {'.html', '.js', '.css'}:
            continue
        text = p.read_text(encoding='utf-8', errors='ignore')
        for m in URL_RE.finditer(text):
            image_id, ext = m.group(1), m.group(2).lower()
            if ext == 'jpeg':
                ext = 'jpg'
            # Prefer jpeg/jpg sources over others if already present
            url = f'https://framerusercontent.com/images/{m.group(1)}.{m.group(2)}'
            if image_id not in sources:
                sources[image_id] = url
    return sources


def download_original(image_id: str, url: str) -> Path | None:
    ORIGINALS.mkdir(parents=True, exist_ok=True)
    existing = [p for p in ORIGINALS.glob(f'{image_id}.*') if p.suffix != '.bin']
    if existing:
        print(f'  keep original {existing[0].name}')
        return existing[0]

    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 webarya-optimizer/1.0'})
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = resp.read()
            ctype = (resp.headers.get('Content-Type') or '').split(';')[0].strip().lower()
    except Exception as exc:
        print(f'  FAIL download {image_id}: {exc}')
        return None

    ext = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
    }.get(ctype)
    if not ext:
        # fall back to URL extension
        ext = Path(url).suffix.lower()
        if ext == '.jpeg':
            ext = '.jpg'
    dest = ORIGINALS / f'{image_id}{ext}'
    dest.write_bytes(data)
    print(f'  saved original {dest.name} ({len(data)//1024} KB, {ctype})')
    return dest


def optimize_one(original: Path, image_id: str) -> dict:
    out_dir = WEB / image_id
    out_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(original) as im:
        im = ImageOps.exif_transpose(im)
        has_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
        if has_alpha and image_id in LOGO_IDS:
            base = im.convert('RGBA')
        else:
            if has_alpha:
                rgba = im.convert('RGBA')
                bg = Image.new('RGB', rgba.size, (250, 250, 250))
                bg.paste(rgba, mask=rgba.split()[-1])
                base = bg
            else:
                base = im.convert('RGB')

        ow, oh = base.size
        quality = HERO_QUALITY if image_id in HERO_IDS else QUALITY
        widths = (200, 400, 800) if image_id in LOGO_IDS else WIDTHS
        variants = []
        produced: set[int] = set()

        for w in widths:
            target_w = min(w, ow)
            if target_w in produced:
                continue
            produced.add(target_w)
            target_h = max(1, round(oh * (target_w / ow)))
            resized = base if target_w == ow else base.resize((target_w, target_h), Image.Resampling.LANCZOS)

            webp_name = f'{image_id}-{target_w}.webp'
            jpg_name = f'{image_id}-{target_w}.jpg'
            webp_path = out_dir / webp_name
            jpg_path = out_dir / jpg_name

            if image_id in LOGO_IDS and base.mode == 'RGBA':
                if not webp_path.exists():
                    resized.save(webp_path, 'WEBP', quality=quality, method=6)
                # PNG fallback for logos with alpha
                png_name = f'{image_id}-{target_w}.png'
                png_path = out_dir / png_name
                if not png_path.exists():
                    resized.save(png_path, 'PNG', optimize=True)
                variants.append({
                    'width': target_w,
                    'height': target_h,
                    'webp': f'assets/images/web/{image_id}/{webp_name}',
                    'jpg': f'assets/images/web/{image_id}/{png_name}',
                })
            else:
                if not webp_path.exists():
                    resized.save(webp_path, 'WEBP', quality=quality, method=6)
                if not jpg_path.exists():
                    rgb = resized.convert('RGB') if resized.mode != 'RGB' else resized
                    rgb.save(jpg_path, 'JPEG', quality=quality, optimize=True, progressive=True)
                variants.append({
                    'width': target_w,
                    'height': target_h,
                    'webp': f'assets/images/web/{image_id}/{webp_name}',
                    'jpg': f'assets/images/web/{image_id}/{jpg_name}',
                })

        largest = max(variants, key=lambda v: v['width'])
        return {
            'id': image_id,
            'originalWidth': ow,
            'originalHeight': oh,
            'original': f'assets/images/originals/{original.name}',
            'variants': sorted(variants, key=lambda v: v['width']),
            'full': {
                'webp': largest['webp'],
                'jpg': largest['jpg'],
                'width': largest['width'],
                'height': largest['height'],
            },
            'thumb': variants[0],
        }


def main() -> None:
    sources = collect_sources()
    print(f'Found {len(sources)} unique images')
    manifest: dict[str, dict] = {}

    for image_id, url in sorted(sources.items()):
        print(f'→ {image_id}')
        original = download_original(image_id, url)
        if not original:
            continue
        try:
            entry = optimize_one(original, image_id)
            manifest[image_id] = entry
            print(f'  optimized {len(entry["variants"])} sizes, full={entry["full"]["width"]}w')
        except Exception as exc:
            print(f'  FAIL optimize: {exc}')

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(f'\nWrote {MANIFEST} ({len(manifest)} entries)')


if __name__ == '__main__':
    main()
