import type { Note } from './types';

export const KEYBOARD_LOW = 36;
export const KEYBOARD_HIGH = 96;

type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

const LETTER_SEMITONE: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_NAMES: Array<{ letter: Letter; sharp: boolean }> = [
  { letter: 'C', sharp: false }, { letter: 'C', sharp: true },
  { letter: 'D', sharp: false }, { letter: 'D', sharp: true },
  { letter: 'E', sharp: false }, { letter: 'F', sharp: false },
  { letter: 'F', sharp: true }, { letter: 'G', sharp: false },
  { letter: 'G', sharp: true }, { letter: 'A', sharp: false },
  { letter: 'A', sharp: true }, { letter: 'B', sharp: false },
];
const WHITES_BELOW = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
const BLACK = new Set([1, 3, 6, 8, 10]);

/** Parses "C", "f#", "Bb3", "C5"... Plain letters are the middle-C octave (C = 60). */
export function parsePitch(token: string): number | null {
  const m = /^([A-Ga-g])([#b]?)(-?\d)?$/.exec(token);
  if (!m) return null;
  const semitone = LETTER_SEMITONE[m[1].toUpperCase() as Letter]
    + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const octave = m[3] === undefined ? 4 : Number(m[3]);
  return (octave + 1) * 12 + semitone;
}

export function midiToName(midi: number): { letter: Letter; sharp: boolean; octave: number } {
  const { letter, sharp } = SHARP_NAMES[((midi % 12) + 12) % 12];
  return { letter, sharp, octave: Math.floor(midi / 12) - 1 };
}

export function isBlack(midi: number): boolean {
  return BLACK.has(((midi % 12) + 12) % 12);
}

/** Count of white keys below; a black key gets the index of the white key just below it. */
export function whiteIndex(midi: number): number {
  const octave = Math.floor(midi / 12);
  return octave * 7 + WHITES_BELOW[midi - octave * 12];
}

/** Shifts the song by whole octaves so it sits inside KEYBOARD_LOW..KEYBOARD_HIGH. */
export function fitToKeyboard(notes: Note[]): { notes: Note[]; octaveShift: number } {
  const pitches = notes.flatMap(n => (n.midi === null ? [] : [n.midi]));
  if (pitches.length === 0) return { notes, octaveShift: 0 };
  const lo = Math.min(...pitches);
  const hi = Math.max(...pitches);
  const minShift = Math.ceil((KEYBOARD_LOW - lo) / 12);
  const maxShift = Math.floor((KEYBOARD_HIGH - hi) / 12);
  // If no whole-octave shift fits both ends, settle for the lowest note being on the keyboard.
  const octaveShift = minShift <= maxShift ? Math.min(Math.max(0, minShift), maxShift) : minShift;
  if (octaveShift === 0) return { notes, octaveShift: 0 };
  return {
    notes: notes.map(n => (n.midi === null ? n : { ...n, midi: n.midi + octaveShift * 12 })),
    octaveShift,
  };
}
