import { t } from '../i18n';
import type { Song } from '../song/types';
import type { Bests } from '../songs/library';
import type { Lang, Level } from '../store/db';
import { Character } from '../ui/Character';
import { HoldButton } from '../ui/HoldButton';

export interface PickerProps {
  songs: Song[];
  bests: Bests;
  lang: Lang;
  level2: boolean;
  onPick: (song: Song, level: Level) => void;
  onMedals: () => void;
  onParent: () => void;
}

function StarRow({ best }: { best: number }) {
  return (
    <span class="card-stars" aria-label={`${best} / 5`}>
      {[1, 2, 3, 4, 5].map(n => <span key={n} class={n <= best ? 'star-on' : 'star-off'}>{'★'}</span>)}
    </span>
  );
}

export function Picker({ songs, bests, lang, level2, onPick, onMedals, onParent }: PickerProps) {
  return (
    <div class="screen picker-screen" data-testid="picker">
      <header class="top-bar">
        <HoldButton ms={3000} onHold={onParent} />
        <h1 class="screen-title">{t(lang, 'picker.title')}</h1>
        <button type="button" class="round-button medal-button" aria-label={t(lang, 'medals.title')} onClick={onMedals}>
          {'🏅'}
        </button>
      </header>
      {songs.length === 0 && <div class="empty-library"><Character /></div>}
      <div class="card-grid">
        {songs.map(song => {
          const best = bests[song.id] ?? { 1: 0, 2: 0 };
          const face = (
            <>
              <span class="card-picture">{song.picture}</span>
              <span class="card-title">{song.title}</span>
            </>
          );
          if (!level2) {
            return (
              <button type="button" key={song.id} class="song-card" data-testid={`song-card-${song.id}`} onClick={() => onPick(song, 1)}>
                {face}
                <StarRow best={best[1]} />
              </button>
            );
          }
          return (
            <div key={song.id} class="song-card" data-testid={`song-card-${song.id}`}>
              {face}
              <div class="level-buttons">
                <button type="button" class="level-button" data-testid={`level-1-${song.id}`} onClick={() => onPick(song, 1)}>
                  <span class="level-number">1</span> {'🎹'} {t(lang, 'level.keys')}
                  <StarRow best={best[1]} />
                </button>
                <button type="button" class="level-button" data-testid={`level-2-${song.id}`} onClick={() => onPick(song, 2)}>
                  <span class="level-number">2</span> {'🥁'} {t(lang, 'level.rhythm')}
                  <StarRow best={best[2]} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
