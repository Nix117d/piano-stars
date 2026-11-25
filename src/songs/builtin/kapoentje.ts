import type { BuiltinSong } from './index';

// Transcribed from the {{muziek}} notation on the nl.wikisource page "Sinterklaas kapoentje"
// (first score): C major, 3/4. Kept in the written key (C4-A4). See docs/songs-sources.md.
export const kapoentje: BuiltinSong = {
  id: 'kapoentje',
  title: 'Sinterklaas kapoentje',
  picture: '🐴',
  typed: `tempo 100
G- G | A- A | G-- | E-- | G- G | A- A | G-- | E-- |
F- F | F- D | F-- | F-- | A- G | F- E | D-- | C--`,
  melodySource: 'https://nl.wikisource.org/wiki/Sinterklaas_kapoentje',
};
