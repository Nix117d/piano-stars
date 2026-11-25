import { useEffect } from 'preact/hooks';

interface Sentinel { release(): Promise<void> }
interface WakeLockApi { request(type: 'screen'): Promise<Sentinel> }

const warn = (e: unknown) => console.warn('Could not keep the screen on', e);

/**
 * Keeps the screen on while `active`. The child plays on the USB keyboard and never touches the
 * screen, so without this Android dims it mid-song. The browser drops the lock when the app is
 * hidden, so it is asked for again each time the app is visible. Without the Wake Lock API, or
 * when the request is refused, it only warns.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    let lock: Sentinel | null = null;
    let done = false;
    const release = (s: Sentinel) => { s.release().catch(warn); };
    const request = () => {
      const api = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
      if (!api) return;
      try {
        api.request('screen').then(s => {
          if (done) { release(s); return; }
          if (lock) release(lock);
          lock = s;
        }, warn);
      } catch (e) {
        warn(e);
      }
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') request(); };
    request();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      done = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (lock) release(lock);
      lock = null;
    };
  }, [active]);
}
