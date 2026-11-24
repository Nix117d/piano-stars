import { Midi } from '@tonejs/midi';
import { describe, expect, test } from 'vitest';
import { parseMidiFile } from '../../src/song/midi-file';

const PPQ = 480;
type N = { midi: number; ticks: number; durationTicks: number };

function build(tracks: { channel: number; name?: string; notes: N[] }[], tempo?: number, name?: string): Uint8Array {
  const midi = new Midi();
  if (tempo) midi.header.setTempo(tempo);
  if (name) midi.header.name = name;
  for (const t of tracks) {
    const track = midi.addTrack();
    track.channel = t.channel;
    if (t.name) track.name = t.name;
    for (const n of t.notes) track.addNote(n);
  }
  return midi.toArray();
}
const n = (midi: number, beat: number, beats: number): N => ({ midi, ticks: beat * PPQ, durationTicks: beats * PPQ });

describe('parseMidiFile', () => {
  test('picks first non-percussion track, top note of chords, rests from gaps', () => {
    const bytes = build([
      { channel: 9, notes: [n(36, 0, 1), n(38, 2, 1)] },
      { channel: 0, notes: [n(60, 0, 1), n(64, 0, 1), n(67, 2, 1)] },
    ]);
    const r = parseMidiFile(bytes);
    expect(r.ok && r.notes).toEqual([{ midi: 64, beats: 1 }, { midi: null, beats: 1 }, { midi: 67, beats: 1 }]);
    expect(r.ok && r.hasFingering).toBe(false);
  });

  test('tempo from file, default 80', () => {
    const notes = [n(60, 0, 1)];
    const r = parseMidiFile(build([{ channel: 0, notes }], 120));
    expect(r.ok && r.tempo).toBe(120);
    const d = parseMidiFile(build([{ channel: 0, notes }]));
    expect(d.ok && d.tempo).toBe(80);
  });

  test('title from track name or header name', () => {
    const notes = [n(60, 0, 1)];
    const a = parseMidiFile(build([{ channel: 0, name: 'Melody', notes }]));
    expect(a.ok && a.title).toBe('Melody');
    const b = parseMidiFile(build([{ channel: 0, notes }], undefined, 'Song'));
    expect(b.ok && b.title).toBe('Song');
  });

  test('overlapping notes take the onset spacing; short last note has 0.25 minimum', () => {
    const r = parseMidiFile(build([{ channel: 0, notes: [n(60, 0, 2), n(62, 1, 1), n(64, 2, 0.01)] }]));
    expect(r.ok && r.notes).toEqual([{ midi: 60, beats: 1 }, { midi: 62, beats: 1 }, { midi: 64, beats: 0.25 }]);
  });

  test('silence before the first note is ignored', () => {
    const r = parseMidiFile(build([{ channel: 0, notes: [n(60, 3, 1)] }]));
    expect(r.ok && r.notes).toEqual([{ midi: 60, beats: 1 }]);
  });

  test('off-grid onsets: cumulative beats equal the snapped onset positions', () => {
    // Triplet-ish onsets every 1/3 beat; each note lasts until the next onset.
    const ticks = [0, 160, 320, 480, 640, 800, 960];
    const notes = ticks.map((t, k) => ({ midi: 60 + k, ticks: t, durationTicks: 160 }));
    const r = parseMidiFile(build([{ channel: 0, notes }]));
    if (!r.ok) throw new Error('expected ok');
    const starts: number[] = [];
    let at = 0;
    for (const note of r.notes) {
      if (note.midi !== null) starts.push(at);
      at += note.beats;
    }
    const snapped = ticks.map(t => Math.round(t / PPQ / 0.25) * 0.25);
    expect(starts).toEqual(snapped);
  });

  test('onsets collapsing into one slot keep the highest note', () => {
    const r = parseMidiFile(
      build([{ channel: 0, notes: [n(60, 0, 1), n(72, 0.05, 1), n(64, 0.1, 1), n(65, 1, 1)] }]),
    );
    expect(r.ok && r.notes).toEqual([{ midi: 72, beats: 1 }, { midi: 65, beats: 1 }]);
  });

  test('very short non-last note is floored at 0.25 beats', () => {
    const r = parseMidiFile(build([{ channel: 0, notes: [n(60, 0, 0.05), n(62, 1, 1)] }]));
    expect(r.ok && r.notes).toEqual([{ midi: 60, beats: 0.25 }, { midi: null, beats: 0.75 }, { midi: 62, beats: 1 }]);
  });

  test('no usable notes', () => {
    expect(parseMidiFile(build([{ channel: 9, notes: [n(36, 0, 1)] }]))).toEqual({ ok: false, reason: 'noNotes' });
  });

  test('garbage', () => {
    expect(parseMidiFile(new Uint8Array([1, 2, 3]))).toEqual({ ok: false, reason: 'unreadable' });
  });
});
