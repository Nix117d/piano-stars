import { KEYBOARD_HIGH, KEYBOARD_LOW } from '../song/pitch';

/** Whole octaves (C to C) covering the notes, at least one octave, within the keyboard. */
export function visibleRange(midis: number[]): { low: number; high: number } {
  const clamp = (v: number) => Math.min(KEYBOARD_HIGH, Math.max(KEYBOARD_LOW, v));
  const low = clamp(12 * Math.floor(Math.min(...midis) / 12));
  const high = clamp(Math.max(low + 12, 12 * Math.ceil(Math.max(...midis) / 12)));
  return { low: Math.min(low, high - 12), high };
}
