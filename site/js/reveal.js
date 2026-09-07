// what stillness reveals. four candidates, chosen by feel (keys 1–4):
//   word — CHINGÓN emerges as a constellation of settling points
//   fragment — a short line surfaces
//   both — the word first, the fragment on deeper stillness
//   visual — nothing written; alignment itself is the reveal

import { clamp, lerp, smoothstep, mixc, hex } from './util.js';

export const MODES = ['word', 'fragment', 'both', 'visual'];

const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif';
const MONO = 'ui-monospace,"SF Mono",Menlo,Consolas,monospace';

const GOLD = hex('#C89550');

export class Reveal {
  constructor(rand) {
    this.rand = rand;
    this.mode = 'word';
    this.sparks = [];
    this.edges = [];
    this.fragment = 'technology · time · tierra';
    this.w = 0; this.h = 0;
  }

  layout(w, h) {
    this.w = w; this.h = h;
    const word = 'CHINGÓN';
    const fs = 220;
    const off = document.createElement('canvas');
    const octx = off.getContext('2d');
    octx.font = `500 ${fs}px ${SERIF}`;
    const tracking = fs * 0.36;
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
    const step = 5;
    for (let yy = 0; yy < off.height; yy += step) {
      for (let xx = 0; xx < off.width; xx += step) {
        if (img[(yy * off.width + xx) * 4 + 3] > 140) raw.push([xx, yy]);
      }
    }
    // shuffle for even thinning
    for (let i = raw.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [raw[i], raw[j]] = [raw[j], raw[i]];
    }

    const dispW = Math.min(w * 0.66, 680);
    const scale = dispW / totalW;
    const cx = w / 2, cy = h * 0.345;
    // spacing from actual glyph coverage, not the text box
    const target = 190;
    const glyphArea = raw.length * (step * scale) * (step * scale);
    const minD = Math.max(3, Math.sqrt(glyphArea / target) * 0.9);

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
      if (pts.length >= 340) break;
    }

    this.sparks = pts.map((p) => {
      const a = this.rand() * Math.PI * 2;
      const d = (0.16 + this.rand() * 0.5) * Math.min(w, h);
      return {
        tx: p.tx, ty: p.ty,
        hx: p.tx + Math.cos(a) * d,
        hy: p.ty + Math.sin(a) * d * 0.7,
        st: 0.28 + this.rand() * 0.36,
        ph: this.rand() * Math.PI * 2,
      };
    });

    // constellation edges: each point to its 2 nearest, deduped
    const eset = new Set();
    this.edges = [];
    for (let i = 0; i < this.sparks.length; i++) {
      const si = this.sparks[i];
      let n1 = -1, n2 = -1, d1 = Infinity, d2 = Infinity;
      for (let j = 0; j < this.sparks.length; j++) {
        if (i === j) continue;
        const sj = this.sparks[j];
        const d = (si.tx - sj.tx) ** 2 + (si.ty - sj.ty) ** 2;
        if (d < d1) { d2 = d1; n2 = n1; d1 = d; n1 = j; }
        else if (d < d2) { d2 = d; n2 = j; }
      }
      for (const n of [n1, n2]) {
        if (n < 0) continue;
        const key = i < n ? i * 1000 + n : n * 1000 + i;
        if (!eset.has(key)) { eset.add(key); this.edges.push([i, n]); }
      }
    }
  }

  draw(ctx, pal, R, t) {
    if (this.mode === 'visual') return;

    const wantWord = this.mode === 'word' || this.mode === 'both';
    const wantFrag = this.mode === 'fragment' || this.mode === 'both';

    if (wantWord && R > 0.28) {
      const night = pal.night;
      const col = mixc(pal.ink, GOLD, night * 0.35);
      const positions = [];
      for (const sp of this.sparks) {
        const ki = smoothstep(sp.st, sp.st + 0.42, R);
        const e = 1 - Math.pow(1 - ki, 3);
        const drift = (1 - e) * 9;
        const x = lerp(sp.hx + Math.sin(t * 0.4 + sp.ph) * drift, sp.tx, e);
        const y = lerp(sp.hy + Math.cos(t * 0.33 + sp.ph) * drift, sp.ty, e);
        positions.push([x, y, ki]);
      }
      // constellation lines bind late, once points are nearly home
      const lineK = smoothstep(0.72, 0.98, R);
      if (lineK > 0.01) {
        ctx.beginPath();
        for (const [i, j] of this.edges) {
          const a = positions[i], b = positions[j];
          if (a[2] < 0.8 || b[2] < 0.8) continue;
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
        }
        ctx.strokeStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${0.16 * lineK})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
      for (const [x, y, ki] of positions) {
        if (ki <= 0.01) continue;
        const a = ki * (0.35 + 0.65 * smoothstep(0.4, 0.9, R));
        // soft halo + core
        ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a * 0.14})`;
        ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.2832); ctx.fill();
        ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a})`;
        ctx.beginPath(); ctx.arc(x, y, 1.05, 0, 6.2832); ctx.fill();
      }
    }

    if (wantFrag) {
      const f0 = this.mode === 'both' ? 0.86 : 0.55;
      const a = smoothstep(f0, f0 + 0.12, R) * 0.52;
      if (a > 0.01) {
        const col = pal.ink;
        const size = clamp(this.w * 0.011, 10, 13.5);
        ctx.save();
        ctx.font = `400 ${size}px ${MONO}`;
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0.32em';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a})`;
        const y = this.mode === 'both' ? this.h * 0.565 : this.h * 0.5;
        ctx.fillText(this.fragment, this.w / 2 + size * 0.16, y);
        ctx.restore();
      }
    }
  }
}
