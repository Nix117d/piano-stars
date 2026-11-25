import type { BuiltinSong } from './index';

// Transcribed from the Breitkopf & Härtel Beethoven Werke edition (Serie 25 No. 298) on Commons:
// the right hand's opening theme only, the upbeat and bar 1 up to the A on the downbeat of bar 2,
// where the E-D#-E-D#-E-B-D-C phrase comes to rest on the tonic. A minor, 3/8; one beat here is
// the notated eighth, so a sixteenth is half a beat. Written key (A4-E5). See docs/songs-sources.md.
export const furElise: BuiltinSong = {
  id: 'fur-elise',
  title: 'Für Elise',
  picture: '🎹',
  typed: `tempo 80
E5/ D#5/ | E5/ D#5/ E5/ B/ D5/ C5/ | A`,
  melodySource: 'https://commons.wikimedia.org/w/index.php?title=File:IMSLP51818-PMLP14377-Beethoven_Werke_Breitkopf_Serie_25_No_298_WoO_59_Fuer_Elise.pdf&page=1',
};
