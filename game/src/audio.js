// A tiny WebAudio kitchen: knife thud, sizzle, brass bell, coins, error tone and rain.
export function createAudio() {
  let ctx = null;
  let master = null;
  let rainGain = null;
  let sizzleGain = null;
  let muted = false;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
    return ctx;
  }

  function noiseBuffer(seconds = 1) {
    const n = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    return buf;
  }

  function burst(dur, freq, gain, type = 'lowpass') {
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(Math.max(0.15, dur));
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  function tone(freq, dur, gain, type = 'sine', toFreq = null, delay = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function loopNoise(freq, gain, q = 0.7) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(2.5);
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(f).connect(g).connect(master);
    src.start();
    return g;
  }

  return {
    ensure,
    get muted() {
      return muted;
    },
    setMuted(m) {
      muted = m;
      if (master) master.gain.value = m ? 0 : 0.55;
    },
    toggleMute() {
      this.setMuted(!muted);
      if (!muted) ensure();
      return muted;
    },
    startRain() {
      if (!ensure() || rainGain) return;
      rainGain = loopNoise(1400, 0, 0.4);
      rainGain.gain.value = muted ? 0 : 0.055;
    },
    knife() {
      burst(0.09, 520, 0.5);
      tone(180, 0.07, 0.18, 'triangle', 90);
    },
    chopMiss() {
      burst(0.12, 240, 0.3);
    },
    bell() {
      tone(1468, 1.1, 0.13, 'sine');
      tone(2210, 0.9, 0.06, 'sine');
      tone(2940, 0.6, 0.03, 'sine');
    },
    coin() {
      tone(1180, 0.1, 0.09, 'triangle', 1560);
      tone(1760, 0.16, 0.07, 'sine', 2320, 0.07);
    },
    perfect() {
      tone(880, 0.22, 0.08, 'sine');
      tone(1320, 0.32, 0.06, 'sine', null, 0.08);
      tone(1760, 0.4, 0.05, 'triangle', null, 0.16);
    },
    error() {
      tone(150, 0.26, 0.12, 'sawtooth', 82);
      burst(0.18, 320, 0.18);
    },
    click() {
      tone(520, 0.05, 0.05, 'square', 380);
    },
    sizzle(on) {
      if (!ctx) return;
      if (!sizzleGain) sizzleGain = loopNoise(3200, 0, 0.9);
      const t = ctx.currentTime;
      sizzleGain.gain.cancelScheduledValues(t);
      sizzleGain.gain.setTargetAtTime(on && !muted ? 0.035 : 0, t, 0.12);
    },
  };
}
