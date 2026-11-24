export type Finger = 1 | 2 | 3 | 4 | 5;

/** `midi: null` is a rest. */
export interface Note {
  midi: number | null;
  beats: number;
  finger?: Finger;
}

export type SongSource = 'builtin' | 'file' | 'typed';
export type FingeringSource = 'sheet' | 'rules' | 'parent';

export interface Song {
  id: string;
  title: string;
  source: SongSource;
  tempo: number;
  notes: Note[];
  fingeringSource: FingeringSource;
  melodySource?: string;
  picture: string;
  hidden: boolean;
  createdAt: number;
}
