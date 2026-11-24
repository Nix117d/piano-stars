// Fingering search: Parncutt et al. (1997) rules (parncutt.ts) plus beginner rules from the
// design. A 5-year-old stays in five-finger positions and moves the hand only at breaks; thumb
// passing is never taught. See docs/references/parncutt-1997-fingering-model.md.
import { whiteIndex } from '../song/pitch';
import type { Finger, Note } from '../song/types';
import { noteRules, outside, pairRules, span, tripleRules } from './parncutt';

// Beginner-rule weights (ours, not the paper's). The brief's five weights are unchanged. With only
// those, the paper's rules finger Ode to Joy's E E F G G as 2 2 3 5 5 (cost 6) rather than
// 3 3 4 5 5 (cost 7). That lets the hand drift (finger 3 plays F, later finger 4 does), and no
// single transition counts as a hand move. The controller added the Five-finger position rule
// below to fix that; tuning the five weights could not, since none of them fires on either path.
/** A hand move at a break (a rest before, or a previous note of 2 beats or more). */
export const HAND_MOVE_AT_BREAK = 10;
/** A hand move of 3 semitones or more away from a break: lifting the hand to a new place. */
export const HAND_MOVE_LIFT = 40;
/** A hand move of 1-2 semitones away from a break: a thumb-under or finger-over crossing. */
export const HAND_MOVE_CROSSING = 1000;
/** The same pitch again with a different finger. */
export const REPEAT_NEW_FINGER = 5;
/** Per semitone outside [MinComf, MaxComf]: a 5-year-old's hand is small. */
export const SMALL_HAND_PER_SEMITONE = 3;
/**
 * Five-finger position, per white key a step is off: in a five-finger position each finger has
 * its own key, so a step between fingers f and g covers |f - g| white keys (in C position,
 * C D E F G = 1 2 3 4 5). From the design's five-finger-position sources (Thompson's Easiest Piano
 * Course, Piano Time 1), not from Parncutt. It is the paper's "next-note-next-finger" idea behind
 * Small/Large-Span, stated for a child. A black key counts as the white key just below it
 * (`whiteIndex`).
 */
export const FIVE_FINGER_POSITION_PER_KEY = 3;

const FINGERS: Finger[] = [1, 2, 3, 4, 5];

/**
 * The hand has to move: the finger direction disagrees with the pitch direction (a higher note
 * with a lower or the same finger, or the reverse), or the interval is outside the pair's
 * practical range. The same finger on the same pitch is a repeated note, not a move.
 */
export function isHandMove(from: Finger, to: Finger, fromMidi: number, toMidi: number): boolean {
  const d = toMidi - fromMidi;
  if (from === to) return d !== 0;
  if ((d > 0 && to < from) || (d < 0 && to > from)) return true;
  const s = span(from, to)!;
  return outside(d, s.minPrac, s.maxPrac) > 0;
}

/**
 * The cost of playing `toMidi` with `to` right after `fromMidi` with `from`: the paper's pair
 * rules plus the beginner rules. The paper's single-note rules (6, 10, 11) are not here, because
 * rules 10 and 11 need the note after as well. `assignFingering` adds them for each note.
 */
export function transitionCost(
  from: Finger, to: Finger, fromMidi: number, toMidi: number, atBreak: boolean,
): number {
  const d = toMidi - fromMidi;
  // A hand move costs only its own price; none of the paper's pair rules apply to it.
  if (isHandMove(from, to, fromMidi, toMidi)) {
    if (atBreak) return HAND_MOVE_AT_BREAK;
    // The brief prices 1-2 semitones as a crossing and 3 or more as a lift. A move on the same
    // pitch (0 semitones, e.g. 2 then 3 on one key) is not a crossing, so it is priced as a lift.
    return Math.abs(d) === 1 || Math.abs(d) === 2 ? HAND_MOVE_CROSSING : HAND_MOVE_LIFT;
  }
  if (from === to) return 0; // a repeated note
  const s = span(from, to)!;
  return pairRules(from, to, fromMidi, toMidi)
    + (d === 0 ? REPEAT_NEW_FINGER : 0)
    + SMALL_HAND_PER_SEMITONE * outside(d, s.minComf, s.maxComf)
    + FIVE_FINGER_POSITION_PER_KEY
      * Math.abs(Math.abs(whiteIndex(toMidi) - whiteIndex(fromMidi)) - Math.abs(to - from));
}

interface Pitched { index: number; midi: number; allowed: Finger[]; atBreak: boolean; cost: (f: Finger) => number }

/** Pitched notes in order, with whether the transition into each one is at a break. */
function pitchedNotes(notes: Note[]): Pitched[] {
  const out: Pitched[] = [];
  let lastIndex = -1;
  notes.forEach((n, index) => {
    if (n.midi === null) return;
    const midi = n.midi;
    const prev = notes[index - 1];
    const next = notes[index + 1];
    const before = prev && prev.midi !== null ? prev.midi : null;
    const after = next && next.midi !== null ? next.midi : null;
    const atBreak = lastIndex >= 0
      && (index - lastIndex > 1 || notes[lastIndex].beats >= 2);
    out.push({
      index, midi, atBreak,
      allowed: n.finger !== undefined ? [n.finger] : FINGERS,
      cost: f => noteRules(f, midi, before, after),
    });
    lastIndex = index;
  });
  return out;
}

/**
 * Fills in a finger for every pitched note that has none, keeping fingers already set. Rests are
 * left alone. Second-order Viterbi: a state is (previous finger, current finger), so the paper's
 * three-note rules can be scored.
 * Each note adds the single-note rules (6, 10, 11); these always apply, even on a hand move. Equal-cost paths go to the lowest finger numbers, first note first.
 */
export function assignFingering(notes: Note[]): Note[] {
  const ps = pitchedNotes(notes);
  const n = ps.length;
  if (n === 0) return notes.map(x => ({ ...x }));

  const trans = (i: number, a: Finger, b: Finger) =>
    transitionCost(a, b, ps[i - 1].midi, ps[i].midi, ps[i].atBreak);
  const triple = (i: number, a: Finger, b: Finger, c: Finger) =>
    isHandMove(a, b, ps[i - 2].midi, ps[i - 1].midi) || isHandMove(b, c, ps[i - 1].midi, ps[i].midi)
      ? 0
      : tripleRules(a, b, c, ps[i - 2].midi, ps[i - 1].midi, ps[i].midi);
  // Cost of adding note i with finger c after fingers a, b on notes i-2, i-1.
  const step = (i: number, a: Finger, b: Finger, c: Finger) =>
    trans(i, b, c) + triple(i, a, b, c) + ps[i].cost(c);

  const chosen: Finger[] = [];
  if (n === 1) {
    chosen.push(argmin(ps[0].allowed, f => ps[0].cost(f)));
  } else {
    // togo[i][a][b]: the least cost of notes i+1..n-1 given fingers a, b on notes i-1, i.
    const togo: number[][][] = [];
    togo[n - 1] = grid(() => 0);
    for (let i = n - 2; i >= 1; i--) {
      togo[i] = grid((a, b) => Math.min(...ps[i + 1].allowed.map(c => step(i + 1, a, b, c) + togo[i + 1][b][c])));
    }
    // Pick the first two fingers, then each next one, taking the lowest finger on ties.
    let best = Infinity;
    for (const a of ps[0].allowed) {
      for (const b of ps[1].allowed) {
        const cost = ps[0].cost(a) + ps[1].cost(b) + trans(1, a, b) + togo[1][a][b];
        if (cost < best) { best = cost; chosen[0] = a; chosen[1] = b; }
      }
    }
    for (let i = 2; i < n; i++) {
      const a = chosen[i - 2];
      const b = chosen[i - 1];
      chosen.push(argmin(ps[i].allowed, c => step(i, a, b, c) + togo[i][b][c]));
    }
  }

  const out = notes.map(x => ({ ...x }));
  ps.forEach((p, i) => { out[p.index].finger = chosen[i]; });
  return out;
}

/**
 * Indexes (into `notes`) of the notes reached by a hand move of 1-2 semitones away from a break:
 * a thumb-under or finger-over crossing on a step. Notes without a finger are skipped.
 */
export function crossesOnStep(notes: Note[]): number[] {
  const ps = pitchedNotes(notes);
  const out: number[] = [];
  for (let i = 1; i < ps.length; i++) {
    const from = notes[ps[i - 1].index].finger;
    const to = notes[ps[i].index].finger;
    if (from === undefined || to === undefined || ps[i].atBreak) continue;
    const d = Math.abs(ps[i].midi - ps[i - 1].midi);
    if ((d === 1 || d === 2) && isHandMove(from, to, ps[i - 1].midi, ps[i].midi)) out.push(ps[i].index);
  }
  return out;
}

/** A 6x6 table indexed by finger (index 0 unused). */
function grid(value: (a: Finger, b: Finger) => number): number[][] {
  const g: number[][] = [];
  for (const a of FINGERS) {
    g[a] = [];
    for (const b of FINGERS) g[a][b] = value(a, b);
  }
  return g;
}

/** The finger with the least cost; the lowest finger number on ties. */
function argmin(fingers: Finger[], cost: (f: Finger) => number): Finger {
  let best = fingers[0];
  let bestCost = cost(best);
  for (const f of fingers.slice(1)) {
    const c = cost(f);
    if (c < bestCost) { best = f; bestCost = c; }
  }
  return best;
}
