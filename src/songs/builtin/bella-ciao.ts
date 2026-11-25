import type { BuiltinSong } from './index';

// Transcribed from the CC0 score on Commons (File:BellaCiao_Accordion.png), the treble line:
// D minor, 4/4, an upbeat of three eighths, one verse. Kept in the written key (A3-Bb4).
// See docs/songs-sources.md.
export const bellaCiao: BuiltinSong = {
  id: 'bella-ciao',
  title: 'Bella Ciao',
  picture: '🌸',
  typed: `tempo 96
A3/ D/ E/ | F/ D- A3/ D/ E/ | F/ D- A3/ D/ E/ | F E/ D/ F E/ D/ |
A A A/ A/ G/ A/ | Bb/ Bb- Bb/ A/ G/ | Bb/ A- A/ G/ F/ | E A F E | D---`,
  melodySource: 'https://commons.wikimedia.org/wiki/File:BellaCiao_Accordion.png',
};
