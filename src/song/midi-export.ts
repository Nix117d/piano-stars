import type { Song } from './types';

const DIVISION = 480;
const VELOCITY = 80;

/** Standard MIDI variable-length quantity. */
function vlq(value: number): number[] {
  let v = Math.max(0, Math.round(value));
  const out = [v & 0x7f];
  while ((v >>= 7) > 0) out.unshift((v & 0x7f) | 0x80);
  return out;
}

const u32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const ascii = (s: string) => [...s].map(c => c.charCodeAt(0));

/** Title as printable ASCII only: diacritics stripped, anything else dropped. */
function plainTitle(title: string): string {
  return title.normalize('NFD').replace(/[^\x20-\x7e]/g, '');
}

/** Writes a song as a format-0 Standard MIDI File: one track on channel 1, rests as gaps. */
export function exportSmf0(song: Song): Uint8Array<ArrayBuffer> {
  const name = ascii(plainTitle(song.title));
  const usPerQuarter = Math.round(60_000_000 / song.tempo);
  const track: number[] = [
    0, 0xff, 0x03, ...vlq(name.length), ...name,
    0, 0xff, 0x51, 0x03, (usPerQuarter >> 16) & 0xff, (usPerQuarter >> 8) & 0xff, usPerQuarter & 0xff,
  ];
  let pendingRest = 0;
  for (const note of song.notes) {
    const ticks = Math.round(note.beats * DIVISION);
    if (note.midi === null) { pendingRest += ticks; continue; }
    track.push(...vlq(pendingRest), 0x90, note.midi, VELOCITY, ...vlq(ticks), 0x80, note.midi, 0);
    pendingRest = 0;
  }
  track.push(...vlq(pendingRest), 0xff, 0x2f, 0x00);
  return Uint8Array.from([
    ...ascii('MThd'), ...u32(6), 0, 0, 0, 1, (DIVISION >> 8) & 0xff, DIVISION & 0xff,
    ...ascii('MTrk'), ...u32(track.length), ...track,
  ]);
}

/**
 * A short 8.3-style name the keyboard can list, e.g. ZIEGKDS.MID for "Zie, ginds komt de
 * stoomboot": the first word (at least 4 letters of it), then the first letter of each other
 * word, 8 characters at most. A name in `taken` (any case) gets a digit at the end instead:
 * BELLAC2.MID, BELLAC3.MID...
 */
export function exportFileName(title: string, taken: Iterable<string> = []): string {
  const words = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    .split(/[^A-Z0-9]+/).filter(w => w !== '');
  const [first = '', ...rest] = words;
  const initials = rest.map(w => w[0]).join('');
  const base = (first.slice(0, Math.max(4, 8 - initials.length)) + initials).slice(0, 8) || 'SONG';
  const used = new Set([...taken].map(n => n.toUpperCase()));
  let name = base;
  for (let i = 2; used.has(`${name}.MID`); i++) name = base.slice(0, 8 - String(i).length) + i;
  return `${name}.MID`;
}

/** A file name for each title, in order, none the same as an earlier one (see `exportFileName`). */
export function exportFileNames(titles: string[]): string[] {
  const names: string[] = [];
  for (const title of titles) names.push(exportFileName(title, names));
  return names;
}

/** Downloads the file through a temporary link, as `fileName` (by default from the title). */
export function downloadSong(song: Song, fileName = exportFileName(song.title)): string {
  const url = URL.createObjectURL(new Blob([exportSmf0(song)], { type: 'audio/midi' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Some browsers cancel the download if the URL is revoked straight away.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}
