// Fingering search: Parncutt et al. (1997) rules (parncutt.ts) plus beginner rules from the
// design. A 5-year-old stays in five-finger positions and moves the hand only at breaks; thumb
// passing is never taught. See docs/references/parncutt-1997-fingering-model.md.
import type { Finger, Note } from '../song/types';
import { noteRules, outside, pairRules, span, tripleRules } from './parncutt';
import { handPositions, positionWidth } from './positions';
import { keySlots, keysOff, looseSlot } from './slots';

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
 * Small/Large-Span, stated for a child. A black key takes the white-key slot the song's spelling
 * gives it (slots.ts, controller ruling N): Bb in an F-position song takes B's slot.
 */
export const FIVE_FINGER_POSITION_PER_KEY = 3;
/**
 * The widest five-finger position, in white keys from the thumb's key to the little finger's key
 * (both counted, black keys by `keySlots`). Five neighbouring white keys is the design's
 * five-finger position (Thompson's Easiest Piano Course, Piano Time 1); one more allows a single
 * small stretch, as in the 1-2 step of C E F G A. A beginner rule for a 5-year-old's hand, not
 * from Parncutt, whose spans are an adult's.
 */
export const MAX_POSITION_WIDTH = 6;

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
 * `slots` are the two notes' white-key slots from `keySlots`. Without them, each black key is
 * tried as the white key below and the white key above, and the smaller cost counts.
 */
export function transitionCost(
  from: Finger, to: Finger, fromMidi: number, toMidi: number, atBreak: boolean,
  slots?: { from: number; to: number },
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
    + FIVE_FINGER_POSITION_PER_KEY * keysOff(
      Math.abs(to - from), slots?.from ?? looseSlot(fromMidi), slots?.to ?? looseSlot(toMidi));
}

interface Pitched {
  index: number; midi: number; beats: number; slot: number; allowed: Finger[]; atBreak: boolean;
  cost: (f: Finger) => number;
}

/**
 * The pitches just before and after `notes[index]`, for rules 10 and 11. A rest or the edge of the
 * song gives null: no neighbour, so that part of the rule adds nothing.
 */
export function neighbours(notes: Note[], index: number): { before: number | null; after: number | null } {
  return { before: notes[index - 1]?.midi ?? null, after: notes[index + 1]?.midi ?? null };
}

/** Pitched notes in order, with their key slots and whether the transition into each is at a break. */
function pitchedNotes(notes: Note[]): Pitched[] {
  const out: Pitched[] = [];
  const slots = keySlots(notes);
  let lastIndex = -1;
  notes.forEach((n, index) => {
    if (n.midi === null) return;
    const midi = n.midi;
    const { before, after } = neighbours(notes, index);
    const atBreak = lastIndex >= 0
      && (index - lastIndex > 1 || notes[lastIndex].beats >= 2);
    out.push({
      index, midi, beats: n.beats, atBreak, slot: slots[index]!,
      allowed: n.finger !== undefined ? [n.finger] : FINGERS,
      cost: f => noteRules(f, midi, before, after),
    });
    lastIndex = index;
  });
  return out;
}

/**
 * Fills in a finger for every pitched note that has none, keeping fingers already set. Rests are
 * left alone.
 *
 * Two steps. First a second-order Viterbi search (`search`) on the per-transition costs above.
 * Those costs can't see a whole position's width, so a run of small, cheap steps can still put
 * the hand over 7 white keys. Then the width rule (MAX_POSITION_WIDTH) as a post-pass: split the
 * fingering into positions (`handPositions`); for each position wider than the rule allows, pick
 * the best place inside it for a hand move (`bestBreak`) and search again with a hand move
 * required there, so the fingers on both sides are chosen afresh. Repeat until every position
 * fits. Each round adds at least one required move inside a too-wide position, and a position
 * of one note is 5 keys wide, so this ends. When fingers set by the sheet or parent leave no
 * room for a move, that position is left as it is.
 */
export function assignFingering(notes: Note[]): Note[] {
  const ps = pitchedNotes(notes);
  if (ps.length === 0) return notes.map(x => ({ ...x }));

  const required = new Set<number>();
  let out = withFingers(notes, ps, search(ps, required)!);
  for (;;) {
    const positions = handPositions(out);
    const added: number[] = [];
    positions.forEach((p, k) => {
      if (positionWidth(out, p) <= MAX_POSITION_WIDTH) return;
      const end = positions[k + 1]?.startIndex ?? notes.length;
      const i = bestBreak(ps, p.startIndex, end);
      if (i !== null) added.push(i);
    });
    if (added.length === 0) return out;
    added.forEach(i => required.add(i));
    const chosen = search(ps, required);
    if (!chosen) return out; // the set fingers can't take all the moves: keep the last fingering
    out = withFingers(notes, ps, chosen);
  }
}

/** A copy of `notes` with `chosen[i]` on the i-th pitched note. */
function withFingers(notes: Note[], ps: Pitched[], chosen: Finger[]): Note[] {
  const out = notes.map(x => ({ ...x }));
  ps.forEach((p, i) => { out[p.index].finger = chosen[i]; });
  return out;
}

/**
 * The best pitched note (an index into `ps`) strictly inside notes[start..end) to move the hand
 * to, or null if there is none. In order of preference: a natural break (a rest or a long note
 * before it, as the design asks); a leap of 3 semitones or more (a lift, not a crossing); a
 * repeated pitch; and last a step, which costs a crossing. Within each, the longest note before
 * it wins, then the earliest. A note whose fixed fingers rule out a hand move is skipped.
 */
function bestBreak(ps: Pitched[], start: number, end: number): number | null {
  let best: number | null = null;
  let bestKey: [number, number] = [Infinity, 0];
  for (let i = 1; i < ps.length; i++) {
    if (ps[i].index <= start || ps[i].index >= end) continue;
    const d = Math.abs(ps[i].midi - ps[i - 1].midi);
    if (!ps[i - 1].allowed.some(a => ps[i].allowed.some(b => isHandMove(a, b, ps[i - 1].midi, ps[i].midi)))) {
      continue;
    }
    const tier = ps[i].atBreak ? 0 : d >= 3 ? 1 : d === 0 ? 2 : 3;
    const key: [number, number] = [tier, -ps[i - 1].beats];
    if (key[0] < bestKey[0] || (key[0] === bestKey[0] && key[1] < bestKey[1])) { best = i; bestKey = key; }
  }
  return best;
}

/**
 * Second-order Viterbi: a state is (previous finger, current finger), so the paper's three-note
 * rules can be scored. Each note also adds the single-note rules (6, 10, 11), which always apply,
 * even on a hand move. At each pitched index in `required` the transition must be a hand move.
 * Equal-cost paths go to the lowest finger numbers, first note first. Returns null when no
 * fingering meets `required`.
 */
function search(ps: Pitched[], required: Set<number>): Finger[] | null {
  const n = ps.length;
  const trans = (i: number, a: Finger, b: Finger) =>
    required.has(i) && !isHandMove(a, b, ps[i - 1].midi, ps[i].midi)
      ? Infinity
      : transitionCost(a, b, ps[i - 1].midi, ps[i].midi, ps[i].atBreak, { from: ps[i - 1].slot, to: ps[i].slot });
  const triple = (i: number, a: Finger, b: Finger, c: Finger) =>
    isHandMove(a, b, ps[i - 2].midi, ps[i - 1].midi) || isHandMove(b, c, ps[i - 1].midi, ps[i].midi)
      ? 0
      : tripleRules(a, b, c, ps[i - 2].midi, ps[i - 1].midi, ps[i].midi);
  // Cost of adding note i with finger c after fingers a, b on notes i-2, i-1.
  const step = (i: number, a: Finger, b: Finger, c: Finger) =>
    trans(i, b, c) + triple(i, a, b, c) + ps[i].cost(c);

  const chosen: Finger[] = [];
  if (n === 1) return [argmin(ps[0].allowed, f => ps[0].cost(f))];
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
  if (best === Infinity) return null;
  for (let i = 2; i < n; i++) {
    const a = chosen[i - 2];
    const b = chosen[i - 1];
    chosen.push(argmin(ps[i].allowed, c => step(i, a, b, c) + togo[i][b][c]));
  }
  return chosen;
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
