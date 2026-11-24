import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parseMusicXml, parseMxl } from '../../src/song/musicxml';

const path = (name: string) => resolve(process.cwd(), 'tests/fixtures', name);
const read = (name: string) => readFileSync(path(name), 'utf8');
const readBytes = (name: string) => new Uint8Array(readFileSync(path(name)));

describe('MusicXML import', () => {
  test('simple melody, title and tempo', () => {
    const r = parseMusicXml(read('simple.musicxml'));
    expect(r).toMatchObject({ ok: true, title: 'Test', tempo: 100, hasFingering: false, octaveShift: 0 });
    expect(r.ok && r.notes.map(n => n.midi)).toEqual([60, 62, 64, 60]);
  });
  test('chord keeps top note, tie merges, rest kept', () => {
    const r = parseMusicXml(read('chord-tie-rest.musicxml'));
    expect(r.ok && r.notes).toEqual([
      { midi: 64, beats: 1 }, { midi: 67, beats: 2 }, { midi: null, beats: 1 }, { midi: 60, beats: 1 },
    ]);
  });
  test('fingering marks are read', () => {
    const r = parseMusicXml(read('fingered.musicxml'));
    expect(r.ok && r.hasFingering).toBe(true);
    expect(r.ok && r.notes.map(n => n.finger)).toEqual([1, 2, 3]);
  });
  test('out-of-range song is shifted into the keyboard', () => {
    const r = parseMusicXml(read('high.musicxml'));
    expect(r.ok && r.octaveShift).toBeLessThan(0);
    expect(r.ok && Math.max(...r.notes.map(n => n.midi ?? 0))).toBeLessThanOrEqual(96);
  });
  test('mxl unzips to the same song', () => {
    expect(parseMxl(readBytes('simple.mxl'))).toEqual(parseMusicXml(read('simple.musicxml')));
  });
  test('garbage and empty files', () => {
    expect(parseMusicXml('not xml')).toEqual({ ok: false, reason: 'unreadable' });
    expect(parseMusicXml('<score-partwise><part-list/><part id="P1"/></score-partwise>')).toEqual({ ok: false, reason: 'noNotes' });
    expect(parseMxl(new Uint8Array([1, 2, 3]))).toEqual({ ok: false, reason: 'unreadable' });
  });
  test('accidentals, other voices/staves, fractional beats, rests-only', () => {
    const xml = `<score-partwise><part id="P1"><measure>
      <attributes><divisions>4</divisions></attributes>
      <note><pitch><step>F</step><alter>1</alter><octave>4</octave></pitch><duration>6</duration><voice>1</voice><staff>1</staff></note>
      <note><pitch><step>B</step><alter>-1</alter><octave>4</octave></pitch><duration>1</duration></note>
      <note><pitch><step>C</step><octave>2</octave></pitch><duration>4</duration><voice>2</voice></note>
      <note><pitch><step>C</step><octave>3</octave></pitch><duration>4</duration><staff>2</staff></note>
      <backup><duration>7</duration></backup>
    </measure></part></score-partwise>`;
    const r = parseMusicXml(xml);
    expect(r.ok && r.notes).toEqual([{ midi: 66, beats: 1.5 }, { midi: 70, beats: 0.25 }]);
    expect(r).toMatchObject({ tempo: 80 });
    expect(parseMusicXml('<score-partwise><part id="P1"><measure><note><rest/><duration>1</duration></note></measure></part></score-partwise>'))
      .toEqual({ ok: false, reason: 'noNotes' });
  });
  const score = (body: string) =>
    `<score-partwise><part id="P1"><measure><attributes><divisions>1</divisions></attributes>${body}</measure></part></score-partwise>`;
  const n = (step: string, extra = '', tie = '') =>
    `<note>${extra}<pitch><step>${step}</step><octave>4</octave></pitch><duration>1</duration>${tie}</note>`;

  test('tied chords merge into one note on the top pitch', () => {
    const r = parseMusicXml(score(n('C') + n('E', '<chord/>') + n('C', '', '<tie type="stop"/>') + n('E', '<chord/>', '<tie type="stop"/>')));
    expect(r.ok && r.notes).toEqual([{ midi: 64, beats: 2 }]);
  });
  test('tied chord with the higher note listed first', () => {
    const r = parseMusicXml(score(n('E') + n('C', '<chord/>') + n('E', '', '<tie type="stop"/>') + n('C', '<chord/>', '<tie type="stop"/>')));
    expect(r.ok && r.notes).toEqual([{ midi: 64, beats: 2 }]);
  });
  test('forward in voice 1 adds silence, in another voice is skipped', () => {
    const r = parseMusicXml(score(n('C') + '<forward><duration>2</duration></forward>' + n('D') +
      '<forward><duration>3</duration><voice>2</voice></forward>' + n('E')));
    expect(r.ok && r.notes).toEqual([{ midi: 60, beats: 1 }, { midi: null, beats: 2 }, { midi: 62, beats: 1 }, { midi: 64, beats: 1 }]);
  });
});
