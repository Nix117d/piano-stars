// Small original sounds made with Web Audio: no audio files, nothing to download.

let ctx: AudioContext | null | undefined;

/** The shared AudioContext, or null where there is none (jsdom, very old browsers). */
function audio(): AudioContext | null {
  if (ctx === undefined) {
    const AC = globalThis.AudioContext
      ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    try {
      ctx = AC ? new AC() : null;
    } catch {
      ctx = null;
    }
  }
  if (ctx?.state === 'suspended') void ctx.resume();
  return ctx;
}

const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function tone(c: AudioContext, hz: number, start: number, seconds: number, type: OscillatorType, peak: number): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = hz;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

export const synth = {
  /** A soft piano-ish note, for tap mode and parent previews. */
  playNote(midi: number, ms: number): void {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    tone(c, freq(midi), t, ms / 1000, 'triangle', 0.3);
    tone(c, freq(midi) * 2, t, ms / 2000, 'sine', 0.06);
  },

  /** A short happy run up to a bright chord, for the results screen. */
  celebrate(): void {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    [72, 76, 79].forEach((m, i) => tone(c, freq(m), t + i * 0.11, 0.3, 'triangle', 0.22));
    for (const m of [84, 88]) tone(c, freq(m), t + 0.33, 0.7, 'sine', 0.16);
    tone(c, freq(96), t + 0.45, 0.25, 'sine', 0.05);
  },

  /** A gentle metronome tick. */
  click(): void {
    const c = audio();
    if (!c) return;
    tone(c, 1200, c.currentTime, 0.04, 'sine', 0.15);
  },
};
