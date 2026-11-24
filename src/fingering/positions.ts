import { whiteIndex } from '../song/pitch';
import type { Finger, Note } from '../song/types';

export interface HandPosition {
  /** Index into the song's notes (rests included) of the first note in this position. */
  startIndex: number;
  /** The key (MIDI number) under each finger. */
  fingerKeys: Partial<Record<Finger, number>>;
}

const FINGERS: Finger[] = [1, 2, 3, 4, 5];
const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

/** The MIDI number of the white key with this `whiteIndex`. */
function whiteKey(index: number): number {
  const octave = Math.floor(index / 7);
  return octave * 12 + WHITE_SEMITONES[index - octave * 7];
}

/**
 * Splits fingered notes into five-finger positions. A position lasts while no finger has to play
 * two different keys; a new one starts at the first note that would. Rests and unfingered notes
 * don't split positions.
 */
export function handPositions(notes: Note[]): HandPosition[] {
  const positions: HandPosition[] = [];
  let current: HandPosition | null = null;
  notes.forEach((n, index) => {
    if (n.midi === null || n.finger === undefined) return;
    const held = current?.fingerKeys[n.finger];
    if (!current || (held !== undefined && held !== n.midi)) {
      current = { startIndex: index, fingerKeys: {} };
      positions.push(current);
    }
    current.fingerKeys[n.finger] = n.midi;
  });
  for (const p of positions) fillUnusedFingers(p.fingerKeys);
  return positions;
}

/**
 * Gives each finger no note uses a key by stepping along white keys from the nearest used finger
 * (the lower one when two are equally near).
 */
function fillUnusedFingers(keys: Partial<Record<Finger, number>>): void {
  const used = FINGERS.filter(f => keys[f] !== undefined);
  for (const f of FINGERS) {
    if (keys[f] !== undefined) continue;
    const nearest = used.reduce((a, b) => (Math.abs(b - f) < Math.abs(a - f) ? b : a));
    keys[f] = whiteKey(whiteIndex(keys[nearest]!) + (f - nearest));
  }
}
