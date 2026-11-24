import { describe, expect, test } from 'vitest';
import { medalFor, starsLevel1, starsLevel2 } from '../../src/play/scoring';

describe('scoring', () => {
  test('stars level 1', () => {
    expect(starsLevel1(0, 20)).toBe(5); expect(starsLevel1(2, 20)).toBe(4);
    expect(starsLevel1(5, 20)).toBe(3); expect(starsLevel1(10, 20)).toBe(2); expect(starsLevel1(20, 20)).toBe(1);
    expect(starsLevel1(0, 0)).toBe(5);
  });
  test('stars level 2 never below 1, mashing costs', () => {
    expect(starsLevel2({ onTime: 20, close: 0, missed: 0, wrongPresses: 0, total: 20 })).toBe(5);
    expect(starsLevel2({ onTime: 20, close: 0, missed: 0, wrongPresses: 60, total: 20 })).toBe(1);
    expect(starsLevel2({ onTime: 16, close: 2, missed: 2, wrongPresses: 0, total: 20 })).toBe(4);
    expect(starsLevel2({ onTime: 14, close: 4, missed: 2, wrongPresses: 0, total: 20 })).toBe(3);
    expect(starsLevel2({ onTime: 0, close: 0, missed: 0, wrongPresses: 0, total: 0 })).toBe(5);
  });
  test('medals', () => {
    expect([0, 1, 2, 3, 4, 5].map(medalFor)).toEqual(['none', 'bronze', 'bronze', 'silver', 'silver', 'gold']);
  });
});
