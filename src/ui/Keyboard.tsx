import { isBlack, midiToName, whiteIndex } from '../song/pitch';
import type { Finger } from '../song/types';
import { keyColor } from './colors';
import './styles.css';

export interface KeyboardProps {
  low: number;
  high: number;
  glow?: { midi: number; finger?: Finger };
  wobble?: number;
  sparkle?: number;
  middleC?: boolean;
  onTap?: (midi: number) => void;
}

export function Keyboard({ low, high, glow, wobble, sparkle, middleC, onTap }: KeyboardProps) {
  const midis: number[] = [];
  for (let m = low; m <= high; m++) midis.push(m);
  const first = whiteIndex(low);
  const whiteCount = midis.filter(m => !isBlack(m)).length || 1;
  const keyW = 100 / whiteCount;

  return (
    <div class="keyboard" style={{ '--white-count': whiteCount } as Record<string, string | number>}>
      {midis.map(m => {
        const black = isBlack(m);
        const color = keyColor(m);
        const isGlow = glow?.midi === m;
        // White keys: slot by position among whites. Black keys: centred on the boundary after their lower white.
        const idx = whiteIndex(m) - first;
        const left = black ? (idx + 1) * keyW : idx * keyW;
        const style: Record<string, string> = black
          ? { left: `${left}%`, width: `${keyW * 0.6}%`, '--key-color': color }
          : { left: `${left}%`, width: `${keyW}%`, '--key-color': color };
        return (
          <div
            key={m}
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
            {isGlow && glow?.finger !== undefined && <span class="finger-badge">{glow.finger}</span>}
          </div>
        );
      })}
    </div>
  );
}
