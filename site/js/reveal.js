// the word is current in the board. vias at the rim write chingón;
// after it forms, charge keeps wisping through the letters.

import { clamp, lerp, smoothstep, mixc } from './util.js';

const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif';
const TAU = Math.PI * 2;

export class Reveal {
  constructor(rand) {
    this.rand = rand;
    this.sparks = [];
    this.edges = [];
    this.adj = [];
    this.wisps = [];
    this.positions = [];
    this.w = 0; this.h = 0;
  }

  layout(w, h) {
    this.w = w; this.h = h;
    const word = 'CHINGÓN';
    const fs = 220;
    const off = document.createElement('canvas');
    const octx = off.getContext('2d');
    octx.font = `500 ${fs}px ${SERIF}`;
    const tracking = fs * 0.34;
    const widths = [...word].map((ch) => octx.measureText(ch).width);
    const totalW = widths.reduce((a, b) => a + b, 0) + tracking * (word.length - 1);

    off.width = Math.ceil(totalW + 80);
    off.height = Math.ceil(fs * 1.6);
    octx.font = `500 ${fs}px ${SERIF}`;
    octx.fillStyle = '#fff';
    octx.textBaseline = 'middle';
    let x = 40;
    const midY = off.height / 2 + fs * 0.06;
    for (let i = 0; i < word.length; i++) {
      octx.fillText(word[i], x, midY);
      x += widths[i] + tracking;
    }

    const img = octx.getImageData(0, 0, off.width, off.height).data;
    const raw = [];
    const step = 4;
    for (let yy = 0; yy < off.height; yy += step) {
      for (let xx = 0; xx < off.width; xx += step) {
        if (img[(yy * off.width + xx) * 4 + 3] > 140) raw.push([xx, yy]);
      }
    }
    for (let i = raw.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [raw[i], raw[j]] = [raw[j], raw[i]];
    }

    const dispW = Math.min(w * 0.74, 760);
    const scale = dispW / totalW;
    const cx = w / 2, cy = h / 2;
    const target = 300;
    const glyphArea = raw.length * (step * scale) * (step * scale);
    const minD = Math.max(2.5, Math.sqrt(glyphArea / target) * 0.86);

    const pts = [];
    for (const [xx, yy] of raw) {
      const px = (xx - off.width / 2) * scale + cx;
      const py = (yy - midY) * scale + cy;
      let ok = true;
      for (const q of pts) {
        const dx = q.tx - px, dy = q.ty - py;
        if (dx * dx + dy * dy < minD * minD) { ok = false; break; }
      }
      if (ok) pts.push({ tx: px, ty: py });
      if (pts.length >= 440) break;
    }

    const margin = Math.min(w, h) * 0.045;
    this.sparks = pts.map((p) => {
      const dl = p.tx, dr = w - p.tx, dt = p.ty, db = h - p.ty;
      const nearest = Math.min(dl, dr, dt, db);
      let side = 'b';
      if (nearest === dl) side = 'l';
      else if (nearest === dr) side = 'r';
      else if (nearest === dt) side = 't';
      return {
        tx: p.tx, ty: p.ty, side,
        hx: side === 'l' ? margin : side === 'r' ? w - margin : p.tx,
        hy: side === 't' ? margin : side === 'b' ? h - margin : p.ty,
        from: null, pad: null,
        st: this.rand() * 0.1,
        ph: this.rand() * TAU,
      };
    });

    this._linkLetters(minD * 1.55);
    this.wisps.length = 0;
  }

  _linkLetters(maxD) {
    const pts = this.sparks;
    const maxD2 = maxD * maxD;
    const eset = new Set();
    this.edges = [];
    this.adj = pts.map(() => []);

    const add = (i, j) => {
      const key = i < j ? i * 4000 + j : j * 4000 + i;
      if (eset.has(key)) return;
      eset.add(key);
      this.edges.push([i, j]);
      this.adj[i].push(j);
      this.adj[j].push(i);
    };

    for (let i = 0; i < pts.length; i++) {
      const si = pts[i];
      const near = [];
      for (let j = 0; j < pts.length; j++) {
        if (i === j) continue;
        const d = (si.tx - pts[j].tx) ** 2 + (si.ty - pts[j].ty) ** 2;
        if (d < maxD2) near.push([d, j]);
      }
      near.sort((a, b) => a[0] - b[0]);
      for (const [, j] of near.slice(0, 2)) add(i, j);
    }
  }

  // snap each spark's origin onto a rim via — current leaves the plate
  bindBoard(nodes) {
    const { w, h } = this;
    const band = Math.min(w, h) * 0.2;
    const sides = { l: [], r: [], t: [], b: [] };
    for (const n of nodes) {
      if (n.bx < band) sides.l.push(n);
      if (n.bx > w - band) sides.r.push(n);
      if (n.by < band) sides.t.push(n);
      if (n.by > h - band) sides.b.push(n);
    }

    for (const sp of this.sparks) {
      const pool = sides[sp.side];
      if (!pool.length) continue;
      const aimX = sp.side === 'l' ? band * 0.35 : sp.side === 'r' ? w - band * 0.35 : sp.tx;
      const aimY = sp.side === 't' ? band * 0.35 : sp.side === 'b' ? h - band * 0.35 : sp.ty;
      let best = pool[0], bestD = Infinity;
      for (const n of pool) {
        const d = (n.bx - aimX) ** 2 + (n.by - aimY) ** 2;
        if (d < bestD) { bestD = d; best = n; }
      }
      sp.from = best;
      sp.hx = best.bx;
      sp.hy = best.by;
    }
  }

  draw(ctx, pal, R, E, t, dt = 0.016) {
    if (R < 0.02 && E < 0.02) return;
    const col = mixc(pal.ink, pal.glow, pal.night * 0.25);
    const positions = this.positions;
    positions.length = 0;

    for (const sp of this.sparks) {
      const ox = sp.from ? sp.from.x : sp.hx;
      const oy = sp.from ? sp.from.y : sp.hy;
      const ki = smoothstep(sp.st * 0.35, 0.26 + sp.st * 0.1, R);
      const e = ki * ki * (3 - 2 * ki);
      const hold = e * (1 - clamp(E * 1.7, 0, 0.88));
      const mid = Math.sin(hold * Math.PI);
      const jit = hold * hold * 0.85;
      const x = lerp(ox, sp.tx, hold)
        + Math.sin(t * 0.55 + sp.ph) * mid * 14
        + Math.sin(t * 1.35 + sp.ph) * jit;
      const y = lerp(oy, sp.ty, hold)
        + Math.cos(t * 0.42 + sp.ph) * mid * 10
        + Math.cos(t * 1.1 + sp.ph * 1.3) * jit * 0.7;
      positions.push([x, y, hold]);
    }

    // solder: short traces from nearby vias into the letter
    const solder = smoothstep(0.4, 0.86, R) * (1 - clamp(E * 1.3, 0, 0.75));
    if (solder > 0.04) {
      ctx.beginPath();
      for (let i = 0; i < this.sparks.length; i++) {
        const pad = this.sparks[i].pad;
        const p = positions[i];
        if (!pad || p[2] < 0.4) continue;
        ctx.moveTo(pad.x, pad.y);
        ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${0.28 * solder})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    const lineK = smoothstep(0.38, 0.84, R) * (1 - clamp(E * 1.4, 0, 0.8));
    if (lineK > 0.02) {
      ctx.beginPath();
      for (const [i, j] of this.edges) {
        const a = positions[i], b = positions[j];
        if (a[2] < 0.32 || b[2] < 0.32) continue;
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      ctx.strokeStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${0.32 * lineK})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    this._wisps(ctx, pal, col, R, E, dt);

    for (const [x, y, hold] of positions) {
      if (hold < 0.01) continue;
      const travel = Math.sin(hold * Math.PI);
      const pulse = 0.82 + 0.18 * Math.sin(t * 2.4 + x * 0.04 + y * 0.03);
      const a = (0.24 + 0.76 * hold) * (0.55 + 0.45 * smoothstep(0.06, 0.55, R)) * pulse;
      ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a * (0.12 + 0.16 * travel)})`;
      ctx.beginPath(); ctx.arc(x, y, 2.6 + travel * 1.2, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a})`;
      ctx.beginPath(); ctx.arc(x, y, 1.05, 0, TAU); ctx.fill();
    }
  }

  _wisps(ctx, pal, col, R, E, dt) {
    const still = R > 0.55 && E < 0.22;
    if (still && this.wisps.length < 22 && this.edges.length && Math.random() < dt * 10 * R) {
      const [i, j] = this.edges[(Math.random() * this.edges.length) | 0];
      const a = this.positions[i], b = this.positions[j];
      if (a && b && a[2] > 0.7 && b[2] > 0.7) {
        this.wisps.push({ i, j, t: 0, dur: 0.45 + this.rand() * 0.35, hops: 0 });
      }
    }

    const glow = pal.glow;
    for (let n = this.wisps.length - 1; n >= 0; n--) {
      const w = this.wisps[n];
      w.t += dt;
      let k = w.t / w.dur;
      if (k >= 1) {
        if (still && w.hops < 4) {
          const nexts = this.adj[w.j].filter((q) => q !== w.i);
          if (nexts.length) {
            const nx = nexts[(Math.random() * nexts.length) | 0];
            w.i = w.j; w.j = nx; w.t = 0; w.hops++;
            k = 0;
          } else {
            this.wisps.splice(n, 1);
            continue;
          }
        } else {
          this.wisps.splice(n, 1);
          continue;
        }
      }
      const a = this.positions[w.i], b = this.positions[w.j];
      if (!a || !b || a[2] < 0.45 || b[2] < 0.45) { this.wisps.splice(n, 1); continue; }
      const x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k);
      const fade = Math.sin(k * Math.PI) * (1 - clamp(E * 2, 0, 0.7));
      ctx.fillStyle = `rgba(${glow[0] | 0},${glow[1] | 0},${glow[2] | 0},${0.85 * fade})`;
      ctx.beginPath(); ctx.arc(x, y, 2.0, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${0.2 * fade})`;
      ctx.beginPath(); ctx.arc(x, y, 6.2, 0, TAU); ctx.fill();
    }
  }
}
