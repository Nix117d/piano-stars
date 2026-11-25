import { assignFingering } from '../../fingering/assign';
import type { ImportResult } from '../../song/import-result';
import { parseTypedNotes, type TypedError } from '../../song/typed-notes';
import type { Song } from '../../song/types';

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `song-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** The file name without its extension, used as the title when the file has none. */
const nameFromFile = (fileName: string, fallback: string) => fileName.replace(/\.[^.]*$/, '').trim() || fallback;

export function songFromImport(r: ImportResult & { ok: true }, fileName: string, picture: string, fallbackTitle = 'Song'): Song {
  return {
    id: newId(),
    title: r.title?.trim() || nameFromFile(fileName, fallbackTitle),
    source: 'file',
    tempo: r.tempo,
    notes: assignFingering(r.notes),
    fingeringSource: r.hasFingering ? 'sheet' : 'rules',
    picture,
    hidden: false,
    createdAt: Date.now(),
  };
}

/**
 * A song from typed text. For a new song, any typed finger makes the fingering 'parent'.
 * When `original` is given (editing), a finger only counts as typed if it differs from the original
 * finger at that place and from what the rules would give; otherwise the original source is kept,
 * and for a 'rules' song the fingers are worked out again for the edited notes.
 */
export function songFromTyped(title: string, text: string, picture: string, fallbackTitle = 'Song', original?: Song): Song | TypedError[] {
  const parsed = parseTypedNotes(text);
  if (!parsed.ok) return parsed.errors;
  const auto = assignFingering(parsed.notes.map(({ finger: _f, ...n }) => n));
  const typed = parsed.notes.some((n, i) => n.finger !== undefined
    && (!original || (n.finger !== original.notes[i]?.finger && n.finger !== auto[i].finger)));
  const source = typed || !original ? (typed || parsed.notes.some(n => n.finger !== undefined) ? 'parent' : 'rules') : original.fingeringSource;
  const notes = source === 'rules' ? auto : assignFingering(parsed.notes);
  return {
    id: newId(),
    title: title.trim() || fallbackTitle,
    source: 'typed',
    tempo: parsed.tempo,
    notes,
    fingeringSource: source,
    picture,
    hidden: false,
    createdAt: Date.now(),
  };
}
