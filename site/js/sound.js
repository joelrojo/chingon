// ambience obeys the same physics as everything else:
// disturbance roughens it, stillness resolves it toward a clear low tone.
// opt-in. silence is a fully valid state.

export class Ambience {
  constructor() {
    this.ctx = null;
    this.on = false;
    this.gust = 0;
    this._suspendTimer = null;
  }

  _build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = (this.ctx = new AC());

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // wind: looped brownish noise through a lowpass
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = 0.97 * last + 0.03 * white;
      d[i] = last * 3.0;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    this.windLP = ctx.createBiquadFilter();
    this.windLP.type = 'lowpass';
    this.windLP.frequency.value = 420;
    this.windLP.Q.value = 0.4;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.05;
    src.connect(this.windLP).connect(this.windGain).connect(this.master);
    src.start();

    // drone: a low root and a soft fifth, clearing with stillness
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0;
    this.droneLP = ctx.createBiquadFilter();
    this.droneLP.type = 'lowpass';
    this.droneLP.frequency.value = 170;
    this.droneGain.connect(this.droneLP).connect(this.master);

    const mk = (freq, type, gain) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g).connect(this.droneGain);
      o.start();
      return o;
    };
    mk(55, 'sine', 0.55);
    mk(82.41, 'triangle', 0.16);
    mk(110.0, 'sine', 0.10);

    // revelation partial — barely there, only at deep stillness
    this.shimmer = ctx.createOscillator();
    this.shimmer.type = 'sine';
    this.shimmer.frequency.value = 164.81;
    this.shGain = ctx.createGain();
    this.shGain.gain.value = 0;
    this.shimmer.connect(this.shGain).connect(this.master);
    this.shimmer.start();

    return true;
  }

  toggle() {
    if (!this.ctx && !this._build()) return false;
    clearTimeout(this._suspendTimer);
    this.on = !this.on;
    const now = this.ctx.currentTime;
    if (this.on) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0.8, now, 0.6);
    } else {
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0, now, 0.4);
      this._suspendTimer = setTimeout(() => this.ctx && this.ctx.suspend(), 2000);
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
    this.gust = Math.max(0, Math.min(1, this.gust + (Math.random() - 0.505) * dt * 0.9));
    const t = this.ctx.currentTime;
    this.windLP.frequency.setTargetAtTime(380 + E * 1500 + this.gust * 160, t, 0.35);
    this.windGain.gain.setTargetAtTime(0.045 + E * 0.11 + this.gust * 0.02, t, 0.5);
    this.droneGain.gain.setTargetAtTime((1 - E) * (0.05 + R * 0.10), t, 1.2);
    this.droneLP.frequency.setTargetAtTime(150 + R * 430, t, 1.5);
    this.shGain.gain.setTargetAtTime(R > 0.92 ? 0.016 : 0, t, 2.2);
  }
}
