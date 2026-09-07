// ethereal atmosphere. odyssey floor, dune air, matrix dust, mycelium underneath.
// no notes, no dings. opt-out.

export class Ambience {
  constructor() {
    this.ctx = null;
    this.on = false;
    this.wanted = true;
    this._suspendTimer = null;
  }

  _build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = (this.ctx = new AC());

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    this.bus = ctx.createGain();
    this.bus.gain.value = 1;
    this.bus.connect(this.master);

    // desert floor — two very low sines, barely beating
    this._drone(46.25, 0.11);
    this._drone(69.30, 0.07);
    this._drone(92.50, 0.045);

    // pad — slow detuned pairs, no attack
    this._pair(110.00, 0.055);
    this._pair(164.81, 0.032);
    this._pair(220.00, 0.018);

    // digital dust — a high partial that breathes
    const dust = ctx.createOscillator();
    dust.type = 'sine';
    dust.frequency.value = 740;
    this.dustG = ctx.createGain();
    this.dustG.gain.value = 0.008;
    dust.connect(this.dustG).connect(this.bus);
    dust.start();
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.005;
    lfo.connect(lfoG).connect(this.dustG.gain);
    lfo.start();

    // air — filtered noise, not a wind bed you notice as wind
    const nLen = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, nLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < nLen; i++) {
      last = last * 0.86 + (Math.random() * 2 - 1) * 0.14;
      data[i] = last;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'bandpass';
    this.filter.frequency.value = 240;
    this.filter.Q.value = 0.7;
    this.airG = ctx.createGain();
    this.airG.gain.value = 0.028;
    noise.connect(this.filter).connect(this.airG).connect(this.bus);
    noise.start();

    return true;
  }

  _drone(freq, gain) {
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    o.connect(g).connect(this.bus);
    o.start();
  }

  _pair(freq, gain) {
    for (const detune of [-0.22, 0.28]) {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq + detune;
      const g = this.ctx.createGain();
      g.gain.value = gain * 0.5;
      o.connect(g).connect(this.bus);
      o.start();
    }
  }

  start() {
    if (!this.ctx && !this._build()) return Promise.resolve(false);
    this.wanted = true;
    clearTimeout(this._suspendTimer);
    const go = () => {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(0.34, t, 1.4);
      this.on = true;
      return true;
    };
    if (this.ctx.state === 'suspended') {
      return this.ctx.resume().then(go).catch(() => false);
    }
    return Promise.resolve(go());
  }

  stop() {
    if (!this.ctx) return;
    this.wanted = false;
    this.on = false;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, 0.45);
    this._suspendTimer = setTimeout(() => this.ctx && this.ctx.suspend(), 2000);
  }

  toggle() {
    if (this.on || this.wanted) {
      this.stop();
      return false;
    }
    this.start();
    return true;
  }

  setHidden(hidden) {
    if (!this.ctx || !this.wanted) return;
    if (hidden) this.ctx.suspend();
    else this.ctx.resume();
  }

  update(_dt, E, R) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime;
    const still = Math.max(0, 1 - E * 1.8);
    this.filter.frequency.setTargetAtTime(200 + E * 420 + R * 40, t, 0.8);
    this.airG.gain.setTargetAtTime(0.018 + E * 0.03, t, 0.9);
    this.bus.gain.setTargetAtTime(0.85 + still * 0.2, t, 1.2);
  }
}
