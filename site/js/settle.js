// the settle mechanic. one scalar drives everything.
// movement disturbs. stillness reveals. the garden keeps no footprints.

import { clamp } from './util.js';

export class Settle {
  constructor(reduced = false) {
    this.reduced = reduced;
    this.E = 0.45;  // disturbance energy — arrival is itself a disturbance
    this.R = 0;     // revelation — accrues only in stillness
    this.impulses = [];
    this.time = 0;
  }

  input(x, y, vx, vy, speedNorm) {
    const target = clamp(speedNorm * 1.5, 0, 1);
    if (target > this.E) this.E += (target - this.E) * 0.45;

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

    // energy decays like settling sand — never a timer
    const tau = this.E > 0.4 ? 2.4 : 3.4;
    this.E *= Math.exp(-dt / tau);
    if (this.E < 0.0004) this.E = 0;

    for (const im of this.impulses) im.power *= Math.exp(-dt / 0.85);
    while (this.impulses.length && this.impulses[0].power < 0.02) this.impulses.shift();

    if (this.reduced) {
      // reduced motion: no turbulence; revelation arrives with quiet time alone
      this.R = clamp(this.R + dt / 7, 0, 1);
      return;
    }

    if (this.E < 0.045) {
      const still = 1 - this.E / 0.045;
      this.R = clamp(this.R + (dt / 8.5) * still, 0, 1);
    } else {
      // movement dissolves the reveal faster than stillness built it
      this.R = clamp(this.R - dt * this.E * 0.9, 0, 1);
    }
  }

  // local displacement from recent disturbance, sampled by every system.
  // quadratic falloff — cheap enough for thousands of samples per frame.
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
