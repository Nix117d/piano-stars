import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';

vi.mock('../../src/songs/builtin/index', () => ({
  BUILTIN_SONGS: [{ id: 'cde', title: 'Test', picture: '🐸', typed: 'C D E', melodySource: 'test' }],
}));

import { FakeSource } from '../../src/midi/fake-source';
import { DEFAULT_SETTINGS, getSettings } from '../../src/store/db';
import * as db from '../../src/store/db';

beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

async function openSettings() {
  const { App } = await import('../../src/App');
  render(<App source={new FakeSource()} />);
  const hold = await screen.findByTestId('hold-button');
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  fireEvent.pointerDown(hold);
  act(() => { vi.advanceTimersByTime(3100); });
  vi.useRealTimers();
  await screen.findByTestId('parent-home');
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  return screen.findByTestId('settings');
}

const toPicker = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  await screen.findByTestId('parent-home');
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
};

test('parent area defaults to English while child screens are Dutch', async () => {
  const { App } = await import('../../src/App');
  render(<App source={new FakeSource()} />);
  expect(await screen.findByText('Kies een liedje')).toBeTruthy();
  await openSettings();
  expect(screen.getByRole('heading', { name: /Settings/ })).toBeTruthy();
  const parent = within(screen.getByRole('group', { name: 'Parent language' }));
  expect(parent.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
  const child = within(screen.getByRole('group', { name: 'Child language' }));
  expect(child.getByRole('button', { name: 'Nederlands' })).toHaveAttribute('aria-pressed', 'true');
});

test('switching child language changes picker title', async () => {
  await openSettings();
  fireEvent.click(within(screen.getByRole('group', { name: 'Child language' })).getByRole('button', { name: 'English' }));
  await waitFor(async () => expect((await getSettings()).childLang).toBe('en'));
  await toPicker();
  expect(await screen.findByText('Pick a song')).toBeTruthy();
});

test('switching parent language changes the settings texts at once', async () => {
  await openSettings();
  fireEvent.click(within(screen.getByRole('group', { name: 'Parent language' })).getByRole('button', { name: 'Nederlands' }));
  expect(await screen.findByRole('heading', { name: /Instellingen/ })).toBeTruthy();
  await waitFor(async () => expect((await getSettings()).parentLang).toBe('nl'));
});

test('turning on level 2 shows level buttons on song cards', async () => {
  await openSettings();
  const toggle = screen.getByRole('switch', { name: /Level 2/ });
  expect(toggle).toHaveAttribute('aria-checked', 'false');
  fireEvent.click(toggle);
  expect(screen.getByRole('switch', { name: /Level 2/ })).toHaveAttribute('aria-checked', 'true');
  await toPicker();
  expect(await screen.findByTestId('level-1-cde')).toBeTruthy();
  expect(screen.getByTestId('level-2-cde')).toBeTruthy();
});

test('a setting is still there after the app is mounted again', async () => {
  await openSettings();
  fireEvent.click(screen.getByRole('switch', { name: /Celebration sound/ }));
  await waitFor(async () => expect((await getSettings()).celebrationSound).toBe(!DEFAULT_SETTINGS.celebrationSound));
  cleanup();
  await openSettings();
  expect(screen.getByRole('switch', { name: /Celebration sound/ }))
    .toHaveAttribute('aria-checked', String(!DEFAULT_SETTINGS.celebrationSound));
});

test('a failed save keeps the change on screen and shows the storage error', async () => {
  await openSettings();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(db, 'saveSettings').mockRejectedValue(new Error('full'));
  fireEvent.click(screen.getByRole('switch', { name: /Metronome/ }));
  expect(await screen.findByTestId('storage-error')).toBeTruthy();
  expect(screen.getByRole('switch', { name: /Metronome/ })).toHaveAttribute('aria-checked', String(!DEFAULT_SETTINGS.metronomeClick));
});
