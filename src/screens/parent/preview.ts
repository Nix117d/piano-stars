import { synth } from '../../audio/synth';
import type { Note } from '../../song/types';

let timers: ReturnType<typeof setTimeout>[] = [];

export function stopPreview(): void {
  timers.forEach(clearTimeout);
  timers = [];
}

/**
 * Plays the notes through the synth at the song tempo; rests are silence. `onEnd` runs when the
 * last note is over, unless `stopPreview` (or another preview) came first.
 */
export function playPreview(tempo: number, notes: Note[], onEnd?: () => void): void {
  stopPreview();
  const beatMs = 60000 / tempo;
  let at = 0;
  for (const n of notes) {
    const ms = n.beats * beatMs;
    const midi = n.midi;
    if (midi !== null) {
      const start = at;
      timers.push(setTimeout(() => synth.playNote(midi, ms), start));
    }
    at += ms;
  }
  if (onEnd) timers.push(setTimeout(onEnd, at));
}
