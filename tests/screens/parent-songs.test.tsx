import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';

vi.mock('../../src/songs/builtin/index', () => ({
  BUILTIN_SONGS: [{ id: 'cde', title: 'Test', picture: '🐸', typed: 'C D E', melodySource: 'test' }],
}));

import { synth } from '../../src/audio/synth';
import { FakeSource } from '../../src/midi/fake-source';
import { ImportReview } from '../../src/screens/parent/ImportReview';
import { ParentHome } from '../../src/screens/parent/ParentHome';
import { SongEditor } from '../../src/screens/parent/SongEditor';
import { songFromImport, songFromTyped } from '../../src/screens/parent/song-factory';
import { loadLibrary } from '../../src/songs/library';
import { DEFAULT_SETTINGS, getBest, getSettings, listUserSongs, recordResult, saveSong } from '../../src/store/db';
import type { Song } from '../../src/song/types';

beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

const userSong = (id: string, picture = '🎈'): Song => ({
  id, title: id, source: 'typed', tempo: 90, notes: [{ midi: 60, beats: 1, finger: 1 }],
  fingeringSource: 'parent', picture, hidden: false, createdAt: 10,
});

function home(over: Partial<Parameters<typeof ParentHome>[0]> = {}, fake = new FakeSource()) {
  const props = {
    source: fake, status: { connected: false }, onStartKeyboard: vi.fn(), onSettings: vi.fn(), onBack: vi.fn(), ...over,
  };
  render(<ParentHome {...props} />);
  return { fake, props };
}

test('songFromImport uses file name when no title and sheet fingering when present', () => {
  const s = songFromImport({ ok: true, tempo: 80, notes: [{ midi: 60, beats: 1, finger: 1 }], hasFingering: true, octaveShift: 0 }, 'twinkle.mid', '⭐');
  expect(s).toMatchObject({ title: 'twinkle', source: 'file', fingeringSource: 'sheet' });
});

test('songFromTyped fills missing fingers and marks parent fingering', () => {
  const s = songFromTyped('Test', 'C(1) D E', '🐸');
  expect(!Array.isArray(s) && s.notes.map(n => n.finger)).toEqual([1, 2, 3]);
  expect(!Array.isArray(s) && s.fingeringSource).toBe('parent');
});

test('songFromTyped without fingers uses the rules and returns errors for bad text', () => {
  const s = songFromTyped('T', 'C D', '🐸');
  expect(!Array.isArray(s) && s.fingeringSource).toBe('rules');
  expect(songFromTyped('T', 'C X', '🐸')).toMatchObject([{ code: 'unknownNote', token: 'X' }]);
});

test('editor blocks save with errors', () => {
  const onSave = vi.fn();
  render(<SongEditor lang="en" editing={false} draft={{ title: 'A', text: 'C', picture: '🐸' }} onSave={onSave} onCancel={() => {}} />);
  fireEvent.input(screen.getByLabelText('Notes'), { target: { value: 'C, X' } });
  expect(screen.getByText('"X" is not a note.')).toBeTruthy();
  expect(screen.getByTestId('note-error')).toHaveTextContent('X');
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  fireEvent.input(screen.getByLabelText('Notes'), { target: { value: 'C D' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'A', source: 'typed' }));
});

test('editor preview plays notes at the tempo, rests are silent', () => {
  vi.useFakeTimers();
  const play = vi.spyOn(synth, 'playNote').mockImplementation(() => {});
  render(<SongEditor lang="en" editing={false} draft={{ title: 'A', text: 'tempo 60\nC _ D-', picture: '🐸' }} onSave={() => {}} onCancel={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /Preview/ }));
  vi.advanceTimersByTime(5000);
  expect(play.mock.calls).toEqual([[60, 1000], [62, 2000]]);
});

test('octave shift note is shown on import review', () => {
  const result = { ok: true as const, tempo: 80, notes: [{ midi: 60, beats: 1 }], hasFingering: false, octaveShift: -1 };
  render(<ImportReview lang="en" result={result} fileName="a.mid" picture="⭐" onSave={() => {}} onFix={() => {}} onCancel={() => {}} />);
  expect(screen.getByText('Moved 1 octave(s) to fit the keyboard.')).toBeTruthy();
  expect(screen.getByTestId('import-notes')).toHaveTextContent('C(1)');
});

test('a failed import shows a message and cannot be saved', () => {
  render(<ImportReview lang="en" result={{ ok: false, reason: 'noNotes' }} fileName="a.mid" picture="⭐" onSave={() => {}} onFix={() => {}} onCancel={() => {}} />);
  expect(screen.getByTestId('import-failed')).toHaveTextContent('No notes were found');
  expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
});

test('importing a file leads to review, then saves the song', async () => {
  home();
  await screen.findByTestId('parent-home');
  const file = new File([readFileSync('tests/fixtures/simple.musicxml', 'utf8')], 'simple.musicxml');
  fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });
  await screen.findByTestId('import-review');
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByTestId('parent-home');
  await waitFor(async () => expect(await listUserSongs()).toHaveLength(1));
  expect((await listUserSongs())[0]).toMatchObject({ source: 'file' });
});

test('typing a song saves it with a free picture', async () => {
  home();
  fireEvent.click(await screen.findByRole('button', { name: 'Type notes' }));
  fireEvent.input(screen.getByLabelText('Title'), { target: { value: 'Mine' } });
  fireEvent.input(screen.getByLabelText('Notes'), { target: { value: 'C D E' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByTestId('parent-home');
  const [song] = await listUserSongs();
  expect(song).toMatchObject({ title: 'Mine', source: 'typed' });
  expect(song.picture).not.toBe('🐸'); // the built-in already uses that one
});

test('delete asks for confirmation', async () => {
  await saveSong(userSong('mine'));
  home();
  const row = await screen.findByTestId('parent-song-mine');
  fireEvent.click(within(row).getByRole('button', { name: 'Delete' }));
  expect(screen.getByTestId('confirm-dialog')).toHaveTextContent('Delete "mine"?');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(await listUserSongs()).toHaveLength(1);
  fireEvent.click(within(row).getByRole('button', { name: 'Delete' }));
  fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
  await waitFor(async () => expect(await listUserSongs()).toHaveLength(0));
});

test('reset medals asks first', async () => {
  await recordResult('cde', 1, 3);
  home();
  fireEvent.click(await screen.findByRole('button', { name: 'Reset medals' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(await getBest('cde', 1)).toBe(3);
  fireEvent.click(screen.getByRole('button', { name: 'Reset medals' }));
  fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
  await waitFor(async () => expect(await getBest('cde', 1)).toBe(0));
});

test('built-ins can be hidden, get a speed and a picture, but not deleted or edited', async () => {
  home();
  const row = await screen.findByTestId('parent-song-cde');
  expect(within(row).queryByRole('button', { name: 'Delete' })).toBeNull();
  expect(within(row).queryByRole('button', { name: 'Edit' })).toBeNull();
  fireEvent.change(within(row).getByLabelText('Speed Test'), { target: { value: 'medium' } });
  await waitFor(async () => expect((await getSettings()).speeds).toEqual({ cde: 'medium' }));
  fireEvent.click(within(row).getByRole('button', { name: 'Picture' }));
  fireEvent.click(within(screen.getByTestId('picture-dialog')).getByRole('button', { name: '🦊' }));
  await waitFor(async () => expect((await loadLibrary(await getSettings()))[0].picture).toBe('🦊'));
  fireEvent.click(await within(await screen.findByTestId('parent-song-cde')).findByRole('button', { name: 'Hide' }));
  await waitFor(async () => expect((await getSettings()).hiddenBuiltins).toEqual(['cde']));
  expect(await loadLibrary(await getSettings())).toHaveLength(0);
  expect(await loadLibrary(await getSettings(), true)).toHaveLength(1);
  expect(await within(await screen.findByTestId('parent-song-cde')).findByRole('button', { name: 'Show' })).toBeTruthy();
});

test('editing a saved song keeps its id', async () => {
  await saveSong(userSong('mine'));
  home();
  fireEvent.click(within(await screen.findByTestId('parent-song-mine')).getByRole('button', { name: 'Edit' }));
  fireEvent.input(screen.getByLabelText('Notes'), { target: { value: 'tempo 100\nG A' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByTestId('parent-home');
  const songs = await listUserSongs();
  expect(songs).toHaveLength(1);
  expect(songs[0]).toMatchObject({ id: 'mine', tempo: 100, createdAt: 10 });
});

test('keyboard check shows status, device and start result', async () => {
  home({ status: { connected: true, deviceName: 'Yamaha PSR' }, startResult: 'denied' });
  expect(await screen.findByTestId('kb-status')).toHaveTextContent('Connected · Keyboard: Yamaha PSR');
  expect(screen.getByTestId('kb-start')).toHaveTextContent("allow MIDI");
});

test('keyboard check shows the last note and warns about transposing', async () => {
  const { fake } = home();
  await screen.findByTestId('keyboard-check');
  // The note subscription starts a moment after the panel appears, so press until it shows.
  await waitFor(() => {
    act(() => fake.press(60));
    expect(screen.getByTestId('kb-last')).toHaveTextContent('C4 (60)');
  });
  expect(screen.queryByTestId('kb-transposed')).toBeNull();
  act(() => fake.press(62));
  expect(screen.getByTestId('kb-transposed')).toHaveTextContent('transposed by +2 semitones');
  expect(DEFAULT_SETTINGS.pictureOverrides).toEqual({});
});

test('the 3-second hold opens the parent area from the app', async () => {
  const { App } = await import('../../src/App');
  render(<App source={new FakeSource()} />);
  const hold = await screen.findByTestId('hold-button');
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  fireEvent.pointerDown(hold);
  act(() => { vi.advanceTimersByTime(3100); });
  vi.useRealTimers();
  expect(await screen.findByTestId('parent-home')).toBeTruthy();
});
