# Piano Stars: handoff (end of 2026-11-25)

## Where things stand

- **The app is built.** All 17 tasks in the plan are done, and each one was reviewed. A final review of the whole app found 5 more problems, which are fixed and re-checked.
- **Tests:** 223 automated tests pass. Type check and production build are clean.
- **Code location:** the work is on the branch `build/v1`, 42 commits, head `75a17e3`. It is **not merged into `main`**, which still holds only the design and plan docs.
- **Docs to start from:**
  - [README.md](../README.md) starts with a quick start for parents.
  - [Design (spec)](superpowers/specs/2026-11-24-piano-stars-design.md)
  - [Implementation plan](superpowers/plans/2026-11-24-piano-stars.md)
  - [Song sources](songs-sources.md)
  - [Fingering model reference](references/parncutt-1997-fingering-model.md)
- **Build log:** `.superpowers/sdd/2026-11-24-piano-stars/progress.md` records every decision, review and deferred item. It is git-ignored, so keep this folder until the branch is finished.

### What works

- **Songs:** six built-in songs (see the list in step 2), songs typed by the parent, and MusicXML/MXL/MIDI import.
- **Level 1:** the next key glows in the correct octave, with a finger number and a hand picture. The app waits for the right key, ignores presses while the hand picture is moving, and makes no sound while the keyboard is connected.
- **Level 2 (rhythm):** off by default. It has a count-in, falling notes, timing scores and an optional metronome. It pauses when the keyboard is unplugged or the app is hidden.
- **Rewards:** 1–5 stars and a medal wall.
- **Languages:** the child's screens are in Dutch and the parent area in English, each switchable separately.
- **Parent area (hold the top-left button for 3 seconds):**
  - songs: preview, edit, hide, picture, speed, reset to original;
  - import review;
  - the "press middle C" keyboard check;
  - settings;
  - "Save for keyboard" (exports a file for the PSR-E373's own Waiting lesson).
- **Screen:** stays on while playing.
- **Offline:** it installs as an offline app. Hosting is still to do.

## What needs you, in order

### 1. Try it on the tablet and listen to the built-in songs (about 20 min)

- On the Mac, start the dev server (`npm run dev` in `piano-stars/`, or ask Claude to start it).
- On the tablet, open `http://<mac-ip>:5173`. (System Settings → Network shows the Mac's address.)
- The Chrome flag you set yesterday ("Insecure origins treated as secure") must list the current address.
- Open the parent area (hold the faint top-left button for 3 seconds). Press **Preview** on each built-in song and check that it sounds right:
  - Zie, ginds komt de stoomboot
  - Sinterklaas kapoentje
  - O, kom er eens kijken: listen carefully to the second half. The 1898 scan had two unclear spots, bars 12–13.
  - Sinterklaasje, bonne, bonne, bonne
  - Bella Ciao: it dips below middle C, to the A.
  - Für Elise: now the whole first part (bars 1-22 with the first repeat, right hand, 128 notes). Listen carefully at bar 13, the big jump up to the high E (E6).
- Also check on the tablet:
  - the screen stays on during a song;
  - the hand picture is big enough;
  - Level 2 timing feels fair at "slow" speed;
  - picking a `.mxl` or `.mid` file works.

### 2. Decide about the three Sinterklaas songs that are missing

- "Hoor wie klopt daar, kind'ren", "De zak van Sinterklaas" and "Dag, Sinterklaasje" were left out. No public-domain sheet music could be found online.
- If you have a songbook or a sheet-music file, add them in the parent area, either from the file or by typing the notes.
- Pietengym, Tamo daleko, the Pink Panther theme and Crni leptir are still under copyright. Add them the same way, from files you're allowed to use.

### 3. Test "Save for keyboard" on the Yamaha

- In the parent area, press **Save for keyboard** on one song and follow the 4 steps the app shows:
  1. Copy the file to a computer.
  2. Connect the keyboard to the computer.
  3. Turn Storage Mode (Function 056) on and copy the file onto the keyboard.
  4. Turn Storage Mode off, choose the song with [SONG], and press LESSON until "WAITING" shows.
- Expected: the keyboard shows the notes and waits for each correct key.

### 4. Choose where to host it once, so the tablet can install it

- The app has to be opened over HTTPS once to install. After that it runs offline from the home screen.
- Options: GitHub Pages (needs a GitHub account and a public repository), Netlify or Cloudflare Pages. All are free for this.
- The app contains no personal data.
- When you choose, Claude sets the base path, fixes the icon links for that host, and publishes it. Nothing is published without your yes.

### 5. Final check, then finish the branch

- On the tablet: open the hosted address in Chrome and use Add to Home screen.
- Turn Wi-Fi off and open it from the home screen with the keyboard plugged in.
- Play a song in both levels, and unplug and replug the keyboard mid-song.
- Then merge `build/v1` into `main`.

## Decisions Claude made on your behalf

Each line is a call Claude made during the build, and what it costs if it's wrong. Tell Claude about any you'd like changed.

- **A.** Skipped "git init", because the repository already existed. *Cost: none.*
- **B.** The MIDI test page is served only in development, not in the installed app. *Cost: none.*
- **C.** Preview in the parent area makes sound even when the keyboard is connected. The "no sound" rule applies to the child's screens. *Cost: none.*
- **D.** Steps that need you (tablet, listening, keyboard export, hosting) are paused and left for you. *Cost: waiting time.*
- **E.** Added a "press middle C" check in the parent area. It warns when the keyboard's Transpose isn't 00, after yesterday's +6 surprise. *Cost: one small screen.*
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
- **AA.** Smaller fixes before handing it to your son:
  - parent quick start in the README;
  - finger numbers readable on every key colour;
  - unique export file names;
  - no lyrics in the docs;
  - no two fingers on one key;
  - MIDI titles taken from the file header;
  - repeated notes in Level 2 matched to the nearest beat.
  *Cost: none.*

## Small things left for later (not blocking)

These are listed in the build log. The ones worth doing eventually:

- Accept notes only from the keyboard's channel 1, so a demo song playing on the keyboard isn't counted as presses.
- Stop the Android back gesture from leaving a song mid-way.
- Guard against a malformed MusicXML file with `divisions` = 0, which would give a Level 2 song that never ends.
- English-only labels for screen readers, plus a few extra tests.
