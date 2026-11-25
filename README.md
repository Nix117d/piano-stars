# Piano Stars

An offline piano-learning app (Preact + TypeScript PWA) for a Samsung Galaxy Tab S7+ in Chrome, with a Yamaha PSR-E373 keyboard connected over USB (Web MIDI).

## Quick start for parents

Plug the keyboard into the tablet with the USB cable, open Piano Stars and let your child pick a song. The rest of this section is for you.

**Opening the parent area.** Hold the faint button in the top-left corner of the song list for 3 seconds. A ring fills up while you hold; letting go early does nothing, so a child tapping it won't get in. The parent area is where you add, edit, hide and preview songs, and where Settings is.

**The first song.** The first time a song starts, Chrome asks whether Piano Stars may use MIDI devices. Tap **Allow**. Without it the app can't hear the keyboard. If you tapped Block by mistake, allow MIDI again for the site in Chrome's site settings.

**Level 2 (rhythm).** Level 1 waits for each key, with no timer. Level 2 adds a steady beat. It is off by default. To switch it on, go to the parent area, then **Settings**, then **Level 2**. Each song card then shows both levels. The song list has a speed per song for level 2 (slow to start with).

**Typing notes: the default octave.** A plain letter (C, D, E...) means the octave that starts at middle C, so `C` is middle C and `B` is the B just above it. Add a number for other octaves: `C5` is the next C up, `G3` is the G just below middle C. The full typing guide is under "Adding songs" below.

**Built-in songs.** Six songs are included, all from sheet music that is free to use (sources in [docs/songs-sources.md](docs/songs-sources.md)):

- Zie, ginds komt de stoomboot
- Sinterklaas kapoentje
- O, kom er eens kijken
- Sinterklaasje, bonne, bonne, bonne
- Bella Ciao
- Für Elise (the whole first part, bars 1-22, right hand)

Three Sinterklaas songs are left out: "Hoor wie klopt daar, kind'ren", "De zak van Sinterklaas" and "Dag, Sinterklaasje". No old, free-to-use printed music for them could be found, and the app never uses a melody written down from memory. You can add them yourself (see below).

**Songs you add yourself.** Some songs are still under copyright, so the app can't include them. This covers Pietengym, Tamo daleko, the Pink Panther theme and Crni leptir. You can add any song you are allowed to use:

- *Where to find a file.* Look for sheet music you have the right to use: for example a licensed arrangement on MuseScore (musescore.com), or a digital score you buy from a sheet-music shop. Piano Stars reads MusicXML (`.musicxml`, `.xml`, `.mxl`) and MIDI (`.mid`) files. Download the file onto the tablet.
- *Loading it.* In the parent area tap **Add from file** and pick the file. Piano Stars shows what it read, with the notes and finger numbers. Press **Preview** to listen, fix anything with **Fix notes**, then **Save**. It keeps only the melody (the top line), and picks fingers for a small right hand unless the file has its own.
- *Typing it.* You can also tap **Type notes** and write the melody as letters, for example `E D C D E E E-`. A **Preview** button plays it back.

**The listening check.** Before your child learns a built-in song, listen to it once. In the parent area, press **Preview** on the song (it becomes **Stop** while it plays). If a note sounds wrong, tap **Edit** to fix it. **Reset to original** puts the shipped version back.

## Run it

```
npm install
npm run dev      # dev server on http://localhost:5173 (also reachable on your LAN)
npm test         # unit and component tests
npm run build    # production build into dist/ (manifest + service worker)
```

### Dev mode without a keyboard: `?fake`

Open `http://localhost:5173/?fake`. The computer keys `a s d f g h j k` are the white keys C4 to C5, and `0` plugs the fake keyboard in and out.

## Test on the tablet from the Mac

Web MIDI needs a secure origin, and plain `http://<mac-ip>` is not one. Pick one:

1. **Chrome flag.** On the tablet open `chrome://flags`, search "Insecure origins treated as secure", enable it, add `http://<mac-ip>:5173` and relaunch Chrome. Then open `http://<mac-ip>:5173`.
2. **adb wireless debugging.** Enable Developer options and Wireless debugging on the tablet, pair it (`adb pair`, `adb connect`), then run `adb reverse tcp:5173 tcp:5173`. The tablet's `http://localhost:5173` now reaches the Mac (localhost counts as secure).

Then open `/midi-test.html` (for example `http://localhost:5173/midi-test.html`) to check that the keyboard is seen and notes arrive. This page only exists on the dev server; it is not part of the production build.

## Keyboard tips (Yamaha PSR-E373)

- **Storage Mode (Function 056) must be OFF.** With it ON the keyboard acts as a USB drive and sends no MIDI.
- **Transpose must be 00.** The app cannot tell when the keyboard is transposed. The Parent area has a "press middle C" check that catches this.
- **Middle C naming.** Yamaha calls middle C "C3". Piano Stars uses the international name C4. Same key.
- **No keyboard shown?** On the tablet: Settings, Developer options, USB configuration, MIDI.
- A small middle C sticker on the keyboard helps beginners find their place.

## Adding songs

Open the Parent area. Songs can be imported from MIDI or MusicXML files, or typed.

Typed-notes syntax:

- Note letters `C D E F G A B`, with an octave number (`C4` is middle C) and `#` or `b` for sharps and flats (`F#4`, `Bb3`).
- Length: a note is one beat by default. `-` after a note makes it longer (one per extra beat), `/` makes it shorter (half), `:N` sets an explicit length.
- `_` is a rest.
- `(N)` sets the finger, 1 to 5: `C(1)`, `E4(3)`.
- An optional first line `tempo N` sets the speed (20 to 300, default 80).

Example:

```
tempo 90
C D E- _ F/ G(3)
```

The editor marks every unrecognised note and explains the problem.

## Save for keyboard

In the Parent area, "Save for keyboard" exports a song as a MIDI file so the keyboard's own lesson mode can use it:

1. Copy the file from the tablet's Downloads to a computer.
2. Connect the keyboard to the computer with the USB cable.
3. On the keyboard set Function 056 "Storage Mode" to ON and copy the file onto the keyboard drive.
4. Set Storage Mode back to OFF. Choose the song with [SONG], press LESSON until "WAITING" shows.

Storage Mode must be OFF again before playing with Piano Stars.

## Sources

- Built-in melodies and their licensing: [docs/songs-sources.md](docs/songs-sources.md)
- Fingering rules (Parncutt et al. 1997 model): [docs/references/parncutt-1997-fingering-model.md](docs/references/parncutt-1997-fingering-model.md)

## Install it on the tablet (once hosted)

Open the hosted address in Chrome on the tablet, wait for the page to load once, then use the Chrome menu and choose "Add to Home screen" (or "Install app"). After that it starts from the home screen, fullscreen and landscape, and works without internet.

Icons are generated by `node scripts/make-icons.mjs` (no dependencies).
