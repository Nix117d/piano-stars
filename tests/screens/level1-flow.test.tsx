import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';

vi.mock('../../src/songs/builtin/index', () => ({
  BUILTIN_SONGS: [
    { id: 'cde', title: 'Test', picture: '🐸', typed: 'C D E', melodySource: 'test' },
    // F is played with the thumb again, so the hand moves to a new position there.
    { id: 'move', title: 'Move', picture: '🚂', typed: 'C(1) D(2) E(3) F(1) G(2)', melodySource: 'test' },
    { id: 'one', title: 'One', picture: '⭐', typed: 'G', melodySource: 'test' },
  ],
}));

import { App } from '../../src/App';
import { synth } from '../../src/audio/synth';
import { FakeSource } from '../../src/midi/fake-source';
import { starsLevel1 } from '../../src/play/scoring';
import { getBest } from '../../src/store/db';

beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

const glowsOn = (midi: number, finger: number) => {
  const key = screen.getByTestId(`key-${midi}`);
  expect(key).toHaveAttribute('data-glow', 'true');
  expect(within(key).getByText(String(finger))).toBeTruthy();
};

/** Renders the app with a connected fake keyboard and opens the hand screen of a song ('C D E' by default). */
async function openSong(id = 'cde', fake = new FakeSource()) {
  render(<App source={fake} />);
  act(() => fake.setConnected(true, 'Test keyboard'));
  fireEvent.click(await screen.findByTestId(`song-card-${id}`));
  await screen.findByTestId('hand-screen');
  return fake;
}

test('full level-1 flow with FakeSource', async () => {
  const fake = await openSong();
  expect(screen.getByText('Duim op de C')).toBeTruthy();
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
  act(() => fake.press(62)); // a stray note while unplugged changes nothing
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

test('the plug screen home button also needs a second tap', async () => {
  const fake = await openSong();
  act(() => fake.press(60));
  act(() => fake.setConnected(false));
  const home = within(screen.getByTestId('plug-screen')).getByTestId('home-button');
  fireEvent.click(home);
  expect(screen.getByTestId('plug-screen')).toBeTruthy();
  fireEvent.click(home);
  await screen.findByTestId('song-card-cde');
});

test('a one-note song finishes on the hand screen press', async () => {
  const fake = await openSong('one');
  act(() => fake.press(67));
  await screen.findByTestId('results');
  expect(screen.getAllByTestId('star-earned')).toHaveLength(5);
});

test('a hand move shows the thumb marker, ignores presses, then glows after 800 ms', async () => {
  const fake = await openSong('move');
  act(() => fake.press(60));
  act(() => fake.press(62));
  vi.useFakeTimers();
  act(() => fake.press(64)); // next is F with the thumb: a new hand position
  expect(screen.getByText('Duim op de F')).toBeTruthy();
  expect(screen.queryByTestId('play-screen')?.querySelector('[data-glow]')).toBeNull();
  act(() => fake.press(65)); // pressed during the move: ignored
  act(() => fake.press(61));
  expect(screen.queryByTestId('play-screen')?.querySelector('[data-wobble]')).toBeNull();
  act(() => { vi.advanceTimersByTime(799); });
  expect(screen.getByTestId('play-screen').querySelector('[data-glow]')).toBeNull();
  act(() => { vi.advanceTimersByTime(1); });
  glowsOn(65, 1);
  expect(screen.queryByText('Duim op de F')).toBeNull();
  act(() => fake.press(65));
  act(() => fake.press(67));
  act(() => { vi.advanceTimersByTime(400); });
  expect(screen.getAllByTestId('star-earned')).toHaveLength(5); // the presses during the move were no mistakes
});

test('starting the keyboard input is tried again until it gives ok', async () => {
  const start = vi.fn().mockResolvedValueOnce('denied').mockResolvedValue('ok');
  await openSong('cde', Object.assign(new FakeSource(), { start }));
  expect(start).toHaveBeenCalledTimes(1);
  const back = async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(await screen.findByTestId('song-card-cde'));
    await screen.findByTestId('hand-screen');
  };
  await back();
  expect(start).toHaveBeenCalledTimes(2);
  await back();
  expect(start).toHaveBeenCalledTimes(2);
});

test('the screen stays on from the hand screen through play, and is let go on leaving', async () => {
  const release = vi.fn(async () => {});
  const request = vi.fn(async () => ({ released: false, release }));
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
  try {
    const fake = await openSong();
    await waitFor(() => expect(request).toHaveBeenCalledWith('screen'));
    act(() => fake.press(60)); // on to the play screen: still the same lock
    expect(screen.getByTestId('play-screen')).toBeTruthy();
    expect(release).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    fireEvent.click(screen.getByRole('button', { name: 'Home' })); // the second tap confirms
    await screen.findByTestId('picker');
    expect(release).toHaveBeenCalled();
  } finally {
    delete (navigator as unknown as Record<string, unknown>).wakeLock;
  }
});
