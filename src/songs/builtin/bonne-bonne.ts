import type { BuiltinSong } from './index';

// Transcribed from the {{muziek}} notation on the nl.wikisource page "Sinterklaas kapoentje"
// (second score): C major, 4/4. Kept in the written key (C4-A4). See docs/songs-sources.md.
export const bonneBonne: BuiltinSong = {
  id: 'bonne-bonne',
  title: 'Sinterklaasje, bonne, bonne, bonne',
  picture: '🍬',
  typed: `tempo 92
G G A A | G/ A/ G/ F/ E C | G G A A | G/ A/ G/ F/ E C |
F F F D | F- F F/ F/ | A G F E | D- C-`,
  melodySource: 'https://nl.wikisource.org/wiki/Sinterklaas_kapoentje',
};
