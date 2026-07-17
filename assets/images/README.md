# Image assets

## Layout

- `originals/` — permanent archive of source photos. **Never modify, rename, or delete.**
- `web/` — optimized copies used by the website (WebP + JPEG/PNG fallbacks, multiple widths).
- `manifest.json` — metadata for responsive `srcset` / lightbox.

The website must reference **only** files under `web/`.

## Regenerate optimized images

```bash
python3 scripts/optimize-images.py      # download originals (if missing) + write web/
python3 scripts/rewrite-image-refs.py  # update HTML/JS to use web/ paths
```

`originals/` is gitignored (large archive). Keep a local backup of that folder.
