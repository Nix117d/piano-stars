# Piano Stars: handoff

**v1 is finished (2026-11-25).** It is live, installed on the tablet, and checked offline with the Yamaha keyboard. This note is the starting point for any later session.

## Where things stand

- **Live app:** https://nix117d.github.io/piano-stars/ (GitHub Pages, from the `gh-pages` branch). It is installed on the tablet's home screen, and was checked there offline with the keyboard on 2026-11-25.
- **Code:** https://github.com/Nix117d/piano-stars (public). `main` holds v1. `build/v1` is the same commit and can be deleted. Commits use the GitHub no-reply address.
- **Health:** 225 automated tests pass (`npm test`). `npx tsc --noEmit` is clean and `npm run build` succeeds.
- **How it was built:**
  - design: [spec](superpowers/specs/2026-11-24-piano-stars-design.md)
  - [17-task plan](superpowers/plans/2026-11-24-piano-stars.md), carried out task by task, each task with its own review
  - a final whole-app review, whose findings were fixed and re-checked

## What v1 does

- **For the child (Dutch by default):**
  - picks a song from big picture cards;
  - a "put your hand here" screen shows where his hand goes;
  - the next key glows in the correct octave, with the right-hand finger number and a hand picture;
  - Level 1 waits for each key, with no sound and no penalty while the hand picture moves;
  - Level 2 (rhythm, off by default) has a count-in, falling notes, timing scores and an optional metronome;
  - 1–5 stars and a medal wall;
  - unplugging the keyboard pauses the song, and the screen stays on while he plays.
- **Fingering:** right-hand five-finger positions (at most 6 white keys wide), worked out with the Parncutt et al. (1997) model plus beginner rules. See [the reference](references/parncutt-1997-fingering-model.md).
- **Songs:**
  - six built-in public-domain songs: the [sources](songs-sources.md) record exactly where each melody comes from;
  - MusicXML/MXL/MIDI import with a "here's what I read" review;
  - typed notes (see the README for the syntax).
- **For the parent (English by default; hold the top-left button for 3 seconds):**
  - songs: preview, edit (built-ins can be edited and reset to the original), hide, picture, Level 2 speed;
  - Settings: Level 2, metronome, celebration sound, both languages;
  - a "press middle C" keyboard check that warns if the keyboard's Transpose isn't 00;
  - "Save for keyboard", which exports a song for the PSR-E373's own Waiting lesson.
- **Offline:** an installable app that works without internet after the first visit. Nothing is sent anywhere.

## Working on it next time

- **Set up:** in `piano-stars/`, run `npm install`.
- **Run it:**
  - `npm run dev` starts it on the Mac;
  - `http://localhost:5173/?fake` lets you play with the computer keys `a s d f g h j k`.
- **Test:** `npm test`.
- **Try it on the tablet against the Mac:**
  - Option 1: Chrome flag "Insecure origins treated as secure" with `http://<mac-ip>:5173`. Switch it off again afterwards.
  - Option 2: adb wireless debugging with `adb reverse tcp:5173 tcp:5173`.
  - `/midi-test.html` (dev only) shows the raw notes coming from the keyboard.
- **Publish a new version:** `npm run deploy`. It builds with the `/piano-stars/` base path and pushes to `gh-pages`. The tablet updates the next time the app opens with internet.
- **Keyboard tips (PSR-E373):**
  - Storage Mode (Function 056) OFF while playing.
  - Transpose 00.
  - Yamaha calls middle C "C3"; the app calls it C4.
- **Songs are stored per web address on the tablet.** Songs added on the Mac test address don't appear in the installed app (see the backlog).
- **Process used for v1:** design → plan → one task at a time, each followed by a review → a final whole-app review. Keep the rule that built-in melodies come only from printed public-domain sources, never from memory, and never store lyrics.

## What's next

Everything open is in [BACKLOG.md](BACKLOG.md):

- **Parked by the parent:** test "Save for keyboard" on the Yamaha.
- **Most useful next:**
  - save and load your own songs as a file;
  - only accept notes from the keyboard's channel 1;
  - stop the Android back gesture from leaving a song mid-way.
- **Songs:** the three missing Sinterklaas songs ("Hoor wie klopt daar, kind'ren", "De zak van Sinterklaas", "Dag, Sinterklaasje"), added once a free-to-use printed source or the family's own songbook is available. The next section of Für Elise could come later, too.
- **Ideas from the original design, left out of v1:** reading a photo of paper sheet music, iPad support, left hand or two hands, microphone input for an acoustic piano.

## Decisions made during v1

Each line is a call made during the build, and what it costs if it turns out wrong.

- **A.** Skipped "git init", because the repository already existed. *Cost: none.*
- **B.** The MIDI test page is served only in development, not in the installed app. *Cost: none.*
- **C.** Preview in the parent area makes sound even when the keyboard is connected. The "no sound" rule applies to the child's screens. *Cost: none.*
- **D.** Steps that needed the parent (tablet, listening, keyboard export, hosting) were paused for them; all done except the keyboard export test, now in the backlog. *Cost: waiting time.*
- **E.** Added a "press middle C" check in the parent area. It warns when the keyboard's Transpose isn't 00, after the keyboard turned out to be set to Transpose +6 during the first hardware test. *Cost: one small screen.*
- **F.** The app calls middle C "C4" (the international name). Yamaha calls it "C3", and the README says so. *Cost: octave labels would need renaming.*
- **G.** A song outside the keyboard's range is shifted by whole octaves, never squeezed. *Cost: rare imports may still go above the top key.*
- **H.** Typed notes accept exact lengths such as `E:1.5`, needed for the dotted rhythms in the Sinterklaas songs. *Cost: one extra notation.*
- **I.** Claude copied the fingering table and rules from the 1997 paper into a reference file, because the PDF couldn't be read automatically. *Cost: if a value was mistyped, fingerings change slightly; you can check it against the paper.*
- **J.** Added a "one finger per key" (five-finger position) rule from the beginner piano books. The paper's adult rules alone gave an odd fingering for Ode to Joy. *Cost: fingerings stay strictly in positions, which is what we want.*
- **K–N.** Black keys are named by the song's key, for example B-flat in an F song counts as a B. Fixed so F-position songs get proper fingering. *Cost: odd spellings in very chromatic songs.*
- **L.** A run of more than 5 steps with no pause can't avoid a thumb-under. Built-in songs are checked to never need one. An imported song may show one, and you can edit the fingers. *Cost: an occasional thumb-under in an imported song.*
- **M.** The hand picture slides at every change of hand position. *Cost: some extra animation.*
- **O.** Black keys are 70% as wide as white keys, and the on-screen keyboard scrolls when a song needs more than two octaves. *Cost: smaller keys in tap mode on wide songs.*
- **P.** The glowing key pulses continuously, because it's a hint rather than feedback. *Cost: none.*
- **Q.** Finger numbers are black or white, whichever reads better on each key colour. A note played twice in a row sparkles twice. *Cost: none.*
- **R.** The keyboard scrolls by itself to keep the glowing key visible. *Cost: none.*
- **S.** Child fairness:
  - The plug-in screen's home button also needs two taps.
  - Presses while the hand picture moves don't count.
  - The Chrome permission prompt is retried if it was dismissed.
  *Cost: none.*
- **T, U.** Level 2: presses while paused count for nothing, and no beat is lost around an unplug. *Cost: none.*
- **V.** Editing a song keeps its fingering label ("from the rules" or "from the sheet"), unless you change a finger. *Cost: an inserted or deleted note can mark a song as "parent" fingering.*
- **W.** There is one shared copy of the settings, so changes in the parent area and in Settings can't undo each other. *Cost: none.*
- **X.** Built-in songs can be edited. The edit is saved as a copy with "Reset to original". *Cost: if a future version removed a song you had edited, the copy couldn't be deleted. It's a small fix if that ever happens.*
- **Y.** The screen stays on while playing, and Level 2 pauses while the app is hidden. *Cost: battery use during play.*
- **Z.** A hand position may span at most 6 white keys. Für Elise covers its whole opening section (bars 1–22, right hand, A minor). *Cost: a few more hand moves in some songs; Für Elise needs about one hand move per bar, so it is the hardest built-in.*
- **AA.** Smaller fixes before handing it to the child:
  - parent quick start in the README;
  - finger numbers readable on every key colour;
  - unique export file names;
  - no lyrics in the docs;
  - no two fingers on one key;
  - MIDI titles taken from the file header;
  - repeated notes in Level 2 matched to the nearest beat.
  *Cost: none.*

