import type { Speed } from '../store/db';
import type { Note } from '../song/types';
import type { Level2Result } from './scoring';

export const ON_TIME_MS = 150;
export const CLOSE_MS = 300;
export const COUNT_IN_BEATS = 4;
export const SPEED_FACTOR: Record<Speed, number> = { slow: 0.6, medium: 0.8, normal: 1.0 };

/** `index` refers to the original notes array. */
export interface Scheduled {
  index: number;
  midi: number;
  time: number;
}

export interface Schedule {
  targets: Scheduled[];
  beatMs: number;
  /** When the song is over: after the last target's close window. */
  endTime: number;
  /** The press that started the count-in; beat k is at startTime + k * beatMs. */
  startTime: number;
}

/** Times are on the performance.now() clock. Rests take up time but aren't targets. */
export function scheduleNotes(notes: Note[], tempo: number, speed: Speed, startTime: number): Schedule {
  const beatMs = 60000 / (tempo * SPEED_FACTOR[speed]);
  const targets: Scheduled[] = [];
  let at = startTime + COUNT_IN_BEATS * beatMs;
  notes.forEach((n, index) => {
    if (n.midi !== null) targets.push({ index, midi: n.midi, time: at });
    at += n.beats * beatMs;
  });
  const last = targets[targets.length - 1];
  return { targets, beatMs, startTime, endTime: (last ? last.time : startTime + COUNT_IN_BEATS * beatMs) + CLOSE_MS };
}

/** `ignored`: the song is paused, so the press counts for nothing. */
export type PressResult = { kind: 'onTime' | 'close'; index: number } | { kind: 'wrong' } | { kind: 'ignored' };

/** Judges presses against a steady beat. The song never waits; `tick` finds the notes that were missed. */
export class Level2Session {
  readonly beatMs: number;
  private readonly all: Scheduled[];
  private readonly judged = new Set<number>(); // positions in `all`
  private endAt: number;
  private startAt: number;
  private pausedAt: number | null = null;
  private counts = { onTime: 0, close: 0, missed: 0, wrongPresses: 0 };

  constructor(s: Schedule) {
    this.beatMs = s.beatMs;
    this.all = s.targets.map(t => ({ ...t }));
    this.endAt = s.endTime;
    this.startAt = s.startTime;
  }

  get paused(): boolean { return this.pausedAt !== null; }

  /** When beat 0 (the first count-in beat) is, after any pauses. */
  get startTime(): number { return this.startAt; }
  get total(): number { return this.all.length; }
  get judgedCount(): number { return this.judged.size; }

  /** The unjudged targets, earliest first. */
  pending(): Scheduled[] {
    return this.all.filter((_, i) => !this.judged.has(i));
  }

  press(midi: number, time: number): PressResult {
    if (this.pausedAt !== null) return { kind: 'ignored' };
    {
      const i = this.all.findIndex((t, k) => !this.judged.has(k) && t.midi === midi && Math.abs(time - t.time) <= CLOSE_MS);
      if (i >= 0) {
        this.judged.add(i);
        const onTime = Math.abs(time - this.all[i].time) <= ON_TIME_MS;
        this.counts[onTime ? 'onTime' : 'close']++;
        return { kind: onTime ? 'onTime' : 'close', index: this.all[i].index };
      }
    }
    this.counts.wrongPresses++;
    return { kind: 'wrong' };
  }

  /** The indexes (of the notes array) that just became missed. */
  tick(now: number): number[] {
    if (this.pausedAt !== null) return [];
    const missed: number[] = [];
    this.all.forEach((t, i) => {
      if (!this.judged.has(i) && now > t.time + CLOSE_MS) {
        this.judged.add(i);
        this.counts.missed++;
        missed.push(t.index);
      }
    });
    return missed;
  }

  pause(now: number): void {
    this.pausedAt ??= now;
  }

  resume(now: number): void {
    if (this.pausedAt === null) return;
    const gap = Math.max(0, now - this.pausedAt);
    this.pausedAt = null;
    this.all.forEach((t, i) => { if (!this.judged.has(i)) t.time += gap; });
    this.endAt += gap;
    this.startAt += gap;
  }

  isDone(now: number): boolean {
    return this.pausedAt === null && now > this.endAt;
  }

  result(): Level2Result {
    return { ...this.counts, total: this.all.length };
  }
}
