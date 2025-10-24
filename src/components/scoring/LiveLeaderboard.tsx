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

      {/* Competition Winners Section */}
      {!isCollapsed && (() => {
        // Collect all competition winners from this round
        const competitionWinners: {
          type: 'closestToPin' | 'longestDrive';
          holeNumber: number;
          playerId: string;
          distance?: number;
        }[] = [];

        if (round.competitionWinners) {
          // Collect all entries and determine overall winners per hole
          Object.entries(round.competitionWinners.closestToPin).forEach(([holeNum, winners]) => {
            if (winners && winners.length > 0) {
              // Find the winner with the shortest distance (or first if no distances)
              const overallWinner = winners.reduce((best, current) => {
                if (!best.distance && !current.distance) return best; // Both have no distance, keep first
                if (!current.distance) return best; // Current has no distance, keep best
                if (!best.distance) return current; // Best has no distance, use current
                return current.distance < best.distance ? current : best; // Compare distances
              });

              competitionWinners.push({
                type: 'closestToPin',
                holeNumber: parseInt(holeNum),
                playerId: overallWinner.playerId,
                distance: overallWinner.distance,
              });
            }
          });
          Object.entries(round.competitionWinners.longestDrive).forEach(([holeNum, winners]) => {
            if (winners && winners.length > 0) {
              // Find the winner with the longest distance (or first if no distances)
              const overallWinner = winners.reduce((best, current) => {
                if (!best.distance && !current.distance) return best; // Both have no distance, keep first
                if (!current.distance) return best; // Current has no distance, keep best
                if (!best.distance) return current; // Best has no distance, use current
                return current.distance > best.distance ? current : best; // Compare distances
              });

              competitionWinners.push({
                type: 'longestDrive',
                holeNumber: parseInt(holeNum),
                playerId: overallWinner.playerId,
                distance: overallWinner.distance,
              });
            }
          });
        }

        if (competitionWinners.length === 0) {
          return null;
        }

        // Group by type
        const closestToPinWinners = competitionWinners.filter(w => w.type === 'closestToPin');
        const longestDriveWinners = competitionWinners.filter(w => w.type === 'longestDrive');

        return (
          <div className="border-t border-slate-200 pt-4 mt-4">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-xl">🏅</span>
              Competition Winners
            </h3>

            <div className="space-y-3">
              {/* Closest to Pin */}
              {closestToPinWinners.length > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
                    </svg>
                    <h4 className="font-semibold text-blue-900 text-sm">Closest to Pin</h4>
                  </div>
                  <div className="space-y-1.5">
                    {closestToPinWinners.map((winner, idx) => {
                      const player = tour.players.find(p => p.id === winner.playerId);
                      return (
                        <div key={idx} className="bg-white rounded-lg p-2 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 text-sm">{player?.name || 'Unknown'}</div>
                            <div className="text-xs text-slate-600">
                              Hole {winner.holeNumber}
                              {winner.distance && <span className="ml-1">• {winner.distance} ft</span>}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Longest Drive */}
              {longestDriveWinners.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                    </svg>
                    <h4 className="font-semibold text-amber-900 text-sm">Longest Drive</h4>
                  </div>
                  <div className="space-y-1.5">
                    {longestDriveWinners.map((winner, idx) => {
                      const player = tour.players.find(p => p.id === winner.playerId);
                      return (
                        <div key={idx} className="bg-white rounded-lg p-2 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 text-sm">{player?.name || 'Unknown'}</div>
                            <div className="text-xs text-slate-600">
                              Hole {winner.holeNumber}
                              {winner.distance && <span className="ml-1">• {winner.distance} yds</span>}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
