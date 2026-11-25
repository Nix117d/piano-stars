import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { handPositions } from '../fingering/positions';
import { t } from '../i18n';
import type { NoteSource } from '../midi/note-source';
import type { Level1Session } from '../play/level1';
import type { Finger, Song } from '../song/types';
import type { Lang } from '../store/db';
import { Hand } from '../ui/Hand';
import { Keyboard } from '../ui/Keyboard';
import { KeyStrip } from '../ui/KeyStrip';
import { keyColor } from '../ui/colors';
import { noteLabel, ThumbMarker, useKeyX } from '../ui/play-parts';
import { visibleRange } from '../ui/range';
import { synth } from '../audio/synth';

export interface HandPlacementProps {
  song: Song;
  session: Level1Session;
  source: NoteSource;
  lang: Lang;
  paused: boolean;
  tapMode: boolean;
  /** Called once the first note's key was pressed; the session already counted it. */
  onStart: () => void;
  onHome: () => void;
}

/** Shows where the hand goes for the first notes; pressing the first note's key starts the song. */
export function HandPlacement({ song, session, source, lang, paused, tapMode, onStart, onHome }: HandPlacementProps) {
  const range = useMemo(() => visibleRange(song.notes.flatMap(n => n.midi ?? [])), [song]);
  const fingerKeys = useMemo(() => handPositions(song.notes)[0]?.fingerKeys ?? {}, [song]);
  const first = session.current()?.note;
  const [wobble, setWobble] = useState<{ midi: number; id: number }>();
  const stage = useRef<HTMLDivElement>(null);
  const thumb = fingerKeys[1];
  const thumbX = useKeyX(stage, thumb, true);
  const pinkyX = useKeyX(stage, fingerKeys[5]);

  const labels: Partial<Record<number, Finger>> = {};
  for (const [finger, midi] of Object.entries(fingerKeys)) labels[midi] = Number(finger) as Finger;

  const handle = (midi: number) => {
    if (paused || !first) return;
    if (midi === first.midi) {
      session.press(midi);
      onStart();
    } else {
      setWobble(w => ({ midi, id: (w?.id ?? 0) + 1 }));
    }
  };
  const handleRef = useRef(handle);
  handleRef.current = handle;
  useEffect(() => source.onNoteOn(e => handleRef.current(e.midi)), [source]);

  const handX = thumbX !== null && pinkyX !== null ? (thumbX + pinkyX) / 2 : null;
  return (
    <div class="screen play-screen" data-testid="hand-screen">
      <header class="top-bar">
        <button type="button" class="round-button" aria-label="Back" onClick={onHome}>{'🏠'}</button>
        <h1 class="song-title">{song.picture} {t(lang, 'hand.title')}</h1>
        <span class="round-spacer" />
      </header>
      <div class="stage" ref={stage}>
        <div class="hand-row">
          {handX !== null && (
            <div class="hand-holder" style={{ left: `${handX}px` }}>
              <Hand highlight={first?.finger} color={first?.midi != null ? keyColor(first.midi) : undefined} />
            </div>
          )}
        </div>
        <div class="marker-row">
          {thumb !== undefined && <ThumbMarker x={thumbX} text={t(lang, 'hand.thumbOn', { note: noteLabel(thumb) })} />}
        </div>
        <div class="keyboard-area">
          <Keyboard
            low={range.low}
            high={range.high}
            glow={first?.midi != null ? { midi: first.midi, finger: first.finger } : undefined}
            labels={labels}
            wobble={wobble?.midi}
            feedbackId={wobble?.id}
            middleC
            onTap={tapMode ? m => { synth.playNote(m, 500); handle(m); } : undefined}
          />
        </div>
        <KeyStrip low={range.low} high={range.high} />
      </div>
    </div>
  );
}
