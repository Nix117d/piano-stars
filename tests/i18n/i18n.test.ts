import { expect, test } from 'vitest';
import { en, nl } from '../../src/i18n/index';
import { t } from '../../src/i18n/index';

test('both languages have exactly the same keys', () => {
  expect(Object.keys(nl).sort()).toEqual(Object.keys(en).sort());
});

test('no empty strings', () => {
  for (const v of [...Object.values(nl), ...Object.values(en)]) {
    expect(v.trim()).not.toBe('');
  }
});

test('placeholders', () => {
  expect(t('nl', 'hand.thumbOn', { note: 'C' })).toBe('Duim op de C');
  expect(t('en', 'hand.thumbOn', { note: 'C' })).toBe('Thumb on C');
});

test('unknown placeholders are left as is', () => {
  expect(t('en', 'hand.thumbOn', { other: 'x' })).toBe('Thumb on {note}');
});

test('returns the copy for each language', () => {
  expect(t('nl', 'picker.title')).toBe('Kies een liedje');
  expect(t('en', 'picker.title')).toBe('Pick a song');
});
