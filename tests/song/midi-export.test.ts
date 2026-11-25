import { Midi } from '@tonejs/midi';
import { expect, test } from 'vitest';
import { exportFileName, exportFileNames, exportSmf0 } from '../../src/song/midi-export';
import { BUILTIN_SONGS } from '../../src/songs/builtin/index';
import { parseMidiFile } from '../../src/song/midi-file';
import { parseTypedNotes } from '../../src/song/typed-notes';
import type { Song } from '../../src/song/types';

function songOf(text: string, title = 'Test'): Song {
  const r = parseTypedNotes(text);
  if (!r.ok) throw new Error('bad typed notes');
  return {
    id: 't', title, source: 'typed', tempo: r.tempo, notes: r.notes, fingeringSource: 'rules',
    picture: '🐸', hidden: false, createdAt: 0,
  };
}

test('format 0, one track, channel 1, round-trips', () => {
  const bytes = exportSmf0(songOf('tempo 100\nC D- _ E'));
  expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('MThd');
  expect((bytes[8] << 8) | bytes[9]).toBe(0);   // format 0
  expect((bytes[10] << 8) | bytes[11]).toBe(1); // one track
  const midi = new Midi(bytes);
  expect(midi.tracks[0].channel).toBe(0);
  expect(Math.round(midi.header.tempos[0].bpm)).toBe(100);
  const back = parseMidiFile(bytes);
  expect(back.ok && back.notes.map(n => [n.midi, n.beats])).toEqual([[60, 1], [62, 2], [null, 1], [64, 1]]);
});

test('track length is correct and the track ends with end-of-track', () => {
  const bytes = exportSmf0(songOf('C D', 'Zie, ginds'));
  expect(String.fromCharCode(...bytes.slice(14, 18))).toBe('MTrk');
  const len = (bytes[18] << 24) | (bytes[19] << 16) | (bytes[20] << 8) | bytes[21];
  expect(bytes.length).toBe(22 + len);
  expect([...bytes.slice(-3)]).toEqual([0xff, 0x2f, 0x00]);
  expect(new Midi(bytes).tracks[0].name).toBe('Zie, ginds');
});

test('a 1.5-beat note and a fractional rest export to the right tick lengths', () => {
  const midi = new Midi(exportSmf0(songOf('tempo 120\nC:1.5 E/ _/ G')));
  expect(midi.header.ppq).toBe(480);
  const notes = midi.tracks[0].notes;
  expect(notes.map(n => [n.midi, n.ticks, n.durationTicks])).toEqual([[60, 0, 720], [64, 720, 240], [67, 1200, 480]]);
  const half = new Midi(exportSmf0(songOf('tempo 120\nC:1.5 _:0.75 D')));
  expect(half.tracks[0].notes.map(n => [n.midi, n.ticks, n.durationTicks])).toEqual([[60, 0, 720], [62, 1080, 480]]);
});

test('file name: the first word, then the first letter of each other word, 8 at most', () => {
  expect(exportFileName('Zie, ginds komt de stoomboot')).toBe('ZIEGKDS.MID');
  expect(exportFileName('Für Elise')).toBe('FURE.MID');
  expect(exportFileName('Bella Ciao')).toBe('BELLAC.MID');
  expect(exportFileName('O, kom er eens kijken')).toBe('OKEEK.MID');
  expect(exportFileName('Twinkletwinkle')).toBe('TWINKLET.MID');
  expect(exportFileName('A b c d e f g h i j')).toBe('ABCDEFGH.MID');
  expect(exportFileName('★ ♪')).toBe('SONG.MID');
});

test('the two Sinterklaas songs get different names', () => {
  expect(exportFileName('Sinterklaas kapoentje')).toBe('SINTERKK.MID');
  expect(exportFileName('Sinterklaasje, bonne, bonne, bonne')).toBe('SINTEBBB.MID');
});

test('a name already taken gets a digit at the end', () => {
  expect(exportFileName('Bella Ciao', ['BELLAC.MID'])).toBe('BELLAC2.MID');
  expect(exportFileName('Bella Ciao', ['bellac.mid', 'BELLAC2.MID'])).toBe('BELLAC3.MID');
  expect(exportFileName('Twinkletwinkle', ['TWINKLET.MID'])).toBe('TWINKLE2.MID');
});

test('exportFileNames gives every song in the library its own name, in order', () => {
  expect(exportFileNames(['Bella Ciao', 'Bella Ciao!', 'Ode'])).toEqual(['BELLAC.MID', 'BELLAC2.MID', 'ODE.MID']);
  const names = exportFileNames(BUILTIN_SONGS.map(b => b.title));
  expect(new Set(names).size).toBe(names.length);
});
