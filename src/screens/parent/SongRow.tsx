import { t } from '../../i18n';
import type { Song } from '../../song/types';
import type { Lang, Speed } from '../../store/db';

const SPEEDS: Speed[] = ['slow', 'medium', 'normal'];

export interface SongRowProps {
  song: Song;
  lang: Lang;
  speed: Speed;
  onEdit: () => void;
  onPicture: () => void;
  onExport: () => void;
  onToggleHidden: () => void;
  onDelete: () => void;
  onSpeed: (s: Speed) => void;
}

/** One song in the parent list. Built-ins can be hidden but not edited or deleted. */
export function SongRow({ song, lang, speed, onEdit, onPicture, onExport, onToggleHidden, onDelete, onSpeed }: SongRowProps) {
  const builtin = song.source === 'builtin';
  const btn = (label: string, onClick: () => void, extra = '') =>
    <button type="button" class={`parent-button small ${extra}`} onClick={onClick}>{label}</button>;
  return (
    <li class="song-row" data-testid={`parent-song-${song.id}`} data-hidden={song.hidden ? 'true' : undefined}>
      <span class="row-picture">{song.picture}</span>
      <span class="row-title">
        {song.title}
        {builtin && <span class="tag">{t(lang, 'parent.builtin')}</span>}
        {song.hidden && <span class="tag">{t(lang, 'parent.hiddenTag')}</span>}
      </span>
      <label class="speed-label">{t(lang, 'parent.speed')}
        <select aria-label={`${t(lang, 'parent.speed')} ${song.title}`} value={speed}
          onChange={e => onSpeed(e.currentTarget.value as Speed)}>
          {SPEEDS.map(s => <option key={s} value={s}>{t(lang, `speed.${s}`)}</option>)}
        </select>
      </label>
      {!builtin && btn(t(lang, 'parent.edit'), onEdit)}
      {btn(t(lang, 'parent.picture'), onPicture)}
      {btn(t(lang, 'parent.export'), onExport)}
      {builtin
        ? btn(t(lang, song.hidden ? 'parent.show' : 'parent.hide'), onToggleHidden)
        : btn(t(lang, 'parent.delete'), onDelete, 'danger')}
    </li>
  );
}
