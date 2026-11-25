# Piano Stars: backlog

Things that are parked or worth doing later. None of them block normal use.

## Parked by the parent

- **Test "Save for keyboard" on the Yamaha PSR-E373.**
  In the parent area, press "Save for keyboard" on one song and follow the 4 steps the app shows:
  1. Copy the file to a computer.
  2. Connect the keyboard to the computer.
  3. Turn on Storage Mode (Function 056) and copy the file onto the keyboard.
  4. Turn Storage Mode off, choose the song with [SONG], and press LESSON until "WAITING" shows.

  Expected: the keyboard shows the notes and waits for each right key. If it doesn't, note what the keyboard did.

## Worth doing later

- Save and load your own songs as a file, so they can move between devices or web addresses. Songs are stored per address on the tablet, so a song typed on the test address didn't carry over to the hosted app.

- Accept notes only from the keyboard's channel 1, so a demo song or style playing on the keyboard isn't counted as presses.
- Stop the Android back gesture from leaving a song mid-way (a history guard on the play screens).
- Guard against a malformed MusicXML file with `divisions` = 0, which would give a Level 2 song that never ends.
- Turn an edited copy of a built-in song into a normal song if a future version ever removes that built-in. Otherwise it couldn't be deleted.
- Level 2 started while the app is hidden doesn't sync its pause until the app is shown again (rare edge case).
- Screen-reader labels are English-only in a few places, and a few extra tests are listed in the build log.
- Für Elise: possibly add the B section later, once the A section is easy for him.
