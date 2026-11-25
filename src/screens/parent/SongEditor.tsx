import { useState } from 'preact/hooks';
import { t } from '../../i18n';
import { parseTypedNotes, type TypedError } from '../../song/typed-notes';
import type { Song } from '../../song/types';
import type { Lang } from '../../store/db';
import { PicturePicker } from './PicturePicker';
import { playPreview } from './preview';
import { songFromTyped } from './song-factory';

export interface EditorDraft { title: string; text: string; picture: string }

export interface SongEditorProps {
  lang: Lang;
  draft: EditorDraft;
  /** True when changing a saved song, false for a new one. */
  editing: boolean;
  onSave: (song: Song) => void;
  onCancel: () => void;
}

/** The typed text with each wrong token underlined. */
function MarkedText({ text, errors }: { text: string; errors: TypedError[] }) {
  const parts = [];
  let at = 0;
  for (const e of errors) {
    parts.push(text.slice(at, e.start));
    parts.push(<mark class="note-error" data-testid="note-error">{text.slice(e.start, e.end)}</mark>);
    at = e.end;
  }
  parts.push(text.slice(at));
  return <pre class="marked-text">{parts}</pre>;
}

export function SongEditor({ lang, draft, editing, onSave, onCancel }: SongEditorProps) {
  const [title, setTitle] = useState(draft.title);
  const [text, setText] = useState(draft.text);
  const [picture, setPicture] = useState(draft.picture);
  const parsed = parseTypedNotes(text);
  const errors = parsed.ok ? [] : parsed.errors;

  const save = () => {
    const song = songFromTyped(title, text, picture);
    if (!Array.isArray(song)) onSave(song);
  };

  return (
    <div class="screen parent-screen" data-testid="song-editor">
      <header class="top-bar">
        <button type="button" class="round-button" aria-label={t(lang, 'song.cancel')} onClick={onCancel}>{'⬅️'}</button>
        <h1 class="screen-title">{t(lang, editing ? 'editor.edit' : 'editor.title')}</h1>
        <span class="round-spacer" />
      </header>
      <div class="parent-scroll">
        <label class="field">{t(lang, 'import.name')}
          <input type="text" value={title} onInput={e => setTitle(e.currentTarget.value)} />
        </label>
        <label class="field">{t(lang, 'editor.notes')}
          <textarea rows={6} value={text} spellcheck={false} onInput={e => setText(e.currentTarget.value)} />
        </label>
        <p class="hint">{t(lang, 'editor.help')}</p>
        {errors.length > 0 && (
          <div class="error-box" data-testid="editor-errors">
            <p>{t(lang, 'editor.errors')}</p>
            <MarkedText text={text} errors={errors} />
            <ul>{errors.map(e => <li key={e.start}>{t(lang, `err.${e.code}`, { token: e.token })}</li>)}</ul>
          </div>
        )}
        <PicturePicker lang={lang} value={picture} onPick={setPicture} />
      </div>
      <footer class="parent-actions">
        <button type="button" class="parent-button" disabled={!parsed.ok}
          onClick={() => parsed.ok && playPreview(parsed.tempo, parsed.notes)}>{'🔊'} {t(lang, 'song.preview')}</button>
        <button type="button" class="parent-button" onClick={onCancel}>{t(lang, 'song.cancel')}</button>
        <button type="button" class="parent-button primary" disabled={errors.length > 0} onClick={save}>{t(lang, 'song.save')}</button>
      </footer>
    </div>
  );
}
