# seeds

> Not yet canon. Proposals, explorations, open items — dated, terse. Promote to `direction.md` only when Joel confirms. Prune what dies.

## Open items

- **Type studies** — system serif for now (Iowan Old Style / Palatino / Georgia); the one-word type study is still open.
- **Fragment** — `technology · time · tierra` is shelved. The doorway reveal is only `chingón`. Revisit the fragment behind the door later.
- **HTTPS** — live (2026-09-07). GitHub minted `chingon.io` + `www.chingon.io` after a domain remove/re-add. `https_enforced` is on. Auto-renews. MX / Google TXT left alone.
- **Analytics** — **counter.dev** is wired on `/` (`site/index.html`, Pacific UTC−7). Visits/day + referrers; no cookies, no IP fingerprinting, no banner. GoatCounter remains the backup if we ever want paths or self-host.

## Decided

- **Stack (2026-09-06)** — vanilla JS + Canvas 2D, ES modules, zero dependencies, no build step. Client-side NOAA-style solar math still drives the board’s temperature (`?h=` hour override). Garden reseeds daily from the Venice date.
- **Host (2026-09-06)** — GitHub Pages from `/site` on `joelrojo/chingon`. Free. HTTPS on custom domains is real (Let's Encrypt) once DNS points here — not before. Three.js / WebGL / R3F later still fit: those are static files. Move to Cloudflare Pages only if GLB/HDR assets get large, or we want CF's free privacy analytics + instant custom-domain certs.
- **Remote (2026-09-06)** — `joelrojo/chingon` on GitHub, public (Pages on a free plan needs a public repo; the site is public anyway).
- **Doorway (2026-09-06, night)** — topological mycelium-motherboard, not a sunset landscape. Horizon / 3D place reserved for Valle del Sol.
- **Hex cells (2026-09-06, late)** — a miss. Joel not a fan; don't double down on honeycomb. Order without tiling.
- **Reveal (2026-09-06, night)** — current in the board writes `chingón` from the rim; wisps keep moving through the letters. Four-candidate prototype closed.
- **Sound (2026-09-06, night)** — opt-out atmospheric pad (Odyssey / Dune / Matrix / mycelium). No dings. No handpan.

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

Leave MX and existing TXT alone. Done 2026-09-06 — MX/TXT untouched.

## HTTPS, host, analytics (2026-09-06)

- GitHub Pages **is HTTPS** for `chingon.io` (cert approved 2026-09-07 after a custom-domain remove/re-add; `https_enforced` on). A/AAAA + `www` CNAME landed 2026-09-06. MX / Google TXT untouched.
- 3D later does not require a new host. Three.js / WebGL / GSAP / R3F ship as static JS + models. GitHub Pages stays free and enough until a single asset wants a real CDN (big `.glb`, HDR, textures). Then Cloudflare Pages, still free.
- Visits: **counter.dev** (2026-09-06; wired 2026-09-06). Same privacy class as GoatCounter, smaller, closer to "how many people showed up today." No cookies, no logging, no IP fingerprinting. Unique visitors/day + referrers. Pay when ready. GoatCounter if we later need per-path or self-host. Not GA. No banner. Beacon lives in `site/index.html`.

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

## Reveal (closed, 2026-09-06 night)

The word is the reveal. Current in the board writes `chingón` from the rim vias; wisps keep running through the letters. The four-candidate plan is retired. Hex honeycomb was a miss.

## Ambience (2026-09-06 night)

- Opt-out. Starts with the visit (after the first pointer if the browser blocks autoplay).
- Continuous atmosphere — no discrete notes. `E` roughens the air; stillness deepens the floor.
- Odyssey / Dune / Matrix / mycelium. Not a soundtrack, not a ding.

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
2. Does it read as a living system, rather than a page that loaded?
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
