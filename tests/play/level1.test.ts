import { describe, expect, test } from 'vitest';
import { Level1Session } from '../../src/play/level1';
import { parseTypedNotes } from '../../src/song/typed-notes';

function seq(text: string) {
  const r = parseTypedNotes(text);
  if (!r.ok) throw new Error('bad test notes');
  return r.notes;
}

describe('Level1Session', () => {
  test('exact key only, octave matters', () => {
    const s = new Level1Session(seq('C D'));
    expect(s.press(72)).toBe('wrong');
    expect(s.press(60)).toBe('correct');
    expect(s.current()?.note.midi).toBe(62);
  });
  test('at most one mistake per target note', () => {
    const s = new Level1Session(seq('C D'));
    s.press(61); s.press(63); s.press(65); s.press(60); s.press(64); s.press(62);
    expect(s.mistakes).toBe(2);
    expect(s.isDone()).toBe(true);
  });
  test('rests are skipped but indexes refer to the original array', () => {
    const s = new Level1Session(seq('C _ D'));
    s.press(60);
    expect(s.current()?.index).toBe(2);
    expect(s.total).toBe(2);
    expect(s.progress()).toEqual({ done: 1, total: 2 });
  });
  test('after done, press is ignored and changes nothing', () => {
    const s = new Level1Session(seq('C'));
    s.press(60);
    expect(s.press(61)).toBe('ignored');
    expect(s.mistakes).toBe(0);
    expect(s.current()).toBeNull();
  });
  test('a song with no pitched notes is done straight away', () => {
    const s = new Level1Session(seq('_ _'));
    expect(s.isDone()).toBe(true);
    expect(s.total).toBe(0);
  });
});
