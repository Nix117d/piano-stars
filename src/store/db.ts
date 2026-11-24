import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Song } from '../song/types';

export type Level = 1 | 2;
export type Speed = 'slow' | 'medium' | 'normal';
export type Lang = 'nl' | 'en';

export interface Settings {
  level2Enabled: boolean;
  childLang: Lang;
  parentLang: Lang;
  metronomeClick: boolean;
  celebrationSound: boolean;
  speeds: Record<string, Speed>;
  hiddenBuiltins: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  level2Enabled: false,
  childLang: 'nl',
  parentLang: 'en',
  metronomeClick: false,
  celebrationSound: true,
  speeds: {},
  hiddenBuiltins: [],
};

interface PianoDB extends DBSchema {
  songs: { key: string; value: Song };
  results: { key: string; value: number };
  settings: { key: string; value: Settings };
}

const SETTINGS_KEY = 'settings';

// The connection is opened per call (and closed afterwards) so that swapping
// the global indexedDB, as tests do, never leaves a stale cached connection.
async function withDb<T>(fn: (db: IDBPDatabase<PianoDB>) => Promise<T>): Promise<T> {
  const db = await openDB<PianoDB>('piano-stars', 1, {
    upgrade(d) {
      d.createObjectStore('songs', { keyPath: 'id' });
      d.createObjectStore('results');
      d.createObjectStore('settings');
    },
  });
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

export const listUserSongs = (): Promise<Song[]> => withDb((db) => db.getAll('songs'));
export const saveSong = (s: Song): Promise<void> =>
  withDb(async (db) => { await db.put('songs', s); });
export const deleteSong = (id: string): Promise<void> =>
  withDb((db) => db.delete('songs', id));

const resultKey = (songId: string, level: Level) => `${songId}:${level}`;

export const getBest = (songId: string, level: Level): Promise<number> =>
  withDb(async (db) => (await db.get('results', resultKey(songId, level))) ?? 0);

export async function recordResult(
  songId: string, level: Level, stars: number,
): Promise<{ best: number; improved: boolean }> {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new RangeError(`stars must be an integer from 1 to 5, got ${stars}`);
  }
  return withDb(async (db) => {
    const tx = db.transaction('results', 'readwrite');
    const key = resultKey(songId, level);
    const previous = (await tx.store.get(key)) ?? 0;
    const improved = stars > previous;
    if (improved) await tx.store.put(stars, key);
    await tx.done;
    return { best: improved ? stars : previous, improved };
  });
}

export const resetMedals = (): Promise<void> => withDb((db) => db.clear('results'));

export const getSettings = (): Promise<Settings> =>
  withDb(async (db) => ({ ...DEFAULT_SETTINGS, ...(await db.get('settings', SETTINGS_KEY)) }));
export const saveSettings = (s: Settings): Promise<void> =>
  withDb(async (db) => { await db.put('settings', s, SETTINGS_KEY); });

export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
