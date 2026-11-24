import { expect, test } from 'vitest';
import {
  assignFingering, crossesOnStep, HAND_MOVE_AT_BREAK, HAND_MOVE_CROSSING, HAND_MOVE_LIFT, neighbours, transitionCost,
} from '../../src/fingering/assign';
import { SPAN_TABLE } from '../../src/fingering/parncutt';
import { handPositions } from '../../src/fingering/positions';
import { parseTypedNotes } from '../../src/song/typed-notes';

const seq = (s: string) => { const r = parseTypedNotes(s); if (!r.ok) throw new Error(); return r.notes; };
const fingers = (s: string) => assignFingering(seq(s)).filter(n => n.midi !== null).map(n => n.finger);

test('C position scale', () => { expect(fingers('C D E F G')).toEqual([1, 2, 3, 4, 5]); });
test('Ode to Joy opening stays in C position', () => {
  expect(fingers('E E F G G F E D C C D E E- D/ D-')).toEqual([3,3,4,5,5,4,3,2,1,1,2,3,3,2,2]);
});
test('no crossings on steps when the melody has breaks to move at', () => {
  expect(crossesOnStep(assignFingering(seq('C D E F G- A B C5- B A G F E- D C')))).toEqual([]);
});
test('a hand move happens at the long note, not mid-run', () => {
  const f = assignFingering(seq('C D E F G- A B C5'));
  expect(handPositions(f).map(p => p.startIndex)).toEqual([0, 5]);
});
test('shift happens at the rest, not mid-phrase', () => {
  // C-position phrase, rest, then a phrase needing A and B
  const f = assignFingering(seq('C D E F G- _ A B A G'));
  expect(f.slice(0, 5).map(n => n.finger)).toEqual([1, 2, 3, 4, 5]);
  expect(handPositions(f).map(p => p.startIndex)).toEqual([0, 6]);
});
test('Ode to Joy in F position: Bb fits between A and C', () => {
  const f = assignFingering(seq('A A A# C5 C5 A# A G F F G A A- G/ G-'));
  expect(f.map(n => n.finger)).toEqual([3,3,4,5,5,4,3,2,1,1,2,3,3,2,2]);
  expect(handPositions(f).map(p => p.startIndex)).toEqual([0]);
});
test('Ode to Joy in D position: F# fits between E and G', () => {
  expect(fingers('D E F# G A')).toEqual([1, 2, 3, 4, 5]);
  const f = assignFingering(seq('F# F# G A A G F# E D D E F# F#- E/ E-'));
  expect(f.map(n => n.finger)).toEqual([3,3,4,5,5,4,3,2,1,1,2,3,3,2,2]);
  expect(handPositions(f).map(p => p.startIndex)).toEqual([0]);
});
test('five-finger position counts a black key from the white key on either side', () => {
  expect(transitionCost(3, 4, 69, 70, false)).toBe(2); // A to Bb, as A to B: only rules 8 and 9
  expect(transitionCost(4, 5, 70, 72, false)).toBe(0); // Bb to C, as B to C
  expect(transitionCost(2, 3, 64, 66, false)).toBe(0); // E to F#, as E to F
});
test('a rest is no neighbour for the black-key rules', () => {
  const notes = seq('C _ C# D');
  expect(neighbours(notes, 2)).toEqual({ before: null, after: 62 });
  expect(neighbours(notes, 0)).toEqual({ before: null, after: null });
  expect(neighbours(notes, 3)).toEqual({ before: 61, after: null });
});
test('keeps fingers set by the sheet or parent', () => {
  expect(fingers('C(2) D E')).toEqual([2, 3, 4]);
});
test('SPAN_TABLE has all ten right-hand pairs', () => {
  expect(Object.keys(SPAN_TABLE).sort()).toEqual(['12','13','14','15','23','24','25','34','35','45']);
});
test('reverse pairs flip the sign and swap min and max (p. 346)', () => {
  // 1-2 rising 10 and 2-1 falling 10 are the same span: stretch 2x2, span 5x1, small hand 2x3,
  // and five-finger position 5x3 (E3 to D4 is 6 white keys for a 1-finger step).
  expect(transitionCost(1, 2, 52, 62, false)).toBe(30);
  expect(transitionCost(2, 1, 62, 52, false)).toBe(30);
  // One more semitone is past MaxPrac (10 for 1-2, so MinPrac -10 for 2-1): the hand must move.
  expect(transitionCost(2, 1, 62, 51, false)).toBe(HAND_MOVE_LIFT);
});
test('hand-move costs', () => {
  expect(transitionCost(3, 1, 64, 65, false)).toBe(HAND_MOVE_CROSSING); // thumb under on a step
  expect(transitionCost(3, 1, 64, 65, true)).toBe(HAND_MOVE_AT_BREAK);
  expect(transitionCost(5, 1, 67, 69, false)).toBe(HAND_MOVE_CROSSING);
  expect(transitionCost(5, 1, 67, 72, false)).toBe(HAND_MOVE_LIFT);
  expect(transitionCost(3, 3, 64, 64, false)).toBe(0); // a repeated note
  expect(transitionCost(3, 3, 64, 65, false)).toBe(HAND_MOVE_CROSSING); // same finger, new key
});
test('C position steps cost nothing between the notes', () => {
  expect(transitionCost(1, 2, 60, 62, false)).toBe(0);
  expect(transitionCost(4, 5, 65, 67, false)).toBe(0);
});
test('five-finger position: a step skipping a finger costs 3 per white key it is off', () => {
  // 3 then 5 on F to G: Small-Span 2 (1 below MinRel 3, non-thumb pair) + five-finger position 3.
  expect(transitionCost(3, 5, 65, 67, false)).toBe(5);
  expect(transitionCost(3, 5, 65, 69, false)).toBe(0);
});
test('crossesOnStep reports where a step crossing lands', () => {
  const notes = seq('C(1) D(2) E(3) F(1)');
  expect(crossesOnStep(notes)).toEqual([3]);
  expect(crossesOnStep(seq('C(1) D(2) E(3)- F(1)'))).toEqual([]);
});
test('rests are left alone', () => {
  const f = assignFingering(seq('C _ D'));
  expect(f[1]).toEqual({ midi: null, beats: 1 });
  expect(f.map(n => n.finger)).toEqual([1, undefined, 2]);
});
