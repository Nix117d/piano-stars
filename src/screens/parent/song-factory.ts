import { assignFingering } from '../../fingering/assign';
import type { ImportResult } from '../../song/import-result';
import { parseTypedNotes, type TypedError } from '../../song/typed-notes';
import type { Song } from '../../song/types';

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `song-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** The file name without its extension, used as the title when the file has none. */
const nameFromFile = (fileName: string) => fileName.replace(/\.[^.]*$/, '').trim() || 'Song';

export function songFromImport(r: ImportResult & { ok: true }, fileName: string, picture: string): Song {
  return {
    id: newId(),
    title: r.title?.trim() || nameFromFile(fileName),
    source: 'file',
    tempo: r.tempo,
    notes: assignFingering(r.notes),
    fingeringSource: r.hasFingering ? 'sheet' : 'rules',
    picture,
    hidden: false,
    createdAt: Date.now(),
  };
}

/** A song from typed text; any finger the parent typed makes the fingering 'parent', the rest are filled in. */
export function songFromTyped(title: string, text: string, picture: string): Song | TypedError[] {
  const parsed = parseTypedNotes(text);
  if (!parsed.ok) return parsed.errors;
  return {
    id: newId(),
    title: title.trim() || 'Song',
    source: 'typed',
    tempo: parsed.tempo,
    notes: assignFingering(parsed.notes),
    fingeringSource: parsed.notes.some(n => n.finger !== undefined) ? 'parent' : 'rules',
    picture,
    hidden: false,
    createdAt: Date.now(),
  };
}
