# seeds

> Not yet canon. Proposals, explorations, open items — dated, terse. Promote to `direction.md` only when Joel confirms. Prune what dies.

## Open items

- **Type studies** — prototype uses a system serif stack (Iowan Old Style / Palatino / Georgia); the real one-word type study is still open.
- **Reveal choice** — prototype live; judge the four candidates by feel (below).
- **Fragment** — working line is `technology · time · tierra`. Swap if Joel wants two words only (`technology × tierra`) or a different third T (threshold, thread, tend).
- **DNS at Spaceship** — add the GitHub Pages A/AAAA records below. Do not touch MX (`smtp.google.com`) or the Google site-verification TXT.

## Decided

- **Stack (2026-09-06)** — vanilla JS + Canvas 2D, ES modules, zero dependencies, no build step. Client-side NOAA-style solar math, verified against published LA sun times (solar noon 62.2°, sunset 19:08). Revisit WebGL only if a specific refraction/texture idea demands it. V1 prototype lives in `site/` — dev notes in `site/README.md` (`?h=` hour override, keys 1–4 / `?r=` reveal modes; garden reseeds daily from the Venice date).
- **Host (2026-09-06)** — GitHub Pages from `/site` on `joelrojo/chingon`. Simplest static host; free SSL; no extra account. Move to Cloudflare Pages later if we want a faster edge or the repo private.
- **Remote (2026-09-06)** — `joelrojo/chingon` on GitHub, public (Pages on a free plan needs a public repo; the site is public anyway).
- **Fragment (2026-09-06, working)** — `technology · time · tierra`. Technology first (the encompassing system). Time as the third T — already the site's clock, never explained. Tierra last: soil, land, mycelium. English + Spanish is the right mix; equilibrio dropped.
- **Sound (2026-09-06, revised)** — brown-noise wind rejected. Sparse handpan-adjacent strikes + a barely-there D/A bed. Speaks only while settling.

### Spaceship DNS (keep Google Workspace)

Apex `chingon.io` → GitHub Pages:

```
A      @     185.199.108.153
A      @     185.199.109.153
A      @     185.199.110.153
A      @     185.199.111.153
AAAA   @     2606:50c0:8000::153
AAAA   @     2606:50c0:8001::153
AAAA   @     2606:50c0:8002::153
AAAA   @     2606:50c0:8003::153
CNAME  www   joelrojo.github.io
```

Leave MX and existing TXT alone.

## Later: 3D scroll / soil vision (Joel, 2026-09-06)

References: [srii_tech_ reel](https://www.instagram.com/reel/Da2klK9MwRO/), [second reel](https://www.instagram.com/reel/Dci-Pn-vvnH/). Compilation of cinematic 3D product/portfolio sites. Stack they name: Three.js, WebGL, GSAP, React Three Fiber.

Extract, don't copy: spatial depth, material light, scroll as storytelling. Do not import the soda-can / dark-luxury / "stop building basic websites" register — that's the opposite of the doorway.

**The doorway (`/`) stays still.** Scroll-through narrative inverts "movement disturbs / stillness reveals." A 3D soil deck — a whole vision told through terrain — belongs behind the doorway (`/sol`, `/garden`, or its own domain). Check that domain when Joel names it.

V1 does not become React or R3F because a reel used them. Complexity only when it creates experiential value the canvas cannot.

## Settle state machine (proposed, 2026-09-06)

One scalar drives everything: **disturbance energy** `E ∈ [0, 1]`.

- Input (pointer velocity, touch drag) adds energy; time decays it — exponential decay tuned to feel like settling sand, not a timer.
- Every subsystem reads `E`: particle turbulence, filament withdrawal, parallax gain, palette noise, audio roughness.
- States are just bands of `E`: disturbed → settling → still → revelation. No discrete unlocks.
- Revelation begins as `E` approaches zero and keeps deepening with continued stillness — a gradient, not a gate.
- **Symmetry: movement dissolves the reveal again.** The garden keeps no footprints.
- All timing tuned by feel in the build; never a visible countdown or progress.

## Solar bands (proposed, 2026-09-06)

Client-side solar position (SunCalc-style math) for Venice: **33.99° N, 118.46° W**. Map solar altitude to continuous palette/light states — bands blend, never step:

night → astronomical/nautical twilight → civil twilight → morning → midday → afternoon → golden hour → dusk → night

- Night: obsidian + moon blue; different hidden structures visible (constellation logic strongest here).
- Golden hour / dusk: solar gold and sunset apricot enter.
- Midday: brightest, flattest, most exposed.
- Moon phase: later, per the brief.

## Reveal prototyping (decided open, 2026-09-06 — choose by feel)

Build all four on the same settle mechanic; judge in person, in dusk and night states, desktop and phone:

1. The word `chingón` emerges — the type study doubles as the identity work.
2. A short fragment, possibly solar-dependent — a different line at night than at midday. (Fragment copy: Joel's, when the time comes.)
3. Word first; deeper stillness yields a fragment.
4. No words — purely visual alignment: filaments → constellation → geometry resolves.

## Ambience (canon that it exists; how is open)

- Same physics as everything else: `E` maps to roughness/filtering; stillness resolves toward a clear low tone over a wind bed.
- Opt-in without conventional UI — candidates to prototype: first intentional gesture enables audio; a single faint element that behaves like an object in the environment, not a button; a hold/long-press.
- Web Audio; generative or one long seamless loop. Silence always a valid state. No autoplay fights with the browser.

## Mobile posture (proposed)

- Touch drag = disturbance; no touch = settling. Simple and honest.
- No gyro permission prompts — the iOS dialog breaks the spell. Revisit only where motion data is available silently.
- The phone is likely the most common accidental first visit (someone searches his name at dinner). V1 must feel whole there, not reduced.

## Type studies (the identity work)

- One word, two faces: literary/humanist serif candidates × technical mono candidates, tested against the moodboard states (dusk, night).
- Criteria: timeless, quiet confidence; the Ó carries the culture; no western, fantasy, or futurist type.
- Judge the type as the reveal itself — emerging from the environment at settle, not on a spec sheet.

## Experience tests (V1 criteria, runnable)

1. Land cold: do you sense intention within three seconds, before touching anything?
2. Does it read as a place you arrived at, rather than a page that loaded?
3. Move: is disturbance subtle, physical, spatial — beautiful but clearly not the reward?
4. Stop: does settling feel like physics, never a timer? Does something reveal?
5. Visit at ~9 AM, 1 PM, 6 PM, 11 PM Venice time: four different rooms?
6. Squint: do nature and computation read as one system, or as decoration?
7. Count the words on screen: could it work with none?
8. Portfolio smell: zero cards, zero nav, zero bio?
9. Explain test: does anything need explaining? If yes, cut it.
10. Exit feel: slightly more curious than when you arrived?

## Stretch: Venice weather as atmosphere, not depiction (Joel, 2026-09-06)

- Real Venice weather modulates mood; never rendered literally. Rain = dampened palette, slower filaments, softened sound, lower contrast. No drawn raindrops. **The system feels the weather; it doesn't report it.**
- Architecture: astronomy stays the deterministic base; weather is an optional modifier — client-side fetch from a keyless, privacy-safe source (e.g. Open-Meteo), degrading to nothing if unavailable.
- Post-V1.
