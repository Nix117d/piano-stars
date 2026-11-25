import { bellaCiao } from './bella-ciao';
import { bonneBonne } from './bonne-bonne';
import { furElise } from './fur-elise';
import { kapoentje } from './kapoentje';
import { komEensKijken } from './kom-eens-kijken';
import { zieGinds } from './zie-ginds';

export interface BuiltinSong {
  id: string;
  title: string;
  picture: string;
  /** The melody in the typed-notes form (see `parseTypedNotes`). */
  typed: string;
  /** Where the public-domain melody comes from. */
  melodySource: string;
}

/**
 * Melodies transcribed from public-domain notation; sources per song in docs/songs-sources.md.
 * "Hoor wie klopt daar, kind'ren", "De zak van Sinterklaas" and "Dag, Sinterklaasje" are left out
 * until a credible public-domain score is found (see that file).
 */
export const BUILTIN_SONGS: BuiltinSong[] = [
  zieGinds,
  kapoentje,
  komEensKijken,
  bonneBonne,
  bellaCiao,
  furElise,
];
