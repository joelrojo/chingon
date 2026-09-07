// the environment. an abstracted place: horizon, one solar body,
// and a terrain that is deliberately ambiguous — zen garden, circuit,
// topo map, mycelium, irrigation, constellation. all at once.

import { clamp, lerp, smoothstep, mulberry32, makeNoise, mixc, hex } from './util.js';

const TAU = Math.PI * 2;
const GOLD = hex('#C89550');
const BONE = hex('#E8E0D2');
const MOONLIT = hex('#AEBBCA');

const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

export class Field {
  constructor(canvas, settle, seed) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.settle = settle;
    this.seed = seed;
    this.noise = makeNoise(mulberry32(seed ^ 0x9e3779b9));
    this.tmp = { dx: 0, dy: 0, mag: 0 };
    this.par = { x: 0, y: 0, tx: 0, ty: 0 };
    this.hasPointer = false;
    this.pulses = [];
    this.grain = null;

    // ---- normalized layouts: the garden of the day (same seed all day) ----
    const rand = mulberry32(seed);

    this.starsN = [];
    for (let i = 0; i < 200; i++) {
      this.starsN.push({
        x: rand(), y: Math.pow(rand(), 1.25) * 0.9,
        r: 0.35 + rand() * 0.8, ph: rand() * TAU, sp: 0.3 + rand() * 0.9,
      });
    }
    // a hidden structure for the night sky: a chain among the brightest
    this.brightN = [];
    for (let i = 0; i < 13; i++) {
      this.brightN.push({ x: 0.08 + rand() * 0.84, y: 0.06 + Math.pow(rand(), 1.4) * 0.6, r: 1.1 + rand() * 0.7, ph: rand() * TAU });
    }

    this.nodesN = [];
    for (let i = 0; i < 148; i++) {
      const sky = i % 4 === 3;
      this.nodesN.push({
        x: rand(), y: sky ? Math.pow(rand(), 1.3) * 0.82 : rand(),
        sky, ph: rand() * TAU, sp: 0.5 + rand(),
      });
    }

    this.grassN = [];
    for (const c of [{ cx: 0.10, n: 11, spread: 0.11 }, { cx: 0.925, n: 7, spread: 0.075 }]) {
      for (let i = 0; i < c.n; i++) {
        this.grassN.push({
          x: c.cx + (rand() - 0.5) * c.spread,
          len: 0.4 + rand() * 0.6, lean: (rand() - 0.5) * 0.55, ph: rand() * TAU,
        });
      }
    }
    this.agaveN = [];
    const nLeaves = 9;
    for (let i = 0; i < nLeaves; i++) {
      const a = -1.15 + (i / (nLeaves - 1)) * 2.3 + (rand() - 0.5) * 0.15;
      this.agaveN.push({ a, len: 0.5 + rand() * 0.5, bow: 0.10 + rand() * 0.18 });
    }
    this.ridgeSeed = rand() * 90;
    this.rand = rand;
  }

  pointer(nx, ny) {
    this.par.tx = clamp(nx, -0.5, 0.5);
    this.par.ty = clamp(ny, -0.5, 0.5);
    this.hasPointer = true;
  }

  resize(w, h, dpr) {
    this.w = w; this.h = h;
    this.cv.width = Math.round(w * dpr);
    this.cv.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.horizon = h * 0.46;
    const m = Math.min(w, h);
    const groundTop = this.horizon + 6;
    const groundH = h - groundTop;

    this.nodes = this.nodesN.map((n) => ({
      bx: n.x * w,
      by: n.sky ? n.y * this.horizon * 0.95 : groundTop + 6 + n.y * (groundH - 10),
      x: 0, y: 0, sky: n.sky, ph: n.ph, sp: n.sp,
      depth: n.sky ? 0 : n.y,
    }));

    // static topology; growth animates connection
    this.edges = [];
    const seen = new Set();
    const N = this.nodes.length;
    for (let i = 0; i < N; i++) {
      const a = this.nodes[i];
      const reach = (a.sky ? m * 0.11 : lerp(m * 0.085, m * 0.16, a.depth)) * (a.hub ? 1.5 : 1);
      const cand = [];
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const b = this.nodes[j];
        if (a.sky !== b.sky) continue;
        const d2 = (a.bx - b.bx) ** 2 + (a.by - b.by) ** 2;
        if (d2 < reach * reach) cand.push([d2, j]);
      }
      cand.sort((p, q) => p[0] - q[0]);
      const deg = a.hub ? 4 : 2;
      for (const [d2, j] of cand.slice(0, deg)) {
        const key = i < j ? i * 1000 + j : j * 1000 + i;
        if (seen.has(key)) continue;
        seen.add(key);
        const rr = mulberry32(this.seed + key);
        this.edges.push({
          i, j, g: 0, th: rr() * 0.4, len: Math.sqrt(d2),
          bow: (rr() - 0.5) * 0.5, // filaments curve; they are grown, not drawn
        });
      }
    }

    // bright-star chain (night constellation)
    this.bright = this.brightN.map((s) => ({ x: s.x * w, y: s.y * this.horizon, r: s.r, ph: s.ph }));
    this.brightEdges = [];
    for (let i = 0; i < this.bright.length; i++) {
      let best = -1, bd = Infinity;
      for (let j = 0; j < this.bright.length; j++) {
        if (i === j) continue;
        const d = (this.bright[i].x - this.bright[j].x) ** 2 + (this.bright[i].y - this.bright[j].y) ** 2;
        if (d < bd) { bd = d; best = j; }
      }
      if (best > i) this.brightEdges.push([i, best]);
      else if (best >= 0 && !this.brightEdges.some(([a, b]) => a === best && b === i)) this.brightEdges.push([best, i]);
    }

    // particles
    const count = clamp(Math.round((w * h) / 4200), 130, 620);
    this.parts = [];
    for (let i = 0; i < count; i++) {
      this.parts.push({
        x: this.rand() * w, y: this.rand() * h,
        z: 0.25 + this.rand() * 0.75, vx: 0, vy: 0,
      });
    }

    // grain tile (baked once)
    if (!this.grain) {
      const g = document.createElement('canvas');
      g.width = g.height = 160;
      const gc = g.getContext('2d');
      const id = gc.createImageData(160, 160);
      const r = mulberry32(this.seed ^ 0x777);
      for (let i = 0; i < id.data.length; i += 4) {
        const light = r() < 0.5;
        const v = light ? 235 : 12;
        id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = v;
        id.data[i + 3] = r() * 13;
      }
      gc.putImageData(id, 0, 0);
      this.grain = this.ctx.createPattern(g, 'repeat');
    }
  }

  // ---------------------------------------------------------------- render
  render(dt, t, solar, pal, R, E, drawReveal) {
    const { ctx, w, h, horizon } = this;
    const S = this.settle;
    const night = pal.night;
    const calm = 1 - R * 0.35;

    // parallax eases toward pointer; drifts on its own when idle
    if (!this.hasPointer) {
      this.par.tx = this.noise(t * 0.02, 40) * 0.16;
      this.par.ty = this.noise(t * 0.016, 60) * 0.08;
    }
    this.par.x += (this.par.tx - this.par.x) * Math.min(1, dt * 2.0);
    this.par.y += (this.par.ty - this.par.y) * Math.min(1, dt * 2.0);
    const px = this.par.x, py = this.par.y;

    // ---- sky ----
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, rgba(pal.skyTop, 1));
    sky.addColorStop(0.58, rgba(pal.skyMid, 1));
    sky.addColorStop(1, rgba(pal.skyHor, 1));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon + 1);

    // sun position — azimuth compressed so rise and set stay in frame
    const az = solar.azimuth, alt = solar.altitude;
    const sunX = clamp(0.1 + ((az - 100) / 180) * 0.8, 0.06, 0.94) * w;
    const sunY = horizon - (alt / 80) * (horizon * 0.94);
    const sunR = clamp(Math.min(w, h) * 0.042, 16, 42);

    ctx.save();
    ctx.translate(-px * 6, -py * 3);

    // stars
    if (pal.star > 0.02) {
      ctx.fillStyle = rgba(mixc(BONE, MOONLIT, 0.5), 1);
      for (const s of this.starsN) {
        const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
        ctx.globalAlpha = pal.star * (0.22 + 0.55 * tw);
        const sx = s.x * w, sy = s.y * horizon;
        ctx.fillRect(sx, sy, s.r, s.r);
      }
      // the brightest, and — in deep stillness — the structure between them
      for (const b of this.bright) {
        const tw = 0.6 + 0.4 * Math.sin(t * 0.5 + b.ph);
        ctx.globalAlpha = pal.star * (0.5 + 0.5 * tw);
        ctx.fillRect(b.x - b.r / 2, b.y - b.r / 2, b.r * 1.6, b.r * 1.6);
      }
      ctx.globalAlpha = 1;
      const ck = smoothstep(0.55, 0.92, R) * pal.star;
      if (ck > 0.01) {
        ctx.beginPath();
        for (const [i, j] of this.brightEdges) {
          ctx.moveTo(this.bright[i].x, this.bright[i].y);
          ctx.lineTo(this.bright[j].x, this.bright[j].y);
        }
        ctx.strokeStyle = rgba(MOONLIT, 0.22 * ck);
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }

    // sun
    if (pal.sunA > 0.01 && alt > -4) {
      const lowBoost = 1 - clamp(alt / 60, 0, 1) * 0.55;
      const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.3, sunX, sunY, sunR * 7);
      halo.addColorStop(0, rgba(pal.halo, 0.4 * pal.sunA * lowBoost));
      halo.addColorStop(1, rgba(pal.halo, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(sunX - sunR * 7, sunY - sunR * 7, sunR * 14, sunR * 14);

      if (alt > -1) {
        const disc = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
        disc.addColorStop(0, rgba(mixc(BONE, pal.halo, 0.3), 0.95 * pal.sunA));
        disc.addColorStop(0.75, rgba(pal.halo, 0.75 * pal.sunA));
        disc.addColorStop(1, rgba(pal.halo, 0));
        ctx.fillStyle = disc;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();

    // ---- ridge ----
    ctx.save();
    ctx.translate(-px * 10, -py * 4);
    ctx.beginPath();
    ctx.moveTo(-20, horizon + 2);
    const rstep = Math.max(14, w / 90);
    for (let x = -20; x <= w + 20; x += rstep) {
      const n = this.noise(x * 0.0032 + this.ridgeSeed, 11.7);
      const rh = (0.5 + 0.5 * n) * h * 0.045 + h * 0.008;
      ctx.lineTo(x, horizon + 2 - rh);
    }
    ctx.lineTo(w + 20, horizon + 2);
    ctx.closePath();
    ctx.fillStyle = rgba(mixc(pal.skyHor, pal.groundFar, 0.78), 1);
    ctx.fill();
    ctx.restore();

    // ---- ground ----
    const grd = ctx.createLinearGradient(0, horizon, 0, h);
    grd.addColorStop(0, rgba(pal.groundFar, 1));
    grd.addColorStop(1, rgba(pal.groundNear, 1));
    ctx.fillStyle = grd;
    ctx.fillRect(0, horizon, w, h - horizon);

    // sun reflection — a suggestion of water near the horizon
    if (alt > -2 && alt < 18 && pal.sunA > 0.05) {
      const k = (1 - clamp(alt / 18, 0, 1)) * pal.sunA;
      ctx.save();
      ctx.translate(sunX - px * 10, horizon + (h - horizon) * 0.10);
      ctx.scale(1, 2.8);
      const refl = ctx.createRadialGradient(0, 0, sunR * 0.4, 0, 0, sunR * 4.6);
      refl.addColorStop(0, rgba(pal.halo, 0.16 * k));
      refl.addColorStop(1, rgba(pal.halo, 0));
      ctx.fillStyle = refl;
      ctx.fillRect(-sunR * 5, -sunR * 5, sunR * 10, sunR * 10);
      ctx.restore();
    }

    // horizon haze
    const haze = ctx.createLinearGradient(0, horizon - 1, 0, horizon + h * 0.1);
    haze.addColorStop(0, rgba(pal.skyHor, 0.22));
    haze.addColorStop(1, rgba(pal.skyHor, 0));
    ctx.fillStyle = haze;
    ctx.fillRect(0, horizon - 1, w, h * 0.1 + 1);

    // ---- ground plane: contours, network ----
    ctx.save();
    ctx.translate(-px * 16, -py * 6);

    const hasImp = S.impulses.length > 0;
    const rows = clamp(Math.round(h * 0.04), 20, 34);
    const step = Math.max(9, w / 150);
    const lineC = pal.line;

    for (let i = 0; i < rows; i++) {
      const dpt = i / (rows - 1);
      const y0 = horizon + 4 + Math.pow(dpt, 1.55) * (h - horizon + 30);
      const freq = lerp(0.011, 0.0045, dpt);
      const amp = lerp(2.5, 22, dpt) * calm;
      const depthK = lerp(0.35, 1, dpt);
      ctx.beginPath();
      let first = true;
      for (let x = -12; x <= w + 12; x += step) {
        let y = y0 + this.noise(x * freq, i * 3.7 + t * 0.05) * amp;
        let xx = x;
        if (hasImp) {
          S.field(xx, y, this.tmp);
          xx += this.tmp.dx * 0.35 * depthK;
          y += this.tmp.dy * 0.95 * depthK;
        }
        if (first) { ctx.moveTo(xx, y); first = false; }
        else ctx.lineTo(xx, y);
      }
      ctx.strokeStyle = rgba(lineC, pal.lineA * lerp(0.5, 1.05, dpt));
      ctx.lineWidth = lerp(0.6, 1.3, dpt);
      ctx.stroke();
    }

    // ---- filament network: mycelium / circuitry / irrigation ----
    const C = Math.pow(1 - E, 1.6);
    for (const n of this.nodes) {
      n.x = n.bx + this.noise(n.bx * 0.01 + t * 0.02 * n.sp, n.ph) * 6;
      n.y = n.by + this.noise(n.ph, n.by * 0.01 + t * 0.017 * n.sp) * 4;
      if (hasImp && !n.sky) {
        S.field(n.x, n.y, this.tmp);
        n.x += this.tmp.dx * 0.5;
        n.y += this.tmp.dy * 0.5;
        n.dist = this.tmp.mag;
      } else n.dist = 0;
    }

    const skyVis = pal.star; // sky filaments belong to the night
    for (const e of this.edges) {
      const a = this.nodes[e.i], b = this.nodes[e.j];
      let target = smoothstep(e.th, e.th + 0.35, C);
      if (a.dist > 0.25 || b.dist > 0.25) target = 0;
      const rate = target > e.g ? 0.7 : 3.2;
      e.g += (target - e.g) * Math.min(1, dt * rate);
      if (e.g < 0.02) continue;

      const vis = a.sky ? skyVis * smoothstep(0.3, 0.8, R) : 1;
      if (vis < 0.02) continue;
      const alpha = pal.filamentA * 0.30 * e.g * vis * (a.sky ? 0.8 : lerp(0.6, 1, a.depth));
      const mx = lerp(a.x, b.x, e.g), my = lerp(a.y, b.y, e.g);
      // control point bows the filament off the straight line
      const nx = -(b.y - a.y), ny = b.x - a.x;
      const cxp = (a.x + mx) / 2 + nx * e.bow * e.g;
      const cyp = (a.y + my) / 2 + ny * e.bow * e.g;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(cxp, cyp, mx, my);
      ctx.strokeStyle = rgba(pal.filament, alpha);
      ctx.lineWidth = a.sky ? 0.55 : 0.7;
      ctx.stroke();
    }
    // node points
    for (const n of this.nodes) {
      const vis = n.sky ? skyVis : 1;
      if (vis < 0.02) continue;
      const base = n.hub ? 0.5 : 0.3;
      ctx.fillStyle = rgba(pal.filament, pal.filamentA * (base + 0.3 * C) * vis);
      const r = n.hub ? 1.7 : 1.05;
      ctx.fillRect(n.x - r / 2, n.y - r / 2, r, r);
    }

    // signal pulses travel the settled network
    if (C > 0.45 && this.pulses.length < 7 && Math.random() < dt * 1.7 * C) {
      const live = this.edges.filter((e) => e.g > 0.9 && !this.nodes[e.i].sky);
      if (live.length) {
        const e = live[(Math.random() * live.length) | 0];
        this.pulses.push({ e, t: 0, dur: Math.max(0.6, e.len / 70) });
      }
    }
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.t += dt;
      const k = p.t / p.dur;
      if (k >= 1 || p.e.g < 0.85) { this.pulses.splice(i, 1); continue; }
      const a = this.nodes[p.e.i], b = this.nodes[p.e.j];
      const x = lerp(a.x, b.x, k), y = lerp(a.y, b.y, k);
      const fade = Math.sin(k * Math.PI);
      ctx.fillStyle = rgba(GOLD, 0.55 * fade * C);
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.10 * fade * C);
      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // ---- the reveal ----
    ctx.save();
    ctx.translate(-px * 7, -py * 3);
    drawReveal(ctx);
    ctx.restore();

    // ---- dust ----
    const windDir = this.noise(t * 0.013, 3.1) * 0.6;
    const cosW = Math.cos(windDir), sinW = Math.sin(windDir) * 0.35;
    ctx.fillStyle = rgba(mixc(pal.line, MOONLIT, night * 0.9), 1);
    for (const p of this.parts) {
      const gustN = 0.55 + 0.45 * this.noise(p.x * 0.0016, p.y * 0.0016 + t * 0.05);
      const spd = (5 + p.z * 13) * gustN * (1 - R * 0.3);
      if (hasImp) {
        S.field(p.x, p.y, this.tmp);
        p.vx += this.tmp.dx * dt * 26 * p.z;
        p.vy += this.tmp.dy * dt * 26 * p.z;
      }
      p.vx += (cosW * spd - p.vx) * Math.min(1, dt * 0.7);
      p.vy += (sinW * spd - p.vy) * Math.min(1, dt * 0.7);
      p.x += p.vx * dt * (0.5 + p.z * 0.8);
      p.y += p.vy * dt * (0.5 + p.z * 0.8);
      if (p.x < -12) p.x = w + 10; else if (p.x > w + 12) p.x = -10;
      if (p.y < -12) p.y = h + 10; else if (p.y > h + 12) p.y = -10;
      ctx.globalAlpha = (0.07 + 0.11 * p.z) * (1 - night * 0.35);
      const s = 0.6 + p.z * 1.2;
      ctx.fillRect(p.x, p.y, s, s);
    }
    ctx.globalAlpha = 1;

    // ---- foreground: sparse grasses and one agave shadow ----
    ctx.save();
    ctx.translate(-px * 26, -py * 9);
    const wg = this.noise(t * 0.06, 7.3) * 0.14;
    ctx.strokeStyle = rgba(pal.grass, 0.55);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (const g of this.grassN) {
      const bx = g.x * w, by = h + 2;
      const len = g.len * h * 0.105;
      let lean = g.lean * 0.42 + wg + this.noise(t * 0.5 + g.ph, 1.1) * 0.1;
      if (hasImp) {
        S.field(bx, h - len * 0.6, this.tmp);
        lean += this.tmp.dx * 0.004;
      }
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + lean * len * 0.28, by - len * 0.55, bx + lean * len, by - len);
    }
    ctx.stroke();

    const abx = w * 0.043, aby = h + 8;
    ctx.strokeStyle = rgba(mixc(pal.grass, pal.stone, 0.45), 0.5);
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    for (const l of this.agaveN) {
      const len = l.len * h * 0.15;
      const sgn = l.a >= 0 ? 1 : -1;
      const sway = wg * 6 + this.noise(t * 0.3, l.a) * 2;
      const tipX = abx + Math.sin(l.a) * len + sway;
      const tipY = aby - Math.cos(l.a) * len;
      const cX = abx + Math.sin(l.a) * len * 0.5 + sgn * l.bow * len * 0.35;
      const cY = aby - Math.cos(l.a) * len * 0.52 + l.bow * len * 0.1;
      ctx.moveTo(abx, aby);
      ctx.quadraticCurveTo(cX, cY, tipX, tipY);
    }
    ctx.stroke();
    ctx.restore();

    // ---- grain + vignette ----
    ctx.globalAlpha = 0.5 + night * 0.25;
    ctx.fillStyle = this.grain;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    const vg = ctx.createRadialGradient(w * 0.5, h * 0.42, Math.min(w, h) * 0.38, w * 0.5, h * 0.46, Math.hypot(w, h) * 0.62);
    vg.addColorStop(0, 'rgba(10,10,10,0)');
    vg.addColorStop(1, `rgba(8,8,9,${0.30 + night * 0.10})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }
}
