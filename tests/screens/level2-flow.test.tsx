import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';

vi.mock('../../src/songs/builtin/index', () => ({
  BUILTIN_SONGS: [{ id: 'cde', title: 'Test', picture: '🐸', typed: 'tempo 60\nC D E', melodySource: 'test' }],
}));

import { App } from '../../src/App';
import { synth } from '../../src/audio/synth';
import { FakeSource } from '../../src/midi/fake-source';
import { starsLevel2 } from '../../src/play/scoring';
import { DEFAULT_SETTINGS, getBest, saveSettings } from '../../src/store/db';

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory();
  await saveSettings({ ...DEFAULT_SETTINGS, level2Enabled: true, speeds: { cde: 'normal' }, metronomeClick: true }); // beatMs 1000
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

async function openLevel2() {
  const fake = new FakeSource();
  render(<App source={fake} />);
  act(() => fake.setConnected(true, 'Test keyboard'));
  fireEvent.click(await screen.findByTestId('level-2-cde'));
  await screen.findByTestId('hand-screen');
  return fake;
}

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

test('level 2: count-in, presses on time, results with level 2 recorded', async () => {
  const fake = await openLevel2();
  const click = vi.spyOn(synth, 'click').mockImplementation(() => {});
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  const t0 = performance.now();
  act(() => fake.press(60, t0)); // starts the count-in; not a note
  expect(screen.getByTestId('play2-screen')).toBeTruthy();
  advance(1100);
  expect(click).toHaveBeenCalledTimes(2); // beats at 0 and 1000
  expect(screen.getByTestId('count-in').querySelectorAll('[data-filled]')).toHaveLength(2);
  advance(2950); // 4050 ms
  expect(screen.getAllByTestId('falling-bubble')).toHaveLength(3); // each shows 2 beats ahead
  act(() => fake.press(60, t0 + 4000));
  expect(screen.getByTestId('key-60')).toHaveAttribute('data-sparkle-size', 'big');
  act(() => fake.press(62, t0 + 5200)); // 200 ms late: close
  expect(screen.getByTestId('key-62')).toHaveAttribute('data-sparkle-size', 'small');
  act(() => fake.press(64, t0 + 6000));
  advance(2500); // past the end, 6300 ms
  expect(screen.getByTestId('results')).toBeTruthy();
  const stars = starsLevel2({ onTime: 2, close: 1, missed: 0, wrongPresses: 0, total: 3 });
  expect(screen.getAllByTestId('star-earned')).toHaveLength(stars);
  vi.useRealTimers();
  await waitFor(async () => expect(await getBest('cde', 2)).toBe(stars));
  expect(await getBest('cde', 1)).toBe(0);
});

test('level 2: unplugging freezes the song; a missed note is a wobble', async () => {
  const fake = await openLevel2();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  const t0 = performance.now();
  act(() => fake.press(60, t0));
  expect(screen.getByTestId('play2-screen')).toBeTruthy();
  advance(2000);
  act(() => fake.setConnected(false));
  advance(10000); // nothing is missed while unplugged
  expect(screen.queryByTestId('results')).toBeNull();
  expect(screen.getByTestId('play2-screen').querySelector('[data-wobble]')).toBeNull();
  act(() => fake.setConnected(true));
  advance(2400); // the first note was due 2000 ms after the reconnect; now 400 ms late: missed
  expect(screen.getByTestId('key-60')).toHaveAttribute('data-wobble', 'true');
});

test('level 2: after a reconnect the beat continues without a stray click', async () => {
  const fake = await openLevel2();
  const click = vi.spyOn(synth, 'click').mockImplementation(() => {});
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  act(() => fake.press(60, performance.now()));
  advance(2500); // beats 0, 1 and 2
  expect(click).toHaveBeenCalledTimes(3);
  act(() => fake.setConnected(false));
  advance(10000);
  expect(click).toHaveBeenCalledTimes(3);
  // Not inside act(): its synchronous effect flush would hide a session that resumes a frame late.
  fake.setConnected(true);
  for (let i = 0; i < 5; i++) await Promise.resolve();
  vi.advanceTimersByTime(300); // the pause moved beat 3 from 3000 ms to 13000 ms
  expect(click).toHaveBeenCalledTimes(3);
  expect(screen.getByTestId('count-in').querySelectorAll('[data-filled]')).toHaveLength(3);
  advance(600); // 13000 ms after the start
  expect(click).toHaveBeenCalledTimes(4);
  expect(screen.getByTestId('count-in').querySelectorAll('[data-filled]')).toHaveLength(4);
});

test('level 2: no click sounds when the metronome click is off', async () => {
  await saveSettings({ ...DEFAULT_SETTINGS, level2Enabled: true, speeds: { cde: 'normal' } });
  const fake = await openLevel2();
  const click = vi.spyOn(synth, 'click').mockImplementation(() => {});
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  act(() => fake.press(60, performance.now()));
  advance(3500);
  expect(screen.getByTestId('count-in').querySelectorAll('[data-filled]')).toHaveLength(4); // the beat runs
  expect(click).not.toHaveBeenCalled();
});

test('level 2: while the app is hidden the song pauses, without the plug screen', async () => {
  const fake = await openLevel2();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  const setHidden = (hidden: boolean) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
  };
  try {
    act(() => fake.press(60, performance.now()));
    advance(2000);
    setHidden(true);
    advance(10000); // nothing is missed while hidden
    expect(screen.queryByTestId('plug-screen')).toBeNull();
    expect(screen.queryByTestId('results')).toBeNull();
    expect(screen.getByTestId('play2-screen').querySelector('[data-wobble]')).toBeNull();
    setHidden(false);
    advance(1500); // the first note is due 2000 ms after coming back: not missed yet
    expect(screen.getByTestId('play2-screen').querySelector('[data-wobble]')).toBeNull();
    advance(900); // now 400 ms late: missed
    expect(screen.getByTestId('key-60')).toHaveAttribute('data-wobble', 'true');
  } finally {
    delete (document as unknown as Record<string, unknown>).hidden;
    delete (document as unknown as Record<string, unknown>).visibilityState;
  }
});
