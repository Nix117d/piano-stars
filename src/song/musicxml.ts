import { unzipSync, strFromU8 } from 'fflate';
import type { ImportResult } from './import-result';
import { fitToKeyboard } from './pitch';
import type { Finger, Note } from './types';

const DEFAULT_TEMPO = 80;
const STEP_SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const child = (el: Element, name: string): Element | null =>
  Array.from(el.children).find(c => c.localName === name) ?? null;
const childNum = (el: Element, name: string): number | null => {
  const text = child(el, name)?.textContent?.trim();
  const n = text ? Number(text) : NaN;
  return Number.isFinite(n) ? n : null;
};
const firstText = (root: Element, name: string): string | undefined =>
  root.getElementsByTagName(name)[0]?.textContent?.trim() || undefined;

function midiOf(note: Element): number | null {
  const pitch = child(note, 'pitch');
  if (!pitch) return null;
  const semitone = STEP_SEMITONE[child(pitch, 'step')?.textContent?.trim() ?? ''];
  const octave = childNum(pitch, 'octave');
  if (semitone === undefined || octave === null) return null;
  return 12 * (octave + 1) + semitone + (childNum(pitch, 'alter') ?? 0);
}

function fingerOf(note: Element): Finger | undefined {
  const n = Number(note.getElementsByTagName('fingering')[0]?.textContent?.trim());
  return n >= 1 && n <= 5 && Number.isInteger(n) ? (n as Finger) : undefined;
}

function tempoOf(root: Element): number {
  const sound = Array.from(root.getElementsByTagName('sound')).find(s => s.hasAttribute('tempo'));
  const fromSound = Number(sound?.getAttribute('tempo'));
  if (fromSound > 0) return fromSound;
  const fromMetronome = Number(firstText(root, 'per-minute'));
  return fromMetronome > 0 ? fromMetronome : DEFAULT_TEMPO;
}

export function parseMusicXml(xml: string): ImportResult {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xml, 'application/xml');
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
  const root = doc.documentElement;
  if (!root || doc.getElementsByTagName('parsererror').length > 0 || root.localName !== 'score-partwise') {
    return { ok: false, reason: 'unreadable' };
  }

  const part = root.getElementsByTagName('part')[0];
  const notes: Note[] = [];
  let divisions = 1;

  for (const measure of Array.from(part?.children ?? [])) {
    for (const el of Array.from(measure.children)) {
      if (el.localName === 'attributes') {
        divisions = childNum(el, 'divisions') ?? divisions;
        continue;
      }
      if (el.localName !== 'note' || child(el, 'grace')) continue;
      if ((childNum(el, 'voice') ?? 1) !== 1 || (childNum(el, 'staff') ?? 1) !== 1) continue;

      const midi = midiOf(el);
      const previous = notes[notes.length - 1];

      if (child(el, 'chord')) {
        // Chord members share the head note's time; keep the highest pitch.
        if (previous && previous.midi !== null && midi !== null && midi > previous.midi) {
          previous.midi = midi;
          const finger = fingerOf(el);
          if (finger) previous.finger = finger;
          else delete previous.finger;
        }
        continue;
      }

      const beats = (childNum(el, 'duration') ?? 0) / divisions;
      const tiedStop = Array.from(el.children).some(c => c.localName === 'tie' && c.getAttribute('type') === 'stop');
      if (tiedStop && previous && previous.midi !== null && previous.midi === midi) {
        previous.beats += beats;
        continue;
      }
      const note: Note = { midi, beats };
      const finger = midi === null ? undefined : fingerOf(el);
      if (finger) note.finger = finger;
      notes.push(note);
    }
  }

  if (!notes.some(n => n.midi !== null)) return { ok: false, reason: 'noNotes' };
  const hasFingering = notes.some(n => n.finger !== undefined);

  const fitted = fitToKeyboard(notes);
  const title = firstText(root, 'work-title') ?? firstText(root, 'movement-title');
  return {
    ok: true,
    ...(title ? { title } : {}),
    tempo: tempoOf(root),
    notes: fitted.notes,
    hasFingering,
    octaveShift: fitted.octaveShift,
  };
}

export function parseMxl(bytes: Uint8Array): ImportResult {
  try {
    const files = unzipSync(bytes);
    const container = files['META-INF/container.xml'];
    if (!container) return { ok: false, reason: 'unreadable' };
    const doc = new DOMParser().parseFromString(strFromU8(container), 'application/xml');
    const path = doc.getElementsByTagName('rootfile')[0]?.getAttribute('full-path');
    const score = path ? files[path] : undefined;
    if (!score) return { ok: false, reason: 'unreadable' };
    return parseMusicXml(strFromU8(score));
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
}
