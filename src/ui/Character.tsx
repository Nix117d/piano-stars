import './styles.css';

export type Mood = 'idle' | 'hop' | 'shake' | 'dance';

/**
 * Kiki the frog, an original character. `mood` picks a short animation; change `moodId` to replay
 * the same one (two correct notes in a row both hop).
 */
export function Character({ mood = 'idle', moodId = 0 }: { mood?: Mood; moodId?: number }) {
  return (
    <span class="character" data-testid="character" data-mood={mood}>
    <svg key={`${mood}-${moodId}`} viewBox="0 0 120 110" role="img" aria-label="Frog">
      <g class="character-body">
        <ellipse cx="34" cy="100" rx="14" ry="7" fill="#4CAF50" />
        <ellipse cx="86" cy="100" rx="14" ry="7" fill="#4CAF50" />
        <ellipse cx="60" cy="72" rx="46" ry="32" fill="#6BCB77" stroke="#3E9B4F" stroke-width="3" />
        <ellipse cx="60" cy="82" rx="28" ry="17" fill="#C9F2C7" />
        <circle cx="36" cy="38" r="17" fill="#6BCB77" stroke="#3E9B4F" stroke-width="3" />
        <circle cx="84" cy="38" r="17" fill="#6BCB77" stroke="#3E9B4F" stroke-width="3" />
        <circle cx="36" cy="38" r="11" fill="#fff" />
        <circle cx="84" cy="38" r="11" fill="#fff" />
        <circle cx="38" cy="40" r="5.5" fill="#1a1a1a" />
        <circle cx="86" cy="40" r="5.5" fill="#1a1a1a" />
        <circle cx="40" cy="37" r="2" fill="#fff" />
        <circle cx="88" cy="37" r="2" fill="#fff" />
        <ellipse cx="30" cy="70" rx="7" ry="4.5" fill="#FF9AA2" opacity="0.85" />
        <ellipse cx="90" cy="70" rx="7" ry="4.5" fill="#FF9AA2" opacity="0.85" />
        <path d="M44 66 Q60 80 76 66" fill="none" stroke="#2E7D32" stroke-width="4" stroke-linecap="round" />
      </g>
    </svg>
    </span>
  );
}
