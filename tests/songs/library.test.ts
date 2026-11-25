import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../src/songs/builtin/index', () => ({
  BUILTIN_SONGS: [{ id: 'cde', title: 'CDE', picture: '🐸', typed: 'C D E', melodySource: 'test' }],
}));

import { editedBuiltinIds, loadBests, loadLibrary } from '../../src/songs/library';
import { freePicture, PICTURES } from '../../src/songs/pictures';
import { DEFAULT_SETTINGS, recordResult, saveSong } from '../../src/store/db';
import type { Song } from '../../src/song/types';

const userSong = (id: string, hidden: boolean, createdAt: number): Song => ({
  id, title: id, source: 'typed', tempo: 90, notes: [{ midi: 60, beats: 1, finger: 1 }],
  fingeringSource: 'parent', picture: '🎈', hidden, createdAt,
});

beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });

test('library adds rules fingering to built-ins and drops hidden songs', async () => {
  const lib = await loadLibrary(DEFAULT_SETTINGS);
  expect(lib[0].notes.map(n => n.finger)).toEqual([1, 2, 3]);
  expect(lib[0].fingeringSource).toBe('rules');
  expect(lib[0]).toMatchObject({ id: 'cde', title: 'CDE', source: 'builtin', picture: '🐸', melodySource: 'test' });
  expect(await loadLibrary({ ...DEFAULT_SETTINGS, hiddenBuiltins: [lib[0].id] })).toHaveLength(0);
});

test('user songs follow the built-ins, oldest first, minus hidden ones', async () => {
  await saveSong(userSong('b-new', false, 20));
  await saveSong(userSong('a-old', false, 10));
  await saveSong(userSong('hidden', true, 5));
  expect((await loadLibrary(DEFAULT_SETTINGS)).map(s => s.id)).toEqual(['cde', 'a-old', 'b-new']);
});

test('a stored copy of a built-in takes the shipped one\'s place', async () => {
  await saveSong({ ...userSong('cde', false, 0), title: 'CDE', source: 'builtin', notes: [{ midi: 67, beats: 1, finger: 1 }] });
  await saveSong(userSong('mine', false, 10));
  const lib = await loadLibrary({ ...DEFAULT_SETTINGS, pictureOverrides: { cde: '🦊' } });
  expect(lib.map(s => s.id)).toEqual(['cde', 'mine']);
  expect(lib[0]).toMatchObject({ source: 'builtin', notes: [{ midi: 67 }], picture: '🦊', hidden: false });
  // Hiding goes by the settings, as for any built-in.
  expect((await loadLibrary({ ...DEFAULT_SETTINGS, hiddenBuiltins: ['cde'] })).map(s => s.id)).toEqual(['mine']);
  expect(await editedBuiltinIds()).toEqual(['cde']);
});

test('loadBests reads the best stars per level', async () => {
  await recordResult('cde', 1, 4);
  const lib = await loadLibrary(DEFAULT_SETTINGS);
  expect(await loadBests(lib)).toEqual({ cde: { 1: 4, 2: 0 } });
});

test('PICTURES has 30 distinct pictures', () => {
  expect(PICTURES).toHaveLength(30);
  expect(new Set(PICTURES).size).toBe(30);
});

test('freePicture avoids used pictures', () => { expect(freePicture(PICTURES.slice(0, 29))).toBe(PICTURES[29]); });

test('freePicture picks the least used picture once all are taken', () => {
  expect(freePicture([...PICTURES, ...PICTURES.filter(p => p !== PICTURES[7])])).toBe(PICTURES[7]);
});

test('built-ins still load when the saved songs cannot be read', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  globalThis.indexedDB = { open() { throw new Error('blocked'); } } as unknown as IDBFactory;
  expect((await loadLibrary(DEFAULT_SETTINGS)).map(s => s.id)).toEqual(['cde']);
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});
