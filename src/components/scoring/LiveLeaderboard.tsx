import { useState } from "react";
import { Tour, Round } from "../../types";
import { storage } from "../../lib/storage";
import { TeamLeaderboard } from "../teams/TeamLeaderboard";

interface LiveLeaderboardProps {
  tour: Tour;
  round: Round;
  isCollapsed?: boolean;
}

export const LiveLeaderboard = ({
  tour,
  round,
  isCollapsed = false,
}: LiveLeaderboardProps) => {
  const [leaderboardView, setLeaderboardView] = useState<"individual" | "team">(
    "individual"
  );

  // Calculate tournament totals like PlayerScorecard does
  const calculateTournamentLeaderboard = () => {
    const entries = tour.players.map((player) => {
      // Get all rounds this player has scores in
      const playerRounds = tour.rounds.filter(
        (round) =>
          round.scores[player.id] && round.scores[player.id].totalScore > 0
      );

      // Calculate total strokes across all rounds
      const totalScore = playerRounds.reduce((sum, round) => {
        return sum + (round.scores[player.id]?.totalScore || 0);
      }, 0);

      // Calculate total handicap strokes across all rounds
      const totalHandicapStrokes = playerRounds.reduce((sum, round) => {
        return sum + (round.scores[player.id]?.handicapStrokes || 0);
      }, 0);

      // Calculate net score if handicaps are applied
      const netScore =
        totalHandicapStrokes > 0
          ? totalScore - totalHandicapStrokes
          : undefined;

      const team = tour.teams?.find((t) => t.id === player.teamId);
      const isCaptain = team?.captainId === player.id;

      return {
        player,
        totalScore,
        netScore,
        handicapStrokes:
          totalHandicapStrokes > 0 ? totalHandicapStrokes : undefined,
        roundsPlayed: playerRounds.length,
        position: 0,
        team,
        isCaptain,
      };
    });

    // Filter out players with no scores
    const playersWithScores = entries.filter((entry) => entry.totalScore > 0);

    // Sort by net score if handicaps are applied, otherwise by total score
    playersWithScores.sort((a, b) => {
      const aScore = a.netScore || a.totalScore;
      const bScore = b.netScore || b.totalScore;
      return aScore - bScore;
    });

    // Set positions
    playersWithScores.forEach((entry, index) => {
      entry.position = index + 1;
    });

    return playersWithScores;
  };

  const playersWithScores = calculateTournamentLeaderboard();

  if (isCollapsed && playersWithScores.length === 0) {
    return (
      <div className="card max-w-5xl mx-auto">
        <h3 className="section-header mb-3">Tournament Leaderboard</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-slate-500 font-medium">
            Scores will appear as players enter them
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated max-w-4xl mx-auto">
      {/* Leaderboard Header with Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 card-spacing">
        <div>
          <h3 className="section-header flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Tournament Leaderboard
          </h3>
          <p className="text-slate-600 mt-1">
            {leaderboardView === "individual"
              ? `${playersWithScores.length} of ${tour.players.length} players with scores`
              : `${tour.teams?.length || 0} teams competing`}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Toggle for team tournaments */}
          {(tour.format === "team" || tour.format === "ryder-cup") &&
            tour.teams &&
            tour.teams.length > 0 && (
              <div className="bg-white rounded-lg p-1 shadow-sm border border-slate-200">
                <button
                  onClick={() => setLeaderboardView("individual")}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    leaderboardView === "individual"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  👤 Individual
                </button>
                <button
                  onClick={() => setLeaderboardView("team")}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    leaderboardView === "team"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  👥 Team
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Leaderboard Content */}
      {(tour.format === "team" || tour.format === "ryder-cup") &&
      leaderboardView === "team" ? (
        <TeamLeaderboard tour={tour} round={round} />
      ) : (
        <>
          {playersWithScores.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto card-spacing">
                <span className="text-4xl">⏳</span>
              </div>
              <h4 className="text-lg font-semibold text-slate-700 mb-2">
                Tournament Starting Soon
              </h4>
              <p className="text-slate-500">
                The leaderboard will update in real-time as players enter scores
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {playersWithScores.map((entry, index) => {
                const isLeader = index === 0;
                const isTop3 = index < 3;

                return (
                  <div
                    key={entry.player.id}
                    className={`flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm transition-all duration-200 ${
                      isLeader
                        ? "border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50"
                        : isTop3
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Position Badge */}
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${
                          isLeader
                            ? "bg-yellow-500 text-white shadow-yellow-200"
                            : index === 1
                            ? "bg-slate-400 text-white"
                            : index === 2
                            ? "bg-amber-600 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isLeader ? (
                          <span className="text-xl">🥇</span>
                        ) : index === 1 ? (
                          <span className="text-xl">🥈</span>
                        ) : index === 2 ? (
                          <span className="text-xl">🥉</span>
                        ) : (
                          entry.position
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                          <h4
                            className={`font-bold truncate ${
                              isLeader
                                ? "text-lg md:text-xl text-yellow-900"
                                : "text-base md:text-lg text-slate-900"
                            }`}
                          >
                            {entry.player.name}
                          </h4>

                          <div className="flex items-center gap-2 flex-wrap">
                            {entry.isCaptain && (
                              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold border border-amber-200">
                                👑 Captain
                              </span>
                            )}

                            {isLeader && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold border border-yellow-300">
                                🏆 Leader
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          {entry.player.handicap !== undefined && (
                            <span className="text-slate-600 flex items-center gap-1">
                              <span className="text-base">⛳</span>
                              HC: {entry.player.handicap}
                            </span>
                          )}

                          {entry.team && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: entry.team.color }}
                              />
                              <span className="text-slate-700 font-medium">
                                {entry.team.name}
                              </span>
                            </div>
                          )}

                          <span className="text-slate-500 flex items-center gap-1">
                            <span className="text-base">📋</span>
                            {entry.roundsPlayed} round
                            {entry.roundsPlayed !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score Display */}
                    <div className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div
                          className={`text-2xl md:text-3xl font-bold mb-1 ${
                            isLeader ? "text-yellow-900" : "text-slate-900"
                          }`}
                        >
                          {entry.netScore !== undefined
                            ? entry.netScore
                            : entry.totalScore}
                        </div>

                        {/* Show handicap strokes if applied */}
                        {entry.handicapStrokes && entry.handicapStrokes > 0 && (
                          <div className="text-xs text-slate-500 bg-blue-100 px-2 py-1 rounded">
                            Gross: {entry.totalScore} (-{entry.handicapStrokes}{" "}
                            HC)
                          </div>
                        )}

                        <div className="text-sm font-medium text-slate-600">
                          Total Strokes
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tournament Summary */}
          {!isCollapsed && playersWithScores.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-xl mb-1">🎯</div>
                <div className="text-2xl font-bold text-slate-900">
                  {Math.min(
                    ...playersWithScores.map((p) => p.netScore || p.totalScore)
                  )}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Low Score
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-xl mb-1">📊</div>
                <div className="text-2xl font-bold text-slate-900">
                  {Math.round(
                    playersWithScores.reduce(
                      (sum, p) => sum + (p.netScore || p.totalScore),
                      0
                    ) / playersWithScores.length
                  )}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Average
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-xl mb-1">✅</div>
                <div className="text-2xl font-bold text-slate-900">
                  {tour.rounds.filter((r) => r.status === "completed").length}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Rounds Complete
                </div>
              </div>
            </div>
          )}

          {/* Waiting Players */}
          {!isCollapsed && playersWithScores.length < tour.players.length && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="subsection-header mb-3 flex items-center gap-2">
                <span className="text-lg">⏳</span>
                Players Yet to Start
              </h4>
              <div className="flex flex-wrap gap-2">
                {tour.players
                  .filter(
                    (player) =>
                      !playersWithScores.find(
                        (entry) => entry.player.id === player.id
                      )
                  )
                  .map((player) => (
                    <span
                      key={player.id}
                      className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium border border-slate-200"
                    >
                      {player.name}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
