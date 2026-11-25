import { whiteIndex } from '../song/pitch';
import type { Finger, Note } from '../song/types';
import { isHandMove } from './assign';
import { keySlots, looseSlot } from './slots';

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
 * Splits fingered notes into five-finger positions. A new position starts at a note reached by a
 * hand move (as `assignFingering` defines it), at the first note that would make one finger
 * play two different keys, or at a key played again with a different finger (two fingers can't
 * share one key). Rests and unfingered notes don't split positions.
 */
export function handPositions(notes: Note[]): HandPosition[] {
  const positions: HandPosition[] = [];
  let current: HandPosition | null = null;
  let last: { finger: Finger; midi: number } | null = null;
  notes.forEach((n, index) => {
    if (n.midi === null || n.finger === undefined) return;
    const held = current?.fingerKeys[n.finger];
    const keyTaken = current !== null
      && FINGERS.some(f => f !== n.finger && current!.fingerKeys[f] === n.midi);
    const moved = last !== null && isHandMove(last.finger, n.finger, last.midi, n.midi);
    last = { finger: n.finger, midi: n.midi };
    if (!current || moved || keyTaken || (held !== undefined && held !== n.midi)) {
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
 * (the lower one when two are equally near). A filled finger never takes a key that another
 * finger already has: it steps on, away from that nearest finger, to the next free white key.
 * Fingers 2-4 must stay strictly between the keys of the used fingers on either side; when no
 * free key fits there, the finger is left out. The thumb and little finger always get a key,
 * since `positionWidth` and the hand screens need them.
 */
function fillUnusedFingers(keys: Partial<Record<Finger, number>>): void {
  const used = FINGERS.filter(f => keys[f] !== undefined);
  const taken = new Set(used.map(f => keys[f]!));
  for (const f of FINGERS) {
    if (keys[f] !== undefined) continue;
    const nearest = used.reduce((a, b) => (Math.abs(b - f) < Math.abs(a - f) ? b : a));
    const step = f > nearest ? 1 : -1;
    const below = used.filter(u => u < f).map(u => keys[u]!);
    const above = used.filter(u => u > f).map(u => keys[u]!);
    const outer = f === 1 || f === 5;
    const fits = (key: number) => outer
      || ((below.length === 0 || key > Math.max(...below)) && (above.length === 0 || key < Math.min(...above)));
    let index = whiteIndex(keys[nearest]!) + (f - nearest);
    while (taken.has(whiteKey(index)) && fits(whiteKey(index))) index += step;
    const key = whiteKey(index);
    if (taken.has(key) || !fits(key)) continue;
    keys[f] = key;
    taken.add(key);
  }
}

/**
 * White keys from the thumb's key to the little finger's key, both counted (C position is 5).
 * A black key counts as the white-key slot the song's spelling gives it (`keySlots`); one that
 * could take either slot is read the narrower way.
 */
export function positionWidth(notes: Note[], position: HandPosition): number {
  const slots = keySlots(notes);
  const slotOf = (midi: number) => {
    const i = notes.findIndex(n => n.midi === midi);
    return i >= 0 ? slots[i]! : looseSlot(midi);
  };
  return Math.floor(slotOf(position.fingerKeys[5]!)) - Math.ceil(slotOf(position.fingerKeys[1]!)) + 1;
}
