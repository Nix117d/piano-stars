import type { Finger } from '../song/types';
import { textOn } from './colors';
import './styles.css';

// Right hand seen from above: thumb (1) on the left, little finger (5) on the right.
const FINGERS: Record<Finger, { x: number; y: number; w: number; h: number; rot: number }> = {
  1: { x: 22, y: 118, w: 26, h: 70, rot: -50 },
  2: { x: 62, y: 20, w: 24, h: 90, rot: -6 },
  3: { x: 96, y: 8, w: 24, h: 100, rot: 0 },
  4: { x: 130, y: 20, w: 24, h: 90, rot: 6 },
  5: { x: 160, y: 50, w: 22, h: 70, rot: 14 },
};

export function Hand({ highlight, color = '#FDD835' }: { highlight?: Finger; color?: string }) {
  return (
    <svg class="hand" viewBox="0 0 200 240" role="img" aria-label="Right hand">
      <rect x="48" y="100" width="116" height="110" rx="40" fill="#F5D0B0" stroke="#C8956B" stroke-width="3" />
      {([1, 2, 3, 4, 5] as Finger[]).map(n => {
        const f = FINGERS[n];
        const on = highlight === n;
        return (
          <g key={n} data-testid={`finger-${n}`} transform={`rotate(${f.rot} ${f.x + f.w / 2} ${f.y + f.h})`}>
            <rect
              x={f.x} y={f.y} width={f.w} height={f.h} rx={f.w / 2}
              fill={on ? color : '#F5D0B0'} stroke="#C8956B" stroke-width="3"
            />
            <text
              x={f.x + f.w / 2} y={f.y + 24} text-anchor="middle"
              font-size="18" font-weight="700" fill={on ? textOn(color) : '#8A5A35'}
            >{n}</text>
          </g>
        );
      })}
    </svg>
  );
}
