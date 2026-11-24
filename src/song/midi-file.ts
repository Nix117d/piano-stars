import { Midi } from '@tonejs/midi';
import type { ImportResult } from './import-result';
import { fitToKeyboard } from './pitch';
import type { Note } from './types';

const DEFAULT_TEMPO = 80;
const PERCUSSION_CHANNEL = 9;
const STEP = 0.25;

const snap = (beats: number): number => Math.round(beats / STEP) * STEP;

export function parseMidiFile(bytes: Uint8Array): ImportResult {
  let midi: Midi;
  try {
    midi = new Midi(bytes);
  } catch {
    return { ok: false, reason: 'unreadable' };
  }

  const track = midi.tracks.find(t => t.notes.length > 0 && t.channel !== PERCUSSION_CHANNEL);
  if (!track) return { ok: false, reason: 'noNotes' };

  const ppq = midi.header.ppq || 480;
  // Keep only the highest note at each start tick.
  const top = new Map<number, { ticks: number; durationTicks: number; midi: number }>();
  for (const n of track.notes) {
    const existing = top.get(n.ticks);
    if (!existing || n.midi > existing.midi) top.set(n.ticks, n);
  }
  const onsets = Array.from(top.values()).sort((a, b) => a.ticks - b.ticks);

  // Onset-based timeline: each note lasts until the next onset; a real gap becomes a rest.
  const notes: Note[] = [];
  onsets.forEach((n, i) => {
    const dur = Math.max(STEP, snap(n.durationTicks / ppq));
    const next = onsets[i + 1];
    if (!next) {
      notes.push({ midi: n.midi, beats: dur });
      return;
    }
    const ioi = Math.max(STEP, snap((next.ticks - n.ticks) / ppq));
    if (ioi - dur >= STEP) {
      notes.push({ midi: n.midi, beats: dur }, { midi: null, beats: ioi - dur });
    } else {
      notes.push({ midi: n.midi, beats: ioi });
    }
  });

  const tempo = Math.round(midi.header.tempos[0]?.bpm ?? DEFAULT_TEMPO) || DEFAULT_TEMPO;
  const title = track.name?.trim() || midi.header.name?.trim() || undefined;
  const fitted = fitToKeyboard(notes);
  return {
    ok: true,
    ...(title ? { title } : {}),
    tempo,
    notes: fitted.notes,
    hasFingering: false,
    octaveShift: fitted.octaveShift,
  };
}
