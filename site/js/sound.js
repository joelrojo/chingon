// sparse, ethereal, handpan-adjacent.
// not wind, not a drone, not a soundtrack. a few metal tones in a quiet room.
// opt-in. silence is a fully valid state.

export class Ambience {
  constructor() {
    this.ctx = null;
    this.on = false;
    this._suspendTimer = null;
    this._nextAt = 0;
    this._voice = 0;
    this._lastR = 0;
  }

  _build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = (this.ctx = new AC());

    this.master = ctx.createGain();
    this.master.gain.value = 0;

    // a little air around the metal — not noise-as-ambience
    this.air = ctx.createConvolver();
    this.air.buffer = this._ir(ctx);
    this.airGain = ctx.createGain();
    this.airGain.gain.value = 0.22;
    this.dry = ctx.createGain();
    this.dry.gain.value = 0.85;
    this.dry.connect(this.master);
    this.air.connect(this.airGain);
    this.airGain.connect(this.master);
    this.master.connect(ctx.destination);

    // barely-there bed: ding + fifth, only when still
    this.bed = ctx.createGain();
    this.bed.gain.value = 0;
    this.bed.connect(this.dry);
    this.bed.connect(this.air);

    const bed = (freq, type, gain) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g).connect(this.bed);
      o.start();
      return o;
    };
    bed(146.83, 'sine', 0.22); // D3 ding
    bed(220.00, 'sine', 0.10); // A3
    bed(293.66, 'sine', 0.06); // D4

    return true;
  }

  // short dark impulse — suggestion of a room, not a hall
  _ir(ctx) {
    const sr = ctx.sampleRate;
    const n = Math.floor(sr * 1.6);
    const buf = ctx.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < n; i++) {
        const t = i / n;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.8) * 0.18;
      }
    }
    return buf;
  }

  // one struck tone field. inharmonic partials keep it closer to steel than a synth pad.
  _strike(freq, vel = 0.18) {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(vel, t + 0.012);
    out.gain.exponentialRampToValueAtTime(0.0008, t + 3.8);
    out.connect(this.dry);
    out.connect(this.air);

    const partials = [
      [1, 'sine', 1],
      [1.004, 'sine', 0.45],   // beat, like two steel faces
      [2.76, 'sine', 0.16],    // handpan-ish inharmonic
      [5.43, 'sine', 0.05],
    ];
    for (const [ratio, type, g] of partials) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq * ratio, t);
      o.frequency.exponentialRampToValueAtTime(freq * ratio * 0.997, t + 2.4);
      const pg = ctx.createGain();
      pg.gain.value = g;
      o.connect(pg).connect(out);
      o.start(t);
      o.stop(t + 4.2);
    }
  }

  toggle() {
    if (!this.ctx && !this._build()) return false;
    clearTimeout(this._suspendTimer);
    this.on = !this.on;
    const now = this.ctx.currentTime;
    if (this.on) {
      const go = () => {
        const t = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setValueAtTime(0.55, t);
        this._strike(293.66, 0.14);
        this._nextAt = performance.now() / 1000 + 4;
      };
      if (this.ctx.state === 'suspended') this.ctx.resume().then(go);
      else go();
    } else {
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0, now, 0.35);
      this._suspendTimer = setTimeout(() => this.ctx && this.ctx.suspend(), 1800);
    }
    return this.on;
  }

  setHidden(hidden) {
    if (!this.ctx || !this.on) return;
    if (hidden) this.ctx.suspend();
    else this.ctx.resume();
  }

  update(dt, E, R) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime;
    const still = Math.max(0, 1 - E * 2.2);
    this.bed.gain.setTargetAtTime(still * (0.012 + R * 0.028), t, 1.1);

    const now = performance.now() / 1000;
    // only speak when the garden is settling; never chatter
    if (E < 0.12 && R > 0.18 && now >= this._nextAt) {
      // D Kurd tone fields, sparse. tierra last in the ear as well as on the page.
      const scale = [146.83, 220.00, 293.66, 349.23, 440.00, 523.25];
      const i = Math.min(scale.length - 1, Math.floor(R * 4) + (this._voice % 2));
      const vel = 0.07 + R * 0.09;
      this._strike(scale[i], vel);
      this._voice = (this._voice + 1) % 5;
      this._nextAt = now + 5.5 + Math.random() * 5.5;
    }
    // a first quiet ding as stillness first arrives
    if (this._lastR < 0.55 && R >= 0.55 && E < 0.08) {
      this._strike(293.66, 0.11);
      this._nextAt = now + 4;
    }
    this._lastR = R;
  }
}
