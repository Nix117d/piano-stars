import type { BuiltinSong } from './index';

// Transcribed from the Breitkopf & Härtel Beethoven Werke edition (Serie 25 No. 298) on Commons:
// the right hand of the whole opening A section, bars 1-22. The upbeat and bars 1-8 with the repeat
// taken (first-time bar, then bars 1-7 again and the second-time bar), then bars 9-22, ending on
// the tonic at the start of bar 22 where the theme comes back to rest. The repeat of bars 9-22 is
// not taken and the B section (bar 23 on) is left out. The right hand is a single line in these
// bars. 3/8; one beat here is the notated eighth, so a sixteenth is half a beat and a dotted
// eighth is 1.5. Written in A minor (C4-E6), transposed down a minor third to F# minor (A3-C#6):
// in A minor the generated fingering put two fingers on one key in bar 2 (both times through)
// and bar 16. The leading tones (B# and E# in F# minor) are typed as C and F.
// See docs/songs-sources.md.
export const furElise: BuiltinSong = {
  id: 'fur-elise',
  title: 'Für Elise',
  picture: '🎹',
  typed: `tempo 80
C#5/ C5/ | C#5/ C5/ C#5/ G#/ B/ A/ | F# _/ A3/ C#/ F#/ | G# _/ C#/ F/ G#/ | A _/ C#/ C#5/ C5/ |
C#5/ C5/ C#5/ G#/ B/ A/ | F# _/ A3/ C#/ F#/ | G# _/ C#/ A/ G#/ | F#- C#5/ C5/ |
C#5/ C5/ C#5/ G#/ B/ A/ | F# _/ A3/ C#/ F#/ | G# _/ C#/ F/ G#/ | A _/ C#/ C#5/ C5/ |
C#5/ C5/ C#5/ G#/ B/ A/ | F# _/ A3/ C#/ F#/ | G# _/ C#/ A/ G#/ | F# _/ G#/ A/ B/ |
C#5:1.5 E/ D5/ C#5/ | B:1.5 D/ C#5/ B/ | A:1.5 C#/ B/ A/ | G# _/ C#/ C#5/ _/ |
_/ C#5/ C#6/ _/ _/ C5/ | C#5 _/ C5/ C#5/ C5/ | C#5/ C5/ C#5/ G#/ B/ A/ | F# _/ A3/ C#/ F#/ |
G# _/ C#/ F/ G#/ | A _/ C#/ C#5/ C5/ | C#5/ C5/ C#5/ G#/ B/ A/ | F# _/ A3/ C#/ F#/ |
G# _/ C#/ A/ G#/ | F#`,
  melodySource: 'https://commons.wikimedia.org/w/index.php?title=File:IMSLP51818-PMLP14377-Beethoven_Werke_Breitkopf_Serie_25_No_298_WoO_59_Fuer_Elise.pdf&page=1',
};
