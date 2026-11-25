import { isBlack, midiToName, whiteIndex } from '../song/pitch';
import type { Finger } from '../song/types';
import { keyColor, textOn } from './colors';
import './styles.css';

export interface KeyboardProps {
  low: number;
  high: number;
  glow?: { midi: number; finger?: Finger };
  wobble?: number;
  sparkle?: number;
  middleC?: boolean;
  onTap?: (midi: number) => void;
  /** Change this to replay wobble/sparkle on a key that is already animating. */
  feedbackId?: number;
  /** Finger numbers to show on keys other than the glowing one (the hand placement screen). */
  labels?: Partial<Record<number, Finger>>;
}

export function Keyboard({ low, high, glow, wobble, sparkle, middleC, onTap, feedbackId, labels }: KeyboardProps) {
  const midis: number[] = [];
  for (let m = low; m <= high; m++) midis.push(m);
  const first = whiteIndex(low);
  const whiteCount = midis.filter(m => !isBlack(m)).length || 1;
  const keyW = 100 / whiteCount;

  return (
    <div class="keyboard-scroll">
    <div class="keyboard" style={{ '--white-count': whiteCount } as Record<string, string | number>}>
      {midis.map(m => {
        const black = isBlack(m);
        const color = keyColor(m);
        const isGlow = glow?.midi === m;
        const badge = isGlow ? glow?.finger : labels?.[m];
        // White keys: slot by position among whites. Black keys: centred on the boundary after their lower white.
        const idx = whiteIndex(m) - first;
        const left = black ? (idx + 1) * keyW : idx * keyW;
        const style: Record<string, string> = black
          ? { left: `${left}%`, width: `${keyW * 0.7}%`, '--key-color': color }
          : { left: `${left}%`, width: `${keyW}%`, '--key-color': color };
        return (
          <div
            key={wobble === m || sparkle === m ? `${m}-${feedbackId ?? 0}` : m}
            data-testid={`key-${m}`}
            class={`key ${black ? 'key-black' : 'key-white'}`}
            data-glow={isGlow ? 'true' : undefined}
            data-wobble={wobble === m ? 'true' : undefined}
            data-sparkle={sparkle === m ? 'true' : undefined}
            style={style}
            onPointerDown={() => onTap?.(m)}
          >
            {!black && <span class="key-letter">{midiToName(m).letter}</span>}
            {!black && middleC && m === 60 && <span class="middle-c-marker" data-testid="middle-c-marker" />}
            {sparkle === m && <span class="key-sparkle" data-testid="sparkle">{'\u2605'}</span>}
            {badge !== undefined && <span class="finger-badge" style={{ color: textOn(color) }}>{badge}</span>}
          </div>
        );
      })}
    </div>
    </div>
  );
}
