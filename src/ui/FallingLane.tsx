import { useEffect, useRef, useState } from 'preact/hooks';
import type { Level2Session } from '../play/level2';
import { keyColor, textOn } from './colors';
import { noteLabel, useKeyXs } from './play-parts';

/** The bubble's bottom edge touches the line when its time comes. */
const BUBBLE_H = 52;
export const LANE_H = 150;
/** Each bubble starts to fall this many beats before its time. */
const LEAD_BEATS = 2;

export interface FallingLaneProps {
  session: Level2Session;
  stage: { current: HTMLElement | null };
  fingers: Record<number, number | undefined>;
  /** While true the drawing stands still. */
  paused: boolean;
}

/** Bubbles (letter and finger) fall to their key's x position and touch the "play now" line at their time. */
export function FallingLane({ session, stage, fingers, paused }: FallingLaneProps) {
  const [now, setNow] = useState(() => performance.now());
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  useEffect(() => {
    let raf = requestAnimationFrame(function frame() {
      if (!pausedRef.current) setNow(performance.now());
      raf = requestAnimationFrame(frame);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const pending = session.pending();
  const xs = useKeyXs(stage, [...new Set(pending.map(t => t.midi))]);
  const lead = LEAD_BEATS * session.beatMs;
  return (
    <div class="falling-lane" data-testid="falling-lane">
      {pending.filter(t => t.time - now <= lead && xs[t.midi] !== undefined).map(t => {
        const color = keyColor(t.midi);
        const fall = 1 - (t.time - now) / lead; // 0 at the top, 1 at the line
        const y = fall * (LANE_H - BUBBLE_H);
        return (
          <span key={t.index} class="bubble" data-testid="falling-bubble"
            style={{ left: `${xs[t.midi]}px`, transform: `translate(-50%, ${y}px)`, background: color, color: textOn(color) }}>
            {noteLabel(t.midi)}{fingers[t.index] !== undefined ? `·${fingers[t.index]}` : ''}
          </span>
        );
      })}
      <div class="play-now-line" />
    </div>
  );
}
