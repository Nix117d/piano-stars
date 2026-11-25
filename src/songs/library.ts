import { assignFingering } from '../fingering/assign';
import { parseTypedNotes } from '../song/typed-notes';
import type { Song } from '../song/types';
import { getBest, listUserSongs, type Level, type Settings } from '../store/db';
import { BUILTIN_SONGS, type BuiltinSong } from './builtin/index';

export type Bests = Record<string, Record<Level, number>>;

function builtinSong(b: BuiltinSong, settings: Settings): Song | null {
  const parsed = parseTypedNotes(b.typed);
  if (!parsed.ok) return null; // every built-in is checked by its own tests
  return {
    id: b.id,
    title: b.title,
    source: 'builtin',
    tempo: parsed.tempo,
    notes: assignFingering(parsed.notes),
    fingeringSource: 'rules',
    melodySource: b.melodySource,
    picture: settings.pictureOverrides?.[b.id] ?? b.picture,
    hidden: settings.hiddenBuiltins.includes(b.id),
    createdAt: 0,
  };
}

/**
 * The songs the child can pick: built-ins first, then the parent's songs oldest first; hidden ones left out.
 * With `includeHidden` (the parent area) hidden songs stay in, marked `hidden`.
 */
export async function loadLibrary(settings: Settings, includeHidden = false): Promise<Song[]> {
  const builtins = BUILTIN_SONGS
    .flatMap(b => builtinSong(b, settings) ?? [])
    .filter(s => includeHidden || !s.hidden);
  // If IndexedDB is unavailable the built-ins must still load.
  const stored = await listUserSongs().catch((e: unknown) => {
    console.warn('Could not read the saved songs', e);
    return [] as Song[];
  });
  const user = stored
    .filter(s => includeHidden || !s.hidden)
    .sort((a, b) => a.createdAt - b.createdAt);
  return [...builtins, ...user];
}

/** Best stars so far per song and level (0 = never finished). */
export async function loadBests(songs: Song[]): Promise<Bests> {
  const entries = await Promise.all(songs.map(async s =>
    [s.id, { 1: await getBest(s.id, 1), 2: await getBest(s.id, 2) }] as const));
  return Object.fromEntries(entries);
}
