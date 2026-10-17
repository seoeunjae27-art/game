/**
 * Procedural Web Audio Ambient Sound Generator
 * Generates natural sounds without external MP3 files or CDN dependencies.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private soundNodes: Map<
    string,
    {
      gainNode: GainNode;
      stop: () => void;
    }
  > = new Map();

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Generate pink noise buffer
  private createPinkNoiseBuffer(ctx: AudioContext, seconds = 5): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // Play rain sound
  private playRain(ctx: AudioContext, masterGain: GainNode) {
    const buffer = this.createPinkNoiseBuffer(ctx, 4);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.value = 1100;

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'highpass';
    filter2.frequency.value = 180;

    source.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(masterGain);
    source.start();

    return () => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    };
  }

  // Play campfire sound (rumble + crackles)
  private playCampfire(ctx: AudioContext, masterGain: GainNode) {
    const buffer = this.createPinkNoiseBuffer(ctx, 4);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.value = 450;

    source.connect(lowFilter);
    lowFilter.connect(masterGain);
    source.start();

    // Random pops/crackles interval
    let isStopped = false;
    const crackleInterval = setInterval(() => {
      if (isStopped || !this.ctx) return;
      if (Math.random() < 0.4) {
        try {
          const osc = ctx.createOscillator();
          const popGain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150 + Math.random() * 800, ctx.currentTime);
          popGain.gain.setValueAtTime(0.06 * Math.random(), ctx.currentTime);
          popGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
          osc.connect(popGain);
          popGain.connect(masterGain);
          osc.start();
          osc.stop(ctx.currentTime + 0.05);
        } catch (e) {}
      }
    }, 120);

    return () => {
      isStopped = true;
      clearInterval(crackleInterval);
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    };
  }

  // Play white noise
  private playWhiteNoise(ctx: AudioContext, masterGain: GainNode) {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2800;

    source.connect(filter);
    filter.connect(masterGain);
    source.start();

    return () => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    };
  }

  // Play ocean waves (modulated noise)
  private playWaves(ctx: AudioContext, masterGain: GainNode) {
    const buffer = this.createPinkNoiseBuffer(ctx, 6);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    // LFO for wave swelling
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12; // 8 seconds per wave cycle

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 500;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(masterGain);
    source.start();
    lfo.start();

    return () => {
      try {
        source.stop();
        lfo.stop();
        source.disconnect();
        lfo.disconnect();
      } catch (e) {}
    };
  }

  // Play cafe background murmur
  private playCafe(ctx: AudioContext, masterGain: GainNode) {
    const buffer = this.createPinkNoiseBuffer(ctx, 5);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 1.2;

    source.connect(filter);
    filter.connect(masterGain);
    source.start();

    return () => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    };
  }

  public setSound(id: string, isPlaying: boolean, volume: number) {
    const ctx = this.initContext();

    if (!isPlaying) {
      if (this.soundNodes.has(id)) {
        const item = this.soundNodes.get(id)!;
        item.stop();
        this.soundNodes.delete(id);
      }
      return;
    }

    let item = this.soundNodes.get(id);
    if (!item) {
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.max(0.001, volume * 0.4), ctx.currentTime);
      masterGain.connect(ctx.destination);

      let stopFn = () => {};
      if (id === 'rain') stopFn = this.playRain(ctx, masterGain);
      else if (id === 'campfire') stopFn = this.playCampfire(ctx, masterGain);
      else if (id === 'whitenoise') stopFn = this.playWhiteNoise(ctx, masterGain);
      else if (id === 'waves') stopFn = this.playWaves(ctx, masterGain);
      else if (id === 'cafe') stopFn = this.playCafe(ctx, masterGain);

      this.soundNodes.set(id, { gainNode: masterGain, stop: stopFn });
    } else {
      item.gainNode.gain.setValueAtTime(Math.max(0.001, volume * 0.4), ctx.currentTime);
    }
  }

  public setVolume(id: string, volume: number) {
    const item = this.soundNodes.get(id);
    if (item && this.ctx) {
      item.gainNode.gain.setValueAtTime(Math.max(0.001, volume * 0.4), this.ctx.currentTime);
    }
  }

  // Play timer chime
  public playChime() {
    try {
      const ctx = this.initContext();
      const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);

        gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + index * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + index * 0.12);
        osc.stop(ctx.currentTime + index * 0.12 + 1.3);
      });
    } catch (e) {
      console.error('Failed to play chime:', e);
    }
  }

  public stopAll() {
    this.soundNodes.forEach((node) => node.stop());
    this.soundNodes.clear();
  }
}

export const soundSynthesizer = new SoundSynthesizer();
