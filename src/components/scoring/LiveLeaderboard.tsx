import React, { useMemo } from "react";
import { Tour, Round } from "../../types";

interface LiveLeaderboardProps {
  tour: Tour;
  round: Round;
  isCollapsed?: boolean;
}

/** Fallback Stableford calculator (if not available in storage).
 *  - Allocates handicap strokes per hole based on total handicapStrokes
 *    and hole Stroke Index (handicap 1..18).
 *  - Points per hole: clamp(0, 2 - (net - par)), capped at 6.
 */
function calculateStablefordForPlayer(round: Round, playerId: string): number {
  const ps: any = (round as any).scores?.[playerId];
  if (!ps) return 0;
  const holes = (round as any).holeInfo || [];
  const scores: number[] = ps.scores || [];
  const n = (round as any).holes || holes.length || 18;
  const total = Math.max(0, ps.handicapStrokes || 0);

  // Build stroke index list (1..n). If missing, use 1..n.
  const idx = holes.length
    ? holes.map((h: any, i: number) =>
        h?.handicap && h.handicap > 0 ? h.handicap : i + 1
      )
    : Array.from({ length: n }, (_, i) => i + 1);

  // Order hole indices by difficulty (1 hardest)
  const order = idx
    .map((v: number, i: number) => ({ i, v }))
    .sort(
      (a: { i: number; v: number }, b: { i: number; v: number }) => a.v - b.v
    )
    .map((o: { i: number; v: number }) => o.i);

  const base = Math.floor(total / n);
  const rem = total % n;
  const alloc = new Array(n).fill(base);
  for (let r = 0; r < rem; r++) alloc[order[r % n]] += 1;

  let totalPts = 0;
  for (let i = 0; i < Math.min(scores.length, holes.length || n); i++) {
    const gross = scores[i] || 0;
    if (!gross) continue;
    const par = holes[i]?.par ?? 4;
    const net = gross - (alloc[i] || 0);
    const diff = net - par;
    let pts = 2 - diff;
    if (pts < 0) pts = 0;
    if (pts > 6) pts = 6;
    totalPts += pts;
  }
  return totalPts;
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({
  tour,
  round,
  isCollapsed = false,
}) => {
  const entries = useMemo(() => {
    return tour.players.map((player) => {
      const ps: any = (round as any).scores?.[player.id];
      const scores: number[] = ps?.scores || [];
      const totalStrokes =
        ps?.totalScore ??
        scores.reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
      const handicapStrokes = ps?.handicapStrokes ?? 0;

      // Prefer existing 'points' if round stores a points metric; otherwise undefined
      const existingPoints = ps?.points as number | undefined;

      const stableford = calculateStablefordForPlayer(round, player.id);

      return {
        player,
        totalStrokes,
        handicapStrokes,
        points: existingPoints,
        stableford,
      };
    });
  }, [tour.players, round]);

  // Sort: by existing points desc if available, otherwise by Stableford desc, then by totalStrokes asc
  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      const aHasPts = typeof a.points === "number";
      const bHasPts = typeof b.points === "number";
      if (aHasPts && bHasPts && a.points !== b.points)
        return b.points! - a.points!;
      if (aHasPts && !bHasPts) return -1;
      if (!aHasPts && bHasPts) return 1;
      if (a.stableford !== b.stableford) return b.stableford - a.stableford;
      return a.totalStrokes - b.totalStrokes;
    });
  }, [entries]);

  return (
    <div className={isCollapsed ? "space-y-2" : "space-y-3"}>
      {sorted.map((entry, idx) => {
        const { player, totalStrokes, handicapStrokes, points, stableford } =
          entry;
        return (
          <div
            key={player.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            {/* Left: position + name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-6 text-right text-sm font-semibold text-slate-600">
                {idx + 1}
              </div>
              <div className="truncate font-medium text-slate-900">
                {player.name}
              </div>
            </div>

            {/* Right: numbers */}
            <div className="flex items-center gap-4 text-right">
              {/* Points (if available) */}
              {typeof points === "number" && (
                <div className="min-w-[56px]">
                  <div className="text-base font-semibold text-slate-900">
                    {points}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Points
                  </div>
                </div>
              )}

              {/* Stableford */}
              <div className="min-w-[56px]">
                <div className="text-base font-semibold text-slate-900">
                  {stableford}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">
                  Stableford
                </div>
              </div>

              {/* Total Strokes */}
              <div className="min-w-[56px]">
                <div className="text-base font-semibold text-slate-900">
                  {totalStrokes}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">
                  Total Strokes
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
