# Piano Stars: design

Date: 2026-11-24
Status: approved 2026-11-24; implemented as v1 on 2026-11-25. Decisions that refine this design are listed in docs/HANDOFF.md ("Decisions made during v1").

## Intent and why

A 5-year-old boy wants to learn the piano. His parent wants an app that turns a
song into "press this key, with this finger, next": the next key lights up with
friendly animation, the child presses it on his real keyboard, and at the end
he wins stars and a medal. He should learn the **proper finger positions** from
the start, and once he knows the keys of a song he should be able to move on
to **playing it in time**.

It has to be easy enough for a child who can't read yet, it has to work at
home without the internet, and the child's side speaks **Dutch**.

Success looks like this: the child sits at the keyboard, picks a Sinterklaas
song by himself, puts his hand where the app shows, plays it through by
following the lights and finger numbers, and feels proud of the reward. A
parent can add a new song in a minute or two.

## Hardware and platform (decided)

- **Tablet:** Samsung Galaxy Tab S7+ (Android, Chrome).
- **Instrument:** Yamaha PSR-E373 (61 keys, C1 to C6), plugged into the tablet
  from its USB TO HOST port (USB-B) with a USB-B to USB-C cable. It needs no
  driver for MIDI. Its Storage Mode (Function 056) must be OFF, or it acts as a
  USB drive and makes no sound.
- **The keyboard makes its own sound.** The app makes no sound while the
  keyboard is connected. It only listens to which keys are pressed.
- **Known risk:** some Samsung tablet owners report USB MIDI keyboards not being
  detected. A reported fix is Settings → Developer options → USB configuration
  → MIDI while the keyboard is plugged in. The first build task tests this on
  the real hardware (see Testing).

## Goals (version 1)

1. **Load a song in two ways**, both turning into the same internal song:
   - **Digital sheet music file:** MusicXML (`.musicxml`, `.xml`, compressed
     `.mxl`) and MIDI (`.mid`, `.midi`), picked from the tablet's files.
   - **Typed notes**, for example `C, D, E, C, C`.
2. **Finger hints:** every note shows which right-hand finger to use (1 to 5),
   and each song starts by showing where to put the hand. The fingering comes
   from credible sources, never made up (see Fingering).
3. **Level 1, "Keys":** a big on-screen keyboard. The next key glows, in the
   **correct octave**, and a character hops onto it. The app reads the real
   key press over USB-MIDI and **waits** for the right key. No tempo, no timer.
4. **Level 2, "Rhythm":** the same song, now with a steady beat. He has to play
   each note in time, and the score includes how well he kept time. Level 2 is
   switched on by the parent (see Level 2).
5. **Results:** at the end, **1 to 5 stars** with a celebration animation. Each
   song earns a medal per level on a medal wall.
6. **Built-in Sinterklaas songs**, plus some extras (see Song library).
7. **Dutch and English.** The child's screens are Dutch by default and can be
   switched to English. The parent area is English by default and can be
   switched to Dutch.
8. **Works offline** once installed. Songs, progress and medals are stored on
   the tablet.
9. **"Save for keyboard" (small extra, built last, can be cut).** Exports any
   song as a `.mid` file prepared for the PSR-E373's own **Waiting** lesson,
   so he can also practise on the keyboard alone, with its display showing
   the notes. See "Keyboard lesson export".

## Non-goals (version 1)

- **iPad support.** The app may happen to run there, but nothing is built or
  tested for it (Safari has no Web MIDI).
- **Reading a photo of a paper sheet.** The internal song format should not
  block adding it later.
- Microphone listening (for an acoustic piano).
- Chords, the left hand, or two hands together. Only a right-hand melody.
- **Checking which finger he actually used.** The keyboard only reports which
  key was pressed, not which finger pressed it. The app shows the right
  finger; a grown-up watching is what makes sure he uses it.
- Showing real staff notation.
- Showing lyrics.
- Accounts, cloud sync, multiple child profiles.
- Lighting up notes on the keyboard's own display live from the app. Yamaha
  doesn't document a way to do this without the keyboard also playing the
  note.
- Copying songs to the keyboard from inside the app.

## Anti-goals (a failure even if it works)

- Anything that makes a 5-year-old feel bad: harsh buzzers, red "WRONG"
  screens, losing stars mid-song, countdown timers.
- Distraction: sounds or animations that pull attention away from his hands
  and the keys.
- Anything that needs reading to use. The child's screens must work with
  pictures, colors, note letters and finger numbers.
- Teaching wrong habits: made-up or awkward fingerings.
- Needing the internet to play.
- Ads, links out of the app, in-app purchases, or any tracking.
- A child being able to delete songs or wipe medals by accident.

## Constraints

- **Web MIDI only works on a secure page** (HTTPS, or `localhost`). The app
  must be opened over HTTPS at least once to install it. After that it runs
  offline from the home screen.
- Chrome on Android supports Web MIDI for class-compliant USB-MIDI devices.
  Chrome asks for MIDI permission the first time.
- Plugging the keyboard in or out while the app is open must be handled:
  reconnect without a restart.
- Tablet held in **landscape**. Touch targets are large (at least 64 px for
  anything the child taps).
- **Copyright:** only songs whose melody is in the public domain are built in.
  Songs still under copyright can be added by the parent from a file they
  have obtained themselves (see Song library). No lyrics are stored or shown.

## Approaches considered

1. **Installable web app (chosen).** One web codebase, installed to the
   Android home screen, works offline, reads the keyboard through Chrome's
   Web MIDI. No app store or developer account. Fast to iterate.
2. **Web app plus photo scanning.** Same as above, plus reading paper sheets
   through an online AI or a reader running on the home computer. Deferred:
   it's the hardest and least reliable part, and the parent chose to leave it
   out of v1.
3. **Native app (Flutter).** Would give MIDI on the iPad too and slightly lower
   latency, but needs an app store account or awkward sideloading. Not worth
   it once the iPad was taken out of scope.

The parent chose approach 1, without photo scanning and without the iPad.

## How it works

### Song model

Every way of loading a song produces the same thing:

```
Song {
  id, title, source: "builtin" | "file" | "typed",
  tempo,                      // beats per minute, for level 2
  notes: [
    { midi: 60, beats: 1, finger: 1 },
    { midi: 62, beats: 1, finger: 2 },
    ...
  ],                          // the right-hand melody, in order
  fingeringSource: "sheet" | "rules" | "parent",
  melodySource,               // for built-in songs: where the notes came from
  picture, hidden, createdAt
}
```

`beats` is the note's length in beats (1 = one beat, 0.5 = half a beat,
2 = two beats). Rests are kept as entries with no pitch, so level 2 keeps the
right timing; level 1 skips them.

### Fingering

**Sources the rules come from:**

- **Finger numbers:** thumb = 1 to little finger = 5. This numbering is
  standard in beginner piano teaching (for example the Dummies piano guides
  and MuseScore's piano hand-position guide).
- **Five-finger positions:** beginners keep the hand over five neighbouring
  white keys, one finger per key. In **C position** the right thumb is on
  middle C, so C D E F G = fingers 1 2 3 4 5. Beginner method books build on
  this and add more five-note positions (G position, for example). John
  Thompson's Easiest Piano Course starts from middle C, and Pauline Hall's
  Piano Time 1 uses more than one five-note position in its first book.
- **When a melody needs more than five notes:** move the whole hand to a new
  five-finger position at a natural break (a rest, a long note, or the end of
  a phrase). Choosing between possible fingerings follows the peer-reviewed
  ergonomic model of Parncutt, Sloboda, Clarke, Raekallio & Desain, "An
  Ergonomic Model of Keyboard Fingering for Melodic Fragments", *Music
  Perception* 14(4), 1997. It scores finger pairs by stretch and the weakness
  of fingers 4 and 5, and its rules are written for the right hand. Prefer
  simple position shifts over thumb-under crossings, which are beyond a
  5-year-old's first songs.

**Where each song's fingering comes from, in order:**

1. **The sheet itself.** If an imported MusicXML file has fingering marks
   (the `<fingering>` element), use them. `fingeringSource = "sheet"`.
2. **The rules above.** Otherwise the app works out a fingering with the
   five-finger-position method and the Parncutt et al. rules.
   `fingeringSource = "rules"`.
3. **The parent.** The parent can change any finger in the editor.
   `fingeringSource = "parent"`.

For the **built-in songs**, the builder works out the fingering with the same
method, writes it into the song data, and records the source. The parent can
also ask a piano teacher to look over the built-in fingerings and correct them
in the editor.

**What the child sees:**

- **Before the song starts:** a "put your hand here" screen with a picture of a
  right hand above the keys. The keys of the first position are highlighted,
  each with its finger number, and the thumb's key gets a big marker ("duim op
  de C" in Dutch). He starts when he presses the first note.
- **While playing:** the glowing key shows the **finger number** in a big
  circle. The hand picture above the keyboard highlights that finger in the
  same color. The "next up" bubbles show the finger number too.
- **Hand moves:** when the song needs a new position, the hand picture slides
  to the new place and the new thumb key gets the marker again before the next
  note lights up.

### Typed notes

- Notes are separated by commas and/or spaces: `C, D, E, C, C` or `C D E C C`.
- A letter on its own (`C` to `B`) means the octave starting at middle C
  (C4 = MIDI 60).
- An octave number picks another octave: `C5`, `G3`.
- Sharps and flats: `C#`, `Db`, `F#4`, `Bb3`. Both `#` and `b` are accepted,
  and letters are case-insensitive (`b` on its own is the note B).
- **Length (optional):** each `-` after a note adds a beat, so `C` is 1 beat,
  `C-` is 2 beats and `C---` is 4. A `/` after a note makes it half a beat:
  `C/`. A rest is `_` (with the same `-` and `/` marks).
- **Finger (optional):** a number in brackets, for example `E(3)` or `G4(5)-`.
  Notes without one get a fingering from the rules.
- **Tempo (optional):** a first line like `tempo 90`. The default is 80.
- `|` or a new line can be used to split lines, and is otherwise ignored.
- Anything it can't read is highlighted in the editor with a friendly
  message, and saving is blocked until it's fixed.
- A preview button plays the notes through the tablet's speaker so the parent
  can check them.

### Digital sheet music files

- **MusicXML / MXL:** take the first part, first staff, voice 1. Where there's
  a chord, keep the top note. Keep rests and note lengths. Honour ties (a tied
  note is one press). Read fingering marks where present. Repeats are not
  expanded in v1. *(Builder's call, see below.)*
- **MIDI:** pick the first track that has notes and isn't percussion (channel
  10). Where several notes start at the same moment, keep the highest. Work out
  note lengths from the timing and the file's tempo.
- The title comes from the file's title field, or else from the file name.
- After import, show a "here's what I read" screen (notes as letters with
  finger numbers, a preview button) where the parent can rename it, fix notes
  or fingers (it opens in the typed-notes editor) or cancel.
- If a file has no usable notes, say so plainly and don't save it.

### Play screen, level 1 "Keys" (child)

```
  🎵 Sinterklaas kapoentje      ●●●○○○○○○○○○○     [🏠]
  ─────────────────────────────────────────────────────
     volgende:  (G·5) (E·3) (C·1) (D·2)    ← coloured bubbles, letter·finger
                  ✋ hand picture, finger 3 lit
                    🐸
  ┌───┬──┬──┬──┬───┬───┬──┬──┬──┬──┬──┬──┬───┐
  │   │C#│  │D#│   │   │F#│  │G#│  │A#│  │   │
  │ C │  │D │  │[E]│ F │  │G │  │A │  │B │ C │
  └───┴──┴──┴──┴─③─┴───┴──┴──┴──┴──┴──┴──┴───┘
                  ✨ glowing, finger ③
  [▁▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁]  ← whole 61-key map, shown part marked
```

- **On-screen keyboard** shows only the range the song needs (at least one
  octave, rounded out to whole octaves), so the keys stay big.
- **Correct octave matters.** Only the exact key counts as correct. To help him
  find it on the real 61-key keyboard, a thin strip under the keyboard shows
  all 61 keys with the visible part marked, and **middle C** has a small
  marker on screen (a matching sticker on the real middle C is suggested in
  the parent's quick-start guide).
- **Every note has its own color**, always the same (for example C red, D
  orange, E yellow ...), with the letter printed on the key. A sharp or flat
  uses a darker shade of its neighbour's color.
- **"Next up" strip:** the next few notes as colored bubbles with their finger
  number.
- **Progress:** a row of dots or a little path the character walks along.
- **Correct key:** the key flashes, sparkles burst, and the character hops to
  the next key. **No sound** from the app.
- **Wrong key:** that key on screen does a small wobble and the character
  shakes its head kindly. The glowing key stays. No sound.
- **No keyboard connected:** show a big picture of a plug and the keyboard,
  and allow tapping the on-screen keys instead (which then do make sound).
  This is also what makes the app testable without the keyboard.
- **Home button** asks for a second tap ("Are you sure?" as an icon) so a
  bump doesn't end the song.

### Level 2 "Rhythm"

- **Turning it on:** the parent area has a switch, **"Level 2 (rhythm)"**, off
  by default. When it's on, each song card shows two big buttons: **1** (keys)
  and **2** (rhythm, with a drum picture). *(My call: one switch for all songs,
  to keep it simple.)*
- **The beat:** a count-in of four beats (four dots that fill, and the
  character bounces). Then the notes come toward a "play now" line in time
  with the beat, while the keyboard, finger hints and colors stay the same as
  in level 1.
- **No waiting:** the song keeps going whether or not he plays. A note played
  on time gets the sparkle, one played a little early or late gets a smaller
  sparkle, a missed or wrong note gets the gentle wobble.
- **Tempo:** songs start at a slow speed (about 60% of the song's tempo). The
  parent can set the speed per song (slow, medium, normal).
- **Click:** a quiet metronome click can be switched on in the parent area,
  off by default, in line with "no distracting sounds". The beat is always
  shown visually.
- **Score:** both right notes and timing count. *(Exact timing windows, for
  example within 150 ms = on time, within 300 ms = close, are the builder's
  call, tuned on the real keyboard.)*

### Results screen

- **1 to 5 stars.**
  - Level 1, from mistakes compared with the number of notes: 5 stars for no
    mistakes, then fewer stars as mistakes go up. Finishing always gives at
    least 1 star.
  - Level 2, from how many notes were right and on time.
  - *(Exact thresholds are the builder's call.)*
- Big celebration: stars fly in one by one, confetti, the character dances. A
  short celebration sound here only, which the parent can switch off.
- Buttons as pictures: **play again** and **choose another song**.
- The song's medal is updated if this was a better result.

### Song picker (child)

- A grid of big song cards, each with a picture, the title, and the best stars
  so far (per level once level 2 is on).
- Tapping a card starts the song (or picks the level, when level 2 is on).
- **Where the picture comes from** *(my call)*: the app ships with a set of
  about 30 simple, distinct pictures (steamboat, horse, gift, star, animals ...).
  Built-in songs have fixed ones. When the parent adds a song, the app
  pre-selects a picture no other song is using, and the parent can change it.
  No own photos in v1.

### Medal wall (child)

- Every song has a medal slot per level: empty, bronze (1 to 2★), silver (3
  to 4★) or gold (5★).

### Parent area

- Opened with a **hold-for-3-seconds** button in a corner, so the child doesn't
  open it by accident.
- Add a song (pick a file, or type notes), rename, edit notes and fingers,
  change picture, delete (with a confirm), reset medals (with a confirm).
- Settings: level 2 on/off, speed per song, metronome click, celebration sound,
  child's language, parent language.
- Shows the keyboard connection status, and the name of the MIDI device that's
  connected.
- Built-in songs can't be deleted, but can be hidden.

### Languages

- Two languages: **Dutch (nl)** and **English (en)**.
- Child's screens: Dutch by default. Parent area: English by default. Each can
  be switched separately in the parent area.
- All interface text lives in translation files, one per language. Song titles
  stay in their own language.
- Note names are shown as letters (C D E F G A B) in both languages, as used in
  Dutch music teaching too.

### Song library

Melodies must come from a trustworthy source, not from memory. For each
built-in song the builder takes the melody from public-domain notation (for
example the score on its Dutch Wikisource page, or the old songbooks named
there), records that source in the song data, and has the parent check it by
ear with the preview button before release. Songs are transposed where needed
so they fit comfortable five-finger positions around middle C.

**Built in: Sinterklaas songs**

| Song | Origin (from nl.wikipedia "Sinterklaaslied" and nl.wikisource) | Built in? |
|---|---|---|
| Zie, ginds komt de stoomboot | Text Jan Schenkman (ca. 1850); tune is the older German "Im Märzen der Bauer"; sung version 1912. Wikisource has the music. | Yes |
| Sinterklaas kapoentje | Traditional; oldest source 1851 (De Navorscher). Wikisource has the music. | Yes |
| O, kom er eens kijken | Text Katharina Leopold (1898); tune "Freut euch des Lebens" by H.G. Nägeli. | Yes |
| Hoor wie klopt daar, kind'ren | Traditional, author unknown. | Yes |
| De zak van Sinterklaas | Traditional, author unknown; in songbooks from at least 1925 to 1963. | Yes |
| Sinterklaasje, bonne, bonne, bonne | Traditional; oldest source 1851. Wikisource has the music (on the Sinterklaas kapoentje page). | Yes |
| Dag, Sinterklaasje | Text Antoinette van Dijk (songbook 1926); tune "O Winter, schlimmer Winter" by F. Mendelssohn Bartholdy. | Yes |
| Pietengym | A modern song (De Club van Sinterklaas), still under copyright. | **No**: parent adds it from a file |

**Built in: extras (nice to have)**

| Song | Status | Built in? |
|---|---|---|
| Bella Ciao (simple version) | Italian folk melody, public domain. | Yes |
| Für Elise (simplified opening theme) | Beethoven, public domain. A short, simplified opening only, since the full piece needs both hands and thumb crossings. | Yes |
| Tamo daleko | Written in 1916 by Đorđe Marinković, who reportedly died in 1977, so likely still under copyright. | **No**: parent adds it from a file |
| Pink Panther theme | Henry Mancini, 1963, under copyright. | **No**: parent adds it from a file |
| Crni leptir (YU Grupa) | 1970s, under copyright. | **No**: parent adds it from a file |

For the "parent adds it" songs, the parent's quick-start guide explains where
to look for a sheet music file they're allowed to use (for example a licensed
arrangement on MuseScore) and how to load it, or to type the notes in.

### Character and look

- One original, friendly character (for example a little frog or bird). No
  existing cartoon characters, and no Sinterklaas or Piet characters from TV
  shows.
- Bright, soft colors, rounded shapes, big everything.
- Animations are short and snappy (under half a second for feedback) so they
  never slow down a child who's playing fast, and calm enough not to distract
  from the keys.

### Keyboard lesson export

What the PSR-E373 manual says (Owner's Manual pp. 38, 50, 54):

- Lesson 3, **Waiting**: the keyboard shows the correct notes on its display
  and the song pauses until the right note is played.
- Lessons work on preset songs and on **songs transferred from a computer**,
  not on songs recorded on the keyboard.
- Transferred songs are `.MID` files, about 1.4 MB in total. The right-hand
  part should be on **channel 1** (left hand on channel 2), and part selection
  only works for **SMF format 0** files.
- Transfer: switch Storage Mode ON, then the keyboard appears to a computer as
  a USB drive and the file is copied onto it.

So the app's export writes: SMF format 0, melody on channel 1 with the song's
real note lengths and tempo, and the song's title as the file name (short,
plain letters). The parent area gets a "Save for keyboard" button that saves
the file to the tablet's Downloads, plus a short picture guide for copying it
to the keyboard with a computer. Whether the tablet can copy it straight to
the keyboard in Storage Mode is worth trying, but it isn't promised.

### Storage and offline

- Songs, best results, medals and settings are saved on the tablet
  (IndexedDB).
- A service worker caches the whole app so it opens with no internet.
- Nothing is sent anywhere. No analytics.

### Hosting and install

- The built app is a set of static files. It has to be served over HTTPS once
  so it can be installed (Web MIDI needs a secure page). After that it lives
  on the tablet's home screen and runs offline.
- Where to host it is the builder's call to propose (a free static host is
  enough). It contains no personal data.

## Tech choices (my calls, open to change)

- TypeScript, built with Vite, as an installable web app (manifest plus
  service worker, for example `vite-plugin-pwa`).
- A light UI framework or plain DOM, whichever the builder prefers. Animations
  in CSS and/or a small animation library.
- Web MIDI API for the keyboard (with timestamps, for level 2 timing); Web
  Audio for the preview, the tap-mode synth and the optional metronome.
- A small library to read MIDI files (for example `@tonejs/midi`), and an
  unzip library for `.mxl` files (for example `fflate`). MusicXML is read with
  the browser's own XML parser.
- A small translation layer with one file per language.

## Testing

- **First task of the build, before anything else:** a tiny test page that
  shows the key presses coming from the Yamaha in Chrome on the real tablet.
  If that doesn't work, stop and revisit the approach (the native-app option)
  before building the rest.
- Unit tests for the typed-notes reader (including lengths, rests, fingers and
  tempo), the MusicXML reader (including fingering marks) and the MIDI reader,
  using small sample files that include chords, ties, rests and percussion.
- Unit tests for the fingering rules: C-position songs get 1 to 5 on C to G;
  position shifts land on natural breaks; no thumb-under crossings.
- Unit tests for the play logic: exact-key matching, wrong keys, star counting
  for both levels, timing windows.
- A fake MIDI input in development so play mode can be tested without the
  keyboard, plus the on-screen tap mode.
- Both languages checked on every child screen and parent screen.
- A final check on the real tablet with the Yamaha plugged in, including
  level 2 timing.
- For the export: a test that the written file is SMF format 0 with notes on
  channel 1, and one real check that an exported song runs in the PSR-E373's
  Waiting lesson.

## Left to the builder

- MusicXML edge cases beyond those listed (repeats, multiple voices).
- Exact star thresholds, level 2 timing windows, and animation details.
- UI framework and animation library.
- Exact color for each note, character design, the picture set, and sounds
  (original or freely licensed).
- Where to host the static files for the first install.

## Sources

- Yamaha PSR-E373 Owner's Manual, pp. 38, 50, 54 to 55.
- Parncutt, Sloboda, Clarke, Raekallio & Desain (1997), "An Ergonomic Model of
  Keyboard Fingering for Melodic Fragments", *Music Perception* 14(4),
  341 to 382.
- Beginner finger numbers and C position: Dummies piano guides; MuseScore,
  "Piano hand position"; Pianodao, "The importance of five-note hand
  positions" (on Thompson's Easiest Piano Course and Pauline Hall's Piano
  Time).
- Song origins: nl.wikipedia "Sinterklaaslied"; nl.wikisource pages for each
  song; en.wikipedia "Tamo daleko".
