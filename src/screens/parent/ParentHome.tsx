import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { NoteSource, SourceStatus } from '../../midi/note-source';
import { downloadSong, exportFileNames } from '../../song/midi-export';
import { parseMidiFile } from '../../song/midi-file';
import type { ImportResult } from '../../song/import-result';
import { parseMusicXml, parseMxl } from '../../song/musicxml';
import { serializeTypedNotes } from '../../song/typed-notes';
import type { Song } from '../../song/types';
import { editedBuiltinIds, loadLibrary } from '../../songs/library';
import { freePicture } from '../../songs/pictures';
import { deleteSong, resetMedals, saveSong, type Settings, type Speed } from '../../store/db';
import { ConfirmDialog } from './ConfirmDialog';
import { ImportReview } from './ImportReview';
import { KeyboardExportGuide } from './KeyboardExportGuide';
import { KeyboardCheck } from './KeyboardCheck';
import { PicturePicker } from './PicturePicker';
import { playPreview, stopPreview } from './preview';
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
  /** The app's settings; the parent area changes them only through `onChangeSettings`. */
  settings: Settings;
  /** Saving (or reading) the settings failed: show the storage error. */
  settingsFailed: boolean;
  onChangeSettings: (patch: Partial<Settings>) => Promise<void>;
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

export function ParentHome({
  source, status, startResult, onStartKeyboard, settings, settingsFailed, onChangeSettings, onSettings, onBack,
}: ParentHomeProps) {
  const [songs, setSongs] = useState<Song[]>();
  const [edited, setEdited] = useState<string[]>([]);
  const [playing, setPlaying] = useState<string>();
  const [view, setView] = useState<View>({ kind: 'home' });
  const [ask, setAsk] = useState<Ask>();
  const [pictureFor, setPictureFor] = useState<Song>();
  const [guideOpen, setGuideOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const [failed, setFailed] = useState(false);
  const fail = (e: unknown) => { console.warn('Storage problem in the parent area', e); setFailed(true); };

  // Only the latest load may set the list, so a slow earlier one can't put back an old list.
  const loads = useRef(0);
  const refresh = async () => {
    const n = ++loads.current;
    // loadLibrary already warns when the saved songs can't be read.
    const [lib, ids] = await Promise.all([loadLibrary(settings, true), editedBuiltinIds().catch(() => [])]);
    if (n === loads.current) { setSongs(lib); setEdited(ids); }
  };
  useEffect(() => { void refresh(); }, [settings]);
  // A preview stops when the list is left (for the editor, an import or the child's screens).
  useEffect(() => { stopPreview(); setPlaying(undefined); }, [view.kind]);
  useEffect(() => stopPreview, []);
  if (!songs) return null;
  const lang = settings.parentLang;
  const newPicture = () => freePicture(songs.map(s => s.picture));
  const done = () => { setFailed(false); setView({ kind: 'home' }); return refresh(); };

  const pickFile = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) setView({ kind: 'review', result: await readImport(file), fileName: file.name, picture: newPicture() });
  };

  const setPicture = (song: Song, picture: string) => {
    setPictureFor(undefined);
    if (song.source === 'builtin') void onChangeSettings({ pictureOverrides: { ...settings.pictureOverrides, [song.id]: picture } });
    else void saveSong({ ...song, picture }).then(refresh).catch(fail);
  };

  const toggleHidden = (song: Song) => onChangeSettings({
    hiddenBuiltins: song.hidden
      ? settings.hiddenBuiltins.filter(id => id !== song.id)
      : [...settings.hiddenBuiltins, song.id],
  });

  const preview = (song: Song) => {
    if (playing === song.id) { stopPreview(); setPlaying(undefined); return; }
    playPreview(song.tempo, song.notes, () => setPlaying(undefined));
    setPlaying(song.id);
  };

  // Saving an edited built-in stores a copy under its id (source 'builtin'), which loadLibrary
  // puts in the shipped song's place. The fingering source follows the usual edit rules.
  const editSong = (song: Song) => {
    const text = serializeTypedNotes(song.tempo, song.notes);
    setView({
      kind: 'editor', editing: true, draft: { title: song.title, text, picture: song.picture, original: song },
      finish: s => ({
        ...s, id: song.id, createdAt: song.createdAt, source: song.source, hidden: song.hidden,
        ...(song.melodySource ? { melodySource: song.melodySource } : {}),
      }),
    });
  };

  // A built-in's picture is a setting, so a picture picked in the editor goes there too.
  const saveEdited = (view: View & { kind: 'editor' }, song: Song) => {
    const saved = view.finish(song);
    const pictureChanged = saved.source === 'builtin' && saved.picture !== view.draft.picture;
    void saveSong(saved)
      .then(() => pictureChanged ? onChangeSettings({ pictureOverrides: { ...settings.pictureOverrides, [saved.id]: saved.picture } }) : undefined)
      .then(done).catch(fail);
  };

  // Names are given in list order, so each song keeps the same one between exports.
  const fileNames = exportFileNames(songs.map(s => s.title));
  const banner = (failed || settingsFailed) && <p class="error-box parent-error" role="alert" data-testid="storage-error">{t(lang, 'parent.error')}</p>;
  if (view.kind === 'review') {
    return (
      <>{banner}<ImportReview lang={lang} result={view.result} fileName={view.fileName} picture={view.picture}
        onCancel={() => setView({ kind: 'home' })}
        onSave={song => void saveSong(song).then(done).catch(fail)}
        onFix={draft => setView({ kind: 'editor', draft, editing: false, finish: s => ({ ...s, source: 'file' }) })} /></>
    );
  }
  if (view.kind === 'editor') {
    return (
      <>{banner}<SongEditor lang={lang} draft={view.draft} editing={view.editing}
        onCancel={() => setView({ kind: 'home' })}
        onSave={song => saveEdited(view, song)} /></>
    );
  }

  return (
    <div class="screen parent-screen" data-testid="parent-home">
      {banner}
      <header class="top-bar">
        <button type="button" class="round-button" aria-label={t(lang, 'parent.back')} onClick={onBack}>{'⬅️'}</button>
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
          onClick={() => setAsk({ message: t(lang, 'confirm.resetMedals'), onYes: () => void resetMedals().catch(fail) })}>
          {t(lang, 'parent.resetMedals')}
        </button>
      </div>
      <div class="parent-scroll">
        <ul class="song-list">
          {songs.map((song, i) => (
            <SongRow key={song.id} song={song} lang={lang} speed={settings.speeds[song.id] ?? 'slow'}
              playing={playing === song.id} edited={edited.includes(song.id)} onPreview={() => preview(song)}
              onEdit={() => editSong(song)} onPicture={() => setPictureFor(song)}
              onExport={() => { try { downloadSong(song, fileNames[i]); setGuideOpen(true); } catch (e) { fail(e); } }}
              onToggleHidden={() => void toggleHidden(song)}
              onDelete={() => setAsk({ message: t(lang, 'confirm.delete', { title: song.title }), onYes: () => void deleteSong(song.id).then(refresh).catch(fail) })}
              onReset={() => setAsk({ message: t(lang, 'confirm.resetOriginal', { title: song.title }), onYes: () => void deleteSong(song.id).then(refresh).catch(fail) })}
              onSpeed={(s: Speed) => void onChangeSettings({ speeds: { ...settings.speeds, [song.id]: s } })} />
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
      {guideOpen && <KeyboardExportGuide lang={lang} onClose={() => setGuideOpen(false)} />}
      {ask && <ConfirmDialog lang={lang} message={ask.message}
        onNo={() => setAsk(undefined)} onYes={() => { ask.onYes(); setAsk(undefined); }} />}
    </div>
  );
}
