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

/** A short 8.3-style name the keyboard can list, e.g. ZIEGINDS.MID. */
export function exportFileName(title: string): string {
  const base = title.normalize('NFD').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
  return `${base || 'SONG'}.MID`;
}

/** Downloads the file through a temporary link. */
export function downloadSong(song: Song): string {
  const fileName = exportFileName(song.title);
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
