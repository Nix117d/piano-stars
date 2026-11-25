# Built-in song sources

Every built-in melody was transcribed by hand from the public-domain notation listed here, never
from memory. Only the melody is stored: no lyrics. The exact URL is also in each song's
`melodySource` (`src/songs/builtin/*.ts`).

Conventions used in all songs:

- One beat in the typed format is the notated beat unit: a quarter note in 3/4 and 4/4, an eighth
  in 3/8. For the one 6/8 song, an eighth is half a beat and a dotted quarter is 1.5 beats.
- An upbeat (anacrusis) is written as notes at the start. Each song is one straight run-through
  as printed, with no repeat taken. Für Elise's bars 1-8 sit under a repeat sign in the score (with
  first- and second-time bars), but the built-in stops in bar 2, well before it. Trailing rests at
  the very end are dropped.
- Keys were chosen so the song sits around middle C. All songs pass
  `crossesOnStep(assignFingering(notes)) === []` with the generated fingering, and every hand
  position spans at most 6 white keys (`MAX_POSITION_WIDTH`). No fingers are written into the
  typed text. Every semitone shift from -9 to +9 was also checked, and all of them pass, so the
  key choice doesn't depend on the fingering.
- Tempo is a comfortable child tempo in beats per minute of the beat unit above.

## Built in

| Song | Source (melody) | Bars used | Key and transposition | Beat and tempo |
|---|---|---|---|---|
| Zie, ginds komt de stoomboot | Score image on the nl.wikisource page, [Commons File:Zie_ginds.png](https://commons.wikimedia.org/wiki/File:Zie_ginds.png): a 2004 engraving (CC BY-SA / GFDL) of the traditional tune, which is public domain | All 16 bars, with the quarter-note upbeat | F major as written, C4-C5. Not transposed | 3/4, quarter = 1 beat, tempo 96 |
| Sinterklaas kapoentje | [nl.wikisource "Sinterklaas kapoentje"](https://nl.wikisource.org/wiki/Sinterklaas_kapoentje), first `{{muziek}}` score. The page cites De Navorscher (1851) as the first printing | All 16 bars | C major as written, C4-A4. Not transposed | 3/4, quarter = 1 beat, tempo 100 |
| O, kom er eens kijken | "Zes December" in Katharina Leopold, *Sint Nikolaas, twaalf versjes met melodieën* (Groningen, 1898), the song's first publication, [p. 11 of the Commons scan](https://commons.wikimedia.org/w/index.php?title=File:Kath_Leopold,_Sint_Nikolaas._Twaalf_versjes_met_melodie%C3%ABn_(1898).pdf&page=11) (public domain). Leopold set her words to H.G. Nägeli's "Freut euch des Lebens", so this is the Nägeli tune as the Dutch song first printed it | All 24 bars (the last bar's rests dropped) | Written in D major (D4-D5). Transposed down a whole step to C major, C4-C5 | 6/8, eighth = 0.5 beat, dotted quarter = 1.5, tempo 90 (a dotted quarter at 60 per minute) |
| Sinterklaasje, bonne, bonne, bonne | [nl.wikisource "Sinterklaas kapoentje"](https://nl.wikisource.org/wiki/Sinterklaas_kapoentje), second `{{muziek}}` score (the page gives this song after the first). Oldest source 1851 | All 8 bars | C major as written, C4-A4. Not transposed | 4/4, quarter = 1 beat, tempo 92 |
| Bella Ciao | [Commons File:BellaCiao_Accordion.png](https://commons.wikimedia.org/wiki/File:BellaCiao_Accordion.png), an accordion arrangement released under CC0 of the Italian folk tune (public domain). Only the treble (melody) line is used. The LilyPond source on the file page gives the same notes | The whole verse: the upbeat of three eighths plus 8 bars | D minor (one flat) as written, A3-Bb4. Not transposed | 4/4, quarter = 1 beat, tempo 96 |
| Für Elise | Beethoven, WoO 59, Breitkopf & Härtel *Beethoven's Werke* Serie 25 No. 298, [page 1 of the Commons copy of the IMSLP scan](https://commons.wikimedia.org/w/index.php?title=File:IMSLP51818-PMLP14377-Beethoven_Werke_Breitkopf_Serie_25_No_298_WoO_59_Fuer_Elise.pdf&page=1) (public domain) | The opening theme only: the upbeat and bar 1, ending on the A at the start of bar 2, where the E-D#-E-D#-E-B-D-C phrase comes to rest on the tonic (an eighth, as printed). Right hand only. Cut short of the brief's first 8 bars because the design asks for a short, simplified opening (final review, ruling F4) | A minor as written, A4-E5. Not transposed | 3/8, eighth = 1 beat (a sixteenth = `/`), tempo 80 |

### Notes per song

- **Für Elise, simplification.** Two cuts: the left hand is left out, and the melody stops at
  the first A of bar 2. The right hand in these bars is already a single line, so nothing else
  changes. Earlier versions had bars 1-8. They needed eight hand positions, two of them wider
  than a 5-year-old's hand (C4 to B4), and an octave lift from E4 to E5. The generated fingering
  has no thumb crossing on a step.
- **Sinterklaas kapoentje and Sinterklaasje bonne.** The nl.wikisource notation is a row of note
  glyphs from its `{{muziek}}` template (for example `2g1` = a half note on g', `4c1` = a quarter
  on middle C, `2p…` = dotted half, `8…` = eighth). The note codes were read straight from the
  page's wikitext, and every bar adds up to the time signature.
- **Zie, ginds.** In bars 6, 10 and 14 (counting the upbeat as bar 0), the first two eighths are
  printed with a dashed slur for the second verse. They are kept as two eighths.

### Please listen extra carefully (parent check)

- **O, kom er eens kijken.** This is a scan of an 1898 print, read at about 1900 px wide. All
  notes were legible, but three places deserve a careful listen:
  - Bar 13 (C major: A A C5 A). The two A's (B's in the printed D major) carry a second, lower
    note (a printed two-note chord). Only the upper (melody) note is kept.
  - Bar 12 ends on a low C (D in the print) before the leap up in bar 13. Bar 10, which is
    otherwise the same, ends on G (A in the print). This was checked twice in the scan.
  - The 1898 tune may differ in small details from the version sung today. The transcription
    follows the 1898 print.
- The other five songs come from clean engravings or plain note codes, and no detail was unclear.

## Left out: no credible public-domain notation found

These songs are not built in. The parent can add them from a file or type them in, or they can be
added later if a public-domain score turns up.

- **Hoor wie klopt daar, kind'ren.** The nl.wikisource page ("Hoor, wie stopt daar kind'ren") has
  no notation and names no tune. Its only source is a modern website (kinderliedjes.overtuin.net).
  nl.wikipedia gives 2000 as the oldest source. No public-domain score was found on Wikisource
  or Commons. Delpher refused automated access (HTTP 403), so it could not be searched.
- **De zak van Sinterklaas.** The nl.wikisource page has no notation and names no tune. It cites
  *Een mandje vol amandelen* (1963, not public domain) and a modern website. nl.wikipedia names
  Almoes, *Vroolijk St. Nicolaas-feest* (192x), as the oldest source. A web search found no scan
  of it, and Delpher refused automated access (HTTP 403), so it could not be searched.
- **Dag, Sinterklaasje.** nl.wikisource says that the welcome song in Van Pelt & Boon (1926)
  (text Antoinette van Dijk) is sung to Mendelssohn's "O Winter, schlimmer Winter". It also says "Dag, Sinterklaasje" is a part of that song. Without
  the 1926 songbook, there is no way to tell which part of Mendelssohn's tune these four lines use.
  Mendelssohn also set the poem twice (Op. 57 No. 2 and Op. 88 No. 3). A web search found no scan
  of the 1926 songbook, and Delpher refused automated access (HTTP 403), so it could not be
  searched. Taking a passage from the Mendelssohn would be a guess.
