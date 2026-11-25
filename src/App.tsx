import { useEffect, useRef, useState } from 'preact/hooks';
import { FakeSource } from './midi/fake-source';
import { MidiInput } from './midi/midi-input';
import type { NoteSource } from './midi/note-source';
import { Level1Session } from './play/level1';
import { starsLevel1, type Stars } from './play/scoring';
import { HandPlacement } from './screens/HandPlacement';
import { Medals } from './screens/Medals';
import { Picker } from './screens/Picker';
import { PlayLevel1 } from './screens/PlayLevel1';
import { PlugIn } from './screens/PlugIn';
import { Results } from './screens/Results';
import type { Song } from './song/types';
import { loadBests, loadLibrary, type Bests } from './songs/library';
import { DEFAULT_SETTINGS, getSettings, recordResult, type Level, type Settings } from './store/db';
import './screens/screens.css';

export type Route =
  | { screen: 'picker' }
  | { screen: 'hand'; song: Song; session: Level1Session }
  | { screen: 'play1'; song: Song; session: Level1Session }
  | { screen: 'play2'; song: Song }
  | { screen: 'results'; song: Song; level: Level; stars: Stars }
  | { screen: 'medals' }
  | { screen: 'parent' };

/** Dev only (`?fake`): computer keys a s d f g h j k are the white keys C4 to C5; 0 plugs in and out. */
const DEV_KEYS: Record<string, number> = { a: 60, s: 62, d: 64, f: 65, g: 67, h: 69, j: 71, k: 72 };

function devKeysSource(): FakeSource & { start(): void } {
  const fake = new FakeSource();
  let connected = false;
  const plug = (on: boolean) => { connected = on; fake.setConnected(on, 'Computer keys'); };
  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.key === '0') plug(!connected);
    else if (DEV_KEYS[e.key] !== undefined) fake.press(DEV_KEYS[e.key]);
  });
  return Object.assign(fake, { start: () => plug(true) });
}

function defaultSource(): NoteSource {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('fake')) return devKeysSource();
  return new MidiInput();
}

export function App({ source: given }: { source?: NoteSource }) {
  const [source] = useState(() => given ?? defaultSource());
  const [settings, setSettings] = useState<Settings>();
  const [songs, setSongs] = useState<Song[]>([]);
  const [bests, setBests] = useState<Bests>({});
  const [route, setRoute] = useState<Route>({ screen: 'picker' });
  // No status has said "connected" yet, so there is no keyboard.
  const [connected, setConnected] = useState(false);
  const [tapMode, setTapMode] = useState(false);
  const started = useRef(false);

  useEffect(() => source.onStatus(s => {
    setConnected(s.connected);
    if (s.connected) setTapMode(false);
  }), [source]);

  const reload = async () => {
    const s = await getSettings().catch(() => DEFAULT_SETTINGS);
    const lib = await loadLibrary(s).catch(() => [] as Song[]);
    setSongs(lib);
    setBests(await loadBests(lib).catch(() => ({})));
    setSettings(s);
  };
  useEffect(() => { void reload(); }, []);

  if (!settings) return null;
  const lang = settings.childLang;
  const toPicker = () => setRoute({ screen: 'picker' });

  const startLevel1 = (song: Song) => {
    const session = new Level1Session(song.notes);
    if (session.current()) setRoute({ screen: 'hand', song, session });
  };

  const pick = (song: Song, level: Level) => {
    // Asking for MIDI on a tap lets Chrome show its permission prompt.
    if (!started.current) {
      started.current = true;
      void (source as Partial<{ start(): unknown }>).start?.();
    }
    if (level === 1) startLevel1(song);
    else setRoute({ screen: 'play2', song });
  };

  const finish = (song: Song, level: Level, stars: Stars) => {
    setRoute({ screen: 'results', song, level, stars });
    recordResult(song.id, level, stars)
      .then(({ best }) => setBests(b => ({ ...b, [song.id]: { ...(b[song.id] ?? { 1: 0, 2: 0 }), [level]: best } })))
      .catch(() => {});
  };

  const needsKeys = route.screen === 'hand' || route.screen === 'play1' || route.screen === 'play2';
  const unplugged = needsKeys && !connected && !tapMode;
  const playProps = { source, lang, paused: unplugged, tapMode, onHome: toPicker };

  let body;
  switch (route.screen) {
    case 'picker':
      body = (
        <Picker songs={songs} bests={bests} lang={lang} level2={settings.level2Enabled}
          onPick={pick} onMedals={() => setRoute({ screen: 'medals' })} onParent={() => setRoute({ screen: 'parent' })} />
      );
      break;
    case 'hand':
      body = (
        <HandPlacement {...playProps} song={route.song} session={route.session}
          onStart={() => setRoute({ screen: 'play1', song: route.song, session: route.session })} />
      );
      break;
    case 'play1':
      body = (
        <PlayLevel1 {...playProps} song={route.song} session={route.session}
          onDone={() => finish(route.song, 1, starsLevel1(route.session.mistakes, route.session.total))} />
      );
      break;
    case 'play2':
      body = <Placeholder testId="play2-placeholder" icon={'🥁'} onBack={toPicker} />;
      break;
    case 'results':
      body = (
        <Results song={route.song} stars={route.stars} lang={lang} celebrationSound={settings.celebrationSound}
          onAgain={() => (route.level === 1 ? startLevel1(route.song) : setRoute({ screen: 'play2', song: route.song }))}
          onOther={toPicker} />
      );
      break;
    case 'medals':
      body = <Medals songs={songs} bests={bests} lang={lang} level2={settings.level2Enabled} onBack={toPicker} />;
      break;
    case 'parent':
      body = <Placeholder testId="parent-placeholder" icon={'⚙️'} onBack={() => { toPicker(); void reload(); }} />;
      break;
  }

  return (
    <div class="app">
      {body}
      {unplugged && <PlugIn lang={lang} onTapMode={() => setTapMode(true)} onHome={toPicker} />}
    </div>
  );
}

/** Stand-in for screens later tasks build (level 2, the parent area). */
function Placeholder({ testId, icon, onBack }: { testId: string; icon: string; onBack: () => void }) {
  return (
    <div class="screen placeholder-screen" data-testid={testId}>
      <header class="top-bar">
        <button type="button" class="round-button" aria-label="Back" onClick={onBack}>{'⬅️'}</button>
        <span />
        <span class="round-spacer" />
      </header>
      <div class="placeholder-icon">{icon}</div>
    </div>
  );
}
