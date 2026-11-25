import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { synth } from '../audio/synth';
import { handPositions } from '../fingering/positions';
import { t } from '../i18n';
import type { NoteSource } from '../midi/note-source';
import { COUNT_IN_BEATS, Level2Session, scheduleNotes } from '../play/level2';
import type { Level2Result } from '../play/scoring';
import type { Song } from '../song/types';
import type { Lang, Speed } from '../store/db';
import { Character } from '../ui/Character';
import { FallingLane } from '../ui/FallingLane';
import { Hand } from '../ui/Hand';
import { Keyboard } from '../ui/Keyboard';
import { KeyStrip } from '../ui/KeyStrip';
import { keyColor } from '../ui/colors';
import { HomeButton, noteLabel, ThumbMarker, useKeyX } from '../ui/play-parts';
import { visibleRange } from '../ui/range';

/** How long the thumb marker flashes when the hand moves to a new position. */
const MARKER_MS = 800;

export interface PlayLevel2Props {
  song: Song;
  /** The press on the hand screen that started the count-in (performance.now() clock). */
  startTime: number;
  speed: Speed;
  metronome: boolean;
  source: NoteSource;
  lang: Lang;
  paused: boolean;
  tapMode: boolean;
  onDone: (result: Level2Result) => void;
  onHome: () => void;
}

type Feedback = { kind: 'sparkle' | 'wobble'; size: 'big' | 'small'; midi: number; id: number };

export function PlayLevel2({ song, startTime, speed, metronome, source, lang, paused, tapMode, onDone, onHome }: PlayLevel2Props) {
  const range = useMemo(() => visibleRange(song.notes.flatMap(n => n.midi ?? [])), [song]);
  const positions = useMemo(() => handPositions(song.notes), [song]);
  const session = useMemo(() => new Level2Session(scheduleNotes(song.notes, song.tempo, speed, startTime)), [song, speed, startTime]);
  const posAt = (index: number) => positions.reduce((p, pos, i) => (pos.startIndex <= index ? i : p), 0);

  const [feedback, setFeedback] = useState<Feedback>();
  const [beat, setBeat] = useState(-1);
  const [marker, setMarker] = useState(false);
  const lastBeat = useRef(-1);
  const finished = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const react = (kind: Feedback['kind'], size: Feedback['size'], midi: number) =>
    setFeedback(f => ({ kind, size, midi, id: (f?.id ?? 0) + 1 }));

  // The session follows `paused` here (not in an effect, which could run a frame late), so what the loop
  // and the presses see always agrees with it.
  const syncPause = (now: number) => {
    if (pausedRef.current === session.paused) return;
    if (pausedRef.current) { session.pause(now); return; }
    session.resume(now);
  };

  // One loop for the beat (dots and click), the misses and the end. The drawing of the bubbles is in FallingLane.
  const midiAt = (index: number) => song.notes[index].midi!;
  useEffect(() => {
    let raf = requestAnimationFrame(function frame() {
      const now = performance.now();
      syncPause(now);
      if (!pausedRef.current && !finished.current) {
        const k = Math.floor((now - session.startTime) / session.beatMs);
        if (k > lastBeat.current && k >= 0) {
          lastBeat.current = k;
          setBeat(k);
          if (metronome) synth.click();
        }
        const missed = session.tick(now);
        if (missed.length) react('wobble', 'big', midiAt(missed[missed.length - 1]));
        if (session.isDone(now)) {
          finished.current = true;
          onDone(session.result());
        }
      }
      raf = requestAnimationFrame(frame);
    });
    return () => cancelAnimationFrame(raf);
  }, [session, metronome]);

  const handle = (midi: number, time: number) => {
    if (paused || finished.current) return;
    syncPause(performance.now());
    const r = session.press(midi, time);
    if (r.kind === 'ignored') return;
    if (r.kind === 'wrong') react('wobble', 'big', midi);
    else react('sparkle', r.kind === 'onTime' ? 'big' : 'small', midi);
  };
  const handleRef = useRef(handle);
  handleRef.current = handle;
  useEffect(() => source.onNoteOn(e => handleRef.current(e.midi, e.time)), [source]);

  const next = session.pending()[0];
  const note = next ? song.notes[next.index] : undefined;
  const nextPos = next ? posAt(next.index) : 0;
  const lastPos = useRef(nextPos);
  useEffect(() => {
    if (lastPos.current === nextPos) return;
    lastPos.current = nextPos;
    setMarker(true);
    const timer = setTimeout(() => setMarker(false), MARKER_MS);
    return () => clearTimeout(timer);
  }, [nextPos]);

  const fingerKeys = positions[nextPos]?.fingerKeys ?? {};
  const fingers = useMemo(() => Object.fromEntries(song.notes.map((n, i) => [i, n.finger])), [song]);
  const stage = useRef<HTMLDivElement>(null);
  useKeyX(stage, next?.midi, true); // keeps the next key in view
  const frogX = useKeyX(stage, feedback?.midi ?? next?.midi);
  const thumbX = useKeyX(stage, marker ? fingerKeys[1] : undefined);
  const handLowX = useKeyX(stage, fingerKeys[1]);
  const handHighX = useKeyX(stage, fingerKeys[5]);
  const handX = handLowX !== null && handHighX !== null ? (handLowX + handHighX) / 2 : null;
  const inCount = beat < COUNT_IN_BEATS;

  return (
    <div class="screen play-screen" data-testid="play2-screen">
      <header class="top-bar">
        <span class="round-spacer" />
        <h1 class="song-title">{song.picture} {song.title}</h1>
        {inCount ? (
          <div class="count-in" data-testid="count-in">
            {Array.from({ length: COUNT_IN_BEATS }, (_, i) => <span key={i} class="count-dot" data-filled={i <= beat ? 'true' : undefined} />)}
          </div>
        ) : (
          <div class="progress" data-testid="progress">
            {Array.from({ length: session.total }, (_, i) => <span key={i} class="progress-dot" data-done={i < session.judgedCount ? 'true' : undefined} />)}
          </div>
        )}
        <HomeButton onHome={onHome} />
      </header>
      <div class="stage" ref={stage}>
        <div class="hand-row">
          {handX !== null && (
            <div class="hand-holder" style={{ left: `${handX}px` }}>
              <Hand highlight={note?.finger} color={next ? keyColor(next.midi) : undefined} />
            </div>
          )}
        </div>
        <div class="marker-row">
          {marker && fingerKeys[1] !== undefined && (
            <ThumbMarker x={thumbX} text={t(lang, 'hand.thumbOn', { note: noteLabel(fingerKeys[1]) })} />
          )}
          {frogX !== null && (
            <div class="character-holder" style={{ left: `${frogX}px` }}>
              <Character mood={inCount ? 'hop' : feedback?.kind === 'wobble' ? 'shake' : feedback ? 'hop' : 'idle'} moodId={inCount ? beat : feedback?.id} />
            </div>
          )}
        </div>
        <FallingLane session={session} stage={stage} fingers={fingers} paused={paused} />
        <div class="keyboard-area">
          <Keyboard
            low={range.low}
            high={range.high}
            glow={next ? { midi: next.midi, finger: note?.finger } : undefined}
            sparkle={feedback?.kind === 'sparkle' ? feedback.midi : undefined}
            sparkleSize={feedback?.size}
            wobble={feedback?.kind === 'wobble' ? feedback.midi : undefined}
            feedbackId={feedback?.id}
            middleC
            onTap={tapMode ? m => { synth.playNote(m, 500); handle(m, performance.now()); } : undefined}
          />
        </div>
        <KeyStrip low={range.low} high={range.high} />
      </div>
    </div>
  );
}
