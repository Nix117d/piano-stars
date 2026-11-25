import { expect, test } from 'vitest';
import { visibleRange } from '../../src/ui/range';
import { contrastRatio, keyColor, NOTE_COLORS, textOn } from '../../src/ui/colors';

test('visibleRange whole octaves, at least one', () => {
  expect(visibleRange([60, 67])).toEqual({ low: 60, high: 72 });
  expect(visibleRange([60, 72])).toEqual({ low: 60, high: 72 });
  expect(visibleRange([55, 64])).toEqual({ low: 48, high: 72 });
  expect(visibleRange([64])).toEqual({ low: 60, high: 72 });
});

test('visibleRange clamps to the keyboard', () => {
  expect(visibleRange([20, 30])).toEqual({ low: 36, high: 48 });
  expect(visibleRange([90, 100])).toEqual({ low: 84, high: 96 });
});

test('keyColor: white keys use the note colour, black keys a 35% darker lower neighbour', () => {
  expect(keyColor(60)).toBe(NOTE_COLORS.C);
  expect(keyColor(61)).toBe('#952522'); // E53935 * 0.65
});

test('visibleRange of no notes defaults to the middle-C octave', () => {
  expect(visibleRange([])).toEqual({ low: 60, high: 72 });
});

test('textOn: dark text on light colours, white on dark ones', () => {
  for (const l of ['C', 'D', 'E', 'F', 'G', 'A'] as const) expect(textOn(NOTE_COLORS[l]), l).toBe('#000000');
  expect(textOn(NOTE_COLORS.B)).toBe('#ffffff');
});

test('contrastRatio follows WCAG 2', () => {
  expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
});

test('finger numbers are readable on every key colour (WCAG AA, 4.5:1)', () => {
  for (const [letter, color] of Object.entries(NOTE_COLORS)) {
    expect(contrastRatio(color, textOn(color)), letter).toBeGreaterThanOrEqual(4.5);
  }
  for (const midi of [61, 63, 66, 68, 70]) { // the black keys, darkened
    expect(contrastRatio(keyColor(midi), textOn(keyColor(midi))), String(midi)).toBeGreaterThanOrEqual(4.5);
  }
});
