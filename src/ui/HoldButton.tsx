import { useEffect, useRef, useState } from 'preact/hooks';
import './styles.css';

/** Fires `onHold` only after being held down for `ms`; letting go earlier does nothing. */
export function HoldButton({ ms, onHold }: { ms: number; onHold: () => void }) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [holding, setHolding] = useState(false);
  const stop = () => { clearTimeout(timer.current); setHolding(false); };
  const start = () => {
    clearTimeout(timer.current);
    setHolding(true);
    timer.current = setTimeout(() => { setHolding(false); onHold(); }, ms);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      class="hold-button"
      data-testid="hold-button"
      data-holding={holding ? 'true' : undefined}
      style={{ '--hold-ms': `${ms}ms` } as Record<string, string>}
      aria-label="Parent area (hold)"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={e => e.preventDefault()}
    >
      <span class="hold-ring" />
      {'⚙️'}
    </button>
  );
}
