"use client";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled() {
    return this.enabled;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Sound error", e);
    }
  }

  public playClick() {
    this.playTone(600, "sine", 0.05, 0.05);
  }

  public playCorrect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    // Play an uplifting major third interval
    this.playTone(523.25, "sine", 0.1, 0.1); // C5
    setTimeout(() => this.playTone(659.25, "sine", 0.3, 0.1), 100); // E5
  }

  public playWrong() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    // Play a low, dissonant buzz
    this.playTone(150, "sawtooth", 0.2, 0.1);
    setTimeout(() => this.playTone(140, "sawtooth", 0.3, 0.1), 150);
  }

  public playWin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, "square", 0.2, 0.08), i * 150);
    });
  }

  public playLose() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, "triangle", 0.3, 0.1), i * 200);
    });
  }
  
  public playCountdown() {
    this.playTone(880, "sine", 0.1, 0.05);
  }
}

export const sounds = new SoundEngine();
