// Point values from docs/references/parncutt-1997-fingering-model.md (Parncutt et al. 1997, pp. 349-357).
import { describe, expect, test } from 'vitest';
import { noteRules, pairRules, tripleRules } from '../../src/fingering/parncutt';

describe('pair rules', () => {
  test('1 Stretch and 3 Large-Span for a non-thumb pair', () => {
    // 2-3 rising 6: 3 above MaxComf 3 (x2) + 4 above MaxRel 2 (x2).
    expect(pairRules(2, 3, 60, 66)).toBe(6 + 8);
  });
  test('2 Small-Span: 2 per semitone for a non-thumb pair', () => {
    expect(pairRules(3, 5, 65, 67)).toBe(2); // 1 below MinRel 3
  });
  test('8 Three-to-Four and 9 Four-on-Black', () => {
    expect(pairRules(3, 4, 64, 66)).toBe(2); // 3 on E (white), 4 on F# (black): rule 8 + rule 9
    expect(pairRules(4, 3, 66, 64)).toBe(1); // either order: rule 9 only
    expect(pairRules(3, 4, 63, 64)).toBe(1); // 3 on D# (black): rule 8 only
  });
  test('12 Thumb-Passing: 1 at the same level, 3 for a finger on white and the thumb on black above', () => {
    // 2 then 1, rising 2: Large-Span 3 (2-1's MaxRel is -1, thumb pair) plus the pass.
    expect(pairRules(2, 1, 62, 64)).toBe(3 + 1); // D (2) to E (thumb): white to white
    expect(pairRules(2, 1, 64, 66)).toBe(3 + 3); // E (2) to F# (thumb): white finger, black thumb above
    expect(pairRules(1, 2, 66, 64)).toBe(3 + 3); // finger over: F# (thumb) to E (2)
    expect(pairRules(2, 1, 61, 62)).toBe(2 + 0); // C# (2) to D (thumb): neither case
    expect(pairRules(1, 2, 60, 62)).toBe(0); // no pass
  });
});

describe('three-note rules', () => {
  // 3-5: MinComf 1, MaxComf 5, MaxPrac 7.
  test('4 and 5: a full change needs the thumb in the middle, between, and past MaxPrac', () => {
    expect(tripleRules(3, 1, 5, 60, 62, 70)).toBe(2 + 5); // full change + 5 past MaxComf
  });
  test('4 and 5: anything else past MaxComf is a half change', () => {
    expect(tripleRules(3, 2, 5, 60, 62, 70)).toBe(1 + 5); // middle note not the thumb
    expect(tripleRules(3, 1, 5, 60, 72, 70)).toBe(1 + 5); // middle pitch not between
    expect(tripleRules(3, 1, 5, 60, 62, 66)).toBe(1 + 1); // inside MaxPrac
  });
  test('4 and 5: nothing inside the comfortable range, or with the same first and third finger', () => {
    expect(tripleRules(3, 1, 5, 60, 62, 64)).toBe(0);
    expect(tripleRules(3, 4, 3, 64, 65, 72)).toBe(0);
  });
  test('7 Three-Four-Five in any order', () => {
    expect(tripleRules(3, 4, 5, 64, 65, 67)).toBe(1);
    expect(tripleRules(5, 3, 4, 67, 64, 65)).toBe(1); // G to F on 5-4 is -2, inside its comfortable range
    expect(tripleRules(3, 4, 4, 64, 65, 65)).toBe(0);
  });
});

describe('single-note rules', () => {
  test('6 Weak-Finger: 1 for finger 4 or 5', () => {
    expect(noteRules(4, 64, 62, 65)).toBe(1);
    expect(noteRules(3, 64, 62, 65)).toBe(0);
  });
  test('10 Thumb-on-Black: 1, plus 2 for each white neighbour; a missing neighbour adds nothing', () => {
    expect(noteRules(1, 61, 60, 62)).toBe(5);
    expect(noteRules(1, 61, null, 62)).toBe(3);
    expect(noteRules(1, 61, 63, 66)).toBe(1);
  });
  test('11 Five-on-Black: 0 with black neighbours, 2 for each white one', () => {
    expect(noteRules(5, 70, 68, 73)).toBe(1 + 0); // Weak-Finger only
    expect(noteRules(5, 70, 69, 72)).toBe(1 + 4);
    expect(noteRules(5, 70, 69, null)).toBe(1 + 2);
  });
});
