export interface BuiltinSong {
  id: string;
  title: string;
  picture: string;
  /** The melody in the typed-notes form (see `parseTypedNotes`). */
  typed: string;
  /** Where the public-domain melody comes from. */
  melodySource: string;
}

/** Filled by Task 15. */
export const BUILTIN_SONGS: BuiltinSong[] = [];
