import type { BuiltinSong } from './index';

// Transcribed from the score image on nl.wikisource (Commons File:Zie_ginds.png): F major, 3/4,
// one-beat upbeat. Kept in the written key (C4-C5). See docs/songs-sources.md.
export const zieGinds: BuiltinSong = {
  id: 'zie-ginds',
  title: 'Zie, ginds komt de stoomboot',
  picture: '🚢',
  typed: `tempo 96
C | F F A | G G Bb | E E G | F- C |
F F A | G/ G/ G Bb | E E G | F- C5 |
G G C5 | A/ A/ A C5 | Bb Bb A | G- C |
F F/ G/ A/ Bb/ | C5/ C5/ A F | Bb G E | F-`,
  melodySource: 'https://commons.wikimedia.org/wiki/File:Zie_ginds.png',
};
