import { useRef, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LeaderboardEntry, Tour } from "../../types";
import { storage } from "../../lib/storage";

interface VirtualizedLeaderboardProps {
  entries: LeaderboardEntry[];
  tour: Tour;
  hasSomeStableford: boolean;
  isMatchPlay: boolean;
  hasHandicaps: boolean;
  view: "overall" | "current-round" | "by-round";
  roundsToInclude: any[];
  playerStablefordPoints: Map<string, number>;
  playerMatchesWon: Map<string, number>;
}

/**
 * Virtualized leaderboard for large player lists
 * Only renders visible entries for better performance
 */
const VirtualizedLeaderboardComponent = ({
  entries,
  tour,
  hasSomeStableford,
  isMatchPlay,
  hasHandicaps,
  view,
  roundsToInclude,
  playerStablefordPoints,
  playerMatchesWon,
}: VirtualizedLeaderboardProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated height of each entry in pixels
    overscan: 5, // Render 5 extra items above and below viewport
  });

  return (
    <div
      ref={parentRef}
      className="space-y-3 max-h-[800px] overflow-y-auto"
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const entry = entries[virtualItem.index];
          const index = virtualItem.index;

          const stablefordPoints =
            playerStablefordPoints.get(entry.player.id) || 0;
          const matchesWon = playerMatchesWon.get(entry.player.id) || 0;

          const displayScore = hasHandicaps
            ? entry.netScore ?? entry.totalScore
            : entry.totalScore;

          return (
            <div
              key={entry.player.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="pb-3"
            >
              <div
                className={`p-4 sm:p-5 bg-white/5 border-2 rounded-xl transition-all ${
                  index === 0
                    ? "border-yellow-400 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 shadow-lg"
                    : index === 1
                    ? "border-white/15 bg-gradient-to-br from-slate-50 to-slate-100 shadow-md"
                    : index === 2
                    ? "border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md"
                    : "border-white/10 hover:border-white/15"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Position Badge with Movement Arrow */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg"
                          : index === 1
                          ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md"
                          : index === 2
                          ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md"
                          : "bg-white/5 text-white/70"
                      }`}
                    >
                      {index < 3 ? (
                        <span className="text-2xl">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </span>
                      ) : (
                        entry.position
                      )}
                    </div>
                    {/* Movement Arrow */}
                    {entry.positionChange !== undefined &&
                      entry.positionChange !== 0 && (
                        <div
                          className={`text-xs font-bold mt-1 flex items-center gap-0.5 ${
                            entry.positionChange > 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          <span className="text-base">
                            {entry.positionChange > 0 ? "↑" : "↓"}
                          </span>
                          <span>{Math.abs(entry.positionChange)}</span>
                        </div>
                      )}
                    {entry.positionChange === 0 && (
                      <div className="text-xs font-medium mt-1 text-white/30">
                        −
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-white truncate">
                        {entry.player.name}
                      </h3>
                      {entry.isCaptain && <span className="text-base">👑</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
                      {entry.player.handicap !== undefined && (
                        <span className="flex items-center gap-1">
                          <span className="text-white/30">HC</span>
                          {entry.player.handicap}
                        </span>
                      )}

                      {entry.team && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.team.color }}
                          />
                          <span>{entry.team.name}</span>
                        </div>
                      )}

                      <span className="text-white/30">
                        {entry.roundsPlayed} round
                        {entry.roundsPlayed !== 1 ? "s" : ""}
                      </span>

                      {/* Show "Thru X holes" for active rounds */}
                      {view === "current-round" &&
                        (() => {
                          const activeRound = roundsToInclude[0];
                          if (
                            activeRound &&
                            activeRound.status === "in-progress"
                          ) {
                            const playerScores =
                              activeRound.scores[entry.player.id];
                            if (playerScores) {
                              const holesCompleted = playerScores.scores.filter(
                                (score: number | null) =>
                                  score !== null && score > 0
                              ).length;
                              if (holesCompleted > 0 && holesCompleted < 18) {
                                return (
                                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Thru {holesCompleted}
                                  </span>
                                );
                              }
                            }
                          }
                          return null;
                        })()}
                    </div>
                  </div>

                  {/* Score Display - FORMAT AWARE */}
                  <div className="text-right flex-shrink-0">
                    {hasSomeStableford ? (
                      // Stableford Format
                      <>
                        <div className="text-3xl font-bold text-emerald-400 mb-1">
                          {stablefordPoints}
                        </div>
                        <div className="text-xs text-white/40">
                          {entry.totalScore} strokes
                        </div>
                        <div className="text-xs text-emerald-400 font-medium mt-1">
                          Stableford Points
                        </div>
                      </>
                    ) : isMatchPlay ? (
                      // Match Play Format
                      <>
                        <div className="text-3xl font-bold text-white mb-1">
                          {matchesWon}
                        </div>
                        <div className="text-xs text-white/40">
                          Matches Won
                        </div>
                        {entry.totalScore > 0 && (
                          <div className="text-xs text-white/30 mt-1">
                            {entry.totalScore} total strokes
                          </div>
                        )}
                      </>
                    ) : (
                      // Stroke Play Format
                      <>
                        <div
                          className={`text-3xl font-bold mb-1 ${
                            hasHandicaps && entry.netToPar !== undefined
                              ? entry.netToPar < 0
                                ? "text-emerald-400"
                                : entry.netToPar > 0
                                ? "text-red-400"
                                : "text-white"
                              : entry.totalToPar < 0
                              ? "text-emerald-400"
                              : entry.totalToPar > 0
                              ? "text-red-400"
                              : "text-white"
                          }`}
                        >
                          {displayScore}
                        </div>
                        <div className="text-xs text-white/40">
                          {entry.totalScore} strokes
                          {entry.netScore && entry.handicapStrokes
                            ? ` (-${entry.handicapStrokes} HC)`
                            : ""}
                        </div>
                        <div
                          className={`text-xs font-medium mt-1 ${
                            hasHandicaps && entry.netToPar !== undefined
                              ? entry.netToPar < 0
                                ? "text-emerald-400"
                                : entry.netToPar > 0
                                ? "text-red-400"
                                : "text-white/50"
                              : entry.totalToPar < 0
                              ? "text-emerald-400"
                              : entry.totalToPar > 0
                              ? "text-red-400"
                              : "text-white/50"
                          }`}
                        >
                          {hasHandicaps && entry.netToPar !== undefined
                            ? `${entry.netToPar > 0 ? "+" : ""}${
                                entry.netToPar
                              } vs Par (Net)`
                            : `${entry.totalToPar > 0 ? "+" : ""}${
                                entry.totalToPar
                              } vs Par`}
                        </div>
                        {/* Today's Score (for Overall view) */}
                        {view === "overall" && entry.currentRoundScore && (
                          <div className="text-xs text-white/30 mt-1.5 pt-1.5 border-t border-white/10">
                            Today:{" "}
                            <span
                              className={`font-medium ${
                                entry.currentRoundToPar !== undefined
                                  ? entry.currentRoundToPar < 0
                                    ? "text-emerald-400"
                                    : entry.currentRoundToPar > 0
                                    ? "text-red-400"
                                    : "text-white/50"
                                  : "text-white/50"
                              }`}
                            >
                              {entry.currentRoundScore}
                              {entry.currentRoundToPar !== undefined &&
                                ` (${
                                  entry.currentRoundToPar > 0 ? "+" : ""
                                }${entry.currentRoundToPar})`}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const VirtualizedLeaderboard = memo(VirtualizedLeaderboardComponent);
