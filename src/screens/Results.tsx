import { useEffect } from 'preact/hooks';
import { synth } from '../audio/synth';
import { t } from '../i18n';
import type { Stars } from '../play/scoring';
import type { Song } from '../song/types';
import type { Lang } from '../store/db';
import { Character } from '../ui/Character';
import { NOTE_COLORS } from '../ui/colors';

const STAR_MS = 300;
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 7) * 120,
  color: Object.values(NOTE_COLORS)[i % 7],
  turn: i % 2 ? 1 : -1,
}));

export interface ResultsProps {
  song: Song;
  stars: Stars;
  lang: Lang;
  celebrationSound: boolean;
  onAgain: () => void;
  onOther: () => void;
}

export function Results({ song, stars, lang, celebrationSound, onAgain, onOther }: ResultsProps) {
  useEffect(() => {
    if (celebrationSound) synth.celebrate();
  }, []);
  return (
    <div class="screen results-screen" data-testid="results" data-stars={stars}>
      <div class="confetti" aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <span key={i} class="confetti-piece" style={{
            left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}ms`, '--turn': c.turn,
          } as Record<string, string | number>} />
        ))}
      </div>
      <h1 class="song-title">{song.picture} {song.title}</h1>
      <div class="result-stars" aria-label={`${stars} / 5`}>
        {[1, 2, 3, 4, 5].map(n => (n <= stars
          ? <span key={n} class="result-star" data-testid="star-earned" style={{ animationDelay: `${(n - 1) * STAR_MS}ms` }}>{'⭐'}</span>
          : <span key={n} class="result-star result-star-empty">{'☆'}</span>))}
      </div>
      <div class="results-frog"><Character mood="dance" /></div>
      <div class="results-buttons">
        <button type="button" class="big-button" onClick={onAgain}>
          <span class="big-button-icon">{'🔁'}</span>{t(lang, 'results.again')}
        </button>
        <button type="button" class="big-button" onClick={onOther}>
          <span class="big-button-icon">{'🎵'}</span>{t(lang, 'results.other')}
        </button>
      </div>
    </div>
  );
}
