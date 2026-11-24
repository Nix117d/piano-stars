import type { Note } from './types';

export type ImportResult =
  | { ok: true; title?: string; tempo: number; notes: Note[]; hasFingering: boolean; octaveShift: number }
  | { ok: false; reason: 'noNotes' | 'unreadable' };
