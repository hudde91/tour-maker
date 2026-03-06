import { useState, useMemo, useCallback } from "react";
import { Round, Tour, LeaderboardEntry } from "../../types";
import { storage } from "../../lib/storage";
import { calculateTournamentPoints } from "../../lib/storage/scoring";
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
import { BroadcastHeader } from "./BroadcastHeader";
import { LeaderboardRow } from "./LeaderboardRow";

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

      // ===== CHECK POINTS-PER-ROUND SCORING =====
      const isPointsPerRound = tour.scoringConfig?.method === "points-per-round";

      if (isPointsPerRound && tour.scoringConfig && view === "overall") {
        // Calculate tournament points for all players
        const pointsMap = calculateTournamentPoints(tour, tour.scoringConfig);

        // Attach points to entries
        playersWithScores.forEach((entry) => {
          entry.tournamentPoints = pointsMap.get(entry.player.id) || 0;
        });

        // Sort by tournament points (highest first)
        playersWithScores.sort((a, b) => {
          const aPts = a.tournamentPoints || 0;
          const bPts = b.tournamentPoints || 0;
          if (aPts !== bPts) return bPts - aPts;
          // Tiebreaker: lower total strokes
          return (a.totalScore || 0) - (b.totalScore || 0);
        });

        // Set positions
        let currentPosition = 1;
        playersWithScores.forEach((entry, index) => {
          if (index > 0) {
            const prev = playersWithScores[index - 1];
            if ((prev.tournamentPoints || 0) !== (entry.tournamentPoints || 0)) {
              currentPosition = index + 1;
            }
          }
          entry.position = currentPosition;
        });
      } else {
        // ===== FORMAT-SPECIFIC SORTING =====
        const completedRounds = getCompletedRounds(tour.rounds);
        const isRyderCup = tour.format === "ryder-cup";
        const hasSomeStableford = completedRounds.some(isStablefordScoring);
        const isMatchPlay = completedRounds.some(isMatchPlayRound);
        const hasHandicaps = completedRounds.some(hasHandicapsEnabled);

        if (isRyderCup) {
          playersWithScores.sort((a, b) => {
            return (a.totalScore || 0) - (b.totalScore || 0);
          });
        } else if (hasSomeStableford) {
          playersWithScores.sort((a, b) => {
            const aSf = storage.calculateTournamentStableford(tour, a.player.id);
            const bSf = storage.calculateTournamentStableford(tour, b.player.id);
            if (aSf !== bSf) return bSf - aSf;
            return (a.totalScore || 0) - (b.totalScore || 0);
          });
        } else if (isMatchPlay) {
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
          playersWithScores.sort((a, b) => {
            if (hasHandicaps) {
              const aScore = a.netScore ?? a.totalScore;
              const bScore = b.netScore ?? b.totalScore;
              return aScore - bScore;
            } else {
              return (a.totalScore || 0) - (b.totalScore || 0);
            }
          });
        }

        // Set positions (handle ties)
        let currentPosition = 1;
        playersWithScores.forEach((entry, index) => {
          if (index > 0) {
            const prev = playersWithScores[index - 1];
            let isTied = false;

            if (hasSomeStableford) {
              const prevSf = storage.calculateTournamentStableford(tour, prev.player.id);
              const currSf = storage.calculateTournamentStableford(tour, entry.player.id);
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
      }

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
      tour.scoringConfig,
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
  const isPointsPerRound = tour.scoringConfig?.method === "points-per-round";

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

  // Check if any round is currently live
  const hasLiveRound = tour.rounds.some((r) => r.status === "in-progress");

  // If no scores at all, show empty state
  if (playersWithScores.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-1">
        <BroadcastHeader
          tournamentName="Leaderboard"
          subtitle="No scores recorded yet"
        />
        <div className="text-center py-12 rounded-b-xl border border-t-0 border-white/10 bg-white/[0.02]">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white/60 mb-2">
            No Scores Yet
          </h3>
          <p className="text-white/30 text-sm">
            Complete rounds to see the leaderboard
          </p>
        </div>
      </div>
    );
  }

  const completedRoundsList = getCompletedRounds(tour.rounds);

  const subtitleText =
    view === "overall"
      ? `${completedRoundsList.length} round${completedRoundsList.length !== 1 ? "s" : ""} completed`
      : view === "current-round"
        ? "Current round"
        : "Round standings";

  return (
    <div className="m-4 max-w-5xl space-y-4 leaderboard-broadcast">
      <BroadcastHeader
        tournamentName="Leaderboard"
        subtitle={subtitleText}
        isLive={hasLiveRound}
        roundInfo={
          view === "overall"
            ? `${completedRoundsList.length} Rd${completedRoundsList.length !== 1 ? "s" : ""}`
            : undefined
        }
      />

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
        /* Team Tournament Leaderboard - Broadcast Style */
        <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
          {teamsWithScores.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">👥</span>
              <p className="text-white/40">No team scores yet</p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="flex items-center gap-3 px-3 py-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/30 border-b border-white/10 bg-white/[0.03]">
                <div className="w-8 text-center">Pos</div>
                <div className="flex-1">Team</div>
                {isRyderCup ? (
                  <div className="min-w-[40px] text-right">Pts</div>
                ) : (
                  <>
                    <div className="min-w-[44px] text-right">
                      {hasHandicaps ? "Net" : "Par"}
                    </div>
                    <div className="min-w-[36px] text-right">Strk</div>
                  </>
                )}
              </div>

              {/* Team rows */}
              {teamsWithScores.map((teamEntry, index) => {
                const captain = tour.players.find(
                  (p) => p.id === teamEntry.team.captainId,
                );
                const posClass =
                  index === 0
                    ? "lb-pos-1"
                    : index === 1
                      ? "lb-pos-2"
                      : index === 2
                        ? "lb-pos-3"
                        : "";
                const rowClass =
                  index === 0
                    ? "lb-row-leader"
                    : index === 1
                      ? "lb-row-2"
                      : index === 2
                        ? "lb-row-3"
                        : "";

                const displayScore = hasHandicaps
                  ? (teamEntry.netScore ?? teamEntry.totalScore)
                  : teamEntry.totalScore;
                const toPar = hasHandicaps
                  ? (teamEntry.netToPar ?? teamEntry.totalToPar)
                  : teamEntry.totalToPar;

                const formatToPar = (v: number) =>
                  v === 0 ? "E" : v > 0 ? `+${v}` : `${v}`;
                const getToParClass = (v: number) =>
                  v < 0
                    ? "lb-score-under"
                    : v > 0
                      ? "lb-score-over"
                      : "lb-score-even";

                return (
                  <div key={teamEntry.team.id} className={`lb-row ${rowClass}`}>
                    {/* Position */}
                    <div className={`lb-pos ${posClass}`}>
                      {teamEntry.position}
                    </div>

                    {/* Team name and meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: teamEntry.team.color }}
                        />
                        <span className="font-semibold text-white text-sm sm:text-base truncate">
                          {teamEntry.team.name}
                        </span>
                        {index === 0 && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/15 px-1.5 py-0.5 rounded flex-shrink-0">
                            Leader
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-white/40 mt-0.5">
                        <span>
                          {teamEntry.playersWithScores}/{teamEntry.totalPlayers} players
                        </span>
                        {captain && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {captain.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score section */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 text-right">
                      {isRyderCup ? (
                        <div className="min-w-[40px]">
                          <div className="text-lg sm:text-xl font-bold text-amber-400">
                            {teamEntry.ryderCupPoints ?? 0}
                          </div>
                          <div className="text-[10px] text-white/30 uppercase">Pts</div>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-[44px]">
                            <div className={`text-lg sm:text-xl font-bold ${getToParClass(toPar)}`}>
                              {formatToPar(toPar)}
                            </div>
                            <div className="text-[10px] text-white/30 uppercase">
                              {hasHandicaps ? "Net" : "Par"}
                            </div>
                          </div>
                          <div className="min-w-[36px] text-white/40">
                            <div className="text-sm font-medium">{displayScore}</div>
                            <div className="text-[10px]">
                              {hasHandicaps && teamEntry.totalHandicapStrokes
                                ? `(-${teamEntry.totalHandicapStrokes})`
                                : "Strk"}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
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
        /* Standard Individual Tournament Leaderboard - Broadcast Style */
        <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
          {/* Column headers */}
          <div className="flex items-center gap-3 px-3 py-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/30 border-b border-white/10 bg-white/[0.03]">
            <div className="w-8 text-center">Pos</div>
            <div className="w-5" />
            <div className="flex-1">Player</div>
            {isPointsPerRound && view === "overall" ? (
              <>
                <div className="min-w-[40px] text-right">Pts</div>
                <div className="min-w-[36px] text-right">Strk</div>
              </>
            ) : hasSomeStableford ? (
              <>
                <div className="min-w-[40px] text-right">Stb</div>
                <div className="min-w-[36px] text-right">Strk</div>
              </>
            ) : isMatchPlay ? (
              <div className="min-w-[40px] text-right">Won</div>
            ) : (
              <>
                <div className="min-w-[44px] text-right">
                  {hasHandicaps ? "Net" : "Par"}
                </div>
                <div className="min-w-[36px] text-right">Strk</div>
                {view === "overall" && (
                  <div className="min-w-[36px] text-right hidden sm:block">Today</div>
                )}
              </>
            )}
          </div>

          {/* Rows */}
          {playersWithScores.slice(0, 10).map((entry, index) => (
            <LeaderboardRow
              key={entry.player.id}
              entry={entry}
              index={index}
              hasSomeStableford={hasSomeStableford}
              isMatchPlay={isMatchPlay}
              hasHandicaps={hasHandicaps}
              isPointsPerRound={isPointsPerRound}
              view={view}
              roundsToInclude={roundsToInclude}
              stablefordPoints={playerStablefordPoints.get(entry.player.id) || 0}
              matchesWon={playerMatchesWon.get(entry.player.id) || 0}
            />
          ))}

          {/* Show more players indicator */}
          {playersWithScores.length > 10 && (
            <div className="text-center py-3 text-xs text-white/30 border-t border-white/10 bg-white/[0.02]">
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
