import 'fake-indexeddb/auto';
import { beforeEach, expect, test } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
  DEFAULT_SETTINGS, deleteSong, getBest, getSettings, listUserSongs, recordResult,
  requestPersistence, resetMedals, saveSettings, saveSong,
} from '../../src/store/db';
import type { Song } from '../../src/song/types';

const song = (id: string): Song => ({
  id, title: id, source: 'typed', tempo: 90, notes: [{ midi: 60, beats: 1, finger: 1 }, { midi: null, beats: 1 }],
  fingeringSource: 'rules', picture: '🎵', hidden: false, createdAt: 1,
});

beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });

test('settings default and persist', async () => {
  expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  await saveSettings({ ...DEFAULT_SETTINGS, level2Enabled: true });
  expect((await getSettings()).level2Enabled).toBe(true);
});
test('missing stored settings fields fall back to defaults', async () => {
  await saveSettings({ level2Enabled: true } as never);
  expect(await getSettings()).toEqual({ ...DEFAULT_SETTINGS, level2Enabled: true });
});
test('best result only improves', async () => {
  expect(await recordResult('s1', 1, 3)).toEqual({ best: 3, improved: true });
  expect(await recordResult('s1', 1, 2)).toEqual({ best: 3, improved: false });
  expect(await recordResult('s1', 1, 5)).toEqual({ best: 5, improved: true });
  expect(await getBest('s1', 2)).toBe(0);
});
test('recordResult rejects invalid stars', async () => {
  await expect(recordResult('s1', 1, 0)).rejects.toThrow();
  await expect(recordResult('s1', 1, 6)).rejects.toThrow();
  await expect(recordResult('s1', 1, 2.5)).rejects.toThrow();
});
test('songs save, list, delete and round-trip', async () => {
  await saveSong(song('a')); await saveSong(song('b'));
  expect(await listUserSongs()).toEqual(expect.arrayContaining([song('a'), song('b')]));
  await deleteSong('a');
  expect(await listUserSongs()).toEqual([song('b')]);
});
test('reset medals clears results only', async () => {
  await saveSong(song('a')); await recordResult('a', 1, 5); await resetMedals();
  expect(await getBest('a', 1)).toBe(0); expect((await listUserSongs()).length).toBe(1);
});
test('requestPersistence tolerates a missing API', async () => {
  expect(await requestPersistence()).toBe(false);
});
test('requestPersistence returns the result, and false on rejection', async () => {
  const nav = globalThis.navigator;
  const set = (persist: () => Promise<boolean>) =>
    Object.defineProperty(nav, 'storage', { value: { persist }, configurable: true });
  set(async () => true);
  expect(await requestPersistence()).toBe(true);
  set(async () => { throw new Error('no'); });
  expect(await requestPersistence()).toBe(false);
  delete (nav as { storage?: unknown }).storage;
});
