import { expect, test } from 'vitest';
import { assignFingering } from '../../src/fingering/assign';
import { handPositions, positionWidth } from '../../src/fingering/positions';
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
test('a filled finger never takes a key played in the position (Für Elise bar 2)', () => {
  // Finger 3 plays nothing. Stepping from finger 2 (G#) lands on A, which finger 4 plays, and no
  // white key lies between G# and A, so finger 3 is left out.
  const p = handPositions(seq('E(1) A(4) B(5) E(1) G#(2)'));
  expect(p).toEqual([{ startIndex: 0, fingerKeys: { 1: 64, 2: 68, 4: 69, 5: 71 } }]);
});
test('a filled thumb steps past a played key to the next free one', () => {
  // The thumb plays nothing. One white key below finger 2 (D) is C, which finger 3 plays.
  const p = handPositions(seq('D(2) E(4) C(3)'));
  expect(p).toEqual([{ startIndex: 0, fingerKeys: { 1: 59, 2: 62, 3: 60, 4: 64, 5: 65 } }]);
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
test('a hand move starts a new position, even onto an unused finger', () => {
  // E(3) to B(4) rises 7 semitones, past 3-4's MaxPrac of 4: the hand has to lift.
  expect(handPositions(seq('C(1) D(2) E(3) B(4)')).map(x => x.startIndex)).toEqual([0, 3]);
});
test('a key played with a different finger starts a new position', () => {
  // D is played with 3, then with 2: two fingers can't share one key in a position.
  const p = handPositions(seq('A3(1) D(3) E(4) _ A3(1) D(2) E(3)'));
  expect(p.map(x => x.startIndex)).toEqual([0, 5]);
  for (const x of p) {
    const keys = Object.values(x.fingerKeys);
    expect(new Set(keys).size).toBe(keys.length);
  }
});
test('no built-in position puts two fingers on one key (Bella Ciao did)', async () => {
  const { BUILTIN_SONGS } = await import('../../src/songs/builtin/index');
  for (const b of BUILTIN_SONGS) {
    const r = parseTypedNotes(b.typed); if (!r.ok) throw new Error(b.id);
    for (const x of handPositions(assignFingering(r.notes))) {
      const keys = Object.values(x.fingerKeys);
      expect(new Set(keys).size, `${b.id} @${x.startIndex}`).toBe(keys.length);
    }
  }
});
test('positionWidth counts white keys from the thumb key to the little-finger key', () => {
  const wide = seq('C(1) E(2) G(3) A(4) B(5)');
  expect(positionWidth(wide, handPositions(wide)[0])).toBe(7);
  const c = seq('C(1) G(5)');
  expect(positionWidth(c, handPositions(c)[0])).toBe(5);
  // Bb next to A (and no B) takes B's slot: F G A Bb C is F position, 5 keys.
  const f = seq('F(1) A(3) A#(4) C5(5)');
  expect(positionWidth(f, handPositions(f)[0])).toBe(5);
});
