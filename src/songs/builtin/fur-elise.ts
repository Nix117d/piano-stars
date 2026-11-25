import type { BuiltinSong } from './index';

// Transcribed from the Breitkopf & Härtel Beethoven Werke edition (Serie 25 No. 298) on Commons:
// the right hand of the whole opening A section, bars 1-22. The upbeat and bars 1-8 with the repeat
// taken (first-time bar, then bars 1-7 again and the second-time bar), then bars 9-22, ending on
// the tonic at the start of bar 22 where the theme comes back to rest. The repeat of bars 9-22 is
// not taken and the B section (bar 23 on) is left out. The right hand is a single line in these
// bars. A minor, 3/8; one beat here is the notated eighth, so a sixteenth is half a beat and a
// dotted eighth is 1.5. Written key (C4-E6). See docs/songs-sources.md.
export const furElise: BuiltinSong = {
  id: 'fur-elise',
  title: 'Für Elise',
  picture: '🎹',
  typed: `tempo 80
E5/ D#5/ | E5/ D#5/ E5/ B/ D5/ C5/ | A _/ C/ E/ A/ | B _/ E/ G#/ B/ | C5 _/ E/ E5/ D#5/ |
E5/ D#5/ E5/ B/ D5/ C5/ | A _/ C/ E/ A/ | B _/ E/ C5/ B/ | A- E5/ D#5/ |
E5/ D#5/ E5/ B/ D5/ C5/ | A _/ C/ E/ A/ | B _/ E/ G#/ B/ | C5 _/ E/ E5/ D#5/ |
E5/ D#5/ E5/ B/ D5/ C5/ | A _/ C/ E/ A/ | B _/ E/ C5/ B/ | A _/ B/ C5/ D5/ |
E5:1.5 G/ F5/ E5/ | D5:1.5 F/ E5/ D5/ | C5:1.5 E/ D5/ C5/ | B _/ E/ E5/ _/ |
_/ E5/ E6/ _/ _/ D#5/ | E5 _/ D#5/ E5/ D#5/ | E5/ D#5/ E5/ B/ D5/ C5/ | A _/ C/ E/ A/ |
B _/ E/ G#/ B/ | C5 _/ E/ E5/ D#5/ | E5/ D#5/ E5/ B/ D5/ C5/ | A _/ C/ E/ A/ |
B _/ E/ C5/ B/ | A`,
  melodySource: 'https://commons.wikimedia.org/w/index.php?title=File:IMSLP51818-PMLP14377-Beethoven_Werke_Breitkopf_Serie_25_No_298_WoO_59_Fuer_Elise.pdf&page=1',
};
