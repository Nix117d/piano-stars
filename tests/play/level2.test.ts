import { describe, expect, test } from 'vitest';
import { Level2Session, scheduleNotes } from '../../src/play/level2';
import { parseTypedNotes } from '../../src/song/typed-notes';

function seq(text: string) {
  const r = parseTypedNotes(text);
  if (!r.ok) throw new Error('bad test notes');
  return r.notes;
}

const sched = () => scheduleNotes(seq('tempo 60\nC D _ E'), 60, 'normal', 0); // beatMs 1000

describe('level 2', () => {
  test('schedule: count-in then beats, rests take time', () => {
    expect(sched().targets.map(t => t.time)).toEqual([4000, 5000, 7000]);
    expect(sched().targets.map(t => t.index)).toEqual([0, 1, 3]);
    expect(scheduleNotes(seq('C'), 60, 'slow', 0).beatMs).toBeCloseTo(1666.67, 1);
    expect(scheduleNotes(seq('C'), 60, 'medium', 100).targets[0].time).toBeCloseTo(100 + 4 * 1250, 5);
  });
  test('on time, close, wrong, missed', () => {
    const s = new Level2Session(sched());
    expect(s.press(60, 4100)).toEqual({ kind: 'onTime', index: 0 });
    expect(s.press(62, 5250)).toEqual({ kind: 'close', index: 1 });
    expect(s.press(65, 5300)).toEqual({ kind: 'wrong' });
    expect(s.tick(7400)).toEqual([3]);
    expect(s.result()).toEqual({ onTime: 1, close: 1, missed: 1, wrongPresses: 1, total: 3 });
  });
  test('a press outside the close window, or of a judged target, is wrong', () => {
    const s = new Level2Session(sched());
    expect(s.press(60, 3600)).toEqual({ kind: 'wrong' });
    expect(s.press(60, 4000)).toEqual({ kind: 'onTime', index: 0 });
    expect(s.press(60, 4010)).toEqual({ kind: 'wrong' });
  });
  test('a repeated note: a press takes the unjudged target closest in time', () => {
    const s = new Level2Session(scheduleNotes(seq('tempo 240\nC C'), 240, 'normal', 0)); // targets at 1000 and 1250
    // Missed the first C, played the second a little early: that is the second C, on time.
    expect(s.press(60, 1200)).toEqual({ kind: 'onTime', index: 1 });
    expect(s.tick(1301)).toEqual([0]);
    expect(s.result()).toMatchObject({ onTime: 1, close: 0, missed: 1 });
  });
  test('a press takes the first unjudged target of the same pitch when it is the closest', () => {
    const s = new Level2Session(scheduleNotes(seq('tempo 240\nC C'), 240, 'normal', 0)); // beatMs 250: targets at 1000 and 1250
    expect(s.press(60, 1100)).toEqual({ kind: 'onTime', index: 0 });
    expect(s.press(60, 1100)).toEqual({ kind: 'onTime', index: 1 });
  });
  test('a target is missed only after its close window', () => {
    const s = new Level2Session(sched());
    expect(s.tick(4300)).toEqual([]);
    expect(s.tick(4301)).toEqual([0]);
    expect(s.tick(4400)).toEqual([]);
  });
  test('pause and resume shift unjudged targets', () => {
    const s = new Level2Session(sched());
    s.pause(3500); s.resume(5500); // 2 s paused during the count-in
    expect(s.tick(5000)).toEqual([]); // nothing missed while paused
    expect(s.press(60, 6100)).toEqual({ kind: 'onTime', index: 0 }); // target moved 4000 -> 6000
    expect(s.isDone(9000)).toBe(false); // the end moved 7300 -> 9300
    expect(s.isDone(9301)).toBe(true);
  });
  test('a press while paused counts for nothing', () => {
    const s = new Level2Session(sched());
    s.pause(3000);
    expect(s.press(60, 4000)).toEqual({ kind: 'ignored' });
    expect(s.press(61, 4000)).toEqual({ kind: 'ignored' });
    s.resume(3500);
    expect(s.result()).toEqual({ onTime: 0, close: 0, missed: 0, wrongPresses: 0, total: 3 });
  });
  test('isDone after the last target window', () => {
    const s = new Level2Session(sched());
    expect(s.isDone(7300)).toBe(false);
    expect(s.isDone(7301)).toBe(true);
  });
});
