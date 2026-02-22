export const isFinitePos = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;

// Safe min: returns null if no valid scores (instead of Infinity)
export function safeMin(
  scores: Array<number | null | undefined>
): number | null {
  const vals = scores.filter(isFinitePos) as number[];
  return vals.length ? Math.min(...vals) : null;
}

// Optional UI helper (so you never print Infinity/NaN/null)
export function formatHoleScore(n: number | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? String(n) : "—";
}
