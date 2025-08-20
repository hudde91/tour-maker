import React, { useMemo } from "react";
import { Tour, Round } from "../../types";
import { storage } from "../../lib/storage";

interface LiveLeaderboardProps {
  tour: Tour;
  round: Round;
  isCollapsed?: boolean;
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

      const stableford = storage.calculateStablefordForPlayer(
        round as any,
        player.id
      );

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
      if (a.stableford !== b.stableford) return b.stableford - a.stableford;
      return a.totalStrokes - b.totalStrokes;
    });
  }, [entries]);

  return (
    <div className={isCollapsed ? "space-y-2" : "space-y-3"}>
      {sorted.map((entry, idx) => {
        const { player, totalStrokes, points, stableford } = entry;
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
