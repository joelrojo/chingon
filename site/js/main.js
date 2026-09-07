// chingón — one screen. movement disturbs. stillness reveals.

import { sunPosition, veniceNow, veniceDaySeed, palette } from './solar.js';
import { Settle } from './settle.js';
import { Field } from './field.js';
import { Reveal } from './reveal.js';
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

let W = 0, H = 0;
function resize() {
  W = innerWidth;
  H = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  field.resize(W, H, dpr);
  reveal.layout(W, H);
  reveal.bindBoard(field.nodes);
  field.graft(reveal);
}
addEventListener('resize', resize);
resize();

let lx = 0, ly = 0, lt = 0;
addEventListener('pointermove', (e) => {
  unlockSound();
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
  unlockSound();
  if (!reduced) settle.tap(e.clientX, e.clientY);
});

const amb = new Ambience();
const btn = document.getElementById('sound');
btn.hidden = false;
btn.setAttribute('aria-pressed', 'true');
btn.addEventListener('pointerdown', (e) => e.stopPropagation());
btn.addEventListener('click', () => {
  btn.setAttribute('aria-pressed', String(amb.toggle()));
});

function syncSoundBtn() {
  btn.setAttribute('aria-pressed', String(amb.on || amb.wanted));
}

function unlockSound() {
  if (!amb.wanted || amb.on) return;
  amb.start().then(syncSoundBtn);
}

amb.start().then(syncSoundBtn);
addEventListener('keydown', unlockSound, { once: true });

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

window.__c = { settle, reveal, field, get solar() { return solar; } };

function loop(now) {
  if (!running) return;
  const dt = clamp((now - last) / 1000, 0.001, 0.05);
  last = now;
  const t = now / 1000;

  settle.update(dt);
  const pal = palette(solar.altitude, solar.azimuth);
  field.render(dt, t, pal, settle.R, settle.E,
    (ctx) => reveal.draw(ctx, pal, settle.R, settle.E, t, dt));
  amb.update(dt, settle.E, settle.R);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
