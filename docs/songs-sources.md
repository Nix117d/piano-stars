# Built-in song sources

Every built-in melody was transcribed by hand from the public-domain notation listed here, never
from memory. Only the melody is stored: no lyrics. The exact URL is also in each song's
`melodySource` (`src/songs/builtin/*.ts`).

Conventions used in all songs:

- One beat in the typed format is the notated beat unit: a quarter note in 3/4 and 4/4, an eighth
  in 3/8. For the one 6/8 song, an eighth is half a beat and a dotted quarter is 1.5 beats.
- An upbeat (anacrusis) is written as notes at the start. Each song is one straight run-through
  as printed, with no repeat taken, except Für Elise: its bars 1-8 sit under a repeat sign with
  first- and second-time bars, and that repeat is written out (bars 1-8 with the first-time bar,
  then bars 1-7 again with the second-time bar). Trailing rests at the very end are dropped.
- Keys were chosen so the song sits around middle C. All songs pass
  `crossesOnStep(assignFingering(notes)) === []` with the generated fingering, and every hand
  position spans at most 6 white keys (`MAX_POSITION_WIDTH`). No fingers are written into the
  typed text. Every semitone shift from -9 to +9 was also checked, and all of them pass, so the
  key choice doesn't depend on the fingering. (Für Elise shifted up 9 would reach C#7, one key
  above the keyboard's top C7, though its fingering would still pass.)
- Tempo is a comfortable child tempo in beats per minute of the beat unit above.

## Built in

| Song | Source (melody) | Bars used | Key and transposition | Beat and tempo |
|---|---|---|---|---|
| Zie, ginds komt de stoomboot | Score image on the nl.wikisource page, [Commons File:Zie_ginds.png](https://commons.wikimedia.org/wiki/File:Zie_ginds.png): a 2004 engraving (CC BY-SA / GFDL) of the traditional tune, which is public domain | All 16 bars, with the quarter-note upbeat | F major as written, C4-C5. Not transposed | 3/4, quarter = 1 beat, tempo 96 |
| Sinterklaas kapoentje | [nl.wikisource "Sinterklaas kapoentje"](https://nl.wikisource.org/wiki/Sinterklaas_kapoentje), first `{{muziek}}` score. The page cites De Navorscher (1851) as the first printing | All 16 bars | C major as written, C4-A4. Not transposed | 3/4, quarter = 1 beat, tempo 100 |
| O, kom er eens kijken | "Zes December" in Katharina Leopold, *Sint Nikolaas, twaalf versjes met melodieën* (Groningen, 1898), the song's first publication, [p. 11 of the Commons scan](https://commons.wikimedia.org/w/index.php?title=File:Kath_Leopold,_Sint_Nikolaas._Twaalf_versjes_met_melodie%C3%ABn_(1898).pdf&page=11) (public domain). Leopold set her words to H.G. Nägeli's "Freut euch des Lebens", so this is the Nägeli tune as the Dutch song first printed it | All 24 bars (the last bar's rests dropped) | Written in D major (D4-D5). Transposed down a whole step to C major, C4-C5 | 6/8, eighth = 0.5 beat, dotted quarter = 1.5, tempo 90 (a dotted quarter at 60 per minute) |
| Sinterklaasje, bonne, bonne, bonne | [nl.wikisource "Sinterklaas kapoentje"](https://nl.wikisource.org/wiki/Sinterklaas_kapoentje), second `{{muziek}}` score (the page gives this song after the first). Oldest source 1851 | All 8 bars | C major as written, C4-A4. Not transposed | 4/4, quarter = 1 beat, tempo 92 |
| Bella Ciao | [Commons File:BellaCiao_Accordion.png](https://commons.wikimedia.org/wiki/File:BellaCiao_Accordion.png), an accordion arrangement released under CC0 of the Italian folk tune (public domain). Only the treble (melody) line is used. The LilyPond source on the file page gives the same notes | The whole verse: the upbeat of three eighths plus 8 bars | D minor (one flat) as written, A3-Bb4. Not transposed | 4/4, quarter = 1 beat, tempo 96 |
| Für Elise | Beethoven, WoO 59, Breitkopf & Härtel *Beethoven's Werke* Serie 25 No. 298, [page 1 of the Commons copy of the IMSLP scan](https://commons.wikimedia.org/w/index.php?title=File:IMSLP51818-PMLP14377-Beethoven_Werke_Breitkopf_Serie_25_No_298_WoO_59_Fuer_Elise.pdf&page=1) (public domain) | The whole opening A section, bars 1-22, right hand only. The upbeat and bars 1-8 with the repeat taken (first-time bar: A, a quarter, then the upbeat again; second time through: bars 1-7 and the second-time bar A-B-C-D), then bars 9-22, ending on the A at the start of bar 22 where the theme returns to the tonic (an eighth, as printed). The repeat of bars 9-22 is not taken, and the B section (bar 23 on, F major, with fast right-hand runs) is left out. Bars are numbered as usual, with both endings of the first repeat counted as bar 8 (parent's request for a longer piece; controller ruling) | A minor as written, C4-E6. Not transposed | 3/8, eighth = 1 beat (a sixteenth = `/`, a dotted eighth = `:1.5`), tempo 80 |

### Notes per song

- **Für Elise, simplification.** The left hand is left out. The right hand in bars 1-22 is
  already a single line (no two-note chords; the first right-hand chords come in the second-time
  bar of bar 22, which is not used), so no note was dropped. The sixteenth rests are kept as
  `_/`, so the rhythm is as printed. The melody has 128 notes in 41 generated hand positions, each
  at most 6 white keys wide, with no thumb crossing on a step. The rising C-E-A and E-G#-B
  figures, the octave E4-E5 in bars 4 and 18 and the two-octave leap to E6 in bar 13 are hand
  moves. In bars 2 and 16 one position has no note for finger 3 and no free white key between
  fingers 2 (G#4) and 4 (A4), so the hand screens show no key for finger 3 there.
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
- **Für Elise, bar 13.** The high note after E5 is E6, two octaves above the E4 just before it,
  on a third ledger line that its notehead covers in the scan. Read at about 3000 px wide, the
  two ledger lines below it and the head's width point to E6; the bar then rests and goes on
  with D#5. Everything else in bars 1-22 is a clean engraving.
- The other four songs come from clean engravings or plain note codes, and no detail was unclear.

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
