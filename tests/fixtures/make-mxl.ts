// One-off: regenerates simple.mxl from simple.musicxml. Run: npx --yes tsx tests/fixtures/make-mxl.ts
import { zipSync, strToU8 } from 'fflate';
import { readFileSync, writeFileSync } from 'node:fs';

const xml = readFileSync(new URL('./simple.musicxml', import.meta.url), 'utf8');
const container = `<?xml version="1.0" encoding="UTF-8"?>
<container><rootfiles><rootfile full-path="score.musicxml" media-type="application/vnd.recordare.musicxml+xml"/></rootfiles></container>
`;
writeFileSync(
  new URL('./simple.mxl', import.meta.url),
  zipSync({ 'META-INF/container.xml': strToU8(container), 'score.musicxml': strToU8(xml) }, { mtime: new Date('2026-01-01') }),
);
