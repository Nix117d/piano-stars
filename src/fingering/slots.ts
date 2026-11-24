// White-key slots for the Five-finger position beginner rule (assign.ts). In a five-finger
// position each finger has its own white-key slot. A black key takes the slot of the white
// neighbour it replaces, the way a key signature spells it (Bb in F major takes B's slot).
import { isBlack, whiteIndex } from '../song/pitch';
import type { Note } from '../song/types';

/**
 * The slot of a key, with no song to judge by. A white key has its `whiteIndex`. A black key
 * could take either neighbouring white slot, so it gets the half-way value (`whiteIndex` + 0.5).
 */
export function looseSlot(midi: number): number {
  return whiteIndex(midi) + (isBlack(midi) ? 0.5 : 0);
}

/**
 * Each note's white-key slot, with null for rests. A black key folds up (to the white key above)
 * when the white key just below it is in the song and the one just above isn't. It folds down in
 * the mirror case. Otherwise it keeps the half-way `looseSlot`, and `keysOff` tries both sides.
 */
export function keySlots(notes: Note[]): (number | null)[] {
  const used = new Set(notes.flatMap(n => (n.midi === null ? [] : [n.midi])));
  return notes.map(n => {
    if (n.midi === null) return null;
    const m = n.midi;
    if (!isBlack(m)) return whiteIndex(m);
    const below = used.has(m - 1);
    const above = used.has(m + 1);
    if (below && !above) return whiteIndex(m) + 1;
    if (above && !below) return whiteIndex(m);
    return looseSlot(m);
  });
}

/**
 * White keys a step is off the five-finger position: | |Δ slot| − |Δ finger| |. A half-way slot
 * is read once as the white key below and once as the white key above (both notes the same way),
 * and the smaller result counts.
 */
export function keysOff(fingerGap: number, fromSlot: number, toSlot: number): number {
  const off = (a: number, b: number) => Math.abs(Math.abs(b - a) - fingerGap);
  return Math.min(
    off(Math.floor(fromSlot), Math.floor(toSlot)),
    off(Math.ceil(fromSlot), Math.ceil(toSlot)),
  );
}
