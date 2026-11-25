import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { ImportResult } from '../../song/import-result';
import { serializeTypedNotes } from '../../song/typed-notes';
import type { Song } from '../../song/types';
import type { Lang } from '../../store/db';
import { PicturePicker } from './PicturePicker';
import { playPreview, stopPreview } from './preview';
import type { EditorDraft } from './SongEditor';
import { songFromImport } from './song-factory';

export interface ImportReviewProps {
  lang: Lang;
  result: ImportResult;
  fileName: string;
  picture: string;
  onSave: (song: Song) => void;
  /** Opens the editor with what is shown here. */
  onFix: (draft: EditorDraft) => void;
  onCancel: () => void;
}

export function ImportReview({ lang, result, fileName, picture: firstPicture, onSave, onFix, onCancel }: ImportReviewProps) {
  const [picture, setPicture] = useState(firstPicture);
  useEffect(() => stopPreview, []);
  const untitled = t(lang, 'song.untitled');
  const [title, setTitle] = useState(result.ok ? songFromImport(result, fileName, picture, untitled).title : '');

  if (!result.ok) {
    return (
      <div class="screen parent-screen" data-testid="import-review">
        <h1 class="screen-title">{t(lang, 'import.title')}</h1>
        <p class="error-box" data-testid="import-failed">{t(lang, result.reason === 'noNotes' ? 'import.noNotes' : 'import.unreadable')}</p>
        <footer class="parent-actions">
          <button type="button" class="parent-button" onClick={onCancel}>{t(lang, 'song.cancel')}</button>
        </footer>
      </div>
    );
  }

  const song = { ...songFromImport(result, fileName, picture, untitled), title: title.trim() || songFromImport(result, fileName, picture, untitled).title };
  const text = serializeTypedNotes(song.tempo, song.notes);
  return (
    <div class="screen parent-screen" data-testid="import-review">
      <header class="top-bar">
        <button type="button" class="round-button" aria-label={t(lang, 'song.cancel')} onClick={onCancel}>{'⬅️'}</button>
        <h1 class="screen-title">{t(lang, 'import.title')}</h1>
        <span class="round-spacer" />
      </header>
      <div class="parent-scroll">
        <label class="field">{t(lang, 'import.name')}
          <input type="text" value={title} onInput={e => setTitle(e.currentTarget.value)} />
        </label>
        {result.octaveShift !== 0 && (
          <p class="hint" data-testid="octave-note">{t(lang, 'import.moved', { n: Math.abs(result.octaveShift) })}</p>
        )}
        <pre class="marked-text" data-testid="import-notes">{text}</pre>
        <PicturePicker lang={lang} value={picture} onPick={setPicture} />
      </div>
      <footer class="parent-actions">
        <button type="button" class="parent-button" onClick={() => playPreview(song.tempo, song.notes)}>{'🔊'} {t(lang, 'song.preview')}</button>
        <button type="button" class="parent-button" onClick={() => onFix({ title: song.title, text, picture, original: song })}>{t(lang, 'song.fix')}</button>
        <button type="button" class="parent-button" onClick={onCancel}>{t(lang, 'song.cancel')}</button>
        <button type="button" class="parent-button primary" onClick={() => onSave(song)}>{t(lang, 'song.save')}</button>
      </footer>
    </div>
  );
}
