import { isBlack, midiToName } from '../song/pitch';

export const NOTE_COLORS: Record<'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B', string> = {
  C: '#E53935', D: '#FB8C00', E: '#FDD835', F: '#43A047', G: '#00ACC1', A: '#1E88E5', B: '#8E24AA',
};

function darken(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map(c => Math.round(c * factor).toString(16).padStart(2, '0'));
  return `#${ch.join('')}`;
}

/** White keys get their note colour; a black key gets its lower white neighbour's, darkened 35%. */
export function keyColor(midi: number): string {
  if (!isBlack(midi)) return NOTE_COLORS[midiToName(midi).letter];
  return darken(NOTE_COLORS[midiToName(midi - 1).letter], 0.65);
}

/** WCAG 2 relative luminance of a #rrggbb colour. */
function luminance(color: string): number {
  const n = parseInt(color.slice(1), 16);
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

/** WCAG 2 contrast ratio of two #rrggbb colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const DARK_TEXT = '#000000';
const LIGHT_TEXT = '#ffffff';

/**
 * Readable text colour for a #rrggbb background: whichever of black and white has the higher
 * contrast (the switch is at a luminance of about 0.18). Every note colour then reaches 4.5:1.
 * Black rather than a softer dark grey, because C's red only reaches 4.5:1 against pure black.
 */
export function textOn(color: string): string {
  return contrastRatio(color, DARK_TEXT) >= contrastRatio(color, LIGHT_TEXT) ? DARK_TEXT : LIGHT_TEXT;
}
