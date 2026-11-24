import { expect, test } from 'vitest';
import { assignFingering } from '../../src/fingering/assign';
import { handPositions } from '../../src/fingering/positions';
import { parseTypedNotes } from '../../src/song/typed-notes';

const seq = (s: string) => { const r = parseTypedNotes(s); if (!r.ok) throw new Error(); return r.notes; };

test('handPositions for one C position', () => {
  const p = handPositions(assignFingering(seq('E E F G G F E D C')));
  expect(p).toEqual([{ startIndex: 0, fingerKeys: { 1: 60, 2: 62, 3: 64, 4: 65, 5: 67 } }]);
});
test('unused fingers step along white keys from the nearest used finger', () => {
  const p = handPositions(seq('G(1) A(2) B(3)'));
  expect(p).toEqual([{ startIndex: 0, fingerKeys: { 1: 67, 2: 69, 3: 71, 4: 72, 5: 74 } }]);
});
test('a new position starts at the first note that moves a finger', () => {
  const p = handPositions(seq('C(1) D(2) _ F(2) G(3)'));
  expect(p.map(x => x.startIndex)).toEqual([0, 3]);
  expect(p[1].fingerKeys).toEqual({ 1: 64, 2: 65, 3: 67, 4: 69, 5: 71 });
});
test('a song starting with a rest starts its first position at the first note', () => {
  expect(handPositions(seq('_ C(1)')).map(x => x.startIndex)).toEqual([1]);
  expect(handPositions(seq('_ _'))).toEqual([]);
});
