import { useEffect, useRef, useState } from 'preact/hooks';
import { FakeSource } from './midi/fake-source';
import { MidiInput } from './midi/midi-input';
import type { NoteSource, SourceStatus } from './midi/note-source';
import { Level1Session } from './play/level1';
import { starsLevel1, starsLevel2, type Stars } from './play/scoring';
import { HandPlacement } from './screens/HandPlacement';
import { Medals } from './screens/Medals';
import { Picker } from './screens/Picker';
import { PlayLevel1 } from './screens/PlayLevel1';
import { PlayLevel2 } from './screens/PlayLevel2';
import { ParentHome } from './screens/parent/ParentHome';
import { PlugIn } from './screens/PlugIn';
import { Results } from './screens/Results';
import type { Song } from './song/types';
import { loadBests, loadLibrary, type Bests } from './songs/library';
import { DEFAULT_SETTINGS, getSettings, recordResult, type Level, type Settings } from './store/db';
import './screens/screens.css';

type StartResult = Awaited<ReturnType<MidiInput['start']>>;

export type Route =
  | { screen: 'picker' }
  | { screen: 'hand'; song: Song; session: Level1Session; level: Level }
  | { screen: 'play1'; song: Song; session: Level1Session }
  | { screen: 'play2'; song: Song; startTime: number }
  | { screen: 'results'; song: Song; level: Level; stars: Stars }
  | { screen: 'medals' }
  | { screen: 'parent' }
  | { screen: 'settings' };

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
  const [status, setStatus] = useState<SourceStatus>({ connected: false });
  const connected = status.connected;
  const [tapMode, setTapMode] = useState(false);
  // What starting the keyboard input gave ('ok', 'unsupported', 'denied'); the parent area shows it.
  const [startResult, setStartResult] = useState<StartResult>();
  const starting = useRef(false);

  useEffect(() => source.onStatus(s => {
    setStatus(s);
    if (s.connected) setTapMode(false);
  }), [source]);

  const reload = async () => {
    const s = await getSettings().catch((e: unknown) => {
      console.warn('Could not read the settings', e);
      return DEFAULT_SETTINGS;
    });
    const lib = await loadLibrary(s);
    setSongs(lib);
    setBests(await loadBests(lib).catch((e: unknown) => {
      console.warn('Could not read the best results', e);
      return {};
    }));
    setSettings(s);
  };
  useEffect(() => { void reload(); }, []);

  if (!settings) return null;
  const lang = settings.childLang;
  const toPicker = () => setRoute({ screen: 'picker' });

  // Both levels start on the hand screen; level 2's session only finds the first note there.
  const startSong = (song: Song, level: Level) => {
    const session = new Level1Session(song.notes);
    if (session.current()) setRoute({ screen: 'hand', song, session, level });
  };

  // Asking for MIDI on a tap lets Chrome show its permission prompt. Until it gives 'ok', the next tap tries again.
  const startSource = () => {
    const startable = source as Partial<{ start(): StartResult | Promise<StartResult> | void }>;
    if (!startable.start || starting.current || startResult === 'ok') return;
    starting.current = true;
    Promise.resolve(startable.start())
      .then(r => setStartResult(r ?? 'ok'))
      .catch((e: unknown) => console.warn('Could not start the keyboard input', e))
      .finally(() => { starting.current = false; });
  };

  const pick = (song: Song, level: Level) => {
    startSource();
    startSong(song, level);
  };

  const finish = (song: Song, level: Level, stars: Stars) => {
    setRoute({ screen: 'results', song, level, stars });
    recordResult(song.id, level, stars)
      .then(({ best }) => setBests(b => ({ ...b, [song.id]: { ...(b[song.id] ?? { 1: 0, 2: 0 }), [level]: best } })))
      .catch((e: unknown) => console.warn('Could not save the result', e));
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
          onStart={time => setRoute(route.level === 1
            ? { screen: 'play1', song: route.song, session: route.session }
            : { screen: 'play2', song: route.song, startTime: time })} />
      );
      break;
    case 'play1':
      body = (
        <PlayLevel1 {...playProps} song={route.song} session={route.session}
          onDone={() => finish(route.song, 1, starsLevel1(route.session.mistakes, route.session.total))} />
      );
      break;
    case 'play2':
      body = (
        <PlayLevel2 {...playProps} song={route.song} startTime={route.startTime}
          speed={settings.speeds[route.song.id] ?? 'slow'} metronome={settings.metronomeClick}
          onDone={result => finish(route.song, 2, starsLevel2(result))} />
      );
      break;
    case 'results':
      body = (
        <Results song={route.song} stars={route.stars} lang={lang} celebrationSound={settings.celebrationSound}
          onAgain={() => startSong(route.song, route.level)}
          onOther={toPicker} />
      );
      break;
    case 'medals':
      body = <Medals songs={songs} bests={bests} lang={lang} level2={settings.level2Enabled} onBack={toPicker} />;
      break;
    case 'parent':
      body = (
        <ParentHome source={source} status={status} startResult={startResult} onStartKeyboard={startSource}
          onSettings={() => setRoute({ screen: 'settings' })} onBack={() => { toPicker(); void reload(); }} />
      );
      break;
    case 'settings':
      // Task 14 fills this in.
      body = <Placeholder testId="settings-placeholder" icon={'⚙️'} onBack={() => setRoute({ screen: 'parent' })} />;
      break;
  }

  return (
    <div class="app">
      {body}
      {unplugged && <PlugIn lang={lang} onTapMode={() => setTapMode(true)} onHome={toPicker} />}
    </div>
  );
}

/** Stand-in for screens later tasks build (the settings). */
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
