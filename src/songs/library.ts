import { assignFingering } from '../fingering/assign';
import { parseTypedNotes } from '../song/typed-notes';
import type { Song } from '../song/types';
import { getBest, listUserSongs, type Level, type Settings } from '../store/db';
import { BUILTIN_SONGS, type BuiltinSong } from './builtin/index';

export type Bests = Record<string, Record<Level, number>>;

function builtinSong(b: BuiltinSong): Song | null {
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
    picture: b.picture,
    hidden: false,
    createdAt: 0,
  };
}

/** The songs the child can pick: built-ins first, then the parent's songs oldest first; hidden ones left out. */
export async function loadLibrary(settings: Settings): Promise<Song[]> {
  const builtins = BUILTIN_SONGS
    .filter(b => !settings.hiddenBuiltins.includes(b.id))
    .flatMap(b => builtinSong(b) ?? []);
  const user = (await listUserSongs())
    .filter(s => !s.hidden)
    .sort((a, b) => a.createdAt - b.createdAt);
  return [...builtins, ...user];
}

/** Best stars so far per song and level (0 = never finished). */
export async function loadBests(songs: Song[]): Promise<Bests> {
  const entries = await Promise.all(songs.map(async s =>
    [s.id, { 1: await getBest(s.id, 1), 2: await getBest(s.id, 2) }] as const));
  return Object.fromEntries(entries);
}
