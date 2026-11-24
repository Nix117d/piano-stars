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

/** Readable text colour for a hex background: dark on light colours, white on dark ones. */
export function textOn(color: string): string {
  const n = parseInt(color.slice(1), 16);
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return lum > 0.4 ? '#1a1a1a' : '#fff';
}
