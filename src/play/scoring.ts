export type Stars = 1 | 2 | 3 | 4 | 5;

export function starsLevel1(mistakes: number, total: number): Stars {
  if (mistakes === 0 || total <= 0) return 5;
  const r = mistakes / total;
  if (r <= 0.1) return 4;
  if (r <= 0.25) return 3;
  if (r <= 0.5) return 2;
  return 1;
}

export interface Level2Result {
  onTime: number;
  close: number;
  missed: number;
  wrongPresses: number;
  total: number;
}

export function starsLevel2(r: Level2Result): Stars {
  if (r.total <= 0) return 5;
  const a = Math.max(0, (r.onTime + 0.5 * r.close - 0.25 * r.wrongPresses) / r.total);
  if (a >= 0.95) return 5;
  if (a >= 0.85) return 4;
  if (a >= 0.7) return 3;
  if (a >= 0.5) return 2;
  return 1;
}

export type Medal = 'none' | 'bronze' | 'silver' | 'gold';

/** `stars` is the best result so far: 0 means never finished. */
export function medalFor(stars: number): Medal {
  if (stars >= 5) return 'gold';
  if (stars >= 3) return 'silver';
  if (stars >= 1) return 'bronze';
  return 'none';
}
