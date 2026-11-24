// The ergonomic fingering model of R. Parncutt, J. A. Sloboda, E. F. Clarke, M. Raekallio &
// P. Desain, "An Ergonomic Model of Keyboard Fingering for Melodic Fragments", Music Perception
// 14(4), 1997, pp. 341-382. Table 1 is from p. 346; the 12 rules are from pp. 349-357.
// Transcribed in docs/references/parncutt-1997-fingering-model.md. Check against the paper
// before changing any value here. Right hand only; intervals are in semitones, first to second.
import { isBlack } from '../song/pitch';
import type { Finger } from '../song/types';

export interface Span {
  minPrac: number;
  minComf: number;
  minRel: number;
  maxRel: number;
  maxComf: number;
  maxPrac: number;
}

export type PairKey = '12' | '13' | '14' | '15' | '23' | '24' | '25' | '34' | '35' | '45';

/** Table 1 (p. 346): right-hand spans for finger pairs, lower-numbered finger first. */
export const SPAN_TABLE: Record<PairKey, Span> = {
  '12': { minPrac: -5, minComf: -3, minRel: 1, maxRel: 5, maxComf: 8, maxPrac: 10 },
  '13': { minPrac: -4, minComf: -2, minRel: 3, maxRel: 7, maxComf: 10, maxPrac: 12 },
  '14': { minPrac: -3, minComf: -1, minRel: 5, maxRel: 9, maxComf: 12, maxPrac: 14 },
  '15': { minPrac: -1, minComf: 1, minRel: 7, maxRel: 10, maxComf: 13, maxPrac: 15 },
  '23': { minPrac: 1, minComf: 1, minRel: 1, maxRel: 2, maxComf: 3, maxPrac: 5 },
  '24': { minPrac: 1, minComf: 1, minRel: 3, maxRel: 4, maxComf: 5, maxPrac: 7 },
  '25': { minPrac: 2, minComf: 2, minRel: 5, maxRel: 6, maxComf: 8, maxPrac: 10 },
  '34': { minPrac: 1, minComf: 1, minRel: 1, maxRel: 2, maxComf: 2, maxPrac: 4 },
  '35': { minPrac: 1, minComf: 1, minRel: 3, maxRel: 4, maxComf: 5, maxPrac: 7 },
  '45': { minPrac: 1, minComf: 1, minRel: 1, maxRel: 2, maxComf: 3, maxPrac: 5 },
};

/**
 * The span for `from` then `to`. Reverse pairs change the sign of every value and swap Min and
 * Max (p. 346). The model has no entry for one finger on two notes, so that gives null.
 */
export function span(from: Finger, to: Finger): Span | null {
  if (from === to) return null;
  if (from < to) return SPAN_TABLE[`${from}${to}` as PairKey];
  const s = SPAN_TABLE[`${to}${from}` as PairKey];
  return {
    minPrac: -s.maxPrac, minComf: -s.maxComf, minRel: -s.maxRel,
    maxRel: -s.minRel, maxComf: -s.minComf, maxPrac: -s.minPrac,
  };
}

/** Semitones the interval lies below `min` or above `max` (0 inside the range). */
export function outside(interval: number, min: number, max: number): number {
  return interval < min ? min - interval : interval > max ? interval - max : 0;
}

/**
 * Rules on two consecutive notes played by two different fingers: 1 Stretch, 2 Small-Span,
 * 3 Large-Span, 8 Three-to-Four, 9 Four-on-Black and 12 Thumb-Passing.
 */
export function pairRules(from: Finger, to: Finger, fromMidi: number, toMidi: number): number {
  const s = span(from, to);
  if (!s) return 0;
  const d = toMidi - fromMidi;
  const thumbPair = from === 1 || to === 1;
  let cost = 0;
  // 1 Stretch: 2 per semitone above MaxComf or below MinComf.
  cost += 2 * outside(d, s.minComf, s.maxComf);
  // 2 Small-Span: per semitone below MinRel, 1 for a thumb pair, 2 otherwise.
  if (d < s.minRel) cost += (thumbPair ? 1 : 2) * (s.minRel - d);
  // 3 Large-Span: per semitone above MaxRel, 1 for a thumb pair, 2 otherwise.
  if (d > s.maxRel) cost += (thumbPair ? 1 : 2) * (d - s.maxRel);
  // 8 Three-to-Four: 1 when finger 3 is immediately followed by finger 4.
  if (from === 3 && to === 4) cost += 1;
  // 9 Four-on-Black: 1 when 3 and 4 are consecutive, 3 on a white key and 4 on a black key.
  if ((from === 3 && to === 4) || (from === 4 && to === 3)) {
    const threeMidi = from === 3 ? fromMidi : toMidi;
    const fourMidi = from === 4 ? fromMidi : toMidi;
    if (!isBlack(threeMidi) && isBlack(fourMidi)) cost += 1;
  }
  // 12 Thumb-Passing: the thumb passes under a finger, or a finger passes over the thumb.
  const isPass = (from === 1 && d < 0) || (to === 1 && d > 0);
  if (isPass) {
    const lowerMidi = Math.min(fromMidi, toMidi);
    const upperMidi = Math.max(fromMidi, toMidi);
    const upperFinger = upperMidi === toMidi ? to : from;
    if (isBlack(lowerMidi) === isBlack(upperMidi)) cost += 1;
    else if (!isBlack(lowerMidi) && upperFinger === 1) cost += 3;
  }
  return cost;
}

/**
 * Rules on three consecutive notes: 4 Position-Change-Count, 5 Position-Change-Size and
 * 7 Three-Four-Five. Rules 4 and 5 need Table 1 for the first and third fingers. Table 1 has no
 * entry for one finger on two notes, so (by the controller's decision) they add nothing when the
 * first and third fingers are the same.
 */
export function tripleRules(
  f1: Finger, f2: Finger, f3: Finger, p1: number, p2: number, p3: number,
): number {
  let cost = 0;
  const s = span(f1, f3);
  if (s) {
    const d = p3 - p1;
    const offComf = outside(d, s.minComf, s.maxComf);
    if (offComf > 0) {
      // 4: a full change (2) needs the thumb on the middle note, the middle pitch between the
      // other two, and the first-to-third interval outside the practical range. Otherwise half (1).
      const between = (p1 < p2 && p2 < p3) || (p3 < p2 && p2 < p1);
      const full = f2 === 1 && between && outside(d, s.minPrac, s.maxPrac) > 0;
      cost += full ? 2 : 1;
      // 5: the semitones beyond the comfortable range.
      cost += offComf;
    }
  }
  // 7 Three-Four-Five: fingers 3, 4 and 5 on three consecutive notes, in any order.
  const fs = [f1, f2, f3].sort().join('');
  if (fs === '345') cost += 1;
  return cost;
}

/**
 * Rules on one note: 6 Weak-Finger, 10 Thumb-on-Black and 11 Five-on-Black. `before` and `after`
 * are the neighbouring pitched notes, or null when there is none (a rest or the song's edge).
 */
export function noteRules(
  finger: Finger, midi: number, before: number | null, after: number | null,
): number {
  let cost = 0;
  // 6 Weak-Finger: 1 each time finger 4 or 5 is used.
  if (finger === 4 || finger === 5) cost += 1;
  const white = (m: number | null) => m !== null && !isBlack(m);
  if (isBlack(midi)) {
    // 10 Thumb-on-Black: 1, plus 2 for a white note before and 2 for a white note after.
    if (finger === 1) cost += 1 + (white(before) ? 2 : 0) + (white(after) ? 2 : 0);
    // 11 Five-on-Black: 2 for a white note before and 2 for a white note after
    // (so 0 when both neighbours are black).
    if (finger === 5) cost += (white(before) ? 2 : 0) + (white(after) ? 2 : 0);
  }
  return cost;
}
