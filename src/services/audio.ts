/**
 * Emergency Hamburg CAD/MDT Audio Synthesizer
 * Uses Web Audio API for 100% reliable portofoon status beeps and emergency sirens.
 */

class CadAudioManager {
  private ctx: AudioContext | null = null;
  private isSirenPlaying = false;
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private isMuted = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.isSirenPlaying) {
      this.stopPanicSiren();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * FEATURE 3: Portofoon Status-Gong
   * Plays a distinct, realistic TETRA/Motorola radio chirp when changing Status 1-4.
   */
  public playStatusGong(statusNumber: number = 1) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';

      // Slight tone differentiation per status
      const baseFreq = statusNumber === 4 ? 1200 : statusNumber === 3 ? 1050 : statusNumber === 2 ? 880 : 740;
      const secondFreq = baseFreq * 1.33;

      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.setValueAtTime(secondFreq, now + 0.08);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.01);
      gain.gain.setValueAtTime(0.35, now + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);

      // Short subtle radio squelch white-noise burst
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now + 0.20);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now + 0.20);
    } catch {
      // AudioContext could be blocked by autoplay policy before user gesture
    }
  }

  /**
   * FEATURE 2: Noodknop Looping Siren
   * Plays a loud, continuous emergency wail / yelp alarm sound until cleared.
   */
  public startPanicSiren() {
    if (this.isMuted || this.isSirenPlaying) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      this.isSirenPlaying = true;

      // Master siren gain
      this.sirenGain = ctx.createGain();
      this.sirenGain.gain.setValueAtTime(0.01, now);
      this.sirenGain.gain.linearRampToValueAtTime(0.5, now + 0.1);

      // Dual tone European / Police Wail
      this.sirenOsc1 = ctx.createOscillator();
      this.sirenOsc1.type = 'sawtooth';

      this.sirenOsc2 = ctx.createOscillator();
      this.sirenOsc2.type = 'sine';

      // LFO for pitch modulation (frequency wobble)
      this.lfo = ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(1.8, now); // 1.8 Hz cycle (fast urgent police siren)
      
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(260, now); // pitch sweep range +/- 260 Hz

      this.sirenOsc1.frequency.setValueAtTime(750, now);
      this.sirenOsc2.frequency.setValueAtTime(750, now);

      this.lfo.connect(lfoGain);
      lfoGain.connect(this.sirenOsc1.frequency);
      lfoGain.connect(this.sirenOsc2.frequency);

      // Low pass filter to make it sound full and authoritative, not harsh
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);

      this.sirenOsc1.connect(filter);
      this.sirenOsc2.connect(filter);
      filter.connect(this.sirenGain);
      this.sirenGain.connect(ctx.destination);

      this.lfo.start(now);
      this.sirenOsc1.start(now);
      this.sirenOsc2.start(now);
    } catch {
      this.isSirenPlaying = false;
    }
  }

  public stopPanicSiren() {
    if (!this.isSirenPlaying) return;
    const ctx = this.getContext();
    if (ctx && this.sirenGain) {
      try {
        const now = ctx.currentTime;
        this.sirenGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        setTimeout(() => {
          this.cleanupSiren();
        }, 120);
      } catch {
        this.cleanupSiren();
      }
    } else {
      this.cleanupSiren();
    }
  }

  private cleanupSiren() {
    try {
      this.sirenOsc1?.stop();
      this.sirenOsc2?.stop();
      this.lfo?.stop();
      this.sirenOsc1?.disconnect();
      this.sirenOsc2?.disconnect();
      this.lfo?.disconnect();
      this.sirenGain?.disconnect();
    } catch {
      // Ignored
    }
    this.sirenOsc1 = null;
    this.sirenOsc2 = null;
    this.lfo = null;
    this.sirenGain = null;
    this.isSirenPlaying = false;
  }
}

export const cadAudio = new CadAudioManager();
