// the settle mechanic. one scalar drives everything.
// movement disturbs. stillness reveals. the board keeps no footprints.

import { clamp } from './util.js';

export class Settle {
  constructor(reduced = false) {
    this.reduced = reduced;
    this.E = 0.04;
    this.R = 0;
    this.impulses = [];
    this.time = 0;
  }

  input(x, y, vx, vy, speedNorm) {
    const target = clamp(speedNorm * 1.5, 0, 1);
    if (target > this.E) this.E += (target - this.E) * 0.5;

    const imps = this.impulses;
    const last = imps[imps.length - 1];
    if (last && this.time - last.born < 0.028) {
      const dx = x - last.x, dy = y - last.y;
      if (dx * dx + dy * dy < 220) {
        last.power = Math.min(1.5, last.power + target * 0.35);
        return;
      }
    }
    imps.push({ x, y, vx, vy, power: 0.3 + target, born: this.time });
    if (imps.length > 56) imps.shift();
  }

  tap(x, y) {
    this.input(x, y, 0, 0, 0.55);
  }

  update(dt) {
    this.time += dt;

    const tau = this.E > 0.3 ? 0.38 : 0.55;
    this.E *= Math.exp(-dt / tau);
    if (this.E < 0.0004) this.E = 0;

    for (const im of this.impulses) im.power *= Math.exp(-dt / 0.55);
    while (this.impulses.length && this.impulses[0].power < 0.02) this.impulses.shift();

    if (this.reduced) {
      this.R = clamp(this.R + dt / 0.6, 0, 1);
      return;
    }

    if (this.E < 0.28) {
      const still = 1 - this.E / 0.28;
      this.R = clamp(this.R + (dt / 0.5) * still, 0, 1);
    } else {
      this.R = clamp(this.R - dt * this.E * 3.6, 0, 1);
    }
  }

  field(x, y, out) {
    let dx = 0, dy = 0, mag = 0;
    const R2 = 170 * 170;
    for (const im of this.impulses) {
      const ox = x - im.x, oy = y - im.y;
      const d2 = ox * ox + oy * oy;
      if (d2 > R2) continue;
      const q = 1 - d2 / R2;
      const g = q * q * im.power;
      const d = Math.sqrt(d2) + 0.001;
      dx += (ox / d) * g * 30 + im.vx * g * 0.012;
      dy += (oy / d) * g * 30 + im.vy * g * 0.012;
      mag += g;
    }
    out.dx = dx; out.dy = dy; out.mag = mag;
    return out;
  }
}
