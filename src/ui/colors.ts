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
