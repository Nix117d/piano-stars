/** The pictures a song card can have: simple, distinct, easy to tell apart without reading. */
export const PICTURES: string[] = [
  '🚢', '🐴', '👀', '🚪', '🎒', '🍬', '👋', '🌸', '🎹', '⭐',
  '🐸', '🦊', '🐻', '🐢', '🐳', '🦋', '🚂', '🚀', '🌈', '☀️',
  '🌙', '🍎', '🎁', '🎈', '🥁', '🐝', '🦁', '🐧', '🦉', '🐞',
];

/** The first picture no song uses yet; once all are taken, the least used one. */
export function freePicture(used: string[]): string {
  const count = (p: string) => used.filter(u => u === p).length;
  return PICTURES.reduce((best, p) => (count(p) < count(best) ? p : best));
}
