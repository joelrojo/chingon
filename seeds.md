# seeds

> Not yet canon. Proposals, explorations, open items — dated, terse. Promote to `direction.md` only when Joel confirms. Prune what dies.

## Open items

- **Type studies** — prototype uses a system serif stack (Iowan Old Style / Palatino / Georgia); the real one-word type study is still open.
- **Reveal choice** — prototype live; judge the four candidates by feel (below).
- **Fragment** — working line is `technology · time · tierra`. Swap if Joel wants two words only (`technology × tierra`) or a different third T (threshold, thread, tend).
- **DNS at Spaceship** — add the GitHub Pages A/AAAA records below. Do not touch MX (`smtp.google.com`) or the Google site-verification TXT. After DNS lands, GitHub issues a Let's Encrypt cert and we flip `https_enforced`. Until then Pages is HTTP-only on the custom domain.
- **Analytics** — **counter.dev** when Joel makes an account (visits/day, referrals, no cookies, no IP fingerprinting, pay-when-ready). GoatCounter is the backup if we ever want paths or self-host. No Google. No banner.

## Decided

- **Stack (2026-09-06)** — vanilla JS + Canvas 2D, ES modules, zero dependencies, no build step. Client-side NOAA-style solar math, verified against published LA sun times (solar noon 62.2°, sunset 19:08). Revisit WebGL only if a specific refraction/texture idea demands it. V1 prototype lives in `site/` — dev notes in `site/README.md` (`?h=` hour override, keys 1–4 / `?r=` reveal modes; garden reseeds daily from the Venice date).
- **Host (2026-09-06)** — GitHub Pages from `/site` on `joelrojo/chingon`. Free. HTTPS on custom domains is real (Let's Encrypt) once DNS points here — not before. Three.js / WebGL / R3F later still fit: those are static files. Move to Cloudflare Pages only if GLB/HDR assets get large, or we want CF's free privacy analytics + instant custom-domain certs.
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

## HTTPS, host, analytics (2026-09-06)

- GitHub Pages **is HTTPS** for `chingon.io` after the Spaceship A records exist and GitHub mints the cert (minutes to a few hours). Enforce HTTPS only after that — enforcing now fails because the cert doesn't exist yet. `www` CNAME to `joelrojo.github.io`.
- 3D later does not require a new host. Three.js / WebGL / GSAP / R3F ship as static JS + models. GitHub Pages stays free and enough until a single asset wants a real CDN (big `.glb`, HDR, textures). Then Cloudflare Pages, still free.
- Visits: **counter.dev** (2026-09-06). Same privacy class as GoatCounter, smaller, closer to "how many people showed up today." No cookies, no logging, no IP fingerprinting. Unique visitors/day + referrers. Pay when ready. GoatCounter if we later need per-path or self-host. Not GA. No banner. Wire the beacon after Joel creates the site.

## Later: 3D scroll / soil vision (Joel, 2026-09-06)

Raw refs now watched: `~/Downloads/igexport-Da2klK9MwRO.mp4`, `~/Downloads/igexport-Dci-Pn-vvnH.mp4`.

**Reel A** is a compilation. The useful one is Pioneer (seed / corn / breeding): one hero object (a seed, then an ear of corn), scroll chapters with a single line each ("less than 0.01% of seeds make it" → breeders → testing over a field-grid), camera and light doing the storytelling. Also: Getty × Gehry — an archive told by moving through a building. Ignore the "AI × Web Design" wrapper and the concert-hall flex.

**Reel B** is Pear and friends: 3D figure pulling a curtain, grafting hands on a branch, dotted mushroom/cloud primitives on a blueprint grid, a pear tree as stage. Agency site. Steal the *graft* and the *mushroom-as-primitive*, not the "REQUEST PARTNERSHIP" register.

What to extract if we ever build a soil / Valle / vision deck:

- **One object, many chapters.** The seed (or a clod, a mycelial body, a horizon) stays; scroll moves the camera around it. Don't swap scenes like slides.
- **Scroll is the verb, type is the caption.** Huge line, almost no UI. Sound toggle, not a nav.
- **Material light on something living** — translucent seed, bark, graft tape, soil crumb — not a chrome soda can.
- **Blueprint × organism** (Pear's dotted mushroom on a grid) is closer to "technology remembering it is nature" than a photoreal farm.

What not to import: agency CTAs, "learn 3D web" energy, brutalist billboard type as identity, scroll on the doorway.

**The doorway (`/`) stays still.** Scroll-story and the soil/vision deck live on the other domain, other thread. Do not import them here. The only story on chingon.io is time: Venice sun, later weather. Not scroll.

V1 does not become R3F because a reel used it.

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
