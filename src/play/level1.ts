import type { Note } from '../song/types';

export type PressResult = 'correct' | 'wrong' | 'ignored';

/** Wait-for-the-right-key play: the song only moves on when the exact key is pressed. */
export class Level1Session {
  private readonly targets: { index: number; note: Note }[];
  private position = 0;
  private mistakeOnTarget = false;
  private mistakeCount = 0;

  constructor(notes: Note[]) {
    this.targets = [];
    notes.forEach((note, index) => {
      if (note.midi !== null) this.targets.push({ index, note });
    });
  }

  get mistakes(): number {
    return this.mistakeCount;
  }

  get total(): number {
    return this.targets.length;
  }

  current(): { index: number; note: Note } | null {
    return this.targets[this.position] ?? null;
  }

  press(midi: number): PressResult {
    const target = this.current();
    if (!target) return 'ignored';
    if (midi === target.note.midi) {
      this.position++;
      this.mistakeOnTarget = false;
      return 'correct';
    }
    if (!this.mistakeOnTarget) {
      this.mistakeOnTarget = true;
      this.mistakeCount++;
    }
    return 'wrong';
  }

  progress(): { done: number; total: number } {
    return { done: this.position, total: this.total };
  }

  isDone(): boolean {
    return this.position >= this.targets.length;
  }
}
