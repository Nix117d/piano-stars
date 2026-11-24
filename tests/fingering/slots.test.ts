import { expect, test } from 'vitest';
import { keySlots, keysOff } from '../../src/fingering/slots';
import { whiteIndex } from '../../src/song/pitch';
import { parseTypedNotes } from '../../src/song/typed-notes';

const seq = (s: string) => { const r = parseTypedNotes(s); if (!r.ok) throw new Error(); return r.notes; };

test('Bb in an F-position song folds up into B\'s slot', () => {
  expect(keySlots(seq('F G A A# C5'))).toEqual([65, 67, 69, 71, 72].map(whiteIndex));
});
test('F# in a D-position song folds down into F\'s slot', () => {
  expect(keySlots(seq('D E F# G A'))[2]).toBe(whiteIndex(65));
});
test('F# below G in a G-position song folds down into F\'s slot', () => {
  expect(keySlots(seq('G F# G A B'))[1]).toBe(whiteIndex(65));
});
test('Bb with both A and B in the song stays half-way, and is tried both ways', () => {
  const slots = keySlots(seq('A A# B'));
  expect(slots[1]).toBe(whiteIndex(69) + 0.5);
  expect(keysOff(1, slots[0]!, slots[1]!)).toBe(0); // A to Bb on neighbouring fingers, as A to B
  expect(keysOff(1, slots[1]!, slots[2]!)).toBe(0); // Bb to B on neighbouring fingers, as A to B
});
test('rests have no slot', () => {
  expect(keySlots(seq('C _ D'))).toEqual([whiteIndex(60), null, whiteIndex(62)]);
});
