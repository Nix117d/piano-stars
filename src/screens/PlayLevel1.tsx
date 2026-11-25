import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { synth } from '../audio/synth';
import { handPositions } from '../fingering/positions';
import { t } from '../i18n';
import type { NoteSource } from '../midi/note-source';
import type { Level1Session } from '../play/level1';
import type { Song } from '../song/types';
import type { Lang } from '../store/db';
import { Character } from '../ui/Character';
import { Hand } from '../ui/Hand';
import { Keyboard } from '../ui/Keyboard';
import { KeyStrip } from '../ui/KeyStrip';
import { keyColor, textOn } from '../ui/colors';
import { HomeButton, noteLabel, ThumbMarker, useKeyX } from '../ui/play-parts';
import { visibleRange } from '../ui/range';

/** How long the new thumb marker shows after a hand move before the glow moves on. */
const HAND_MOVE_MS = 800;
/** Time for the last sparkle before the results screen. */
const FINISH_MS = 400;
const NEXT_UP = 4;

export interface PlayLevel1Props {
  song: Song;
  session: Level1Session;
  source: NoteSource;
  lang: Lang;
  paused: boolean;
  tapMode: boolean;
  onDone: () => void;
  onHome: () => void;
}

type Feedback = { kind: 'sparkle' | 'wobble'; midi: number; id: number };

export function PlayLevel1({ song, session, source, lang, paused, tapMode, onDone, onHome }: PlayLevel1Props) {
  const range = useMemo(() => visibleRange(song.notes.flatMap(n => n.midi ?? [])), [song]);
  const positions = useMemo(() => handPositions(song.notes), [song]);
  const pitched = useMemo(() => song.notes.flatMap((n, i) => (n.midi === null ? [] : [i])), [song]);
  const posAt = (index: number) => {
    let p = 0;
    positions.forEach((pos, i) => { if (pos.startIndex <= index) p = i; });
    return p;
  };

  const done = session.progress().done;
  const previous = done > 0 ? pitched[done - 1] : undefined;
  // The sparkle from the press that started (or resumed) the song.
  const [feedback, setFeedback] = useState<Feedback | undefined>(() =>
    previous === undefined ? undefined : { kind: 'sparkle', midi: song.notes[previous].midi!, id: 1 });
  // The hand position the glow has caught up with; when the current note is in another one, the hand moves first.
  const [settledPos, setSettledPos] = useState(() => posAt(previous ?? pitched[0] ?? 0));

  const current = session.current();
  const currentPos = current ? posAt(current.index) : settledPos;
  const moving = currentPos !== settledPos;
  useEffect(() => {
    if (!moving) return;
    const timer = setTimeout(() => setSettledPos(currentPos), HAND_MOVE_MS);
    return () => clearTimeout(timer);
  }, [moving, currentPos]);

  const finishTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    // A one-note song is already finished by the press on the hand screen.
    if (session.isDone()) finishTimer.current = setTimeout(onDone, FINISH_MS);
    return () => clearTimeout(finishTimer.current);
  }, []);

  const handle = (midi: number) => {
    // Presses while the hand moves to a new position don't count: no mistake, no wobble.
    if (paused || moving || session.isDone()) return;
    const result = session.press(midi);
    if (result === 'ignored') return;
    setFeedback(f => ({ kind: result === 'correct' ? 'sparkle' : 'wobble', midi, id: (f?.id ?? 0) + 1 }));
    if (session.isDone()) finishTimer.current = setTimeout(onDone, FINISH_MS);
  };
  const handleRef = useRef(handle);
  handleRef.current = handle;
  useEffect(() => source.onNoteOn(e => handleRef.current(e.midi)), [source]);

  const note = current?.note;
  const glowMidi = note && !moving ? note.midi ?? undefined : undefined;
  const fingerKeys = positions[currentPos]?.fingerKeys ?? {};
  const stage = useRef<HTMLDivElement>(null);
  // The frog sits on the glowing key (kept in view); while the hand moves it waits on the last key played.
  const frogX = useKeyX(stage, glowMidi ?? (previous === undefined ? undefined : song.notes[previous].midi ?? undefined), !moving);
  const thumbX = useKeyX(stage, moving ? fingerKeys[1] : undefined, true);
  const handLowX = useKeyX(stage, fingerKeys[1]);
  const handHighX = useKeyX(stage, fingerKeys[5]);
  const handX = handLowX !== null && handHighX !== null ? (handLowX + handHighX) / 2 : null;
  const next = current ? pitched.filter(i => i > current.index).slice(0, NEXT_UP).map(i => song.notes[i]) : [];
  const { total } = session.progress();

  return (
    <div class="screen play-screen" data-testid="play-screen">
      <header class="top-bar">
        <span class="round-spacer" />
        <h1 class="song-title">{song.picture} {song.title}</h1>
        <div class="progress" data-testid="progress">
          {Array.from({ length: total }, (_, i) => <span key={i} class="progress-dot" data-done={i < done ? 'true' : undefined} />)}
        </div>
        <HomeButton onHome={onHome} />
      </header>
      <div class="next-up">
        <span class="next-label">{t(lang, 'play.next')}</span>
        {next.map((n, i) => {
          const color = keyColor(n.midi!);
          return (
            <span key={`${done}-${i}`} class="bubble" data-testid="next-bubble" style={{ background: color, color: textOn(color) }}>
              {noteLabel(n.midi!)}{n.finger !== undefined ? `·${n.finger}` : ''}
            </span>
          );
        })}
      </div>
      <div class="stage" ref={stage}>
        <div class="hand-row">
          {handX !== null && (
            <div class="hand-holder" style={{ left: `${handX}px` }}>
              <Hand highlight={moving ? undefined : note?.finger} color={note?.midi != null ? keyColor(note.midi) : undefined} />
            </div>
          )}
        </div>
        <div class="marker-row">
          {moving && fingerKeys[1] !== undefined && (
            <ThumbMarker x={thumbX} text={t(lang, 'hand.thumbOn', { note: noteLabel(fingerKeys[1]) })} />
          )}
          {frogX !== null && (
            <div class="character-holder" style={{ left: `${frogX}px` }}>
              <Character mood={feedback?.kind === 'wobble' ? 'shake' : feedback ? 'hop' : 'idle'} moodId={feedback?.id} />
            </div>
          )}
        </div>
        <div class="keyboard-area">
          <Keyboard
            low={range.low}
            high={range.high}
            glow={glowMidi !== undefined ? { midi: glowMidi, finger: note?.finger } : undefined}
            sparkle={feedback?.kind === 'sparkle' ? feedback.midi : undefined}
            wobble={feedback?.kind === 'wobble' ? feedback.midi : undefined}
            feedbackId={feedback?.id}
            middleC
            onTap={tapMode ? m => { synth.playNote(m, 500); handle(m); } : undefined}
          />
        </div>
        <KeyStrip low={range.low} high={range.high} />
      </div>
    </div>
  );
}
