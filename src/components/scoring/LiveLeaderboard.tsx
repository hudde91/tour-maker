import React, { useMemo, useState } from "react";
import { Tour, Round } from "../../types";
import { storage } from "../../lib/storage";
import { PlayerScorecard } from "../players/PlayerScorecard";
import { BroadcastHeader } from "../tournament/BroadcastHeader";

interface LiveLeaderboardProps {
  tour: Tour;
  round: Round;
  isCollapsed?: boolean;
}

/** Format to-par like TV broadcasts */
const formatToPar = (toPar: number): string => {
  if (toPar === 0) return "E";
  return toPar > 0 ? `+${toPar}` : `${toPar}`;
};

const getToParClass = (toPar: number): string => {
  if (toPar < 0) return "lb-score-under";
  if (toPar > 0) return "lb-score-over";
  return "lb-score-even";
};

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({
  tour,
  round,
  isCollapsed = false,
}) => {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const handlePlayerToggle = (playerId: string) => {
    setExpandedPlayerId(expandedPlayerId === playerId ? null : playerId);
  };

  const entries = useMemo(() => {
    return tour.players.map((player) => {
      const ps: any = (round as any).scores?.[player.id];
      const scores: number[] = ps?.scores || [];
      const totalStrokes =
        ps?.totalScore ??
        scores.reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
      const handicapStrokes = ps?.handicapStrokes ?? 0;

      const existingPoints = ps?.points as number | undefined;

      const stableford = storage.calculateStablefordForPlayer(
        round as any,
        player.id
      );

      // Calculate holes completed
      const holesCompleted = scores.filter(
        (s: number | null) => s !== null && s > 0
      ).length;

      // Calculate to-par
      const totalPar = storage.getTotalPar(round as any);
      const parPerHole = totalPar / (round.holes || 18);
      const parThrough = Math.round(parPerHole * holesCompleted);
      const toPar = holesCompleted > 0 ? totalStrokes - parThrough : 0;

      return {
        player,
        totalStrokes,
        handicapStrokes,
        points: existingPoints,
        stableford,
        holesCompleted,
        toPar,
      };
    });
  }, [tour.players, round]);

  // Sort by Stableford desc, then by totalStrokes asc
  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.stableford !== b.stableford) return b.stableford - a.stableford;
      return a.totalStrokes - b.totalStrokes;
    });
  }, [entries]);

  const isLive = round.status === "in-progress";

  return (
    <div className="leaderboard-broadcast">
      {!isCollapsed && (
        <BroadcastHeader
          tournamentName={round.name || "Round Leaderboard"}
          subtitle={round.courseName || "Live scoring"}
          isLive={isLive}
        />
      )}

      <div
        className={`${
          !isCollapsed
            ? "rounded-b-xl border border-t-0 border-white/10 overflow-hidden bg-white/[0.02]"
            : ""
        }`}
      >
        {/* Column headers */}
        {!isCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/30 border-b border-white/10 bg-white/[0.03]">
            <div className="w-8 text-center">Pos</div>
            <div className="flex-1">Player</div>
            <div className="min-w-[40px] text-right">Stb</div>
            <div className="min-w-[36px] text-right">Strk</div>
            <div className="w-4" />
          </div>
        )}

        <div className={isCollapsed ? "space-y-1" : ""}>
          {sorted.map((entry, idx) => {
            const { player, totalStrokes, points, stableford, holesCompleted, toPar } =
              entry;
            const isExpanded = expandedPlayerId === player.id;

            const posClass =
              idx === 0
                ? "lb-pos-1"
                : idx === 1
                  ? "lb-pos-2"
                  : idx === 2
                    ? "lb-pos-3"
                    : "";

            const rowClass =
              idx === 0
                ? "lb-row-leader"
                : idx === 1
                  ? "lb-row-2"
                  : idx === 2
                    ? "lb-row-3"
                    : "";

            return (
              <div key={player.id} className="w-full">
                <button
                  onClick={() => handlePlayerToggle(player.id)}
                  className={`w-full ${isCollapsed ? "lb-row rounded-lg" : `lb-row ${rowClass}`} cursor-pointer group active:scale-[0.99] transition-transform`}
                >
                  {/* Position */}
                  <div className={`${isCollapsed ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"} lb-pos ${posClass} ${isCollapsed ? "!rounded" : ""}`}>
                    {idx + 1}
                  </div>

                  {/* Player name */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-semibold text-white truncate ${
                          isCollapsed ? "text-xs" : "text-sm"
                        }`}
                      >
                        {player.name}
                      </span>
                      {idx === 0 && !isCollapsed && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/15 px-1 py-0.5 rounded flex-shrink-0">
                          Leader
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <div className="flex items-center gap-2 text-[11px] text-white/40 mt-0.5">
                        {holesCompleted > 0 && holesCompleted < (round.holes || 18) && isLive ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Thru {holesCompleted}
                          </span>
                        ) : holesCompleted > 0 ? (
                          <span>{holesCompleted} holes</span>
                        ) : null}
                        {holesCompleted > 0 && (
                          <span className={`font-medium ${getToParClass(toPar)}`}>
                            {formatToPar(toPar)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Scores */}
                  <div className="flex items-center gap-3 text-right">
                    {typeof points === "number" && (
                      <div className={isCollapsed ? "min-w-[32px]" : "min-w-[40px]"}>
                        <div className={`font-bold text-white ${isCollapsed ? "text-sm" : "text-lg"}`}>
                          {points}
                        </div>
                        {!isCollapsed && (
                          <div className="text-[10px] text-white/30 uppercase">Pts</div>
                        )}
                      </div>
                    )}

                    <div className={isCollapsed ? "min-w-[32px]" : "min-w-[40px]"}>
                      <div className={`font-bold text-emerald-400 ${isCollapsed ? "text-sm" : "text-lg"}`}>
                        {stableford}
                      </div>
                      {!isCollapsed && (
                        <div className="text-[10px] text-white/30 uppercase">Stb</div>
                      )}
                    </div>

                    <div className={isCollapsed ? "min-w-[28px]" : "min-w-[36px]"}>
                      <div className={`font-medium text-white/50 ${isCollapsed ? "text-xs" : "text-sm"}`}>
                        {totalStrokes}
                      </div>
                      {!isCollapsed && (
                        <div className="text-[10px] text-white/30">Strk</div>
                      )}
                    </div>

                    {/* Chevron */}
                    <svg
                      className={`w-4 h-4 text-white/20 group-hover:text-white/40 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded PlayerScorecard */}
                {isExpanded && (
                  <div className="mx-3 mb-2 mt-1 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <PlayerScorecard
                      tour={tour}
                      player={player}
                      isExpanded={true}
                      onToggle={() => handlePlayerToggle(player.id)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Competition Winners Section */}
      {!isCollapsed &&
        (() => {
          const competitionWinners: {
            type: "closestToPin" | "longestDrive";
            holeNumber: number;
            playerId: string;
            distance?: number;
          }[] = [];

          if (round.competitionWinners) {
            Object.entries(round.competitionWinners.closestToPin).forEach(
              ([holeNum, winners]) => {
                if (winners && winners.length > 0) {
                  const overallWinner = winners.reduce((best, current) => {
                    if (!best.distance && !current.distance) return best;
                    if (!current.distance) return best;
                    if (!best.distance) return current;
                    return current.distance < best.distance ? current : best;
                  });

                  competitionWinners.push({
                    type: "closestToPin",
                    holeNumber: parseInt(holeNum),
                    playerId: overallWinner.playerId,
                    distance: overallWinner.distance,
                  });
                }
              }
            );
            Object.entries(round.competitionWinners.longestDrive).forEach(
              ([holeNum, winners]) => {
                if (winners && winners.length > 0) {
                  const overallWinner = winners.reduce((best, current) => {
                    if (!best.distance && !current.distance) return best;
                    if (!current.distance) return best;
                    if (!best.distance) return current;
                    return current.distance > best.distance ? current : best;
                  });

                  competitionWinners.push({
                    type: "longestDrive",
                    holeNumber: parseInt(holeNum),
                    playerId: overallWinner.playerId,
                    distance: overallWinner.distance,
                  });
                }
              }
            );
          }

          if (competitionWinners.length === 0) {
            return null;
          }

          const closestToPinWinners = competitionWinners.filter(
            (w) => w.type === "closestToPin"
          );
          const longestDriveWinners = competitionWinners.filter(
            (w) => w.type === "longestDrive"
          );

          return (
            <div className="mt-4 rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
              <div className="px-4 py-2.5 border-b border-white/10 bg-white/[0.03]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
                  </svg>
                  Competition Winners
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2">
                {closestToPinWinners.length > 0 && (
                  <div className="p-3 border-b md:border-b-0 md:border-r border-white/10">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                        Closest to Pin
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {closestToPinWinners.map((winner, idx) => {
                        const player = tour.players.find(
                          (p) => p.id === winner.playerId
                        );
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="font-medium text-white">
                              {player?.name || "Unknown"}
                            </span>
                            <span className="text-white/40 text-xs">
                              H{winner.holeNumber}
                              {winner.distance && ` - ${winner.distance}ft`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {longestDriveWinners.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                        Longest Drive
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {longestDriveWinners.map((winner, idx) => {
                        const player = tour.players.find(
                          (p) => p.id === winner.playerId
                        );
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="font-medium text-white">
                              {player?.name || "Unknown"}
                            </span>
                            <span className="text-white/40 text-xs">
                              H{winner.holeNumber}
                              {winner.distance && ` - ${winner.distance}yds`}
                            </span>
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
