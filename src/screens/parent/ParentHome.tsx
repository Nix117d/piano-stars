import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { NoteSource, SourceStatus } from '../../midi/note-source';
import { parseMidiFile } from '../../song/midi-file';
import type { ImportResult } from '../../song/import-result';
import { parseMusicXml, parseMxl } from '../../song/musicxml';
import { serializeTypedNotes } from '../../song/typed-notes';
import type { Song } from '../../song/types';
import { loadLibrary } from '../../songs/library';
import { freePicture } from '../../songs/pictures';
import {
  deleteSong, getSettings, resetMedals, saveSettings, saveSong, type Settings, type Speed,
} from '../../store/db';
import { ConfirmDialog } from './ConfirmDialog';
import { ImportReview } from './ImportReview';
import { KeyboardCheck } from './KeyboardCheck';
import { PicturePicker } from './PicturePicker';
import { SongEditor, type EditorDraft } from './SongEditor';
import { SongRow } from './SongRow';

type View =
  | { kind: 'home' }
  | { kind: 'review'; result: ImportResult; fileName: string; picture: string }
  | { kind: 'editor'; draft: EditorDraft; /** Turns the typed song into what gets saved. */ finish: (s: Song) => Song; editing: boolean };

type Ask = { message: string; onYes: () => void };

export interface ParentHomeProps {
  source: NoteSource;
  status: SourceStatus;
  startResult?: 'ok' | 'unsupported' | 'denied';
  onStartKeyboard: () => void;
  onSettings: () => void;
  onBack: () => void;
}

async function readImport(file: File): Promise<ImportResult> {
  const name = file.name.toLowerCase();
  try {
    if (/\.(mid|midi)$/.test(name)) return parseMidiFile(new Uint8Array(await file.arrayBuffer()));
    if (name.endsWith('.mxl')) return parseMxl(new Uint8Array(await file.arrayBuffer()));
    return parseMusicXml(await file.text());
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
}

export function ParentHome({ source, status, startResult, onStartKeyboard, onSettings, onBack }: ParentHomeProps) {
  const [settings, setSettings] = useState<Settings>();
  const [songs, setSongs] = useState<Song[]>([]);
  const [view, setView] = useState<View>({ kind: 'home' });
  const [ask, setAsk] = useState<Ask>();
  const [pictureFor, setPictureFor] = useState<Song>();
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const s = await getSettings();
    setSongs(await loadLibrary(s, true));
    setSettings(s);
  };
  useEffect(() => { void refresh(); }, []);
  if (!settings) return null;
  const lang = settings.parentLang;
  const newPicture = () => freePicture(songs.map(s => s.picture));
  const done = () => { setView({ kind: 'home' }); return refresh(); };
  const changeSettings = (patch: Partial<Settings>) =>
    saveSettings({ ...settings, ...patch }).then(refresh);

  const pickFile = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) setView({ kind: 'review', result: await readImport(file), fileName: file.name, picture: newPicture() });
  };

  const setPicture = (song: Song, picture: string) => {
    setPictureFor(undefined);
    if (song.source === 'builtin') void changeSettings({ pictureOverrides: { ...settings.pictureOverrides, [song.id]: picture } });
    else void saveSong({ ...song, picture }).then(refresh);
  };

  const toggleHidden = (song: Song) => changeSettings({
    hiddenBuiltins: song.hidden
      ? settings.hiddenBuiltins.filter(id => id !== song.id)
      : [...settings.hiddenBuiltins, song.id],
  });

  const editSong = (song: Song) => {
    const text = serializeTypedNotes(song.tempo, song.notes);
    setView({
      kind: 'editor', editing: true, draft: { title: song.title, text, picture: song.picture },
      finish: s => ({ ...s, id: song.id, createdAt: song.createdAt, source: song.source, hidden: song.hidden }),
    });
  };

  if (view.kind === 'review') {
    return (
      <ImportReview lang={lang} result={view.result} fileName={view.fileName} picture={view.picture}
        onCancel={() => setView({ kind: 'home' })}
        onSave={song => void saveSong(song).then(done)}
        onFix={draft => setView({ kind: 'editor', draft, editing: false, finish: s => ({ ...s, source: 'file' }) })} />
    );
  }
  if (view.kind === 'editor') {
    return (
      <SongEditor lang={lang} draft={view.draft} editing={view.editing}
        onCancel={() => setView({ kind: 'home' })}
        onSave={song => void saveSong(view.finish(song)).then(done)} />
    );
  }

  return (
    <div class="screen parent-screen" data-testid="parent-home">
      <header class="top-bar">
        <button type="button" class="round-button" aria-label="Back" onClick={onBack}>{'⬅️'}</button>
        <h1 class="screen-title">{'⚙️'} {t(lang, 'parent.title')}</h1>
        <span class="round-spacer" />
      </header>
      <div class="parent-actions top-actions">
        <button type="button" class="parent-button primary" onClick={() => fileInput.current?.click()}>{t(lang, 'parent.addFile')}</button>
        <input ref={fileInput} type="file" accept=".musicxml,.xml,.mxl,.mid,.midi" hidden data-testid="file-input" onChange={pickFile} />
        <button type="button" class="parent-button primary"
          onClick={() => setView({ kind: 'editor', editing: false, draft: { title: '', text: 'tempo 80\n', picture: newPicture() }, finish: s => s })}>
          {t(lang, 'parent.typeNotes')}
        </button>
        <button type="button" class="parent-button" onClick={onSettings}>{t(lang, 'parent.settings')}</button>
        <button type="button" class="parent-button danger"
          onClick={() => setAsk({ message: t(lang, 'confirm.resetMedals'), onYes: () => void resetMedals() })}>
          {t(lang, 'parent.resetMedals')}
        </button>
      </div>
      <div class="parent-scroll">
        <ul class="song-list">
          {songs.map(song => (
            <SongRow key={song.id} song={song} lang={lang} speed={settings.speeds[song.id] ?? 'slow'}
              onEdit={() => editSong(song)} onPicture={() => setPictureFor(song)}
              onToggleHidden={() => void toggleHidden(song)}
              onDelete={() => setAsk({ message: t(lang, 'confirm.delete', { title: song.title }), onYes: () => void deleteSong(song.id).then(refresh) })}
              onSpeed={(s: Speed) => void changeSettings({ speeds: { ...settings.speeds, [song.id]: s } })} />
          ))}
        </ul>
        {songs.length === 0 && <p class="hint">{t(lang, 'parent.noSongs')}</p>}
        <KeyboardCheck lang={lang} source={source} status={status} startResult={startResult} onStart={onStartKeyboard} />
      </div>
      {pictureFor && (
        <div class="dialog-backdrop">
          <div class="dialog wide" data-testid="picture-dialog">
            <PicturePicker lang={lang} value={pictureFor.picture} onPick={p => setPicture(pictureFor, p)} />
            <button type="button" class="parent-button" onClick={() => setPictureFor(undefined)}>{t(lang, 'song.cancel')}</button>
          </div>
        </div>
      )}
      {ask && <ConfirmDialog lang={lang} message={ask.message}
        onNo={() => setAsk(undefined)} onYes={() => { ask.onYes(); setAsk(undefined); }} />}
    </div>
  );
}
