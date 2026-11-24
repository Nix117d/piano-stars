# Piano Stars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An installable, offline web app for an Android tablet that lights up the next key and finger for a child playing a Yamaha PSR-E373 over USB-MIDI, with a keys level, a rhythm level, 1–5 stars and medals, in Dutch and English.

**Architecture:** A Vite + TypeScript + Preact single-page app, installed as a PWA. Pure logic modules (pitch, parsers, fingering, sessions, scoring, export) have no DOM dependencies and are unit-tested with Vitest. Preact screens sit on top of these modules. Notes arrive through one `NoteSource` interface, fed by Web MIDI, by on-screen taps, or by a fake source in development. Data is kept in IndexedDB.

**Tech Stack:** TypeScript 5, Vite 5, Preact 10 (`@preact/preset-vite`), Vitest + jsdom, `fake-indexeddb` (tests), `idb`, `@tonejs/midi`, `fflate`, `vite-plugin-pwa`.

**Spec:** `docs/superpowers/specs/2026-11-24-piano-stars-design.md` (read it alongside this plan).

## Global Constraints

- Project root: `piano-stars/`. All paths below are relative to it.
- Target: Chrome on a Samsung Galaxy Tab S7+, landscape. Keyboard: Yamaha PSR-E373, 61 keys, MIDI 36 (C1) to 96 (C6). Middle C = C4 = MIDI 60.
- Web MIDI needs a secure context (HTTPS or `localhost`).
- The app makes **no sound** while a MIDI keyboard is connected, except the celebration sound on the results screen (switchable) and the optional metronome click in level 2 (off by default). The tap mode (no keyboard) plays notes.
- Touch targets the child taps: at least 64 px.
- Child UI language defaults to `nl`, parent UI to `en`. Each can be switched separately. All UI text comes from the translation files; song titles are never translated.
- Note names are letters C D E F G A B with `#`/`b`, in both languages.
- Fingering is right hand only, fingers 1 (thumb) to 5 (little finger). Generated fingering never has a thumb-under or finger-over crossing on a step. The hand moves to a new five-finger position at breaks (see Task 4).
- No lyrics are stored or shown. Built-in songs only when the melody is public domain, each with a recorded `melodySource`.
- No network calls at runtime, no analytics, no external links in the child UI.
- Feedback animations last under 500 ms.
- Commit messages end with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Keyboard unplugged mid-song.** Play pauses, the plug screen appears, and play resumes where it stopped once the keyboard is back. In level 2 the schedule shifts by the paused time. Tested in Task 1 (status events) and Task 12 (pause/resume shifts the schedule).
2. **A child mashing keys.** At most one mistake is counted per target note in level 1. In level 2, wrong presses cost a little but can never make the score negative. Tested in Tasks 9 and 12.
3. **Imported songs outside the keyboard's range.** Notes are shifted by whole octaves into MIDI 36–96 and the import review says so. Tested in Task 2 (`fitToKeyboard`) and Task 5.
4. **Velocity-0 note-ons, held keys and channel 10.** A note-on with velocity 0 is a note-off, a held key never re-triggers, and percussion is ignored. Tested in Task 1.
5. **Progress lost because the browser cleared its storage.** Call `navigator.storage.persist()` on first start. Settings and medals survive a reload. Tested in Task 7.

---

### Task 1: Project setup, MIDI input, and the hardware test page (GATE)

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `.gitignore`
- Create: `src/midi/note-source.ts`, `src/midi/midi-input.ts`, `src/midi/fake-source.ts`
- Create: `midi-test.html`, `src/midi-test.ts`
- Test: `tests/midi/midi-input.test.ts`

**Interfaces:**
- Produces:
  - `interface NoteEvent { midi: number; time: number }` (time in ms, `performance.now()` clock; Web MIDI's `event.timeStamp`)
  - `interface SourceStatus { connected: boolean; deviceName?: string }`
  - `interface NoteSource { onNoteOn(cb: (e: NoteEvent) => void): () => void; onStatus(cb: (s: SourceStatus) => void): () => void }`
  - `parseMidiMessage(data: Uint8Array): { type: 'noteOn' | 'noteOff'; midi: number; channel: number } | null` (channel 0-based)
  - `class MidiInput implements NoteSource { start(): Promise<'ok' | 'unsupported' | 'denied'> }`
  - `class FakeSource implements NoteSource { press(midi: number, time?: number): void; setConnected(c: boolean, name?: string): void }`

- [ ] **Step 1: Set up the project**

`git init` in `piano-stars/`. Create a Vite project with TypeScript and `@preact/preset-vite`, and add Vitest with the `jsdom` environment. Add the scripts `dev`, `build`, `preview` and `test` (`vitest run`). `vite.config.ts` has two build inputs, `index.html` and `midi-test.html`, and `server.host: true`.

- [ ] **Step 2: Write the failing tests**

```ts
// tests/midi/midi-input.test.ts
test('note-on is parsed with channel', () => {
  expect(parseMidiMessage(new Uint8Array([0x90, 60, 100]))).toEqual({ type: 'noteOn', midi: 60, channel: 0 });
});
test('note-on with velocity 0 is a note-off', () => {
  expect(parseMidiMessage(new Uint8Array([0x90, 60, 0]))).toEqual({ type: 'noteOff', midi: 60, channel: 0 });
});
test('note-off 0x80 is parsed', () => {
  expect(parseMidiMessage(new Uint8Array([0x81, 62, 40]))?.type).toBe('noteOff');
});
test('active sensing, clock and control change return null', () => {
  expect(parseMidiMessage(new Uint8Array([0xfe]))).toBeNull();
  expect(parseMidiMessage(new Uint8Array([0xf8]))).toBeNull();
  expect(parseMidiMessage(new Uint8Array([0xb0, 7, 100]))).toBeNull();
});
test('MidiInput ignores channel 10 and does not re-trigger a held key', () => {
  // Drive MidiInput through a stubbed navigator.requestMIDIAccess whose input
  // fires onmidimessage: [0x99,36,100] -> no event; [0x90,60,100] twice
  // without a note-off -> one event; after [0x80,60,0], [0x90,60,100] -> second event.
});
test('MidiInput reports connect and disconnect from statechange', () => {
  // stub access.onstatechange with port {type:'input', state:'connected', name:'Digital Keyboard'}
  // then state 'disconnected' -> statuses [{connected:true, deviceName:'Digital Keyboard'}, {connected:false}]
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run tests/midi/midi-input.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement `parseMidiMessage`, `MidiInput` and `FakeSource`**

`MidiInput.start()` calls `navigator.requestMIDIAccess({ sysex: false })`. It returns `'unsupported'` when that is missing and `'denied'` when it rejects. It listens on every input and re-attaches when `onstatechange` reports a new input. The source counts as connected when at least one input is in the `connected` state. `FakeSource.press` defaults `time` to `performance.now()`. It ignores channel index 9 and keeps a held-key set so a repeated note-on without a note-off is dropped.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/midi/midi-input.test.ts`
Expected: PASS.

- [ ] **Step 6: Build the hardware test page**

`midi-test.html` and `src/midi-test.ts` use `MidiInput`. They show, in big text, the connection status, the device name, and the last 10 notes as letter, octave and MIDI number (for example `E4 (64)`), with a "Start" button that calls `start()` (Chrome needs a user gesture for the permission prompt).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: project setup, MIDI input and hardware test page"
```

- [ ] **Step 8: Real-hardware check with the parent (GATE: stop here if it fails)**

Run `npm run dev` on the Mac. Install `adb` (`brew install android-platform-tools`). On the tablet, turn on Developer options → Wireless debugging and pair (`adb pair <ip:port>`, then `adb connect <ip:port>`). Then run `adb reverse tcp:5173 tcp:5173`, so the tablet's Chrome can open `http://localhost:5173/midi-test.html` as a secure page. Plug the PSR-E373 in (Storage Mode, Function 056, OFF). Press Start and allow MIDI.
Expected: the device name appears, and pressing C4, E4 and G4 on the keyboard shows `C4 (60)`, `E4 (64)`, `G4 (67)`; unplugging shows "not connected" and plugging back in reconnects.
If no device shows: try Settings → Developer options → USB configuration → MIDI with the keyboard plugged in. If it still fails, **stop and report back to the parent**. The spec says to revisit the native-app approach before building anything else.

---

### Task 2: Pitch helpers and the song model

**Files:**
- Create: `src/song/types.ts`, `src/song/pitch.ts`
- Test: `tests/song/pitch.test.ts`

**Interfaces:**
- Produces:
  - `type Finger = 1 | 2 | 3 | 4 | 5`
  - `interface Note { midi: number | null; beats: number; finger?: Finger }` (`midi: null` is a rest)
  - `type SongSource = 'builtin' | 'file' | 'typed'`; `type FingeringSource = 'sheet' | 'rules' | 'parent'`
  - `interface Song { id: string; title: string; source: SongSource; tempo: number; notes: Note[]; fingeringSource: FingeringSource; melodySource?: string; picture: string; hidden: boolean; createdAt: number }`
  - `const KEYBOARD_LOW = 36, KEYBOARD_HIGH = 96`
  - `parsePitch(token: string): number | null`
  - `midiToName(midi: number): { letter: 'C'|'D'|'E'|'F'|'G'|'A'|'B'; sharp: boolean; octave: number }` (black keys named as sharps)
  - `isBlack(midi: number): boolean`
  - `whiteIndex(midi: number): number` (count of white keys below; black keys get the index of the white key below them)
  - `fitToKeyboard(notes: Note[]): { notes: Note[]; octaveShift: number }`

- [ ] **Step 1: Write the failing tests**

```ts
test('plain letters are the middle-C octave', () => {
  expect(parsePitch('C')).toBe(60); expect(parsePitch('b')).toBe(71); expect(parsePitch('A')).toBe(69);
});
test('octave numbers, sharps and flats', () => {
  expect(parsePitch('C5')).toBe(72); expect(parsePitch('G3')).toBe(55);
  expect(parsePitch('C#')).toBe(61); expect(parsePitch('Db')).toBe(61);
  expect(parsePitch('F#4')).toBe(66); expect(parsePitch('Bb3')).toBe(58);
  expect(parsePitch('bb')).toBe(70); expect(parsePitch('eb')).toBe(63);
});
test('rejects junk', () => {
  expect(parsePitch('H')).toBeNull(); expect(parsePitch('C##')).toBeNull(); expect(parsePitch('')).toBeNull();
});
test('midiToName and isBlack', () => {
  expect(midiToName(61)).toEqual({ letter: 'C', sharp: true, octave: 4 });
  expect(isBlack(61)).toBe(true); expect(isBlack(64)).toBe(false);
});
test('fitToKeyboard shifts whole octaves into 36..96', () => {
  const r = fitToKeyboard([{ midi: 100, beats: 1 }, { midi: 98, beats: 1 }, { midi: null, beats: 1 }]);
  expect(r.octaveShift).toBe(-1);
  expect(r.notes.map(n => n.midi)).toEqual([88, 86, null]);
  expect(fitToKeyboard([{ midi: 60, beats: 1 }]).octaveShift).toBe(0);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/song/pitch.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/song/types.ts` and `src/song/pitch.ts`**

`fitToKeyboard` picks the smallest shift (in octaves, toward the middle) that puts the lowest and highest notes inside 36–96. When the song's span is wider than 60 semitones, it shifts to put the lowest note at or above 36 and leaves the rest unchanged.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/song/pitch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: pitch helpers and song model"
```

---

### Task 3: Typed notes reader and writer

**Files:**
- Create: `src/song/typed-notes.ts`
- Test: `tests/song/typed-notes.test.ts`

**Interfaces:**
- Consumes: `parsePitch`, `Note`, `KEYBOARD_LOW/HIGH` (Task 2)
- Produces:
  - `type TypedError = { start: number; end: number; token: string; code: 'unknownNote' | 'badFinger' | 'badTempo' | 'outOfRange' }`
  - `parseTypedNotes(text: string): { ok: true; tempo: number; notes: Note[] } | { ok: false; errors: TypedError[] }`
  - `serializeTypedNotes(tempo: number, notes: Note[]): string`

Grammar, from the spec. Tokens are separated by commas, spaces, `|` or new lines. A token is `PITCH` or `_` (rest), then an optional `(N)` finger 1–5, then any number of `-` (each adds one beat) or a single `/` (half a beat). An optional first line `tempo N` sets the tempo (20–300); the default is 80. Error `start`/`end` are character offsets in `text`.

- [ ] **Step 1: Write the failing tests**

```ts
test('the spec example', () => {
  const r = parseTypedNotes('C, D, E, C, C');
  expect(r.ok && r.notes.map(n => n.midi)).toEqual([60, 62, 64, 60, 60]);
  expect(r.ok && r.tempo).toBe(80);
});
test('spaces, bars and new lines all separate', () => {
  const r = parseTypedNotes('C D | E\nC');
  expect(r.ok && r.notes.length).toBe(4);
});
test('lengths, rests and halves', () => {
  const r = parseTypedNotes('C C- C--- C/ _ _-');
  expect(r.ok && r.notes.map(n => n.beats)).toEqual([1, 2, 4, 0.5, 1, 2]);
  expect(r.ok && r.notes[4].midi).toBeNull();
});
test('fingers in brackets, with length after', () => {
  const r = parseTypedNotes('E(3) G4(5)-');
  expect(r.ok && r.notes).toEqual([{ midi: 64, beats: 1, finger: 3 }, { midi: 67, beats: 2, finger: 5 }]);
});
test('tempo line', () => {
  const r = parseTypedNotes('tempo 90\nC D');
  expect(r.ok && r.tempo).toBe(90);
});
test('errors carry position and code', () => {
  const r = parseTypedNotes('C, X, E(7), C9');
  expect(r.ok).toBe(false);
  expect(!r.ok && r.errors.map(e => [e.token, e.code, e.start])).toEqual([
    ['X', 'unknownNote', 3], ['E(7)', 'badFinger', 6], ['C9', 'outOfRange', 12],
  ]);
});
test('serialize round-trips', () => {
  const src = 'tempo 100\nC(1) D(2)- _ E/';
  const r = parseTypedNotes(src);
  if (!r.ok) throw new Error();
  expect(parseTypedNotes(serializeTypedNotes(r.tempo, r.notes))).toEqual(r);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/song/typed-notes.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `parseTypedNotes` and `serializeTypedNotes` in `src/song/typed-notes.ts`**

`serializeTypedNotes` writes `tempo N` on the first line, then the notes separated by spaces, using sharps for black keys. It adds the octave number only when it isn't 4, and the finger only when it is set.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/song/typed-notes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: typed notes reader and writer"
```

---

### Task 4: Fingering engine

**Files:**
- Create: `src/fingering/parncutt.ts`, `src/fingering/assign.ts`, `src/fingering/positions.ts`
- Test: `tests/fingering/assign.test.ts`, `tests/fingering/positions.test.ts`

**Interfaces:**
- Consumes: `Note`, `Finger`, `whiteIndex` (Task 2)
- Produces:
  - `SPAN_TABLE: Record<'12'|'13'|'14'|'15'|'23'|'24'|'25'|'34'|'35'|'45', { minPrac: number; minComf: number; minRel: number; maxRel: number; maxComf: number; maxPrac: number }>`
  - `transitionCost(from: Finger, to: Finger, fromMidi: number, toMidi: number, atBreak: boolean): number`
  - `assignFingering(notes: Note[]): Note[]` (keeps fingers already set, fills the rest; rests are left alone)
  - `interface HandPosition { startIndex: number; fingerKeys: Partial<Record<Finger, number>> }`
  - `handPositions(notes: Note[]): HandPosition[]` (indexes refer to the input array, rests included)

The design fixes the method. Copy **Table 1 (finger-pair spans, right hand, in semitones)** and the rule definitions from Parncutt et al. 1997 (PDF: `https://static.uni-graz.at/fileadmin/_Persoenliche_Webseite/parncutt_richard/Pdfs/PaSlClRaDe97_FingeringModel.pdf`) into `parncutt.ts`, with a comment citing the page. Do not use values from memory. Cite Jacobs (2001) only if the paper's table is ambiguous.

`transitionCost` is the sum of:
- Parncutt's rules that apply to a pair of consecutive notes: Stretch, Small-Span, Large-Span, Weak-Finger, the 3-4 / 4-on-black rules, Thumb-on-Black, Five-on-Black, and Thumb-Passing (taken as written in the paper). These apply only when the transition is *not* a hand move (below).
- **Beginner rules (ours, from the design):**
  - **Hand move:** the finger direction disagrees with the pitch direction (a higher note with a lower or the same finger, or the reverse), or the interval lies outside `[minPrac, maxPrac]` for the pair. It costs **+10 at a break**. Away from a break it costs **+40 if the interval is 3 semitones or more** (lifting the hand to a new place) and **+1000 if it is 1–2 semitones** (that would be a thumb-under or finger-over crossing, which is never taught here).
  - +5 when the same pitch repeats with a different finger.
  - +3 per semitone a note-to-note interval lies outside `[minComf, maxComf]`, since a 5-year-old's hand is small.
- **Tie-break:** at equal cost, prefer the path whose first note has the lower finger number.

`assignFingering` runs a Viterbi search over five states (fingers) per pitched note. Rests are skipped, but they mark the next transition as `atBreak`, as does a previous note with `beats >= 2`. Fixed fingers allow only one state.

Also export `crossesOnStep(notes: Note[]): number[]` from `assign.ts`. It returns the indexes of transitions that are a hand move of 1–2 semitones not at a break. Tests here and in Task 15 use it.

`handPositions` groups consecutive pitched notes into one position while no finger maps to two different keys. A new position starts at the first conflicting note.

- [ ] **Step 1: Write the failing tests**

```ts
const seq = (s: string) => { const r = parseTypedNotes(s); if (!r.ok) throw new Error(); return r.notes; };
const fingers = (s: string) => assignFingering(seq(s)).filter(n => n.midi !== null).map(n => n.finger);

test('C position scale', () => { expect(fingers('C D E F G')).toEqual([1, 2, 3, 4, 5]); });
test('Ode to Joy opening stays in C position', () => {
  expect(fingers('E E F G G F E D C C D E E- D/ D-')).toEqual([3,3,4,5,5,4,3,2,1,1,2,3,3,2,2]);
});
test('no crossings on steps when the melody has breaks to move at', () => {
  expect(crossesOnStep(assignFingering(seq('C D E F G- A B C5- B A G F E- D C')))).toEqual([]);
});
test('a hand move happens at the long note, not mid-run', () => {
  const f = assignFingering(seq('C D E F G- A B C5'));
  expect(handPositions(f).map(p => p.startIndex)).toEqual([0, 5]);
});
test('shift happens at the rest, not mid-phrase', () => {
  // C-position phrase, rest, then a phrase needing A and B
  const f = assignFingering(seq('C D E F G- _ A B A G'));
  expect(f.slice(0, 5).map(n => n.finger)).toEqual([1, 2, 3, 4, 5]);
  expect(handPositions(f).map(p => p.startIndex)).toEqual([0, 6]);
});
test('keeps fingers set by the sheet or parent', () => {
  expect(fingers('C(2) D E')).toEqual([2, 3, 4]);
});
test('SPAN_TABLE has all ten right-hand pairs', () => {
  expect(Object.keys(SPAN_TABLE).sort()).toEqual(['12','13','14','15','23','24','25','34','35','45']);
});
test('handPositions for one C position', () => {
  const p = handPositions(assignFingering(seq('E E F G G F E D C')));
  expect(p).toEqual([{ startIndex: 0, fingerKeys: { 1: 60, 2: 62, 3: 64, 4: 65, 5: 67 } }]);
});
```

`handPositions` fills `fingerKeys` for all five fingers of a position. It fills fingers that the notes don't use by stepping along white keys from the nearest used finger, which is why the last test expects all five fingers.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/fingering`
Expected: FAIL.

- [ ] **Step 3: Implement `parncutt.ts`, `assign.ts` and `positions.ts` as described above**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/fingering`
Expected: PASS. If the Ode to Joy test fails, adjust only the beginner-rule weights listed above, never the paper's table, and record the final weights in a comment.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: fingering engine (Parncutt et al. 1997 + beginner rules)"
```

---

### Task 5: MusicXML and MXL import

**Files:**
- Create: `src/song/import-result.ts`, `src/song/musicxml.ts`
- Create: `tests/fixtures/simple.musicxml`, `tests/fixtures/chord-tie-rest.musicxml`, `tests/fixtures/fingered.musicxml`, `tests/fixtures/high.musicxml`, `tests/fixtures/simple.mxl`
- Test: `tests/song/musicxml.test.ts`

**Interfaces:**
- Consumes: `Note`, `fitToKeyboard` (Task 2)
- Produces:
  - `type ImportResult = { ok: true; title?: string; tempo: number; notes: Note[]; hasFingering: boolean; octaveShift: number } | { ok: false; reason: 'noNotes' | 'unreadable' }`
  - `parseMusicXml(xml: string): ImportResult`
  - `parseMxl(bytes: Uint8Array): ImportResult`

Rules from the spec: use the first `<part>`, `<staff>` 1 (or no staff element), and `<voice>` 1. In a chord (`<chord/>`), keep the highest pitch. Rests become `{ midi: null }`. Merge a note that has a tie stop into the previous note's beats. `<technical><fingering>` sets `finger`. Beats = `duration / divisions`. The tempo comes from `<sound tempo>` or else `<metronome><per-minute>`, with 80 as the default. The title comes from `<work-title>` or else `<movement-title>`. Skip `<backup>`/`<forward>` content from other voices. Don't expand repeats. Always pass the result through `fitToKeyboard`. For MXL, `fflate.unzipSync`, then read `META-INF/container.xml` → `rootfile full-path`.

- [ ] **Step 1: Write the fixtures and failing tests**

Hand-write small fixtures, each under 60 lines of MusicXML.

```ts
test('simple melody, title and tempo', () => {
  const r = parseMusicXml(read('simple.musicxml'));          // C D E C quarters, work-title "Test", tempo 100
  expect(r).toMatchObject({ ok: true, title: 'Test', tempo: 100, hasFingering: false, octaveShift: 0 });
  expect(r.ok && r.notes.map(n => n.midi)).toEqual([60, 62, 64, 60]);
});
test('chord keeps top note, tie merges, rest kept', () => {
  const r = parseMusicXml(read('chord-tie-rest.musicxml')); // [C+E chord] [G tied G] [rest] [C]
  expect(r.ok && r.notes).toEqual([
    { midi: 64, beats: 1 }, { midi: 67, beats: 2 }, { midi: null, beats: 1 }, { midi: 60, beats: 1 },
  ]);
});
test('fingering marks are read', () => {
  const r = parseMusicXml(read('fingered.musicxml'));       // C(1) D(2) E(3)
  expect(r.ok && r.hasFingering).toBe(true);
  expect(r.ok && r.notes.map(n => n.finger)).toEqual([1, 2, 3]);
});
test('out-of-range song is shifted into the keyboard', () => {
  const r = parseMusicXml(read('high.musicxml'));            // notes around C8 (108)
  expect(r.ok && r.octaveShift).toBeLessThan(0);
  expect(r.ok && Math.max(...r.notes.map(n => n.midi ?? 0))).toBeLessThanOrEqual(96);
});
test('mxl unzips to the same song', () => {
  expect(parseMxl(readBytes('simple.mxl'))).toEqual(parseMusicXml(read('simple.musicxml')));
});
test('garbage and empty files', () => {
  expect(parseMusicXml('not xml')).toEqual({ ok: false, reason: 'unreadable' });
  expect(parseMusicXml('<score-partwise><part-list/><part id="P1"/></score-partwise>')).toEqual({ ok: false, reason: 'noNotes' });
});
```

Make `simple.mxl` from `simple.musicxml` with a small script using `fflate.zipSync`, committed as a fixture.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/song/musicxml.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `parseMusicXml` and `parseMxl` with `DOMParser`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/song/musicxml.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: MusicXML and MXL import"
```

---

### Task 6: MIDI file import

**Files:**
- Create: `src/song/midi-file.ts`
- Test: `tests/song/midi-file.test.ts`

**Interfaces:**
- Consumes: `ImportResult` (Task 5), `fitToKeyboard` (Task 2)
- Produces: `parseMidiFile(bytes: Uint8Array): ImportResult` (`hasFingering` is always `false`)

Rules: using `@tonejs/midi`, pick the first track that has notes and whose channel isn't 9. At the same tick, keep the highest note. Beats = `durationTicks / ppq`, rounded to the nearest 0.25. A gap of at least 0.25 beats between one note's end and the next note's start becomes a rest. The tempo is the first tempo event (rounded), or 80. The title is the track or header name, if any.

- [ ] **Step 1: Write the failing tests**

Build the input files inside the tests with `new Midi()` from `@tonejs/midi` and `toArray()`.

```ts
test('picks first non-percussion track, top note of chords, rests from gaps', () => {
  // track 0: channel 9 drums; track 1: channel 0, C+E at tick 0 (1 beat), G at beat 2 (1 beat)
  const r = parseMidiFile(bytes);
  expect(r.ok && r.notes).toEqual([{ midi: 64, beats: 1 }, { midi: null, beats: 1 }, { midi: 67, beats: 1 }]);
});
test('tempo from file', () => { /* header.setTempo(120) */ expect(r.ok && r.tempo).toBe(120); });
test('no usable notes', () => { /* only a percussion track */ expect(r).toEqual({ ok: false, reason: 'noNotes' }); });
test('garbage', () => { expect(parseMidiFile(new Uint8Array([1, 2, 3]))).toEqual({ ok: false, reason: 'unreadable' }); });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/song/midi-file.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `parseMidiFile`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/song/midi-file.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: MIDI file import"
```

---

### Task 7: Storage and settings

**Files:**
- Create: `src/store/db.ts`
- Test: `tests/store/db.test.ts` (uses `fake-indexeddb/auto`)

**Interfaces:**
- Consumes: `Song` (Task 2)
- Produces:
  - `type Level = 1 | 2`; `type Speed = 'slow' | 'medium' | 'normal'`; `type Lang = 'nl' | 'en'`
  - `interface Settings { level2Enabled: boolean; childLang: Lang; parentLang: Lang; metronomeClick: boolean; celebrationSound: boolean; speeds: Record<string, Speed>; hiddenBuiltins: string[] }`
  - `const DEFAULT_SETTINGS: Settings = { level2Enabled: false, childLang: 'nl', parentLang: 'en', metronomeClick: false, celebrationSound: true, speeds: {}, hiddenBuiltins: [] }`
  - `listUserSongs(): Promise<Song[]>`, `saveSong(s: Song): Promise<void>`, `deleteSong(id: string): Promise<void>`
  - `getBest(songId: string, level: Level): Promise<number>` (0 = never finished)
  - `recordResult(songId: string, level: Level, stars: number): Promise<{ best: number; improved: boolean }>`
  - `resetMedals(): Promise<void>`
  - `getSettings(): Promise<Settings>`, `saveSettings(s: Settings): Promise<void>`
  - `requestPersistence(): Promise<boolean>` (wraps `navigator.storage?.persist?.()`; returns false if missing)

The database is `piano-stars` version 1, with the stores `songs` (key `id`), `results` (key `${songId}:${level}`) and `settings` (key `'settings'`). Built-in songs are not stored; only their hidden flags are kept, in settings.

- [ ] **Step 1: Write the failing tests**

```ts
test('settings default and persist', async () => {
  expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  await saveSettings({ ...DEFAULT_SETTINGS, level2Enabled: true });
  expect((await getSettings()).level2Enabled).toBe(true);
});
test('best result only improves', async () => {
  expect(await recordResult('s1', 1, 3)).toEqual({ best: 3, improved: true });
  expect(await recordResult('s1', 1, 2)).toEqual({ best: 3, improved: false });
  expect(await getBest('s1', 2)).toBe(0);
});
test('reset medals clears results only', async () => {
  await saveSong(song('a')); await recordResult('a', 1, 5); await resetMedals();
  expect(await getBest('a', 1)).toBe(0); expect((await listUserSongs()).length).toBe(1);
});
test('requestPersistence tolerates a missing API', async () => {
  expect(await requestPersistence()).toBe(false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/store/db.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/store/db.ts` with `idb`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/store/db.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: IndexedDB storage and settings"
```

---

### Task 8: Translations

**Files:**
- Create: `src/i18n/nl.ts`, `src/i18n/en.ts`, `src/i18n/index.ts`
- Test: `tests/i18n/i18n.test.ts`

**Interfaces:**
- Consumes: `Lang` (Task 7)
- Produces: `type TKey = keyof typeof en`; `t(lang: Lang, key: TKey, params?: Record<string, string | number>): string` (`{name}` placeholders)

Child keys and exact copy:

| key | nl | en |
|---|---|---|
| `picker.title` | Kies een liedje | Pick a song |
| `level.keys` | Toetsen | Keys |
| `level.rhythm` | Ritme | Rhythm |
| `hand.title` | Zet je hand hier | Put your hand here |
| `hand.thumbOn` | Duim op de {note} | Thumb on {note} |
| `play.next` | Volgende | Next |
| `plug.title` | Sluit het keyboard aan | Plug in the keyboard |
| `plug.tap` | Of tik op de toetsen | Or tap the keys |
| `results.again` | Nog een keer | Play again |
| `results.other` | Ander liedje | Another song |
| `medals.title` | Mijn medailles | My medals |

The parent-area keys (`parent.*`, for every label in Tasks 14–16) are written by the implementer in both languages. They have to be plain and short.

- [ ] **Step 1: Write the failing tests**

```ts
test('both languages have exactly the same keys', () => {
  expect(Object.keys(nl).sort()).toEqual(Object.keys(en).sort());
});
test('no empty strings', () => { for (const v of [...Object.values(nl), ...Object.values(en)]) expect(v.trim()).not.toBe(''); });
test('placeholders', () => { expect(t('nl', 'hand.thumbOn', { note: 'C' })).toBe('Duim op de C'); });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/i18n`
Expected: FAIL.

- [ ] **Step 3: Implement the files**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/i18n`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: Dutch and English translations"
```

---

### Task 9: Level 1 session and scoring

**Files:**
- Create: `src/play/level1.ts`, `src/play/scoring.ts`
- Test: `tests/play/level1.test.ts`, `tests/play/scoring.test.ts`

**Interfaces:**
- Consumes: `Note` (Task 2)
- Produces:
  - `class Level1Session { constructor(notes: Note[]); current(): { index: number; note: Note } | null; press(midi: number): 'correct' | 'wrong' | 'ignored'; readonly mistakes: number; readonly total: number; progress(): { done: number; total: number }; isDone(): boolean }` (rests are dropped; `index` is the position in the original `notes` array, so `handPositions` lines up; after it's done, `press` returns `'ignored'`)
  - `starsLevel1(mistakes: number, total: number): 1 | 2 | 3 | 4 | 5`
  - `interface Level2Result { onTime: number; close: number; missed: number; wrongPresses: number; total: number }`
  - `starsLevel2(r: Level2Result): 1 | 2 | 3 | 4 | 5`
  - `type Medal = 'none' | 'bronze' | 'silver' | 'gold'`; `medalFor(stars: number): Medal`

Values (the design leaves these to the builder; this plan fixes them):
- Level 1: r = mistakes / total. 5★ if mistakes = 0; 4★ if r ≤ 0.10; 3★ if r ≤ 0.25; 2★ if r ≤ 0.50; else 1★.
- Level 2: a = max(0, (onTime + 0.5·close − 0.25·wrongPresses) / total). 5★ if a ≥ 0.95; 4★ if a ≥ 0.85; 3★ if a ≥ 0.70; 2★ if a ≥ 0.50; else 1★.
- Medal: 0 → none, 1–2 → bronze, 3–4 → silver, 5 → gold.

- [ ] **Step 1: Write the failing tests**

```ts
test('exact key only, octave matters', () => {
  const s = new Level1Session(seq('C D'));
  expect(s.press(72)).toBe('wrong');    // C5 is not C4
  expect(s.press(60)).toBe('correct');
  expect(s.current()?.note.midi).toBe(62);
});
test('at most one mistake per target note', () => {
  const s = new Level1Session(seq('C D'));
  s.press(61); s.press(63); s.press(65); s.press(60); s.press(64); s.press(62);
  expect(s.mistakes).toBe(2); expect(s.isDone()).toBe(true);
});
test('rests are skipped but indexes refer to the original array', () => {
  const s = new Level1Session(seq('C _ D'));
  s.press(60); expect(s.current()?.index).toBe(2);
});
test('stars level 1', () => {
  expect(starsLevel1(0, 20)).toBe(5); expect(starsLevel1(2, 20)).toBe(4);
  expect(starsLevel1(5, 20)).toBe(3); expect(starsLevel1(10, 20)).toBe(2); expect(starsLevel1(20, 20)).toBe(1);
});
test('stars level 2 never below 1, mashing costs', () => {
  expect(starsLevel2({ onTime: 20, close: 0, missed: 0, wrongPresses: 0, total: 20 })).toBe(5);
  expect(starsLevel2({ onTime: 20, close: 0, missed: 0, wrongPresses: 60, total: 20 })).toBe(1); // (20-15)/20 = 0.25
  expect(starsLevel2({ onTime: 16, close: 2, missed: 2, wrongPresses: 0, total: 20 })).toBe(4);  // 17/20 = 0.85
  expect(starsLevel2({ onTime: 14, close: 4, missed: 2, wrongPresses: 0, total: 20 })).toBe(3);  // 16/20 = 0.80
});
test('medals', () => { expect([0,1,2,3,4,5].map(medalFor)).toEqual(['none','bronze','bronze','silver','silver','gold']); });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/play/level1.test.ts tests/play/scoring.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `level1.ts` and `scoring.ts`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/play/level1.test.ts tests/play/scoring.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: level 1 session and star scoring"
```

---

### Task 10: Keyboard, key strip and hand components

**Files:**
- Create: `src/ui/colors.ts`, `src/ui/range.ts`, `src/ui/Keyboard.tsx`, `src/ui/KeyStrip.tsx`, `src/ui/Hand.tsx`, `src/ui/styles.css`
- Test: `tests/ui/range.test.ts`, `tests/ui/Keyboard.test.tsx` (`@testing-library/preact`)

**Interfaces:**
- Consumes: `isBlack`, `midiToName`, `Finger`, `KEYBOARD_LOW/HIGH` (Task 2)
- Produces:
  - `NOTE_COLORS: Record<'C'|'D'|'E'|'F'|'G'|'A'|'B', string>` = C `#E53935`, D `#FB8C00`, E `#FDD835`, F `#43A047`, G `#00ACC1`, A `#1E88E5`, B `#8E24AA`
  - `keyColor(midi: number): string` (a black key gets its lower white neighbour's color, darkened 35%)
  - `visibleRange(midis: number[]): { low: number; high: number }`: low = 12·⌊min/12⌋, high = max(low + 12, 12·⌈max/12⌉), clamped to 36–96
  - `<Keyboard low high glow?: { midi: number; finger?: Finger } wobble?: number sparkle?: number middleC onTap?: (midi: number) => void />`
  - `<KeyStrip low high />` (all 61 keys, with low–high marked)
  - `<Hand highlight?: Finger color?: string />` (an original right-hand SVG, fingers labelled 1–5)

- [ ] **Step 1: Write the failing tests**

```ts
test('visibleRange whole octaves, at least one', () => {
  expect(visibleRange([60, 67])).toEqual({ low: 60, high: 72 });
  expect(visibleRange([60, 72])).toEqual({ low: 60, high: 72 });
  expect(visibleRange([55, 64])).toEqual({ low: 48, high: 72 });
  expect(visibleRange([64])).toEqual({ low: 60, high: 72 });
});
test('Keyboard renders the range, letters, glow finger and middle C marker', () => {
  render(<Keyboard low={60} high={72} glow={{ midi: 64, finger: 3 }} middleC />);
  expect(screen.getAllByTestId(/^key-/)).toHaveLength(13);
  expect(screen.getByTestId('key-64')).toHaveAttribute('data-glow', 'true');
  expect(within(screen.getByTestId('key-64')).getByText('3')).toBeTruthy();
  expect(screen.getByTestId('middle-c-marker')).toBeTruthy();
});
test('onTap reports the key', () => {
  const onTap = vi.fn(); render(<Keyboard low={60} high={72} onTap={onTap} />);
  fireEvent.pointerDown(screen.getByTestId('key-62')); expect(onTap).toHaveBeenCalledWith(62);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/ui`
Expected: FAIL.

- [ ] **Step 3: Implement the components**

White keys are at least 64 px wide on the S7+ (2800×1752) for a two-octave range. Each white key shows its letter at the bottom, in its note color. A glowing key gets a pulsing glow and a big circled finger number. A wobble is a 300 ms shake, and a sparkle is a 400 ms burst (CSS keyframes).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/ui`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: keyboard, key strip and hand components"
```

---

### Task 11: App shell, song picker, hand placement, level 1 play, results and medal wall

**Files:**
- Create: `src/App.tsx`, `src/songs/library.ts`, `src/songs/pictures.ts`, `src/songs/builtin/index.ts` (exports `BuiltinSong` and an empty `BUILTIN_SONGS`; Task 15 fills it), `src/ui/Character.tsx`, `src/ui/HoldButton.tsx`, `src/audio/synth.ts`
- Create: `src/screens/Picker.tsx`, `src/screens/HandPlacement.tsx`, `src/screens/PlayLevel1.tsx`, `src/screens/PlugIn.tsx`, `src/screens/Results.tsx`, `src/screens/Medals.tsx`
- Modify: `src/main.tsx`
- Test: `tests/screens/level1-flow.test.tsx`, `tests/songs/library.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–10
- Produces:
  - `loadLibrary(settings: Settings): Promise<Song[]>`: the built-ins (from `src/songs/builtin/index.ts`, which is an empty array until Task 15) parsed with `parseTypedNotes` and `assignFingering` (`fingeringSource: 'rules'`), followed by the user songs, minus hidden songs
  - `PICTURES: string[]` (30 distinct emoji, for example 🚢 🐴 👀 🚪 🎒 🍬 👋 🌸 🎹 ⭐ 🐸 🦊 🐻 🐢 🐳 🦋 🚂 🚀 🌈 ☀️ 🌙 🍎 🎁 🎈 🥁 🐝 🦁 🐧 🦉 🐞); `freePicture(used: string[]): string`
  - `<HoldButton ms={3000} onHold={() => void} />`
  - `synth.playNote(midi, ms)`, `synth.celebrate()`, `synth.click()` (Web Audio, original sounds)
  - App state: `screen: 'picker' | 'hand' | 'play1' | 'play2' | 'results' | 'medals' | 'parent'`, `source: NoteSource` (a `MidiInput`, or `FakeSource` when `import.meta.env.DEV` and `?fake` is in the URL; dev maps computer keys `a s d f g h j k` to C4–C5 white keys)

Behaviour from the spec:
- **Picker:** a grid of cards (picture, title, best stars for level 1, and for level 2 when it's on). With level 2 off, a tap goes straight to the hand screen. With it on, the card shows the buttons 1 (Keys) and 2 (Rhythm, with a drum). The medal wall button sits at the top right, and a `HoldButton` in the top-left corner opens the parent area.
- **Hand placement:** the Keyboard shows the first `HandPosition` with every finger number on its key, `<Hand>` sits above, and the thumb key has a marker with `hand.thumbOn`. Pressing the first note's key starts play and counts as that first note.
- **Play level 1:** Keyboard (range from `visibleRange`), KeyStrip, Hand highlighting the current finger in its key color, the next-up strip with the next 4 notes (letter·finger bubbles), a progress row and `<Character>` hopping onto the glowing key. A correct press sparkles and the character hops, with **no sound**. A wrong press wobbles and the character shakes its head, with no sound. When the next note starts a new `HandPosition`, the Hand slides and the new thumb marker shows for 800 ms before the glow moves. The home button needs a second tap within 3 s.
- **Plug-in screen:** shown whenever `SourceStatus.connected` is false during play. Play pauses there. Its "tap the keys" option switches to tap mode, where the Keyboard's `onTap` feeds the session and `synth.playNote` sounds. Play resumes on reconnect.
- **Results:** stars fly in one at a time (300 ms each), with confetti and a dancing character. `synth.celebrate()` plays only if `celebrationSound` is on. `recordResult` is called. The buttons are Play again and Another song.
- **Medal wall:** every visible song with a medal per level (`medalFor(best)`), and level 2 medals only when level 2 is on.
- **Character:** an original frog in SVG. No TV or Sinterklaas characters.
- `main.tsx` calls `requestPersistence()` once at start-up.

- [ ] **Step 1: Write the failing tests**

```ts
test('library adds rules fingering to built-ins and drops hidden songs', async () => {
  // with a stub builtin list of one typed song 'C D E', hiddenBuiltins: []
  const lib = await loadLibrary(DEFAULT_SETTINGS);
  expect(lib[0].notes.map(n => n.finger)).toEqual([1, 2, 3]);
  expect(lib[0].fingeringSource).toBe('rules');
  expect(await loadLibrary({ ...DEFAULT_SETTINGS, hiddenBuiltins: [lib[0].id] })).toHaveLength(0);
});
test('freePicture avoids used pictures', () => { expect(freePicture(PICTURES.slice(0, 29))).toBe(PICTURES[29]); });
test('full level-1 flow with FakeSource', async () => {
  // render <App source={fake}/> with one song 'C D E'; tap its card; hand screen shows 'Duim op de C';
  // fake.press(60) -> play screen glow on 62 with finger 2; fake.press(61) -> wobble on 61;
  // fake.press(62), fake.press(64) -> results screen showing starsLevel1(1, 3) stars
});
test('unplugging pauses and shows the plug screen; reconnect resumes at the same note', async () => {
  // during play: fake.setConnected(false) -> plug screen; fake.setConnected(true) -> glow still on same key
});
test('no sound is played on correct or wrong presses while connected', async () => {
  // spy on synth.playNote; press right and wrong keys via fake -> not called
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/screens tests/songs`
Expected: FAIL.

- [ ] **Step 3: Implement the shell and screens**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/screens tests/songs`
Expected: PASS.

- [ ] **Step 5: Check in the browser**

Run `npm run dev`, open `http://localhost:5173/?fake` at 1400×876 (the S7+ CSS viewport in landscape), and play a test song with the `a s d f` keys.
Expected: the hand screen, then glow, sparkle, wobble and hand slide work, the results show stars, and nothing overflows the screen.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: child screens and level 1 play"
```

---

### Task 12: Level 2 rhythm

**Files:**
- Create: `src/play/level2.ts`, `src/screens/PlayLevel2.tsx`
- Modify: `src/App.tsx` (route `play2`)
- Test: `tests/play/level2.test.ts`

**Interfaces:**
- Consumes: `Note` (Task 2), `Level2Result`, `starsLevel2` (Task 9), `Speed` (Task 7), `synth.click` (Task 11)
- Produces:
  - `const ON_TIME_MS = 150, CLOSE_MS = 300, COUNT_IN_BEATS = 4`
  - `const SPEED_FACTOR: Record<Speed, number> = { slow: 0.6, medium: 0.8, normal: 1.0 }`
  - `interface Scheduled { index: number; midi: number; time: number }` (`index` refers to the original notes array)
  - `scheduleNotes(notes: Note[], tempo: number, speed: Speed, startTime: number): { targets: Scheduled[]; beatMs: number; endTime: number }`: beatMs = 60000 / (tempo · factor); the first note lands at startTime + 4·beatMs; rests take up time but aren't targets
  - `class Level2Session { constructor(s: ReturnType<typeof scheduleNotes>); press(midi: number, time: number): { kind: 'onTime' | 'close'; index: number } | { kind: 'wrong' }; tick(now: number): number[] /* indexes newly missed */; pause(now: number): void; resume(now: number): void; isDone(now: number): boolean; result(): Level2Result }`

Rules: a press matches the earliest unjudged target with the same pitch within ±`CLOSE_MS`. It's `onTime` within ±`ON_TIME_MS`, otherwise `close`. Any other press is `wrong`. A target with no match by `time + CLOSE_MS` is missed. `resume` shifts all unjudged targets and `endTime` by the paused time. The default speed is `'slow'` unless `settings.speeds[songId]` says otherwise.

Screen: a 4-beat count-in (four dots fill, the character bounces). Then falling bubbles (letter·finger, in the note's color) drop onto their key and reach the "play now" line at their `time`. The Keyboard, Hand and KeyStrip are the same as in level 1. The sparkle is big for onTime and small for close, and a missed or wrong note gets the wobble. `synth.click()` plays on each beat only when `metronomeClick` is on. Pause on disconnect works as in level 1. Animations run on `requestAnimationFrame` and timing uses `NoteEvent.time`.

- [ ] **Step 1: Write the failing tests**

```ts
const sched = () => scheduleNotes(seq('tempo 60\nC D _ E'), 60, 'normal', 0); // beatMs 1000
test('schedule: count-in then beats, rests take time', () => {
  expect(sched().targets.map(t => t.time)).toEqual([4000, 5000, 7000]);
  expect(scheduleNotes(seq('C'), 60, 'slow', 0).beatMs).toBeCloseTo(1666.67, 1);
});
test('on time, close, wrong, missed', () => {
  const s = new Level2Session(sched());
  expect(s.press(60, 4100)).toEqual({ kind: 'onTime', index: 0 });
  expect(s.press(62, 5250)).toEqual({ kind: 'close', index: 1 });
  expect(s.press(65, 5300)).toEqual({ kind: 'wrong' });
  expect(s.tick(7400)).toEqual([3]);
  expect(s.result()).toEqual({ onTime: 1, close: 1, missed: 1, wrongPresses: 1, total: 3 });
});
test('pause and resume shift unjudged targets', () => {
  const s = new Level2Session(sched());
  s.pause(3500); s.resume(5500);                 // 2 s paused during the count-in
  expect(s.tick(5000)).toEqual([]);              // nothing missed while paused
  expect(s.press(60, 6100)).toEqual({ kind: 'onTime', index: 0 }); // target moved 4000 -> 6000
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/play/level2.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `level2.ts` and `PlayLevel2.tsx`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/play/level2.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: level 2 rhythm mode"
```

---

### Task 13: Parent area: songs, import review and editor

**Files:**
- Create: `src/screens/parent/ParentHome.tsx`, `src/screens/parent/SongEditor.tsx`, `src/screens/parent/ImportReview.tsx`, `src/screens/parent/PicturePicker.tsx`
- Modify: `src/App.tsx`, `src/i18n/nl.ts`, `src/i18n/en.ts`
- Test: `tests/screens/parent-songs.test.tsx`

**Interfaces:**
- Consumes: `parseTypedNotes`, `serializeTypedNotes` (Task 3), `assignFingering` (Task 4), `parseMusicXml`, `parseMxl` (Task 5), `parseMidiFile` (Task 6), db functions (Task 7), `t` (Task 8), `freePicture`, `PICTURES`, `synth.playNote` (Task 11)
- Produces: `songFromImport(r: ImportResult & { ok: true }, fileName: string, picture: string): Song` and `songFromTyped(title: string, text: string, picture: string): Song | TypedError[]` (both in `src/screens/parent/song-factory.ts`)

Behaviour:
- **Parent home:** opened by the 3-second hold, and uses `parentLang`. It lists all songs (built-ins first, marked). Its buttons are Add from file (`<input type=file accept=".musicxml,.xml,.mxl,.mid,.midi">`), Type notes, and for each song Edit, Picture, Hide/Show (built-ins), Delete (user songs, with a confirm) and Speed (slow/medium/normal). It also has Reset medals (with a confirm), a Settings link (Task 14), and the keyboard status with the device name.
- **Import review:** shows the title (editable), the notes as `serializeTypedNotes` text with finger numbers, a note when `octaveShift ≠ 0` ("Moved N octave(s) to fit the keyboard"), Preview (plays through `synth.playNote` at tempo), Fix notes (opens the editor) and Save/Cancel. If the import failed, a plain message by reason and no save.
- **Editor:** a textarea with the typed-notes text. Errors are underlined by `start`/`end` with a friendly message per `code`, and Save is disabled while there are errors. It also has Preview and a picture picker. When saving, any finger the parent typed sets `fingeringSource: 'parent'`, and the missing fingers are filled by `assignFingering`.
- Fingering source for imports: `'sheet'` when `hasFingering`, else `'rules'`.

- [ ] **Step 1: Write the failing tests**

```ts
test('songFromImport uses file name when no title and sheet fingering when present', () => {
  const s = songFromImport({ ok: true, tempo: 80, notes: [{ midi: 60, beats: 1, finger: 1 }], hasFingering: true, octaveShift: 0 }, 'twinkle.mid', '⭐');
  expect(s).toMatchObject({ title: 'twinkle', source: 'file', fingeringSource: 'sheet' });
});
test('songFromTyped fills missing fingers and marks parent fingering', () => {
  const s = songFromTyped('Test', 'C(1) D E', '🐸');
  expect(!Array.isArray(s) && s.notes.map(n => n.finger)).toEqual([1, 2, 3]);
  expect(!Array.isArray(s) && s.fingeringSource).toBe('parent');
});
test('editor blocks save with errors', async () => {
  // type 'C, X' -> Save disabled, error text for unknownNote visible
});
test('octave shift note is shown on import review', async () => { /* octaveShift -1 -> message visible */ });
test('delete asks for confirmation', async () => { /* click delete -> confirm dialog; cancel keeps song */ });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/screens/parent-songs.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement the parent song screens and `song-factory.ts`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/screens/parent-songs.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: parent area songs, import review and editor"
```

---

### Task 14: Parent settings and language switching

**Files:**
- Create: `src/screens/parent/Settings.tsx`
- Modify: `src/App.tsx`, `src/i18n/nl.ts`, `src/i18n/en.ts`
- Test: `tests/screens/settings.test.tsx`

**Interfaces:**
- Consumes: `getSettings`, `saveSettings` (Task 7), `t` (Task 8)

The settings are toggles for level 2 (rhythm), metronome click and celebration sound, plus two language pickers (child, parent). Changes are saved straight away and apply without a reload.

- [ ] **Step 1: Write the failing tests**

```ts
test('switching child language changes picker title', async () => {
  // default -> 'Kies een liedje'; set childLang en -> 'Pick a song'
});
test('parent area defaults to English while child screens are Dutch', async () => { /* both visible texts */ });
test('turning on level 2 shows level buttons on song cards', async () => { /* toggle -> buttons 1 and 2 visible */ });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/screens/settings.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `Settings.tsx`**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/screens/settings.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: parent settings and language switching"
```

---

### Task 15: Built-in songs from public-domain sources

**Files:**
- Modify: `src/songs/builtin/index.ts`
- Create: one file per song in `src/songs/builtin/`: `zie-ginds.ts`, `kapoentje.ts`, `kom-eens-kijken.ts`, `hoor-wie-klopt.ts`, `zak-van-sinterklaas.ts`, `bonne-bonne.ts`, `dag-sinterklaasje.ts`, `bella-ciao.ts`, `fur-elise.ts`
- Create: `docs/songs-sources.md`
- Test: `tests/songs/builtin.test.ts`

**Interfaces:**
- Produces: `interface BuiltinSong { id: string; title: string; picture: string; typed: string; melodySource: string }`; `BUILTIN_SONGS: BuiltinSong[]`

Titles (exact): "Zie, ginds komt de stoomboot", "Sinterklaas kapoentje", "O, kom er eens kijken", "Hoor wie klopt daar, kind'ren", "De zak van Sinterklaas", "Sinterklaasje, bonne, bonne, bonne", "Dag, Sinterklaasje", "Bella Ciao", "Für Elise". Pictures: 🚢 🐴 👀 🚪 🎒 🍬 👋 🌸 🎹.

Not built in (copyright, per spec): Pietengym, Tamo daleko, Pink Panther theme, Crni leptir.

- [ ] **Step 1: Write the failing tests**

```ts
test('every built-in parses, fits the keyboard and has a source', () => {
  for (const b of BUILTIN_SONGS) {
    const r = parseTypedNotes(b.typed);
    expect(r.ok, b.id).toBe(true);
    if (!r.ok) continue;
    for (const n of r.notes) if (n.midi !== null) { expect(n.midi).toBeGreaterThanOrEqual(36); expect(n.midi).toBeLessThanOrEqual(96); }
    expect(b.melodySource).toMatch(/^https?:\/\//);
  }
});
test('generated fingering has no crossings on steps', () => {
  for (const b of BUILTIN_SONGS) {
    const r = parseTypedNotes(b.typed); if (!r.ok) continue;
    expect(crossesOnStep(assignFingering(r.notes)), b.id).toEqual([]);
  }
});
test('the nine titles', () => { expect(BUILTIN_SONGS.map(b => b.title)).toEqual([/* the nine exact titles above */]); });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/songs/builtin.test.ts`
Expected: FAIL.

- [ ] **Step 3: Transcribe each melody from a public-domain notation source**

For each song, find printed notation in the public domain and transcribe the **melody only, no lyrics**, into the typed format with lengths. Sources to try, in this order:
1. The song's nl.wikisource page (Zie ginds has a score image; Sinterklaas kapoentje and Sinterklaasje bonne have notation on the Kapoentje page).
2. The old songbooks those pages name, as scans on Wikisource or Delpher (for example Leopold 1898 for "O, kom er eens kijken"; Van Pelt & Boon 1926 for "Dag, Sinterklaasje").
3. The public-domain original tunes the spec names ("Im Märzen der Bauer"; Nägeli "Freut euch des Lebens"; Mendelssohn "O Winter, schlimmer Winter").
4. IMSLP for Für Elise (Beethoven WoO 59): the first 8 bars of the right-hand melody, simplified to a single line without the thumb crossing.

Transpose each song so that it fits five-finger positions around middle C (C, G or F major preferred). If the crossing test fails for a song, a hand move has landed mid-run. Fix it by choosing a transposition that moves the break, or by writing the finger from a fingered public-domain edition into the typed text (`E(3)`), noted in `docs/songs-sources.md`. Never relax the test. Record the exact source URL in `melodySource` and a line per song in `docs/songs-sources.md` (source, bars used, transposition). **If no credible public-domain notation can be found for a song, leave it out, note it in `docs/songs-sources.md`, and report it to the parent.** Never fill a melody from memory.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/songs/builtin.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: built-in Sinterklaas songs and extras from public-domain sources"
```

- [ ] **Step 6: Parent listening check**

Ask the parent to open each built-in song in the parent area and press Preview.
Expected: the parent confirms each melody sounds right. Fix any song they flag in its file and re-run Step 4.

---

### Task 16: "Save for keyboard" MIDI export

**Files:**
- Create: `src/song/midi-export.ts`, `src/screens/parent/KeyboardExportGuide.tsx`
- Modify: `src/screens/parent/ParentHome.tsx`
- Test: `tests/song/midi-export.test.ts`

**Interfaces:**
- Consumes: `Song` (Task 2), `parseMidiFile` (Task 6, used in the test)
- Produces: `exportSmf0(song: Song): Uint8Array` and `exportFileName(title: string): string` (strip diacritics with NFD, keep only A–Z and 0–9, upper case, first 8 characters, then `.MID`; for example `ZIEGINDS.MID`; `SONG.MID` if nothing is left)

Format: `MThd` length 6, format 0, 1 track, division 480. Then one `MTrk` with a track name (`FF 03`), a tempo (`FF 51 03`, µs per quarter = 60 000 000 / tempo), notes as note-on `0x90` velocity 80 and note-off `0x80` on **channel 1** (status nibble 0), rests as delta time only, and end of track `FF 2F 00`.

UI: a "Save for keyboard" button per song downloads the file through an `<a download>` blob link, then shows the guide. The guide has four picture steps: copy the file to a computer, connect the keyboard to the computer, set Function 056 Storage Mode ON and copy the file onto the keyboard drive, then set Storage Mode OFF, pick the song and press Lesson until "WAITING" shows.

- [ ] **Step 1: Write the failing tests**

```ts
test('format 0, one track, channel 1, round-trips', () => {
  const bytes = exportSmf0(songOf('tempo 100\nC D- _ E'));
  expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('MThd');
  expect((bytes[8] << 8) | bytes[9]).toBe(0);   // format 0
  expect((bytes[10] << 8) | bytes[11]).toBe(1); // one track
  const midi = new Midi(bytes);
  expect(midi.tracks[0].channel).toBe(0);
  expect(Math.round(midi.header.tempos[0].bpm)).toBe(100);
  const back = parseMidiFile(bytes);
  expect(back.ok && back.notes.map(n => [n.midi, n.beats])).toEqual([[60, 1], [62, 2], [null, 1], [64, 1]]);
});
test('file name is short and plain', () => {
  expect(exportFileName('Zie, ginds komt de stoomboot')).toBe('ZIEGINDS.MID');
  expect(exportFileName('Für Elise')).toBe('FURELISE.MID');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/song/midi-export.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `exportSmf0`, `exportFileName` and the guide**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/song/midi-export.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: save songs for the keyboard's Waiting lesson"
```

- [ ] **Step 6: Real-keyboard check with the parent**

Ask the parent to copy one exported song to the PSR-E373 as described in the guide and start Lesson 3 (Waiting).
Expected: the keyboard shows the notes and waits for each right key. If it doesn't, record what the keyboard did and report back.

---

### Task 17: Offline install, hosting and final check on the tablet

**Files:**
- Modify: `vite.config.ts` (add `vite-plugin-pwa`), `index.html`
- Create: `public/icon-192.png`, `public/icon-512.png`, `README.md`
- Test: `tests/pwa/manifest.test.ts`

**Interfaces:**
- Produces: a static build in `dist/` that works offline after the first visit.

PWA settings: name "Piano Stars", short name "Piano Stars", `display: 'fullscreen'`, `orientation: 'landscape'`, theme color `#43A047`, `registerType: 'autoUpdate'`, and Workbox precaching all build assets (`globPatterns: ['**/*.{js,css,html,png,svg,woff2}']`). Exclude `midi-test.html` from the production build.

- [ ] **Step 1: Write the failing test**

```ts
test('manifest is landscape fullscreen and has icons', () => {
  // import the plugin config object exported from vite.config.ts (export const pwaOptions)
  expect(pwaOptions.manifest).toMatchObject({ name: 'Piano Stars', display: 'fullscreen', orientation: 'landscape' });
  expect(pwaOptions.manifest.icons.map((i: any) => i.sizes)).toEqual(['192x192', '512x512']);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/pwa/manifest.test.ts`
Expected: FAIL.

- [ ] **Step 3: Add the PWA config, icons (an original simple star-on-key drawing) and README**

The README covers how to run it (`npm run dev`, `?fake` mode), the adb steps from Task 1, how to install, and the keyboard tips: Storage Mode OFF, the Developer-options MIDI setting, and the middle C sticker.

- [ ] **Step 4: Run the full test suite and build**

Run: `npm test && npm run build`
Expected: all tests PASS. The build succeeds and `dist/` holds `manifest.webmanifest` and `sw.js`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: offline install as a PWA"
```

- [ ] **Step 6: Hosting (ask the parent first)**

Propose GitHub Pages, which needs the parent's GitHub account and a public repository, or Netlify or Cloudflare Pages. Explain that the app contains no personal data. **Publish only after the parent says yes and picks the host.** Set Vite's `base` to match the host path.

- [ ] **Step 7: Final check on the real tablet (with the parent)**

Open the hosted URL in Chrome on the S7+, use Add to Home screen, then turn Wi-Fi off and open it from the home screen with the PSR-E373 plugged in.
Expected: it opens offline. Every built-in song plays in level 1 with finger hints and the hand screen. Level 2 timing feels right at slow speed. Unplugging mid-song shows the plug screen and resumes. Both languages look right. Medals survive closing the app.
