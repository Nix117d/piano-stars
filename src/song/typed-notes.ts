import { KEYBOARD_HIGH, KEYBOARD_LOW, midiToName, parsePitch } from './pitch';
import type { Finger, Note } from './types';

export type TypedError = {
  start: number;
  end: number;
  token: string;
  code: 'unknownNote' | 'badFinger' | 'badTempo' | 'outOfRange';
};

export type TypedResult =
  | { ok: true; tempo: number; notes: Note[] }
  | { ok: false; errors: TypedError[] };

const DEFAULT_TEMPO = 80;
const MIN_TEMPO = 20;
const MAX_TEMPO = 300;

// PITCH or "_", optional "(finger)", then any number of "-", a single "/", or an explicit ":N" length.
const TOKEN = /^(.*?)(?:\(([^)]*)\))?(-+|\/|:.*)?$/;

/** Reads typed notes like "tempo 90\nC D(2)- _ E/". Reports every error, in text order. */
export function parseTypedNotes(text: string): TypedResult {
  const errors: TypedError[] = [];
  let tempo = DEFAULT_TEMPO;
  let bodyStart = 0;

  const tempoLine = /^(\s*)(tempo\b[^\n]*)/i.exec(text);
  if (tempoLine) {
    const line = tempoLine[2];
    const start = tempoLine[1].length;
    const value = /^tempo\s+(\d+(?:\.\d+)?)\s*$/i.exec(line);
    const n = value ? Number(value[1]) : NaN;
    if (n >= MIN_TEMPO && n <= MAX_TEMPO) tempo = n;
    else errors.push({ start, end: start + line.trimEnd().length, token: line.trimEnd(), code: 'badTempo' });
    bodyStart = start + line.length;
  }

  const notes: Note[] = [];
  const tokens = /[^\s,|]+/g;
  tokens.lastIndex = bodyStart;
  for (let m = tokens.exec(text); m; m = tokens.exec(text)) {
    const token = m[0];
    const fail = (code: TypedError['code']) =>
      errors.push({ start: m.index, end: m.index + token.length, token, code });

    const parts = TOKEN.exec(token);
    const pitchText = parts?.[1] ?? '';
    const midi = pitchText === '_' ? null : parsePitch(pitchText);
    if (!parts || (pitchText !== '_' && midi === null)) { fail('unknownNote'); continue; }
    if (parts[2] !== undefined && !/^[1-5]$/.test(parts[2])) { fail('badFinger'); continue; }
    if (midi !== null && (midi < KEYBOARD_LOW || midi > KEYBOARD_HIGH)) { fail('outOfRange'); continue; }

    const suffix = parts[3];
    let beats = 1;
    if (suffix === '/') beats = 0.5;
    else if (suffix?.startsWith(':')) {
      beats = /^:\d+(\.\d+)?$/.test(suffix) ? Number(suffix.slice(1)) : 0;
      if (!(beats > 0)) { fail('unknownNote'); continue; }
    } else if (suffix) beats = 1 + suffix.length;
    const note: Note = { midi, beats };
    if (parts[2] !== undefined) note.finger = Number(parts[2]) as Finger;
    notes.push(note);
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, tempo, notes };
}

/** Writes notes back in the typed form: sharps for black keys, octave only when not 4. */
export function serializeTypedNotes(tempo: number, notes: Note[]): string {
  const words = notes.map(n => {
    let word = '_';
    if (n.midi !== null) {
      const { letter, sharp, octave } = midiToName(n.midi);
      word = letter + (sharp ? '#' : '') + (octave === 4 ? '' : String(octave));
    }
    if (n.finger !== undefined) word += `(${n.finger})`;
    if (n.beats === 0.5) word += '/';
    else if (Number.isInteger(n.beats) && n.beats >= 1) word += '-'.repeat(n.beats - 1);
    else word += `:${n.beats}`;
    return word;
  });
  return `tempo ${tempo}\n${words.join(' ')}`;
}
