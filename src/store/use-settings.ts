import { useEffect, useRef, useState } from 'preact/hooks';
import { DEFAULT_SETTINGS, getSettings, updateSettings, type Settings } from './db';

export interface SettingsState {
  /** Undefined until the stored settings have been read. */
  settings: Settings | undefined;
  /** Reading or saving the settings failed; the parent area shows the storage error. */
  failed: boolean;
  /** Applies a change at once and saves it. Never rejects: a failed save sets `failed`. */
  change: (patch: Partial<Settings>) => Promise<void>;
}

/**
 * The app's one copy of the settings. Every screen reads and changes them through this, so no
 * screen can save a stale copy over another's change. A failed save keeps the change in memory,
 * and the next save writes all of it.
 */
export function useSettings(): SettingsState {
  const [settings, setSettings] = useState<Settings>();
  const [failed, setFailed] = useState(false);
  const current = useRef<Settings | undefined>(undefined);
  // A save failed, so the stored settings are behind the ones in memory.
  const behind = useRef(false);

  useEffect(() => {
    getSettings()
      .catch((e: unknown) => {
        console.warn('Could not read the settings', e);
        setFailed(true);
        return DEFAULT_SETTINGS;
      })
      .then(s => { current.current = s; setSettings(s); });
  }, []);

  const change = (patch: Partial<Settings>): Promise<void> => {
    const next = { ...(current.current ?? DEFAULT_SETTINGS), ...patch };
    current.current = next;
    setSettings(next);
    return updateSettings(behind.current ? next : patch).then(
      () => { behind.current = false; setFailed(false); },
      (e: unknown) => {
        console.warn('Could not save the settings', e);
        behind.current = true;
        setFailed(true);
      },
    );
  };

  return { settings, failed, change };
}
