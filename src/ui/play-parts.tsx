import type { RefObject } from 'preact';
import { useEffect, useLayoutEffect, useState } from 'preact/hooks';
import { isBlack, midiToName } from '../song/pitch';
import './styles.css';

interface KeyFinder {
  scroller: HTMLElement;
  /** A key's centre inside the keyboard's scrolling content. */
  centre(midi: number): number | null;
  /** A key's centre in px from the left edge of the stage, as scrolled now. */
  x(midi: number): number | null;
}

/**
 * Runs `onUpdate` with a finder for the keyboard inside `stage` now and whenever it scrolls or the window
 * resizes (with null when there is no keyboard). `onStart` runs once first, before the first update.
 */
function useKeyboardWatch(
  stage: RefObject<HTMLElement | null>,
  deps: unknown[],
  onUpdate: (finder: KeyFinder | null) => void,
  onStart?: (finder: KeyFinder) => void,
) {
  useLayoutEffect(() => {
    const root = stage.current;
    const scroller = root?.querySelector<HTMLElement>('.keyboard-scroll');
    if (!root || !scroller) { onUpdate(null); return; }
    // Keys are re-created to replay feedback, so look the key up each time.
    const centre = (midi: number) => {
      const key = root.querySelector<HTMLElement>(`[data-testid="key-${midi}"]`);
      if (!key) return null;
      // Black keys are shifted left by half their width, so their left edge is their centre.
      return key.offsetLeft + (isBlack(midi) ? 0 : key.offsetWidth / 2);
    };
    const x = (midi: number) => {
      const c = centre(midi);
      if (c === null) return null;
      return scroller.getBoundingClientRect().left - root.getBoundingClientRect().left + c - scroller.scrollLeft;
    };
    const finder = { scroller, centre, x };
    const update = () => onUpdate(finder);
    onStart?.(finder);
    update();
    scroller.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      scroller.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [stage, ...deps]);
}

/**
 * The x position (px from the left edge of the stage) of a key's centre in the Keyboard inside
 * `stage`, kept up to date while the keyboard scrolls. With `follow`, the keyboard scrolls so the
 * key stays in view.
 */
export function useKeyX(stage: RefObject<HTMLElement | null>, midi: number | undefined, follow = false): number | null {
  const [x, setX] = useState<number | null>(null);
  useKeyboardWatch(
    stage,
    [midi, follow],
    f => setX(f && midi !== undefined ? f.x(midi) : null),
    f => {
      const c = midi !== undefined ? f.centre(midi) : null;
      if (!follow || c === null) return;
      const margin = 120;
      const view = f.scroller.clientWidth;
      if (c < f.scroller.scrollLeft + margin) f.scroller.scrollLeft = Math.max(0, c - margin);
      else if (c > f.scroller.scrollLeft + view - margin) f.scroller.scrollLeft = c - view + margin;
    },
  );
  return x;
}

/** The x position of each key's centre (as in `useKeyX`), for several keys at once. */
export function useKeyXs(stage: RefObject<HTMLElement | null>, midis: number[]): Record<number, number> {
  const [xs, setXs] = useState<Record<number, number>>({});
  useKeyboardWatch(stage, [midis.join(',')], f => {
    const next: Record<number, number> = {};
    for (const midi of f ? midis : []) {
      const x = f!.x(midi);
      if (x !== null) next[midi] = x;
    }
    setXs(next);
  });
  return xs;
}

/** "C", "F#": the letter a child sees on the key. */
export function noteLabel(midi: number): string {
  const { letter, sharp } = midiToName(midi);
  return letter + (sharp ? '#' : '');
}

/** A speech-bubble marker pointing down at a key ("Duim op de C"); the bubble stays on screen at the edges. */
export function ThumbMarker({ x, text }: { x: number | null; text: string }) {
  if (x === null) return null;
  return (
    <>
      <div class="thumb-marker" data-testid="thumb-marker" style={{ left: `clamp(130px, ${x}px, calc(100% - 130px))` }}>
        <span aria-hidden="true">{'\u{1F44D}'}</span> <span>{text}</span>
      </div>
      <div class="thumb-marker-arrow" style={{ left: `${x}px` }} />
    </>
  );
}

/** Home needs a second tap within 3 s, so a bump doesn't end the song. */
export function HomeButton({ onHome }: { onHome: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      class="round-button home-button"
      data-testid="home-button"
      data-armed={armed ? 'true' : undefined}
      aria-label="Home"
      onClick={() => (armed ? onHome() : setArmed(true))}
    >
      {'🏠'}
      {armed && <span class="home-ask">?</span>}
    </button>
  );
}
