import type { BuiltinSong } from './index';

// Transcribed from the Breitkopf & Härtel Beethoven Werke edition (Serie 25 No. 298) on Commons:
// the right hand of bars 1-8 with the upbeat, ending on the first-time bar. A minor, 3/8; one
// beat here is the notated eighth, so a sixteenth is half a beat. Written key (C4-E5).
// See docs/songs-sources.md.
export const furElise: BuiltinSong = {
  id: 'fur-elise',
  title: 'Für Elise',
  picture: '🎹',
  typed: `tempo 80
E5/ D#5/ | E5/ D#5/ E5/ B/ D5/ C5/ | A _/ C/ E/ A/ | B _/ E/ G#/ B/ | C5 _/ E/ E5/ D#5/ |
E5/ D#5/ E5/ B/ D5/ C5/ | A _/ C/ E/ A/ | B _/ E/ C5/ B/ | A-`,
  melodySource: 'https://commons.wikimedia.org/w/index.php?title=File:IMSLP51818-PMLP14377-Beethoven_Werke_Breitkopf_Serie_25_No_298_WoO_59_Fuer_Elise.pdf&page=1',
};
