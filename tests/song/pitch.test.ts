import { describe, expect, test } from 'vitest';
import { fitToKeyboard, isBlack, midiToName, parsePitch, whiteIndex } from '../../src/song/pitch';

describe('pitch helpers', () => {
  test('plain letters are the middle-C octave', () => {
    expect(parsePitch('C')).toBe(60); expect(parsePitch('b')).toBe(71); expect(parsePitch('A')).toBe(69);
  });
  test('octave numbers, sharps and flats', () => {
    expect(parsePitch('C5')).toBe(72); expect(parsePitch('G3')).toBe(55);
    expect(parsePitch('C#')).toBe(61); expect(parsePitch('Db')).toBe(61);
    expect(parsePitch('F#4')).toBe(66); expect(parsePitch('Bb3')).toBe(58);
    expect(parsePitch('bb')).toBe(70); expect(parsePitch('eb')).toBe(63);
  });
  test('rejects junk', () => {
    expect(parsePitch('H')).toBeNull(); expect(parsePitch('C##')).toBeNull(); expect(parsePitch('')).toBeNull();
  });
  test('midiToName and isBlack', () => {
    expect(midiToName(61)).toEqual({ letter: 'C', sharp: true, octave: 4 });
    expect(midiToName(60)).toEqual({ letter: 'C', sharp: false, octave: 4 });
    expect(isBlack(61)).toBe(true); expect(isBlack(64)).toBe(false);
  });
  test('whiteIndex counts white keys below', () => {
    expect(whiteIndex(0)).toBe(0); expect(whiteIndex(2)).toBe(1);
    expect(whiteIndex(60)).toBe(35); expect(whiteIndex(61)).toBe(35); expect(whiteIndex(62)).toBe(36);
  });
  test('fitToKeyboard shifts whole octaves into 36..96', () => {
    const r = fitToKeyboard([{ midi: 100, beats: 1 }, { midi: 98, beats: 1 }, { midi: null, beats: 1 }]);
    expect(r.octaveShift).toBe(-1);
    expect(r.notes.map(n => n.midi)).toEqual([88, 86, null]);
    expect(fitToKeyboard([{ midi: 60, beats: 1 }]).octaveShift).toBe(0);
  });
  test('fitToKeyboard shifts up, and handles spans wider than the keyboard', () => {
    expect(fitToKeyboard([{ midi: 20, beats: 1 }, { midi: 30, beats: 1 }]).octaveShift).toBe(2);
    const wide = fitToKeyboard([{ midi: 24, beats: 1 }, { midi: 100, beats: 1 }]);
    expect(wide.octaveShift).toBe(1);
    expect(wide.notes.map(n => n.midi)).toEqual([36, 112]);
    expect(fitToKeyboard([{ midi: null, beats: 1 }]).octaveShift).toBe(0);
  });
  test('fitToKeyboard fallback never returns -0', () => {
    const r = fitToKeyboard([{ midi: 40, beats: 1 }, { midi: 100, beats: 1 }]);
    expect(Object.is(r.octaveShift, 0)).toBe(true);
    expect(r.notes.map(n => n.midi)).toEqual([40, 100]);
  });
  test('fitToKeyboard fallback shifts down by the same amount for every note', () => {
    const r = fitToKeyboard([{ midi: 60, beats: 1 }, { midi: null, beats: 1 }, { midi: 130, beats: 1 }]);
    expect(r.octaveShift).toBe(-2);
    expect(r.notes.map(n => n.midi)).toEqual([36, null, 106]);
  });
});
