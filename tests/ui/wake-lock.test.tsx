import { afterEach, expect, test, vi } from 'vitest';
import { act, render } from '@testing-library/preact';
import { useWakeLock } from '../../src/ui/use-wake-lock';

function Holder({ active }: { active: boolean }) {
  useWakeLock(active);
  return null;
}

const flush = () => act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); });

/** A stub `navigator.wakeLock` whose sentinels can be released. */
function stubWakeLock(request?: () => Promise<unknown>) {
  const sentinels: { release: ReturnType<typeof vi.fn> }[] = [];
  const api = {
    request: vi.fn(request ?? (async () => {
      const s = { released: false, release: vi.fn(async () => { s.released = true; }) };
      sentinels.push(s);
      return s;
    })),
  };
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: api });
  return { api, sentinels };
}

function setVisible(visible: boolean) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (visible ? 'visible' : 'hidden') });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => !visible });
  document.dispatchEvent(new Event('visibilitychange'));
}

afterEach(() => {
  delete (navigator as unknown as Record<string, unknown>).wakeLock;
  delete (document as unknown as Record<string, unknown>).visibilityState;
  delete (document as unknown as Record<string, unknown>).hidden;
  vi.restoreAllMocks();
});

test('asks for a screen wake lock while active and releases it after', async () => {
  const { api, sentinels } = stubWakeLock();
  const { rerender, unmount } = render(<Holder active={false} />);
  expect(api.request).not.toHaveBeenCalled();
  rerender(<Holder active />);
  await flush();
  expect(api.request).toHaveBeenCalledWith('screen');
  rerender(<Holder active={false} />);
  await flush();
  expect(sentinels[0].release).toHaveBeenCalled();
  rerender(<Holder active />);
  await flush();
  act(() => unmount());
  await flush();
  expect(sentinels[1].release).toHaveBeenCalled();
});

test('asks again when the app becomes visible', async () => {
  const { api } = stubWakeLock();
  render(<Holder active />);
  await flush();
  setVisible(false); // the browser drops the lock when hidden
  setVisible(true);
  await flush();
  expect(api.request).toHaveBeenCalledTimes(2);
});

test('never throws without the API, or when the request fails', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { unmount } = render(<Holder active />);
  await flush();
  act(() => unmount());
  stubWakeLock(() => Promise.reject(new Error('NotAllowedError')));
  render(<Holder active />);
  await flush();
  expect(warn).toHaveBeenCalled();
  stubWakeLock(() => { throw new Error('sync'); });
  render(<Holder active />);
  await flush();
  expect(warn).toHaveBeenCalledTimes(2);
});
