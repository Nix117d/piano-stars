import type { BuiltinSong } from './index';

// Transcribed from "Zes December" in Katharina Leopold, Sint Nikolaas (1898), p. 11 of the
// Commons scan: Nägeli's "Freut euch des Lebens" tune in D major, 6/8. Written here with an eighth
// = half a beat and a dotted quarter = 1.5 beats; transposed down a whole step to C major
// (C4-C5). See docs/songs-sources.md.
export const komEensKijken: BuiltinSong = {
  id: 'kom-eens-kijken',
  title: 'O, kom er eens kijken',
  picture: '👀',
  typed: `tempo 90
E:1.5 F/ E/ F/ | G:1.5 C5 _/ | C:1.5 D/ C/ D/ | E/ F/ E/ D _/ |
E:1.5 F/ E/ F/ | G:1.5 C5 _/ | C C/ D/ E/ D/ | C:1.5 _ G/ |
G F/ D/ E/ F/ | G E/ C G/ | G F/ D/ E/ F/ | G E/ C C/ |
A A/ C5 A/ | G E/ C5 G/ | G/ A/ G/ G/ F/ E/ | E:1.5 D _/ |
E:1.5 F/ E/ F/ | G:1.5 C5 _/ | C:1.5 D/ C/ D/ | E/ F/ E/ D _/ |
E:1.5 F/ E/ F/ | G:1.5 C5 _/ | C C/ D/ E/ D/ | C:1.5`,
  melodySource: 'https://commons.wikimedia.org/w/index.php?title=File:Kath_Leopold,_Sint_Nikolaas._Twaalf_versjes_met_melodie%C3%ABn_(1898).pdf&page=11',
};
