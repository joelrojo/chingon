// full-screen topological board: hex / geodesic / mycelium.
// orthographic. the current in the plate writes the word.

import { clamp, lerp, smoothstep, mulberry32, makeNoise } from './util.js';

const TAU = Math.PI * 2;
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

export class Field {
  constructor(canvas, settle, seed) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.settle = settle;
    this.seed = seed;
    this.noise = makeNoise(mulberry32(seed ^ 0x9e3779b9));
    this.rand = mulberry32(seed);
    this.tmp = { dx: 0, dy: 0, mag: 0 };
    this.pulses = [];
    this.grain = null;
    this.nodes = [];
    this.edges = [];
    this.rings = [];
    this.age = 0;
  }

  resize(w, h, dpr) {
    this.w = w; this.h = h;
    this.cv.width = Math.round(w * dpr);
    this.cv.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._build(w, h);
    if (!this.grain) this.grain = this._makeGrain();
  }

  _makeGrain() {
    const g = document.createElement('canvas');
    g.width = g.height = 160;
    const gc = g.getContext('2d');
    const id = gc.createImageData(160, 160);
    const r = mulberry32(this.seed ^ 0x777);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = r() < 0.5 ? 230 : 14;
      id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = v;
      id.data[i + 3] = r() * 14;
    }
    gc.putImageData(id, 0, 0);
    return this.ctx.createPattern(g, 'repeat');
  }

  _build(w, h) {
    const rand = mulberry32(this.seed ^ (w * 131 + h));
    const cx = w * 0.5, cy = h * 0.5;
    const size = clamp(Math.min(w, h) * 0.08, 50, 78);
    const SQRT3 = Math.sqrt(3);

    // pointy-top honeycomb (axial). faces are hexes; vertices meet.
    const cells = [];
    const qMax = Math.ceil((w * 0.5 + size) / (size * SQRT3)) + 1;
    const rMax = Math.ceil((h * 0.5 + size) / (size * 1.5)) + 1;
    for (let q = -qMax; q <= qMax; q++) {
      for (let r = -rMax; r <= rMax; r++) {
        const x = cx + size * (SQRT3 * q + SQRT3 * 0.5 * r);
        const y = cy + size * (1.5 * r);
        if (x < -size || x > w + size || y < -size || y > h + size) continue;
        if (rand() < 0.08) continue;
        const hub = ((q + r * 2) % 4 + 4) % 4 === 0;
        cells.push({ x, y, q, r, hub });
      }
    }

    const nodes = [];
    const at = new Map();
    const bucket = size * 0.28;
    const mergeR2 = (bucket * 0.55) ** 2;
    const vert = (x, y) => {
      const gx = Math.round(x / bucket);
      const gy = Math.round(y / bucket);
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const i = at.get(`${gx + ox},${gy + oy}`);
          if (i == null) continue;
          const n = nodes[i];
          if ((n._ux - x) ** 2 + (n._uy - y) ** 2 < mergeR2) return i;
        }
      }
      const warp = size * 0.09;
      const bx = x + this.noise(x * 0.018, y * 0.018) * warp;
      const by = y + this.noise(y * 0.018 + 9, x * 0.018) * warp;
      const i = nodes.length;
      at.set(`${gx},${gy}`, i);
      nodes.push({
        _ux: x, _uy: y,
        bx, by, x: bx, y: by,
        ph: rand() * TAU, sp: 0.35 + rand() * 0.65,
        kind: 'cell', dist: 0,
      });
      return i;
    };

    const edges = [];
    const seen = new Set();
    const link = (i, j, extra) => {
      const key = i < j ? i * 10000 + j : j * 10000 + i;
      if (seen.has(key)) return;
      seen.add(key);
      const a = nodes[i], b = nodes[j];
      const len = Math.hypot(a.bx - b.bx, a.by - b.by);
      const da = Math.hypot(a.bx - cx, a.by - cy);
      const db = Math.hypot(b.bx - cx, b.by - cy);
      edges.push({
        i, j, g: 0, len,
        th: extra.th ?? rand() * 0.16,
        bow: extra.bow ?? (rand() - 0.5) * 0.08,
        manhattan: extra.manhattan ?? false,
        kind: extra.kind ?? 'hypha',
        radial: Math.abs(da - db) / (len + 1),
        inward: da > db ? 1 : 0,
      });
    };

    for (const cell of cells) {
      const ids = [];
      for (let k = 0; k < 6; k++) {
        const a = (60 * k - 30) * Math.PI / 180;
        ids.push(vert(cell.x + size * Math.cos(a), cell.y + size * Math.sin(a)));
      }
      for (let k = 0; k < 6; k++) {
        if (rand() < 0.06) continue;
        link(ids[k], ids[(k + 1) % 6], {
          kind: 'hypha',
          bow: (rand() - 0.5) * 0.1,
        });
      }
      if (cell.hub) {
        const hi = nodes.length;
        const warp = size * 0.05;
        const bx = cell.x + this.noise(cell.q, cell.r) * warp;
        const by = cell.y + this.noise(cell.r, cell.q + 4) * warp;
        nodes.push({
          bx, by, x: bx, y: by,
          ph: rand() * TAU, sp: 0.4 + rand() * 0.5,
          kind: 'hub', dist: 0,
        });
        const spokes = ids.slice();
        for (let i = spokes.length - 1; i > 0; i--) {
          const j = (rand() * (i + 1)) | 0;
          [spokes[i], spokes[j]] = [spokes[j], spokes[i]];
        }
        for (const id of spokes.slice(0, 2 + ((rand() * 2) | 0))) {
          link(hi, id, { kind: 'axon', bow: (rand() - 0.5) * 0.28, th: 0.04 + rand() * 0.1 });
        }
      }
    }

    // a few hub-to-hub traces — motherboard buses between somas
    const hubs = nodes.map((n, i) => n.kind === 'hub' ? i : -1).filter((i) => i >= 0);
    for (const i of hubs) {
      const n = nodes[i];
      const nd = Math.hypot(n.bx - cx, n.by - cy);
      let best = -1, bestD = Infinity;
      for (const j of hubs) {
        if (j === i) continue;
        const o = nodes[j];
        const od = Math.hypot(o.bx - cx, o.by - cy);
        if (od >= nd - 4) continue;
        const d = Math.hypot(n.bx - o.bx, n.by - o.by);
        if (d < size * 1.6 || d > size * 5.2) continue;
        if (d < bestD) { bestD = d; best = j; }
      }
      if (best >= 0 && rand() < 0.7) {
        link(i, best, {
          kind: 'trace',
          manhattan: rand() < 0.22,
          bow: (rand() - 0.5) * 0.28,
          th: 0.05 + rand() * 0.1,
        });
      }
    }

    this.nodes = nodes;
    this.edges = edges;
    this.cx = cx; this.cy = cy; this.s = size;
    this.rings = [0.36, 0.58, 0.82].map((k, i) => ({
      rx: (w * 0.5) * k,
      ry: (h * 0.5) * k,
      rot: i % 2 ? TAU / 12 : -TAU / 4,
    }));
    this.pulses.length = 0;
  }

  graft(reveal) {
    const maxD2 = (this.s * 1.15) ** 2;
    const cand = [];
    for (const sp of reveal.sparks) {
      let best = null, bestD = Infinity;
      for (const n of this.nodes) {
        const d = (n.bx - sp.tx) ** 2 + (n.by - sp.ty) ** 2;
        if (d < bestD) { bestD = d; best = n; }
      }
      cand.push({ sp, best, d: bestD });
    }
    cand.sort((a, b) => a.d - b.d);
    const take = Math.min(40, cand.length);
    for (let i = 0; i < take; i++) {
      if (cand[i].d < maxD2) cand[i].sp.pad = cand[i].best;
    }
  }

  _edgePoint(e, k) {
    const a = this.nodes[e.i], b = this.nodes[e.j];
    if (e.manhattan) {
      if (k < 0.5) {
        const t = k * 2;
        return Math.abs(a.x - b.x) > Math.abs(a.y - b.y)
          ? [lerp(a.x, b.x, t), a.y]
          : [a.x, lerp(a.y, b.y, t)];
      }
      const t = (k - 0.5) * 2;
      return Math.abs(a.x - b.x) > Math.abs(a.y - b.y)
        ? [b.x, lerp(a.y, b.y, t)]
        : [lerp(a.x, b.x, t), b.y];
    }
    const mx = lerp(a.x, b.x, k), my = lerp(a.y, b.y, k);
    const nx = -(b.y - a.y), ny = b.x - a.x;
    const bow = e.bow * 4 * k * (1 - k);
    return [mx + nx * bow, my + ny * bow];
  }

  render(dt, t, pal, R, E, drawReveal) {
    const { ctx, w, h } = this;
    const S = this.settle;
    const hasImp = S.impulses.length > 0;
    const C = Math.pow(1 - E, 1.45);
    this.age += dt;
    const appear = smoothstep(0.12, 4.2, this.age);

    const bg = ctx.createLinearGradient(0, 0, w * 0.12, h);
    bg.addColorStop(0, rgba(pal.field, 1));
    bg.addColorStop(1, rgba(pal.field2, 1));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // geodesic rings — order under the net
    ctx.lineWidth = 0.7;
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      ctx.beginPath();
      for (let k = 0; k <= 6; k++) {
        const a = ring.rot + (k % 6) * TAU / 6;
        let x = this.cx + Math.cos(a) * ring.rx;
        let y = this.cy + Math.sin(a) * ring.ry;
        x += this.noise(a + t * 0.015, i * 3) * 3.5;
        y += this.noise(i * 3, a + t * 0.015) * 3.5;
        if (hasImp) {
          S.field(x, y, this.tmp);
          x += this.tmp.dx * 0.22;
          y += this.tmp.dy * 0.22;
        }
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = rgba(pal.filament, pal.filamentA * (0.42 + 0.22 * C) * appear);
      ctx.lineWidth = i === 1 ? 1.25 : 0.95;
      ctx.stroke();
    }

    for (const n of this.nodes) {
      n.x = n.bx + this.noise(n.bx * 0.007 + t * 0.016 * n.sp, n.ph) * 2.4;
      n.y = n.by + this.noise(n.ph, n.by * 0.007 + t * 0.013 * n.sp) * 2.4;
      if (hasImp) {
        S.field(n.x, n.y, this.tmp);
        n.x += this.tmp.dx * 0.42;
        n.y += this.tmp.dy * 0.42;
        n.dist = this.tmp.mag;
      } else n.dist = 0;
    }

    for (const e of this.edges) {
      const a = this.nodes[e.i], b = this.nodes[e.j];
      const grow = (e.kind === 'axon' ? R * C : C) * appear;
      let target = smoothstep(e.th, e.th + 0.28, grow);
      if (a.dist > 0.28 || b.dist > 0.28) target = 0;
      e.g += (target - e.g) * Math.min(1, dt * (target > e.g ? 1.15 : 3.2));
      if (e.g < 0.03) continue;

      const [ex, ey] = this._edgePoint(e, e.g);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      if (e.manhattan) {
        if (Math.abs(a.x - b.x) > Math.abs(a.y - b.y)) {
          ctx.lineTo(lerp(a.x, b.x, e.g), a.y);
          ctx.lineTo(ex, ey);
        } else {
          ctx.lineTo(a.x, lerp(a.y, b.y, e.g));
          ctx.lineTo(ex, ey);
        }
      } else {
        const mx = lerp(a.x, b.x, e.g), my = lerp(a.y, b.y, e.g);
        const nx = -(b.y - a.y), ny = b.x - a.x;
        ctx.quadraticCurveTo(
          (a.x + mx) / 2 + nx * e.bow * e.g,
          (a.y + my) / 2 + ny * e.bow * e.g,
          mx, my
        );
      }
      const wgt = e.kind === 'axon' ? 0.7 : e.kind === 'trace' ? 0.62 : 0.58;
      ctx.strokeStyle = rgba(pal.filament, pal.filamentA * wgt * e.g);
      ctx.lineWidth = e.kind === 'trace' ? 1.05 : e.kind === 'axon' ? 0.9 : 0.95;
      ctx.stroke();
    }

    for (const n of this.nodes) {
      const hub = n.kind === 'hub';
      const a = pal.filamentA * (hub ? 0.78 : 0.36) * (0.45 + 0.55 * C) * appear;
      if (hub) {
        ctx.strokeStyle = rgba(pal.filament, a);
        ctx.lineWidth = 0.85;
        ctx.beginPath(); ctx.arc(n.x, n.y, 3.1, 0, TAU); ctx.stroke();
        ctx.fillStyle = rgba(pal.glow, a * 0.85);
        ctx.beginPath(); ctx.arc(n.x, n.y, 1.15, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = rgba(pal.filament, a);
        ctx.fillRect(n.x - 0.7, n.y - 0.7, 1.4, 1.4);
      }
    }

    const hunger = 2.8 + R * 5.5;
    if (C > 0.3 && this.pulses.length < 18 && Math.random() < dt * hunger * C) {
      const live = this.edges.filter((e) => e.g > 0.82);
      const inward = live.filter((e) => e.radial > 0.32);
      const pool = (R > 0.12 && inward.length) ? inward : live;
      if (pool.length) {
        const e = pool[(Math.random() * pool.length) | 0];
        const dir = e.inward;
        this.pulses.push({
          e, t: 0, dur: Math.max(0.38, e.len / 140),
          dir, // 1 = i→ inner j
        });
      }
    }
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.t += dt;
      const k = p.t / p.dur;
      if (k >= 1 || p.e.g < 0.65) { this.pulses.splice(i, 1); continue; }
      const u = p.dir ? k : 1 - k;
      const [x, y] = this._edgePoint(p.e, u);
      const fade = Math.sin(k * Math.PI);
      ctx.fillStyle = rgba(pal.glow, 0.62 * fade * C);
      ctx.beginPath(); ctx.arc(x, y, 1.55, 0, TAU); ctx.fill();
      ctx.fillStyle = rgba(pal.glow, 0.1 * fade * C);
      ctx.beginPath(); ctx.arc(x, y, 5.2, 0, TAU); ctx.fill();
    }

    drawReveal(ctx);

    ctx.globalAlpha = 0.36 + pal.night * 0.16;
    ctx.fillStyle = this.grain;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    const vg = ctx.createRadialGradient(this.cx, this.cy, Math.min(w, h) * 0.22, this.cx, this.cy, Math.hypot(w, h) * 0.62);
    vg.addColorStop(0, 'rgba(10,10,10,0)');
    vg.addColorStop(1, `rgba(8,8,8,${0.32 + pal.night * 0.12})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }
}
