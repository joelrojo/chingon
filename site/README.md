# site

The V1 screen. Vanilla JS + Canvas 2D, ES modules, zero dependencies, no build step.

Run locally (modules need a server):

```
python3 -m http.server 8123 -d site
```

Quiet dev affordances (not UI):

- `?h=19.1` — override the Venice hour (e.g. `?h=23` for night, `?h=6.4` for dawn)
- The board reseeds daily from the Venice date; layouts are stable within a day.

Live: GitHub Pages from this folder → `chingon.io` once Spaceship A records are set (see `../seeds.md`). `CNAME` in this folder is `chingon.io`.

Structure: `js/solar.js` (Venice sun + palette bands) · `js/settle.js` (disturbance energy E, revelation R) · `js/field.js` (the environment) · `js/reveal.js` (what stillness reveals) · `js/sound.js` (opt-in ambience) · `js/main.js` (wiring).
