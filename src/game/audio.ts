import { BiomeId } from './types';

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private started = false;

  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private ambientGain: GainNode | null = null;
  private echoDelay: DelayNode | null = null;
  private echoFeedback: GainNode | null = null;
  private echoFilter: BiquadFilterNode | null = null;

  // Continuous drone nodes for smooth biome crossfading
  private droneOscA: OscillatorNode | null = null;
  private droneOscB: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private droneGain: GainNode | null = null;

  private noiseBuffer: AudioBuffer | null = null;
  private currentBiome: BiomeId = 'vila';
  private chordTimer = 0.6;
  private detailTimer = 1.2;
  private pulseStep = 0;
  private lastChordIdx = -1;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 1, this.ctx.currentTime, 0.12);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public setBiome(biome: BiomeId): void {
    if (this.currentBiome === biome) return;
    this.currentBiome = biome;
    this.chordTimer = 0.25;
    this.detailTimer = 0.5;
    this.updateDroneForBiome();
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 1;

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 1.1;
      this.ambientGain.connect(this.masterGain);

      // Gentle stereo-like feedback echo bus for Bosque harp/bells & Cidadela pulses
      this.echoDelay = this.ctx.createDelay(1.0);
      this.echoDelay.delayTime.value = 0.42;
      this.echoFeedback = this.ctx.createGain();
      this.echoFeedback.gain.value = 0.34;
      this.echoFilter = this.ctx.createBiquadFilter();
      this.echoFilter.type = 'lowpass';
      this.echoFilter.frequency.value = 1450;

      this.echoDelay.connect(this.echoFilter);
      this.echoFilter.connect(this.echoFeedback);
      this.echoFeedback.connect(this.echoDelay);
      this.echoFilter.connect(this.ambientGain);

      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public startAmbient(): void {
    if (this.started) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain) return;
    this.started = true;

    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    oscA.type = 'triangle';
    oscA.frequency.value = 55;
    oscB.type = 'sine';
    oscB.frequency.value = 82.41;

    filter.type = 'lowpass';
    filter.frequency.value = 180;

    gain.gain.value = 0.065;

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    oscA.start();
    oscB.start();

    this.droneOscA = oscA;
    this.droneOscB = oscB;
    this.droneFilter = filter;
    this.droneGain = gain;
    this.updateDroneForBiome();
  }

  private updateDroneForBiome(): void {
    if (!this.ctx || !this.droneOscA || !this.droneOscB || !this.droneFilter || !this.droneGain) {
      return;
    }
    const now = this.ctx.currentTime;
    if (this.currentBiome === 'vila') {
      this.droneOscA.frequency.setTargetAtTime(55.0, now, 1.2); // A1 warm foundation
      this.droneOscB.frequency.setTargetAtTime(82.41, now, 1.2); // E2 fifth
      this.droneFilter.frequency.setTargetAtTime(195, now, 1.2);
      this.droneGain.gain.setTargetAtTime(0.055, now, 1.2);
    } else if (this.currentBiome === 'bosque') {
      this.droneOscA.frequency.setTargetAtTime(61.74, now, 1.2); // B1 misty bed
      this.droneOscB.frequency.setTargetAtTime(92.5, now, 1.2); // F#2
      this.droneFilter.frequency.setTargetAtTime(170, now, 1.2);
      this.droneGain.gain.setTargetAtTime(0.042, now, 1.2);
    } else {
      this.droneOscA.frequency.setTargetAtTime(43.65, now, 1.2); // F1 deep abyssal drone
      this.droneOscB.frequency.setTargetAtTime(65.41, now, 1.2); // C2
      this.droneFilter.frequency.setTargetAtTime(240, now, 1.2);
      this.droneGain.gain.setTargetAtTime(0.105, now, 1.2);
    }
  }

  public updateAmbient(dt: number): void {
    if (!this.started || this.muted || !this.ctx || this.ctx.state !== 'running') return;

    this.chordTimer -= dt;
    this.detailTimer -= dt;

    if (this.currentBiome === 'vila') {
      // Warm melancholic minor chords + subtle wind/campfire crackle
      if (this.chordTimer <= 0) {
        this.chordTimer = 4.6 + Math.random() * 2.4;
        const chords = [
          [220.0, 261.63, 329.63, 392.0], // Am7
          [174.61, 220.0, 261.63, 329.63], // Fmaj7
          [146.83, 174.61, 220.0, 261.63], // Dm7
          [164.81, 196.0, 246.94, 293.66], // Em7
        ];
        let idx = Math.floor(Math.random() * chords.length);
        if (idx === this.lastChordIdx) idx = (idx + 1) % chords.length;
        this.lastChordIdx = idx;
        this.playWarmChord(chords[idx], 3.8);
      }

      if (this.detailTimer <= 0) {
        this.detailTimer = 0.55 + Math.random() * 1.45;
        if (Math.random() < 0.35) {
          this.playWindGust();
        } else {
          this.playCampfireCrackle();
        }
      }
    } else if (this.currentBiome === 'bosque') {
      // Sparse crystalline bell/harp notes with gentle echo
      if (this.chordTimer <= 0) {
        this.chordTimer = 1.6 + Math.random() * 2.1;
        const scale = [329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99, 880.0];
        const note = scale[Math.floor(Math.random() * scale.length)];
        this.playCrystalBell(note, 1.9);
        if (Math.random() > 0.55) {
          const fifth = scale[Math.floor(Math.random() * scale.length)];
          this.playCrystalBell(fifth, 1.6, 0.32);
        }
      }

      if (this.detailTimer <= 0) {
        this.detailTimer = 3.2 + Math.random() * 2.5;
        this.playWindGust(0.03, 420);
      }
    } else {
      // Cidadela: deep mysterious drones + rhythmic abyssal pulses
      if (this.detailTimer <= 0) {
        this.detailTimer = 0.85;
        this.pulseStep = (this.pulseStep + 1) % 8;
        const accent = this.pulseStep === 0 || this.pulseStep === 3 || this.pulseStep === 6;
        this.playCitadelPulse(accent ? 58.27 : 43.65, accent ? 0.135 : 0.08);
      }

      if (this.chordTimer <= 0) {
        this.chordTimer = 4.2 + Math.random() * 2.2;
        const modal = [261.63, 277.18, 329.63, 392.0, 415.3];
        const note = modal[Math.floor(Math.random() * modal.length)];
        this.playCrystalBell(note * 0.5, 2.8, 0, 0.05);
      }
    }
  }

  private playWarmChord(freqs: number[], duration: number): void {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.ambientGain) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * (1 + (Math.random() - 0.5) * 0.004), now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(560, now);

      const start = now + i * 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.036, start + 0.9);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      osc.start(start);
      osc.stop(start + duration + 0.05);
    });
  }

  private playCrystalBell(freq: number, duration: number, delay = 0, vol = 0.075): void {
    if (!this.ctx || !this.ambientGain || !this.echoDelay) return;
    const now = this.ctx.currentTime + delay;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.0, now);

    const harmonicGain = this.ctx.createGain();
    harmonicGain.gain.value = 0.22;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain);
    osc2.connect(harmonicGain);
    harmonicGain.connect(gain);

    gain.connect(this.ambientGain);
    gain.connect(this.echoDelay);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  private playCitadelPulse(freq: number, vol: number): void {
    if (!this.ctx || !this.ambientGain || !this.echoDelay) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.15, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.14);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    gain.connect(this.echoDelay);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  private playWindGust(vol = 0.038, cutoff = 340): void {
    if (!this.ctx || !this.ambientGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(cutoff, now);
    filter.Q.value = 1.8;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    src.start(now);
    src.stop(now + 2.3);
  }

  private playCampfireCrackle(): void {
    if (!this.ctx || !this.ambientGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800 + Math.random() * 1400, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    src.start(now, Math.random() * 1.2, 0.06);
  }

  public playSplashChord(canPlay: () => boolean = () => true): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const scheduleNotes = () => {
      if (this.muted || !this.ctx || !this.masterGain || !canPlay()) return;
      if (this.ctx.state !== 'running') return;

      const notes = [
        { freq: 523.25, delay: 0.0, type: 'triangle' as OscillatorType, vol: 0.14, dur: 0.7 },
        { freq: 659.25, delay: 0.06, type: 'sine' as OscillatorType, vol: 0.13, dur: 0.72 },
        { freq: 783.99, delay: 0.12, type: 'triangle' as OscillatorType, vol: 0.12, dur: 0.78 },
        { freq: 987.77, delay: 0.18, type: 'sine' as OscillatorType, vol: 0.11, dur: 0.85 },
        { freq: 1174.66, delay: 0.24, type: 'sine' as OscillatorType, vol: 0.1, dur: 0.95 },
      ];

      const base = this.ctx.currentTime;
      for (const n of notes) {
        const start = base + n.delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = n.type;
        osc.frequency.setValueAtTime(n.freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(n.vol, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);

        osc.connect(gain);
        gain.connect(this.masterGain);
        if (this.echoDelay) {
          gain.connect(this.echoDelay);
        }

        osc.start(start);
        osc.stop(start + n.dur + 0.04);
      }
    };

    if (ctx.state === 'running') {
      scheduleNotes();
    } else {
      ctx
        .resume()
        .then(() => {
          scheduleNotes();
        })
        .catch(() => {});
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.08,
    slideTo?: number,
    delay = 0
  ): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const boostedVolume = Math.min(0.45, volume * 2.5);
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(boostedVolume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playFootstep(biome: BiomeId): void {
    if (this.muted) return;
    const base = biome === 'vila' ? 115 : biome === 'bosque' ? 95 : 140;
    const jitter = (Math.random() - 0.5) * 18;
    this.playTone(base + jitter, 0.05, 'triangle', 0.025, 55);
  }

  public playLanternPulse(): void {
    // Tuning-fork harmonic resonance
    this.playTone(523.25, 0.55, 'sine', 0.085);
    this.playTone(783.99, 0.48, 'sine', 0.055, undefined, 0.03);
    this.playTone(1046.5, 0.42, 'triangle', 0.03, undefined, 0.06);
  }

  public playInteract(): void {
    this.playTone(392, 0.1, 'triangle', 0.06, 440);
  }

  public playDialogueBlip(pitchOffset = 0): void {
    this.playTone(310 + pitchOffset + Math.random() * 24, 0.04, 'square', 0.018);
  }

  public playItemPickup(): void {
    this.playTone(440, 0.14, 'triangle', 0.07, undefined, 0);
    this.playTone(554.37, 0.14, 'triangle', 0.07, undefined, 0.08);
    this.playTone(659.25, 0.25, 'sine', 0.08, undefined, 0.16);
  }

  public playUnlock(): void {
    this.playTone(196, 0.18, 'sawtooth', 0.05, 130);
    this.playTone(493.88, 0.28, 'sine', 0.08, undefined, 0.12);
    this.playTone(739.99, 0.36, 'sine', 0.07, undefined, 0.22);
  }

  public playChoiceRestore(): void {
    // Warm luminous major-9th chord
    this.playTone(261.63, 0.7, 'sine', 0.07, undefined, 0);
    this.playTone(329.63, 0.7, 'sine', 0.06, undefined, 0.06);
    this.playTone(392.0, 0.75, 'sine', 0.06, undefined, 0.12);
    this.playTone(587.33, 0.85, 'triangle', 0.05, undefined, 0.18);
  }

  public playChoiceAbsorb(): void {
    // Heavy abyssal dissonance absorption
    this.playTone(110, 0.65, 'sawtooth', 0.065, 55, 0);
    this.playTone(155.56, 0.6, 'triangle', 0.055, 92, 0.05);
    this.playTone(65.41, 0.85, 'sine', 0.09, undefined, 0.1);
  }

  public playError(): void {
    this.playTone(180, 0.16, 'sawtooth', 0.06, 110);
    this.playTone(145, 0.2, 'sawtooth', 0.05, 95, 0.12);
  }

  public playDamage(): void {
    this.playTone(130, 0.22, 'sawtooth', 0.09, 48);
  }

  public playSave(): void {
    this.playTone(587.33, 0.15, 'sine', 0.06, undefined, 0);
    this.playTone(880.0, 0.3, 'sine', 0.06, undefined, 0.09);
  }
}
