import { t } from '../i18n';
import { medalFor, type Medal } from '../play/scoring';
import type { Song } from '../song/types';
import type { Bests } from '../songs/library';
import type { Lang, Level } from '../store/db';

const MEDAL_ICON: Record<Medal, string> = { none: '', bronze: '🥉', silver: '🥈', gold: '🥇' };

export interface MedalsProps {
  songs: Song[];
  bests: Bests;
  lang: Lang;
  level2: boolean;
  onBack: () => void;
}

export function Medals({ songs, bests, lang, level2, onBack }: MedalsProps) {
  const levels: Level[] = level2 ? [1, 2] : [1];
  return (
    <div class="screen medals-screen" data-testid="medals-screen">
      <header class="top-bar">
        <button type="button" class="round-button" aria-label="Back" onClick={onBack}>{'⬅️'}</button>
        <h1 class="screen-title">{'🏅'} {t(lang, 'medals.title')}</h1>
        <span class="round-spacer" />
      </header>
      <div class="card-grid">
        {songs.map(song => (
          <div key={song.id} class="medal-card">
            <span class="card-picture">{song.picture}</span>
            <span class="card-title">{song.title}</span>
            <div class="medal-row">
              {levels.map(level => {
                const medal = medalFor(bests[song.id]?.[level] ?? 0);
                return (
                  <span key={level} class="medal-slot" data-testid={`medal-${song.id}-${level}`} data-medal={medal}>
                    {MEDAL_ICON[medal]}
                    {level2 && <span class="medal-level">{level === 1 ? '🎹' : '🥁'}</span>}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
