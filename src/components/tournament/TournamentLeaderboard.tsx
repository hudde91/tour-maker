import { useState, useMemo, useCallback } from "react";
import { Round, Tour, LeaderboardEntry } from "../../types";
import { storage } from "../../lib/storage";
import {
  LeaderboardFilters,
  LeaderboardView,
  LeaderboardSort,
} from "./LeaderboardFilters";
import {
  isRoundCompleted,
  isStablefordScoring,
  hasHandicapsEnabled,
  isMatchPlayRound,
  getCompletedRounds,
} from "../../lib/roundUtils";
import { VirtualizedLeaderboard } from "./VirtualizedLeaderboard";

// Threshold for enabling virtualization - improves performance for large tournaments
const VIRTUALIZATION_THRESHOLD = 50;

interface TournamentLeaderboardProps {
  tour: Tour;
}

export const TournamentLeaderboard = ({ tour }: TournamentLeaderboardProps) => {
  const [leaderboardView, setLeaderboardView] = useState<"individual" | "team">(
    "individual",
  );
  const [view, setView] = useState<LeaderboardView>("overall");
  const [sort, setSort] = useState<LeaderboardSort>("score-asc");
  const [selectedRoundId, setSelectedRoundId] = useState<string>(
    tour.rounds[0]?.id || "",
  );

  // Memoize event handlers to prevent unnecessary re-renders
  const handleViewChange = useCallback((newView: LeaderboardView) => {
    setView(newView);
  }, []);

  const handleSortChange = useCallback((newSort: LeaderboardSort) => {
    setSort(newSort);
  }, []);

  const handleRoundSelect = useCallback((roundId: string) => {
    setSelectedRoundId(roundId);
  }, []);

  const handleLeaderboardViewChange = useCallback(
    (newView: "individual" | "team") => {
      setLeaderboardView(newView);
    },
    [],
  );

  // Memoize rounds to include based on view - prevents recalculation on every render
  const { roundsToInclude, previousRoundsToInclude } = useMemo(() => {
    let rounds: Round[] = [];
    let previousRounds: Round[] = [];

    if (view === "overall") {
      rounds = getCompletedRounds(tour.rounds);
      // For position change, compare to all rounds except the most recent
      if (rounds.length > 1) {
        previousRounds = rounds.slice(0, -1);
      }
    } else if (view === "current-round") {
      // Get the most recent active or completed round
      const activeRound = tour.rounds.find((r) => r.status === "in-progress");
      const latestCompletedRound = [...tour.rounds]
        .filter(isRoundCompleted)
        .sort(
          (a, b) =>
            new Date(b.completedAt || 0).getTime() -
            new Date(a.completedAt || 0).getTime(),
        )[0];
      rounds = activeRound
        ? [activeRound]
        : latestCompletedRound
          ? [latestCompletedRound]
          : [];
      // For position change in current round, compare to overall standings before this round
      const allCompleted = getCompletedRounds(tour.rounds);
      if (rounds.length > 0 && allCompleted.length > 0) {
        const currentRoundId = rounds[0].id;
        previousRounds = allCompleted.filter((r) => r.id !== currentRoundId);
      }
    } else if (view === "by-round") {
      const selectedRound = tour.rounds.find((r) => r.id === selectedRoundId);
      rounds =
        selectedRound && isRoundCompleted(selectedRound) ? [selectedRound] : [];
      // For position change in specific round, compare to all previous rounds
      if (selectedRound) {
        const selectedRoundIndex = tour.rounds.findIndex(
          (r) => r.id === selectedRoundId,
        );
        if (selectedRoundIndex > 0) {
          previousRounds = tour.rounds
            .slice(0, selectedRoundIndex)
            .filter(isRoundCompleted);
        }
      }
    }

    return { roundsToInclude: rounds, previousRoundsToInclude: previousRounds };
  }, [view, selectedRoundId, tour.rounds]);

  // Memoize the expensive leaderboard calculation function
  const calculateTournamentLeaderboard = useCallback(
    (useRounds: Round[] = roundsToInclude): LeaderboardEntry[] => {
      const entries: LeaderboardEntry[] = tour.players.map((player) => {
        // Get all rounds this player has scores in (from filtered rounds)
        const playerRounds = useRounds.filter((round) => {
          // Check for traditional stroke play scores
          if (
            round.scores[player.id] &&
            round.scores[player.id].totalScore > 0
          ) {
            return true;
          }

          // Check for Ryder Cup match play scores
          if (round.isMatchPlay) {
            return storage.hasRyderCupScores(round, player.id);
          }

          return false;
        });

        // Calculate total strokes across all rounds
        const totalScore = playerRounds.reduce((sum, round) => {
          // Get score from traditional stroke play
          if (round.scores[player.id]) {
            return sum + (round.scores[player.id]?.totalScore || 0);
          }

          // Get score from Ryder Cup match play
          if (round.isMatchPlay) {
            return sum + storage.getPlayerScoreFromRyderCup(round, player.id);
          }

          return sum;
        }, 0);

        // Calculate current round score (for "Overall" view with today's score)
        let currentRoundScore: number | undefined;
        let currentRoundToPar: number | undefined;
        if (view === "overall" && roundsToInclude.length > 0) {
          const latestRound = roundsToInclude[roundsToInclude.length - 1];
          if (latestRound.scores[player.id]) {
            currentRoundScore = latestRound.scores[player.id].totalScore;
            const roundPar = storage.getTotalPar(latestRound);
            currentRoundToPar = currentRoundScore - roundPar;
          }
        }

        // Calculate total handicap strokes across all rounds
        const totalHandicapStrokes = playerRounds.reduce((sum, round) => {
          return sum + (round.scores[player.id]?.handicapStrokes || 0);
        }, 0);

        // Calculate net score if handicaps are applied
        const netScore =
          totalHandicapStrokes > 0
            ? totalScore - totalHandicapStrokes
            : undefined;

        // Calculate total par across completed rounds
        const totalPar = playerRounds.reduce((sum, round) => {
          return sum + storage.getTotalPar(round);
        }, 0);

        const totalToPar = totalScore - totalPar;
        const netToPar = netScore ? netScore - totalPar : undefined;

        const team = tour.teams?.find((t) => t.id === player.teamId);
        const isCaptain = team?.captainId === player.id;

        return {
          player,
          totalScore,
          netScore,
          totalToPar,
          netToPar,
          handicapStrokes:
            totalHandicapStrokes > 0 ? totalHandicapStrokes : undefined,
          roundsPlayed: playerRounds.length,
          position: 0,
          team,
          isCaptain,
          currentRoundScore,
          currentRoundToPar,
        };
      });

      // Filter out players with no scores
      const playersWithScores = entries.filter((entry) => entry.totalScore > 0);

      // ===== FORMAT-SPECIFIC SORTING =====
      const completedRounds = getCompletedRounds(tour.rounds);
      const isRyderCup = tour.format === "ryder-cup";
      const hasSomeStableford = completedRounds.some(isStablefordScoring);
      const isMatchPlay = completedRounds.some(isMatchPlayRound);
      const hasHandicaps = completedRounds.some(hasHandicapsEnabled);

      if (isRyderCup) {
        // Ryder Cup: Individual leaderboard is less relevant
        // Sort by total strokes as a fallback, but team view is primary
        playersWithScores.sort((a, b) => {
          return (a.totalScore || 0) - (b.totalScore || 0);
        });
      } else if (hasSomeStableford) {
        // Stableford: Sort by HIGHEST Stableford points
        playersWithScores.sort((a, b) => {
          const aSf = storage.calculateTournamentStableford(tour, a.player.id);
          const bSf = storage.calculateTournamentStableford(tour, b.player.id);
          if (aSf !== bSf) return bSf - aSf; // Higher is better
          return (a.totalScore || 0) - (b.totalScore || 0); // Lower strokes as tiebreaker
        });
      } else if (isMatchPlay) {
        // Match Play: Sort by matches won
        playersWithScores.sort((a, b) => {
          const aMatchesWon = storage.calculateMatchesWon
            ? storage.calculateMatchesWon(tour, a.player.id)
            : 0;
          const bMatchesWon = storage.calculateMatchesWon
            ? storage.calculateMatchesWon(tour, b.player.id)
            : 0;
          if (aMatchesWon !== bMatchesWon) return bMatchesWon - aMatchesWon;
          return (a.totalScore || 0) - (b.totalScore || 0);
        });
      } else {
        // Stroke Play (default): Sort by LOWEST total strokes
        // Use NET score if handicaps are applied, otherwise GROSS
        playersWithScores.sort((a, b) => {
          if (hasHandicaps) {
            const aScore = a.netScore ?? a.totalScore;
            const bScore = b.netScore ?? b.totalScore;
            return aScore - bScore; // Lower is better
          } else {
            return (a.totalScore || 0) - (b.totalScore || 0); // Lower is better
          }
        });
      }

      // Set positions (handle ties)
      let currentPosition = 1;
      playersWithScores.forEach((entry, index) => {
        if (index > 0) {
          const prev = playersWithScores[index - 1];
          // Determine if there's a tie based on scoring method
          let isTied = false;

          if (hasSomeStableford) {
            const prevSf = storage.calculateTournamentStableford(
              tour,
              prev.player.id,
            );
            const currSf = storage.calculateTournamentStableford(
              tour,
              entry.player.id,
            );
            isTied = prevSf === currSf;
          } else if (hasHandicaps) {
            isTied =
              (prev.netScore ?? prev.totalScore) ===
              (entry.netScore ?? entry.totalScore);
          } else {
            isTied = prev.totalScore === entry.totalScore;
          }

          if (!isTied) {
            currentPosition = index + 1;
          }
        }
        entry.position = currentPosition;
      });

      // Calculate position changes if we have previous rounds to compare
      if (previousRoundsToInclude.length > 0 && useRounds === roundsToInclude) {
        const previousLeaderboard = calculateTournamentLeaderboard(
          previousRoundsToInclude,
        );
        const previousPositionMap = new Map(
          previousLeaderboard.map((e) => [e.player.id, e.position]),
        );

        playersWithScores.forEach((entry) => {
          const previousPosition = previousPositionMap.get(entry.player.id);
          if (previousPosition !== undefined) {
            // Positive = moved up (lower position number), Negative = moved down
            entry.positionChange = previousPosition - entry.position;
          }
        });
      }

      // Apply custom sorting if different from default
      if (sort === "score-desc") {
        playersWithScores.reverse();
      } else if (sort === "holes-desc" && isMatchPlay) {
        // Sort by matches won in match play (using existing function)
        playersWithScores.sort((a, b) => {
          const aMatchesWon = storage.calculateMatchesWon
            ? storage.calculateMatchesWon(tour, a.player.id)
            : 0;
          const bMatchesWon = storage.calculateMatchesWon
            ? storage.calculateMatchesWon(tour, b.player.id)
            : 0;
          if (aMatchesWon !== bMatchesWon) return bMatchesWon - aMatchesWon;
          return (a.totalScore || 0) - (b.totalScore || 0);
        });
      }

      return playersWithScores;
    },
    [
      tour.players,
      tour.rounds,
      tour.format,
      view,
      roundsToInclude,
      previousRoundsToInclude,
      sort,
    ],
  );

  // Memoize the individual leaderboard calculation - this is expensive!
  const individualLeaderboard = useMemo(() => {
    return calculateTournamentLeaderboard();
  }, [calculateTournamentLeaderboard]);

  // Memoize the team leaderboard calculation
  const teamLeaderboard = useMemo(() => {
    return storage.calculateTeamLeaderboard(tour);
  }, [tour]);

  const playersWithScores = individualLeaderboard;
  const teamsWithScores = teamLeaderboard.filter(
    (entry) => entry.totalScore > 0,
  );

  // Determine format characteristics for display
  const completedRounds = getCompletedRounds(tour.rounds);
  const isRyderCup = tour.format === "ryder-cup";
  const hasSomeStableford = completedRounds.some(isStablefordScoring);
  const isMatchPlay = completedRounds.some(
    (r) => isMatchPlayRound(r) && !isRyderCup,
  );
  const hasHandicaps = completedRounds.some(hasHandicapsEnabled);

  // Pre-calculate stableford and matches won for all players to avoid repeated calls in render loop
  const playerStablefordPoints = useMemo(() => {
    if (!hasSomeStableford) return new Map<string, number>();
    const points = new Map<string, number>();
    playersWithScores.forEach((entry) => {
      points.set(
        entry.player.id,
        storage.calculateTournamentStableford(tour, entry.player.id),
      );
    });
    return points;
  }, [hasSomeStableford, playersWithScores, tour]);

  const playerMatchesWon = useMemo(() => {
    if (!isMatchPlay || !storage.calculateMatchesWon)
      return new Map<string, number>();
    const matches = new Map<string, number>();
    playersWithScores.forEach((entry) => {
      matches.set(
        entry.player.id,
        storage.calculateMatchesWon(tour, entry.player.id),
      );
    });
    return matches;
  }, [isMatchPlay, playersWithScores, tour]);

  // If no scores at all, show empty state
  if (playersWithScores.length === 0) {
    return (
      <div className="card max-w-5xl mx-auto">
        <h2 className="section-header card-spacing flex items-center gap-3">
          <span className="text-3xl">🏆</span>
          Tournament Leaderboard
        </h2>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto card-spacing">
            <span className="text-4xl">📊</span>
          </div>
          <h3 className="text-xl font-semibold text-white/70 card-spacing">
            No Scores Yet
          </h3>
          <p className="text-white/40 card-spacing max-w-md mx-auto">
            Complete rounds to see the leaderboard
          </p>
        </div>
      </div>
    );
  }

  const completedRoundsList = getCompletedRounds(tour.rounds);

  return (
    <div className="card max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="section-header flex items-center gap-3 mb-2">
          <span className="text-3xl">🏆</span>
          Tournament Leaderboard
        </h2>
        <p className="text-white/40 text-sm">
          {view === "overall"
            ? `Overall standings across ${
                completedRoundsList.length
              } completed round${completedRoundsList.length !== 1 ? "s" : ""}`
            : view === "current-round"
              ? "Current round standings"
              : "Round-specific standings"}
        </p>
      </div>

      {/* Filters */}
      <LeaderboardFilters
        view={view}
        onViewChange={handleViewChange}
        sort={sort}
        onSortChange={handleSortChange}
        rounds={completedRoundsList}
        selectedRoundId={selectedRoundId}
        onRoundSelect={handleRoundSelect}
        isStableford={hasSomeStableford}
        isMatchPlay={isMatchPlay}
      />

      {/* Team/Individual Toggle */}
      {tour.format === "team" && teamsWithScores.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={() => handleLeaderboardViewChange("individual")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              leaderboardView === "individual"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => handleLeaderboardViewChange("team")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              leaderboardView === "team"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Team
          </button>
        </div>
      )}

      {/* Leaderboard Content */}
      {leaderboardView === "team" &&
      (tour.format === "team" || tour.format === "ryder-cup") ? (
        /* Team Tournament Leaderboard */
        <div className="space-y-3">
          {teamsWithScores.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">👥</span>
              <p className="text-white/40">No team scores yet</p>
            </div>
          ) : (
            teamsWithScores.map((teamEntry, index) => {
              const captain = tour.players.find(
                (p) => p.id === teamEntry.team.captainId,
              );
              const isLeadingTeam = index === 0;

              return (
                <div
                  key={teamEntry.team.id}
                  className={`p-4 sm:p-5 bg-white/5 border-2 rounded-xl transition-all ${
                    isLeadingTeam
                      ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50"
                      : "border-white/10 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Position Badge */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                        isLeadingTeam
                          ? "bg-yellow-500 text-white"
                          : "bg-white/5 text-white/70"
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Team Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                          style={{ backgroundColor: teamEntry.team.color }}
                        />
                        <h3 className="font-bold text-lg text-white truncate">
                          {teamEntry.team.name}
                        </h3>
                        {isLeadingTeam && (
                          <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                            Leading
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-white/50">
                        <span>{teamEntry.playersWithScores} players</span>
                        {captain && <span>Captain: {captain.name}</span>}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-3xl font-bold text-white">
                        {teamEntry.netScore || teamEntry.totalScore}
                      </div>
                      <div className="text-xs text-white/40 mt-1">
                        {teamEntry.totalScore} strokes
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : playersWithScores.length > VIRTUALIZATION_THRESHOLD ? (
        /* Virtualized Individual Tournament Leaderboard for large player counts */
        <div>
          <div className="mb-3 text-sm text-white/50 bg-blue-500/15 border border-blue-500/30 rounded-lg p-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>
              Performance mode enabled for {playersWithScores.length} players -
              scroll to view all entries
            </span>
          </div>
          <VirtualizedLeaderboard
            entries={playersWithScores}
            hasSomeStableford={hasSomeStableford}
            isMatchPlay={isMatchPlay}
            hasHandicaps={hasHandicaps}
            view={view}
            roundsToInclude={roundsToInclude}
            playerStablefordPoints={playerStablefordPoints}
            playerMatchesWon={playerMatchesWon}
          />
        </div>
      ) : (
        /* Standard Individual Tournament Leaderboard (top 10) */
        <div className="space-y-3">
          {playersWithScores.slice(0, 10).map((entry, index) => {
            // Use pre-calculated values instead of calling expensive functions in the loop
            const stablefordPoints =
              playerStablefordPoints.get(entry.player.id) || 0;
            const matchesWon = playerMatchesWon.get(entry.player.id) || 0;

            // Determine display score
            const displayScore = hasHandicaps
              ? (entry.netScore ?? entry.totalScore)
              : entry.totalScore;

            return (
              <div
                key={entry.player.id}
                className={`p-4 sm:p-5 bg-white/5 border-2 rounded-xl transition-all ${
                  index === 0
                    ? "border-yellow-400"
                    : index === 1
                      ? "border-white/35"
                      : index === 2
                        ? "border-orange-300"
                        : "border-white/10 hover:border-white/15"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Position Badge with Movement Arrow */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    {index < 3 ? (
                      <span className="text-2xl">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </span>
                    ) : (
                      entry.position
                    )}
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
                              // Count non-zero scores to determine holes completed
                              const holesCompleted = playerScores.scores.filter(
                                (score) => score !== null && score > 0,
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
                        <div className="text-xs text-white/40">Matches Won</div>
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
                                ` (${entry.currentRoundToPar > 0 ? "+" : ""}${
                                  entry.currentRoundToPar
                                })`}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Show more players indicator */}
          {playersWithScores.length > 10 && (
            <div className="text-center py-4 text-sm text-white/40">
              Showing top 10 of {playersWithScores.length} players
            </div>
          )}
        </div>
      )}

      {/* Competition Winners Section */}
      {(() => {
        // Collect all competition winners from the rounds being displayed
        const competitionWinners: {
          type: "closestToPin" | "longestDrive";
          holeNumber: number;
          playerId: string;
          roundName: string;
          distance?: number;
        }[] = [];

        roundsToInclude.forEach((round) => {
          if (round.competitionWinners) {
            // For each hole, determine the overall winner from all match entries
            Object.entries(round.competitionWinners.closestToPin).forEach(
              ([holeNum, winners]) => {
                if (winners && winners.length > 0) {
                  // Find the winner with the shortest distance (or first if no distances)
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
                    roundName: round.name,
                    distance: overallWinner.distance,
                  });
                }
              },
            );
            Object.entries(round.competitionWinners.longestDrive).forEach(
              ([holeNum, winners]) => {
                if (winners && winners.length > 0) {
                  // Find the winner with the longest distance (or first if no distances)
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
                    roundName: round.name,
                    distance: overallWinner.distance,
                  });
                }
              },
            );
          }
        });

        if (competitionWinners.length === 0) {
          return null;
        }

        // Group by type
        const closestToPinWinners = competitionWinners.filter(
          (w) => w.type === "closestToPin",
        );
        const longestDriveWinners = competitionWinners.filter(
          (w) => w.type === "longestDrive",
        );

        return (
          <div className="border-t border-white/10 pt-6 mt-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🏅</span>
              Competition Winners
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Closest to Pin */}
              {closestToPinWinners.length > 0 && (
                <div className="border-2 border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                    </svg>
                    <h4 className="font-semibold text-blue-400">
                      Closest to Pin
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {closestToPinWinners.map((winner, idx) => {
                      const player = tour.players.find(
                        (p) => p.id === winner.playerId,
                      );
                      return (
                        <div
                          key={idx}
                          className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-white">
                              {player?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-white/50">
                              Hole {winner.holeNumber}
                              {roundsToInclude.length > 1 &&
                                ` • ${winner.roundName}`}
                              {winner.distance && ` • ${winner.distance} ft`}
                            </div>
                          </div>
                          <svg
                            className="w-6 h-6 text-blue-600 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Longest Drive */}
              {longestDriveWinners.length > 0 && (
                <div className="border-2 border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h4 className="font-semibold text-amber-400">
                      Longest Drive
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {longestDriveWinners.map((winner, idx) => {
                      const player = tour.players.find(
                        (p) => p.id === winner.playerId,
                      );
                      return (
                        <div
                          key={idx}
                          className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-white">
                              {player?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-white/50">
                              Hole {winner.holeNumber}
                              {roundsToInclude.length > 1 &&
                                ` • ${winner.roundName}`}
                              {winner.distance && ` • ${winner.distance} yds`}
                            </div>
                          </div>
                          <svg
                            className="w-6 h-6 text-amber-600 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
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
