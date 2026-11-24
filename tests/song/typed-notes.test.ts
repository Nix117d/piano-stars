import { describe, expect, test } from 'vitest';
import { parseTypedNotes, serializeTypedNotes } from '../../src/song/typed-notes';

describe('typed notes', () => {
  test('the spec example', () => {
    const r = parseTypedNotes('C, D, E, C, C');
    expect(r.ok && r.notes.map(n => n.midi)).toEqual([60, 62, 64, 60, 60]);
    expect(r.ok && r.tempo).toBe(80);
  });
  test('spaces, bars and new lines all separate', () => {
    const r = parseTypedNotes('C D | E\nC');
    expect(r.ok && r.notes.length).toBe(4);
  });
  test('lengths, rests and halves', () => {
    const r = parseTypedNotes('C C- C--- C/ _ _-');
    expect(r.ok && r.notes.map(n => n.beats)).toEqual([1, 2, 4, 0.5, 1, 2]);
    expect(r.ok && r.notes[4].midi).toBeNull();
  });
  test('fingers in brackets, with length after', () => {
    const r = parseTypedNotes('E(3) G4(5)-');
    expect(r.ok && r.notes).toEqual([{ midi: 64, beats: 1, finger: 3 }, { midi: 67, beats: 2, finger: 5 }]);
  });
  test('notes without a finger have no finger key', () => {
    const r = parseTypedNotes('C');
    expect(r.ok && 'finger' in r.notes[0]).toBe(false);
  });
  test('tempo line', () => {
    const r = parseTypedNotes('tempo 90\nC D');
    expect(r.ok && r.tempo).toBe(90);
  });
  test('tempo is case-insensitive and may follow blank lines', () => {
    const r = parseTypedNotes('\n  TEMPO 120\nC');
    expect(r.ok && r.tempo).toBe(120);
  });
  test('bad tempo is reported', () => {
    for (const src of ['tempo\nC', 'tempo 10\nC', 'tempo 301\nC', 'tempo fast\nC']) {
      const r = parseTypedNotes(src);
      expect(!r.ok && r.errors[0].code).toBe('badTempo');
    }
  });
  test('b alone is B and bb is B-flat', () => {
    const r = parseTypedNotes('b bb');
    expect(r.ok && r.notes.map(n => n.midi)).toEqual([71, 70]);
  });
  test('errors carry position and code', () => {
    const r = parseTypedNotes('C, X, E(7), C9');
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errors.map(e => [e.token, e.code, e.start])).toEqual([
      ['X', 'unknownNote', 3], ['E(7)', 'badFinger', 6], ['C9', 'outOfRange', 12],
    ]);
    expect(!r.ok && r.errors[0].end).toBe(4);
  });
  test('error offsets count the tempo line', () => {
    const r = parseTypedNotes('tempo 90\nC X');
    expect(!r.ok && r.errors).toEqual([{ start: 11, end: 12, token: 'X', code: 'unknownNote' }]);
  });
  test('serialize round-trips', () => {
    const src = 'tempo 100\nC(1) D(2)- _ E/';
    const r = parseTypedNotes(src);
    if (!r.ok) throw new Error();
    expect(parseTypedNotes(serializeTypedNotes(r.tempo, r.notes))).toEqual(r);
  });
  test('serialize uses sharps and omits octave 4', () => {
    expect(serializeTypedNotes(80, [{ midi: 61, beats: 1 }, { midi: 72, beats: 1 }, { midi: 48, beats: 0.5, finger: 2 }]))
      .toBe('tempo 80\nC# C5 C3(2)/');
  });
});
