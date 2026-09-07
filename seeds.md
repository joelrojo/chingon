# seeds

> Not yet canon. Proposals, explorations, open items — dated, terse. Promote to `direction.md` only when Joel confirms. Prune what dies.

## Open items

- **Host** — Render (current home of joelrojo.com) vs a static host. Decide at deploy time; the site is fully static.
- **Repo remote** — private `joelrojo/chingon` on GitHub when Joel says go. Until then, local only.
- **DNS** — ready at Spaceship; point after the host decision. Google Workspace mail stays untouched.
- **Type studies** — prototype uses a system serif stack (Iowan Old Style / Palatino / Georgia); the real one-word type study is still open.
- **Reveal choice** — prototype live; judge the four candidates by feel (below).

## Decided

- **Stack (2026-09-06)** — vanilla JS + Canvas 2D, ES modules, zero dependencies, no build step. Client-side NOAA-style solar math, verified against published LA sun times (solar noon 62.2°, sunset 19:08). Revisit WebGL only if a specific refraction/texture idea demands it. V1 prototype lives in `site/` — dev notes in `site/README.md` (`?h=` hour override, keys 1–4 / `?r=` reveal modes; garden reseeds daily from the Venice date).

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
