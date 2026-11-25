import { assignFingering } from '../fingering/assign';
import { parseTypedNotes } from '../song/typed-notes';
import type { Song } from '../song/types';
import { getBest, listUserSongs, type Level, type Settings } from '../store/db';
import { BUILTIN_SONGS, type BuiltinSong } from './builtin/index';

export type Bests = Record<string, Record<Level, number>>;

const BUILTIN_IDS = new Set(BUILTIN_SONGS.map(b => b.id));

/**
 * A built-in as the child gets it. A stored copy (the parent edited it) takes the shipped song's
 * place. Either way the picture override and hiding come from the settings.
 */
function builtinSong(b: BuiltinSong, settings: Settings, edited?: Song): Song | null {
  const own = { hidden: settings.hiddenBuiltins.includes(b.id) };
  if (edited) {
    return {
      ...edited, ...own, source: 'builtin', melodySource: edited.melodySource ?? b.melodySource,
      picture: settings.pictureOverrides?.[b.id] ?? edited.picture,
    };
  }
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
    ...own,
    createdAt: 0,
  };
}

/**
 * The songs the child can pick: built-ins first, then the parent's songs oldest first; hidden ones left out.
 * With `includeHidden` (the parent area) hidden songs stay in, marked `hidden`.
 */
export async function loadLibrary(settings: Settings, includeHidden = false): Promise<Song[]> {
  // If IndexedDB is unavailable the built-ins must still load.
  const stored = await listUserSongs().catch((e: unknown) => {
    console.warn('Could not read the saved songs', e);
    return [] as Song[];
  });
  const edited = new Map(stored.filter(s => BUILTIN_IDS.has(s.id)).map(s => [s.id, s]));
  const builtins = BUILTIN_SONGS
    .flatMap(b => builtinSong(b, settings, edited.get(b.id)) ?? [])
    .filter(s => includeHidden || !s.hidden);
  const user = stored
    .filter(s => !BUILTIN_IDS.has(s.id))
    .filter(s => includeHidden || !s.hidden)
    .sort((a, b) => a.createdAt - b.createdAt);
  return [...builtins, ...user];
}

/** Ids of the built-ins the parent has edited (a stored copy replaces the shipped song). */
export async function editedBuiltinIds(): Promise<string[]> {
  return (await listUserSongs()).filter(s => BUILTIN_IDS.has(s.id)).map(s => s.id);
}

/** Best stars so far per song and level (0 = never finished). */
export async function loadBests(songs: Song[]): Promise<Bests> {
  const entries = await Promise.all(songs.map(async s =>
    [s.id, { 1: await getBest(s.id, 1), 2: await getBest(s.id, 2) }] as const));
  return Object.fromEntries(entries);
}
