import { useState } from "react";
import { Round, Tour } from "../../types";
import { storage } from "../../lib/storage";

interface TournamentLeaderboardProps {
  tour: Tour;
}

export const TournamentLeaderboard = ({ tour }: TournamentLeaderboardProps) => {
  const [leaderboardView, setLeaderboardView] = useState<"individual" | "team">(
    "individual"
  );

  const isCompleted = (r: Round) =>
    r?.status === "completed" || !!r?.completedAt;

  const calculateTournamentLeaderboard = () => {
    const entries = tour.players.map((player) => {
      // Get all rounds this player has scores in
      const playerRounds = tour.rounds.filter(
        (round) =>
          isCompleted(round) &&
          round.scores[player.id] &&
          round.scores[player.id].totalScore > 0
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

    // Sort by Tournament Stableford (desc)
    playersWithScores.sort((a, b) => {
      const aSf = storage.calculateTournamentStableford(
        tour as any,
        a.player.id
      );
      const bSf = storage.calculateTournamentStableford(
        tour as any,
        b.player.id
      );
      if (aSf !== bSf) return bSf - aSf;
      return (a.totalScore || 0) - (b.totalScore || 0);
    });
    // Set positions
    playersWithScores.forEach((entry, index) => {
      entry.position = index + 1;
    });

    return playersWithScores;
  };

  const individualLeaderboard = calculateTournamentLeaderboard();
  const teamLeaderboard = storage.calculateTeamLeaderboard(tour);

  const playersWithScores = individualLeaderboard;
  const teamsWithScores = teamLeaderboard.filter(
    (entry) => entry.totalScore > 0
  );

  // If no scores at all, show empty state
  if (playersWithScores.length === 0) {
    return (
      <div className="card max-w-5xl mx-auto">
        <h2 className="section-header card-spacing flex items-center gap-3">
          <span className="text-3xl">🏆</span>
          Tournament Leaderboard
        </h2>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto card-spacing">
            <span className="text-4xl">📊</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-3">
            Tournament Not Started
          </h3>
          <p className="text-slate-500">
            The leaderboard will show overall standings as players complete
            rounds
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-5xl mx-auto p-4 sm:p-6">
      {/* Tournament Leaderboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Tournament Leaderboard
          </h2>
          {(() => {
            const completedCount = tour.rounds.filter(isCompleted).length;
            return (
              <p className="text-slate-600 text-sm sm:text-base mt-1">
                Overall standings across {completedCount} completed round
                {completedCount !== 1 ? "s" : ""}
              </p>
            );
          })()}
        </div>

        <div className="flex items-center gap-4">
          {/* Toggle for team tournaments */}
          {(tour.format === "team" || tour.format === "ryder-cup") &&
            tour.teams &&
            tour.teams.length > 0 && (
              <div className="bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setLeaderboardView("individual")}
                  className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                    leaderboardView === "individual"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  👤 Individual
                </button>
                <button
                  onClick={() => setLeaderboardView("team")}
                  className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                    leaderboardView === "team"
                      ? "bg-emerald-600 text-white"
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
      {leaderboardView === "team" &&
      (tour.format === "team" || tour.format === "ryder-cup") ? (
        /* Team Tournament Leaderboard */
        <div className="space-y-3">
          {teamsWithScores.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">👥</span>
              <p className="text-slate-500">No team scores yet</p>
            </div>
          ) : (
            teamsWithScores.map((teamEntry, index) => {
              const captain = tour.players.find(
                (p) => p.id === teamEntry.team.captainId
              );
              const isLeadingTeam = index === 0;

              return (
                <div
                  key={teamEntry.team.id}
                  className={`p-4 sm:p-5 bg-white border-2 rounded-xl transition-all ${
                    isLeadingTeam
                      ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Position Badge */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                        isLeadingTeam
                          ? "bg-yellow-500 text-white"
                          : "bg-slate-100 text-slate-700"
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
                        <h3 className="font-bold text-lg text-slate-900 truncate">
                          {teamEntry.team.name}
                        </h3>
                        {isLeadingTeam && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                            Leading
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>{teamEntry.playersWithScores} players</span>
                        {captain && <span>Captain: {captain.name}</span>}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-3xl font-bold text-slate-900">
                        {teamEntry.netScore || teamEntry.totalScore}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {teamEntry.totalScore} strokes
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Individual Tournament Leaderboard */
        <div className="space-y-3">
          {playersWithScores.slice(0, 10).map((entry, index) => {
            const isLeader = index === 0;
            const stablefordPoints = storage.calculateTournamentStableford(
              tour,
              entry.player.id
            );

            return (
              <div
                key={entry.player.id}
                className={`p-4 sm:p-5 bg-white border-2 rounded-xl transition-all ${
                  isLeader
                    ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Position Badge */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                      isLeader
                        ? "bg-yellow-500 text-white"
                        : "bg-slate-100 text-slate-700"
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

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-slate-900 truncate">
                        {entry.player.name}
                      </h3>
                      {entry.isCaptain && <span className="text-base">👑</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      {entry.player.handicap !== undefined && (
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400">HC</span>
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

                      <span className="text-slate-400">
                        {entry.roundsPlayed} round
                        {entry.roundsPlayed !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Score Display */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {stablefordPoints}
                    </div>
                    <div className="text-xs text-slate-500">
                      Total strokes: {entry.totalScore}
                      {entry.handicapStrokes && entry.handicapStrokes > 0
                        ? ` (-${entry.handicapStrokes} HC)`
                        : ""}
                    </div>
                    <div className="text-xs text-emerald-600 font-medium mt-1">
                      Stableford: {stablefordPoints}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Show more players indicator */}
          {playersWithScores.length > 10 && (
            <div className="text-center py-4 text-sm text-slate-500">
              Showing top 10 of {playersWithScores.length} players
            </div>
          )}
        </div>
      )}
    </div>
  );
};
