import { expect, test } from 'vitest';
import { assignFingering, crossesOnStep, MAX_POSITION_WIDTH } from '../../src/fingering/assign';
import { handPositions, positionWidth } from '../../src/fingering/positions';
import { parseTypedNotes } from '../../src/song/typed-notes';
import { BUILTIN_SONGS } from '../../src/songs/builtin/index';

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

test('every hand position of every built-in spans at most 6 white keys', () => {
  for (const b of BUILTIN_SONGS) {
    const r = parseTypedNotes(b.typed); if (!r.ok) continue;
    const f = assignFingering(r.notes);
    for (const p of handPositions(f)) {
      expect(positionWidth(f, p), `${b.id} @${p.startIndex}`).toBeLessThanOrEqual(MAX_POSITION_WIDTH);
    }
  }
});

// The brief's nine titles, in its order, minus the three left out for want of a public-domain
// score: "Hoor wie klopt daar, kind'ren", "De zak van Sinterklaas", "Dag, Sinterklaasje"
// (docs/songs-sources.md).
test('the included titles, in the brief\'s order', () => {
  expect(BUILTIN_SONGS.map(b => b.title)).toEqual([
    'Zie, ginds komt de stoomboot',
    'Sinterklaas kapoentje',
    'O, kom er eens kijken',
    'Sinterklaasje, bonne, bonne, bonne',
    'Bella Ciao',
    'Für Elise',
  ]);
});
