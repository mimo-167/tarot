export class TarotAudioEngine {
  private context?: AudioContext;
  private ambient?: { gain: GainNode; oscillators: OscillatorNode[] };

  private getContext() {
    if (typeof window === "undefined") return undefined;
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") void this.context.resume();
    return this.context;
  }

  startAmbient() {
    const context = this.getContext();
    if (!context || this.ambient) return;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.022, context.currentTime + 1.8);
    gain.connect(context.destination);
    const oscillators = [110, 164.81, 220].map((frequency, index) => {
      const oscillator = context.createOscillator();
      const voice = context.createGain();
      oscillator.type = index === 1 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index * 3;
      voice.gain.value = index === 1 ? 0.32 : 0.16;
      oscillator.connect(voice).connect(gain);
      oscillator.start();
      return oscillator;
    });
    this.ambient = { gain, oscillators };
  }

  stopAmbient() {
    if (!this.context || !this.ambient) return;
    const { gain, oscillators } = this.ambient;
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.35);
    window.setTimeout(() => oscillators.forEach((oscillator) => oscillator.stop()), 420);
    this.ambient = undefined;
  }

  chime(kind: "select" | "shuffle" | "reveal") {
    const context = this.getContext();
    if (!context) return;
    const gain = context.createGain();
    const oscillator = context.createOscillator();
    const now = context.currentTime;
    const frequencies = { select: [330, 430], shuffle: [180, 260], reveal: [440, 720] }[kind];
    oscillator.type = kind === "shuffle" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequencies[0], now);
    oscillator.frequency.exponentialRampToValueAtTime(frequencies[1], now + 0.28);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.45);
  }
}
