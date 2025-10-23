export const isFinitePos = (n: any): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;

// Safe min: returns null if no valid scores (instead of Infinity)
export function safeMin(
  scores: Array<number | null | undefined>
): number | null {
  const vals = scores.filter(isFinitePos) as number[];
  return vals.length ? Math.min(...vals) : null;
}

// Optional UI helper (so you never print Infinity/NaN/null)
export function formatHoleScore(n: number | null | undefined): string {
  // Explicitly check for null (conceded hole in match play)
  if (n === null) {
    return "-";
  }
  return typeof n === "number" && Number.isFinite(n) ? String(n) : "—";
}

/**
 * Get the actual stroke count for a conceded hole based on format
 * @param par - The par for the hole
 * @param isMatchPlay - Whether this is a match play format
 * @returns The number of strokes to count (0 for match play, 2x par for stroke play)
 */
export function getConcededHoleStrokes(par: number, isMatchPlay: boolean): number {
  return isMatchPlay ? 0 : par * 2;
}
