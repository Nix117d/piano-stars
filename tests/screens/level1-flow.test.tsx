import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';

vi.mock('../../src/songs/builtin/index', () => ({
  BUILTIN_SONGS: [{ id: 'cde', title: 'Test', picture: '🐸', typed: 'C D E', melodySource: 'test' }],
}));

import { App } from '../../src/App';
import { synth } from '../../src/audio/synth';
import { FakeSource } from '../../src/midi/fake-source';
import { starsLevel1 } from '../../src/play/scoring';
import { getBest } from '../../src/store/db';

beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });
afterEach(() => { vi.restoreAllMocks(); });

const glowsOn = (midi: number, finger: number) => {
  const key = screen.getByTestId(`key-${midi}`);
  expect(key).toHaveAttribute('data-glow', 'true');
  expect(within(key).getByText(String(finger))).toBeTruthy();
};

/** Renders the app with a connected fake keyboard and opens the hand screen of the 'C D E' song. */
async function openSong() {
  const fake = new FakeSource();
  render(<App source={fake} />);
  act(() => fake.setConnected(true, 'Test keyboard'));
  fireEvent.click(await screen.findByTestId('song-card-cde'));
  await screen.findByText('Duim op de C');
  return fake;
}

test('full level-1 flow with FakeSource', async () => {
  const fake = await openSong();
  act(() => fake.press(60));
  expect(screen.queryByText('Duim op de C')).toBeNull();
  glowsOn(62, 2);
  act(() => fake.press(61));
  expect(screen.getByTestId('key-61')).toHaveAttribute('data-wobble', 'true');
  glowsOn(62, 2);
  act(() => fake.press(62));
  act(() => fake.press(64));
  await screen.findByTestId('results');
  expect(screen.getAllByTestId('star-earned')).toHaveLength(starsLevel1(1, 3));
  await waitFor(async () => expect(await getBest('cde', 1)).toBe(starsLevel1(1, 3)));
});

test('a wrong key on the hand screen does not start play', async () => {
  const fake = await openSong();
  act(() => fake.press(62));
  expect(screen.getByText('Duim op de C')).toBeTruthy();
  expect(screen.getByTestId('key-62')).toHaveAttribute('data-wobble', 'true');
});

test('unplugging pauses and shows the plug screen; reconnect resumes at the same note', async () => {
  const fake = await openSong();
  act(() => fake.press(60));
  act(() => fake.setConnected(false));
  expect(screen.getByTestId('plug-screen')).toBeTruthy();
  act(() => fake.setConnected(true));
  expect(screen.queryByTestId('plug-screen')).toBeNull();
  glowsOn(62, 2);
});

test('tap mode feeds the on-screen keys to the song, with sound', async () => {
  const playNote = vi.spyOn(synth, 'playNote');
  const fake = await openSong();
  act(() => fake.press(60));
  act(() => fake.setConnected(false));
  fireEvent.click(screen.getByText('Of tik op de toetsen'));
  expect(screen.queryByTestId('plug-screen')).toBeNull();
  fireEvent.pointerDown(screen.getByTestId('key-62'));
  expect(playNote).toHaveBeenCalledWith(62, expect.any(Number));
  glowsOn(64, 3);
});

test('no sound is played on correct or wrong presses while connected', async () => {
  const playNote = vi.spyOn(synth, 'playNote');
  const fake = await openSong();
  act(() => fake.press(60));
  act(() => fake.press(61));
  act(() => fake.press(62));
  fireEvent.pointerDown(screen.getByTestId('key-64'));
  expect(playNote).not.toHaveBeenCalled();
  glowsOn(64, 3);
});

test('the home button needs a second tap', async () => {
  const fake = await openSong();
  act(() => fake.press(60));
  const home = screen.getByTestId('home-button');
  fireEvent.click(home);
  expect(screen.getByTestId('key-62')).toBeTruthy();
  fireEvent.click(home);
  await screen.findByTestId('song-card-cde');
});
