/**
 * Procedural Web Audio Synthesizer for Retro-Futuristic Game Feel
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private comboCount: number = 0;
  private comboResetTimer: any = null;
  private bgmGain: GainNode | null = null;
  private bgmOsc: OscillatorNode | null = null;
  private isBgmPlaying: boolean = false;

  constructor() {
    this.isMuted = localStorage.getItem('cyber_mute') === 'true';
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('cyber_mute', String(this.isMuted));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public laser() {
    if (this.isMuted) return;
    try {
      const ctx = this.init();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch (e) {}
  }

  public dash() {
    if (this.isMuted) return;
    try {
      const ctx = this.init();
      const now = ctx.currentTime;

      // Filtered noise swoosh
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.2;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.1);
      filter.Q.value = 3;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.21);
    } catch (e) {}
  }

  public hit() {
    if (this.isMuted) return;
    try {
      const ctx = this.init();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  public explosion(scale = 1) {
    if (this.isMuted) return;
    try {
      const ctx = this.init();
      const now = ctx.currentTime;
      const duration = Math.min(0.6, 0.25 * scale);

      // Noise source
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450 * scale, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.min(0.3, 0.15 * scale), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Sub kick
      const kick = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(140, now);
      kick.frequency.exponentialRampToValueAtTime(30, now + duration * 0.8);

      kickGain.gain.setValueAtTime(0.25, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      kick.connect(kickGain);
      kickGain.connect(ctx.destination);

      noise.start(now);
      kick.start(now);
      noise.stop(now + duration + 0.02);
      kick.stop(now + duration + 0.02);
    } catch (e) {}
  }

  public gemPickup() {
    if (this.isMuted) return;
    try {
      const ctx = this.init();
      const now = ctx.currentTime;

      // Pentatonic pitch steps
      const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]; // C5, D5, E5, G5, A5, C6
      const freq = notes[this.comboCount % notes.length];

      this.comboCount++;
      clearTimeout(this.comboResetTimer);
      this.comboResetTimer = setTimeout(() => {
        this.comboCount = 0;
      }, 800);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  public levelUp() {
    if (this.isMuted) return;
    try {
      const ctx = this.init();
      const now = ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C E G C E

      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const start = now + idx * 0.08;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.36);
      });
    } catch (e) {}
  }

  public nova() {
    if (this.isMuted) return;
    try {
      const ctx = this.init();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.7);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.82);
    } catch (e) {}
  }

  public startBgm() {
    if (this.isBgmPlaying) return;
    try {
      const ctx = this.init();
      this.bgmGain = ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.035, ctx.currentTime);

      this.bgmOsc = ctx.createOscillator();
      this.bgmOsc.type = 'sawtooth';
      this.bgmOsc.frequency.setValueAtTime(55, ctx.currentTime); // Low A1 drone

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, ctx.currentTime);

      this.bgmOsc.connect(filter);
      filter.connect(this.bgmGain);
      this.bgmGain.connect(ctx.destination);

      this.bgmOsc.start();
      this.isBgmPlaying = true;
    } catch (e) {}
  }

  public stopBgm() {
    if (this.bgmOsc) {
      try {
        this.bgmOsc.stop();
        this.bgmOsc.disconnect();
      } catch (e) {}
      this.bgmOsc = null;
      this.isBgmPlaying = false;
    }
  }
}

export const sound = new SoundEngine();
