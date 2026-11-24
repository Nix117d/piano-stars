import { isBlack, KEYBOARD_HIGH, KEYBOARD_LOW, whiteIndex } from '../song/pitch';
import './styles.css';

export function KeyStrip({ low, high }: { low: number; high: number }) {
  const midis: number[] = [];
  for (let m = KEYBOARD_LOW; m <= KEYBOARD_HIGH; m++) midis.push(m);
  const base = whiteIndex(KEYBOARD_LOW);
  const total = whiteIndex(KEYBOARD_HIGH) - base + 1;
  const w = 100 / total;
  const rangeLeft = (whiteIndex(low) - base) * w;
  const rangeRight = (whiteIndex(high) - base + 1) * w;
  return (
    <div class="key-strip">
      {midis.map(m => (
        <div
          key={m}
          data-testid={`strip-key-${m}`}
          class={`strip-key ${isBlack(m) ? 'strip-black' : 'strip-white'}`}
          style={isBlack(m)
            ? { left: `${(whiteIndex(m) - base + 1) * w}%` }
            : { left: `${(whiteIndex(m) - base) * w}%`, width: `${w}%` }}
        />
      ))}
      <div
        class="strip-range"
        data-testid="strip-range"
        style={{ left: `${rangeLeft}%`, width: `${rangeRight - rangeLeft}%` }}
      />
    </div>
  );
}
