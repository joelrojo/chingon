# Images

Every image slot in the book is declared once in `src/content/images.ts`. The `src` there is the
path the book expects. Drop a file at that exact path and it appears — nothing else to wire up.
Until a file exists, the page shows a designed placeholder with the shot note and the minimum
pixel size for that frame at 300 dpi.

```
public/images/
  00-cover/          emblem.png
  01-front-matter/   portrait-oval.jpg
  02-specimen/       aya-specimen-cutout.png
  03-gardener/       aya-botanical-garden.jpg · botanical-plate.jpg
  04-mountain/       rock-face-topo.jpg
  05-kitchen/        overhead-kitchen-diagram.jpg
  06-animals/        aya-with-animals-plate.jpg
  07-vibe/           aya-dancing-dark-club.jpg
  08-cougar/         cougar-silhouette.png · sighting-1603-kyoto.jpg · sighting-1872-fuji.jpg
                     sighting-1998-rave.jpg · sighting-2026-la.jpg · edo-sighting-full-bleed.jpg
  09-badass/         aya-climbing-full-bleed.jpg
  10-field-notes/    quiet-morning.jpg
```

Each folder has its own `README.md` with the shot list and art direction for that section.

## Resolution

Target 300 dpi at printed size. The placeholder on each page prints the exact minimum for its frame.

| Frame | Printed size | Minimum pixels |
|---|---|---|
| Full-bleed page (with ⅛″ bleed) | 6.25 × 8.25 in | 1875 × 2475 |
| Half-page plate | ~5 × 4 in | 1500 × 1200 |
| Small frames (oval portrait, sightings) | ~2.5 × 2.5 in | 900 × 900 |
| Cutouts / silhouettes (PNG, transparent) | varies | ≥ 1500 on the long side |

Bigger is fine — the frame crops with `object-fit: cover`. JPG for photos (quality 90+), PNG only
where transparency matters (`emblem`, `aya-specimen-cutout`, `cougar-silhouette`).

## Crop and treatment controls

All in `src/content/images.ts`, per image:

- `fit` — `cover` (fill + crop, default) or `contain` (show the whole image).
- `focal` — `{ x, y }` in percent. Which point of the photo stays visible when cropping, and the
  zoom origin. `{ x: 50, y: 35 }` keeps a face a third of the way down.
- `scale` — zoom in (`1.2` = 20 % tighter) around the focal point.
- `treatment` — `graphite`, `sepia`, `faded`, `night`, or `none`. These are CSS filters; they
  survive PDF export, but for a press run consider baking the look into the file instead.

## Adding a new image slot

1. Add an entry to `images` in `src/content/images.ts` (give it a `src`, `note`, `brief`).
2. Place `<ImageFrame image="your.id" variant="plate" aspect="4 / 5" />` on a page.
3. Drop the file at `public/images/<section>/<file>`.

Full-bleed photo? Use `variant="bleed"` and put annotations inside the frame as children — their
percentage coordinates are measured against the trim box, so they land in the same place in the
digital and print exports.
