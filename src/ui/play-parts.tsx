import type { RefObject } from 'preact';
import { useEffect, useLayoutEffect, useState } from 'preact/hooks';
import { isBlack, midiToName } from '../song/pitch';
import './styles.css';

/**
 * The x position (px from the left edge of the stage) of a key's centre in the Keyboard inside
 * `stage`, kept up to date while the keyboard scrolls. With `follow`, the keyboard scrolls so the
 * key stays in view.
 */
export function useKeyX(stage: RefObject<HTMLElement | null>, midi: number | undefined, follow = false): number | null {
  const [x, setX] = useState<number | null>(null);
  useLayoutEffect(() => {
    const root = stage.current;
    const scroller = root?.querySelector<HTMLElement>('.keyboard-scroll');
    if (!root || !scroller || midi === undefined) { setX(null); return; }
    // Keys are re-created to replay feedback, so look the key up each time.
    const centre = () => {
      const key = root.querySelector<HTMLElement>(`[data-testid="key-${midi}"]`);
      if (!key) return null;
      // Black keys are shifted left by half their width, so their left edge is their centre.
      return key.offsetLeft + (isBlack(midi) ? 0 : key.offsetWidth / 2);
    };
    const update = () => {
      const c = centre();
      const offset = scroller.getBoundingClientRect().left - root.getBoundingClientRect().left;
      setX(c === null ? null : offset + c - scroller.scrollLeft);
    };
    const c = centre();
    if (follow && c !== null) {
      const margin = 120;
      const view = scroller.clientWidth;
      if (c < scroller.scrollLeft + margin) scroller.scrollLeft = Math.max(0, c - margin);
      else if (c > scroller.scrollLeft + view - margin) scroller.scrollLeft = c - view + margin;
    }
    update();
    scroller.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      scroller.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [stage, midi, follow]);
  return x;
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
