// chingón — one screen. movement disturbs. stillness reveals.

import { sunPosition, veniceNow, veniceDaySeed, palette } from './solar.js';
import { Settle } from './settle.js';
import { Field } from './field.js';
import { Reveal, MODES } from './reveal.js';
import { Ambience } from './sound.js';
import { clamp, mulberry32 } from './util.js';

const cv = document.getElementById('field');
const params = new URLSearchParams(location.search);
const overrideHour = params.has('h') ? parseFloat(params.get('h')) : null;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const seed = veniceDaySeed();
const settle = new Settle(reduced);
const field = new Field(cv, settle, seed);
const reveal = new Reveal(mulberry32(seed ^ 0x51ab3));

if (params.has('r')) {
  const m = params.get('r');
  reveal.mode = MODES.includes(m) ? m : MODES[(parseInt(m, 10) || 1) - 1] || 'word';
}

let W = 0, H = 0;
function resize() {
  W = innerWidth;
  H = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  field.resize(W, H, dpr);
  reveal.layout(W, H);
}
addEventListener('resize', resize);
resize();

// ---- input: presence as physical force ----
let lx = 0, ly = 0, lt = 0;
addEventListener('pointermove', (e) => {
  field.pointer(e.clientX / W - 0.5, e.clientY / H - 0.5);
  if (reduced) return;
  const t = performance.now();
  if (lt) {
    const dt = Math.max(4, t - lt) / 1000;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    const speed = Math.hypot(dx, dy) / dt / Math.hypot(W, H);
    settle.input(e.clientX, e.clientY, dx / dt, dy / dt, speed);
  }
  lx = e.clientX; ly = e.clientY; lt = t;
}, { passive: true });

addEventListener('pointerdown', (e) => {
  if (!reduced) settle.tap(e.clientX, e.clientY);
});

// reveal candidates, judged by feel (1 word · 2 fragment · 3 both · 4 visual)
addEventListener('keydown', (e) => {
  const i = parseInt(e.key, 10);
  if (i >= 1 && i <= 4) reveal.mode = MODES[i - 1];
});

// ---- sound: opt-in, an object in the environment ----
const amb = new Ambience();
const btn = document.getElementById('sound');
btn.hidden = false;
btn.addEventListener('pointerdown', (e) => e.stopPropagation());
btn.addEventListener('click', () => {
  btn.setAttribute('aria-pressed', String(amb.toggle()));
});

// ---- the clock is the environment ----
let solar = sunPosition(veniceNow(overrideHour));
setInterval(() => { solar = sunPosition(veniceNow(overrideHour)); }, 1000);

let running = true;
let last = performance.now();
document.addEventListener('visibilitychange', () => {
  const wasRunning = running;
  running = !document.hidden;
  amb.setHidden(document.hidden);
  if (running && !wasRunning) {
    last = performance.now();
    requestAnimationFrame(loop);
  }
});

// quiet debug handle (no UI, no logging)
window.__c = { settle, reveal, field, get solar() { return solar; } };

function loop(now) {
  if (!running) return;
  const dt = clamp((now - last) / 1000, 0.001, 0.05);
  last = now;
  const t = now / 1000;

  settle.update(dt);
  const pal = palette(solar.altitude, solar.azimuth);
  field.render(dt, t, solar, pal, settle.R, settle.E,
    (ctx) => reveal.draw(ctx, pal, settle.R, t));
  amb.update(dt, settle.E, settle.R);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
