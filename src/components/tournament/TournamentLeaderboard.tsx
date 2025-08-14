import { useState } from "react";
import { Tour } from "../../types";
import { storage } from "../../lib/storage";

interface TournamentLeaderboardProps {
  tour: Tour;
}

export const TournamentLeaderboard = ({ tour }: TournamentLeaderboardProps) => {
  const [leaderboardView, setLeaderboardView] = useState<"individual" | "team">(
    "individual"
  );

  // Get overall tournament leaderboard (no roundId = all rounds combined)
  const individualLeaderboard = storage.calculateLeaderboard(tour);
  const teamLeaderboard = storage.calculateTeamLeaderboard(tour);

  const playersWithScores = individualLeaderboard.filter(
    (entry) => entry.totalScore > 0
  );
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
    <div className="card max-w-5xl mx-auto p-6 md:p-10">
      {/* Tournament Leaderboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 card-spacing">
        <div>
          <h2 className="section-header flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            Tournament Leaderboard
          </h2>
          <p className="text-slate-600 mt-1">
            Overall standings across {tour.rounds.length} round
            {tour.rounds.length !== 1 ? "s" : ""}
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
              const isTop3 = index < 3;

              return (
                <div
                  key={teamEntry.team.id}
                  className={`flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm transition-all ${
                    isLeadingTeam
                      ? "border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50"
                      : isTop3
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Team Position */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                        isLeadingTeam
                          ? "bg-yellow-500 text-white"
                          : index === 1
                          ? "bg-slate-400 text-white"
                          : index === 2
                          ? "bg-amber-600 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isLeadingTeam ? (
                        <span className="text-lg">🥇</span>
                      ) : index === 1 ? (
                        <span className="text-lg">🥈</span>
                      ) : index === 2 ? (
                        <span className="text-lg">🥉</span>
                      ) : (
                        teamEntry.position
                      )}
                    </div>

                    {/* Team Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: teamEntry.team.color }}
                          />
                          <h3
                            className={`font-bold truncate ${
                              isLeadingTeam
                                ? "text-lg text-yellow-900"
                                : "text-slate-900"
                            }`}
                          >
                            {teamEntry.team.name}
                          </h3>
                        </div>

                        {isLeadingTeam && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold self-start">
                            🏆 Leading
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <span className="text-base">👥</span>
                          {teamEntry.playersWithScores} of{" "}
                          {teamEntry.totalPlayers} players
                        </span>
                        {captain && (
                          <span className="flex items-center gap-1">
                            <span className="text-base">👑</span>
                            Captain: {captain.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team Score */}
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${
                        isLeadingTeam ? "text-yellow-900" : "text-slate-900"
                      }`}
                    >
                      {teamEntry.totalScore}
                    </div>
                    {teamEntry.totalToPar !== 0 && (
                      <div
                        className={`text-sm font-semibold ${
                          teamEntry.totalToPar < 0
                            ? "text-red-600"
                            : teamEntry.totalToPar > 0
                            ? "text-orange-600"
                            : "text-blue-600"
                        }`}
                      >
                        {teamEntry.totalToPar > 0 ? "+" : ""}
                        {teamEntry.totalToPar}
                      </div>
                    )}
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
            const team = tour.teams?.find((t) => t.id === entry.player.teamId);
            const isCaptain = team?.captainId === entry.player.id;
            const isLeader = index === 0;
            const isTop3 = index < 3;

            return (
              <div
                key={entry.player.id}
                className={`flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm transition-all ${
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                      isLeader
                        ? "bg-yellow-500 text-white"
                        : index === 1
                        ? "bg-slate-400 text-white"
                        : index === 2
                        ? "bg-amber-600 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isLeader ? (
                      <span className="text-lg">🥇</span>
                    ) : index === 1 ? (
                      <span className="text-lg">🥈</span>
                    ) : index === 2 ? (
                      <span className="text-lg">🥉</span>
                    ) : (
                      entry.position
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                      <h3
                        className={`font-bold truncate ${
                          isLeader
                            ? "text-lg text-yellow-900"
                            : "text-slate-900"
                        }`}
                      >
                        {entry.player.name}
                      </h3>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isCaptain && (
                          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold">
                            👑 Captain
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      {entry.player.handicap !== undefined && (
                        <span className="flex items-center gap-1">
                          <span className="text-base">⛳</span>
                          HC: {entry.player.handicap}
                        </span>
                      )}

                      {team && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="font-medium">{team.name}</span>
                        </div>
                      )}

                      <span className="flex items-center gap-1">
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
                      className={`text-2xl font-bold ${
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
                        Gross: {entry.totalScore} (-{entry.handicapStrokes} HC)
                      </div>
                    )}

                    {/* To Par Display */}
                    {(entry.netToPar !== undefined
                      ? entry.netToPar
                      : entry.totalToPar) !== 0 && (
                      <div
                        className={`text-sm font-semibold ${
                          (entry.netToPar !== undefined
                            ? entry.netToPar
                            : entry.totalToPar) < 0
                            ? "text-red-600"
                            : (entry.netToPar !== undefined
                                ? entry.netToPar
                                : entry.totalToPar) > 0
                            ? "text-orange-600"
                            : "text-blue-600"
                        }`}
                      >
                        {(entry.netToPar !== undefined
                          ? entry.netToPar
                          : entry.totalToPar) > 0
                          ? "+"
                          : ""}
                        {entry.netToPar !== undefined
                          ? entry.netToPar
                          : entry.totalToPar}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Show more players indicator */}
          {playersWithScores.length > 10 && (
            <div className="text-center py-4 border-t border-slate-200">
              <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
                <span className="text-base">👥</span>
                Showing top 10 of {playersWithScores.length} players
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tournament Statistics */}
      {playersWithScores.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="subsection-header mb-4 flex items-center gap-2">
            <span className="text-xl">📊</span>
            Tournament Statistics
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-xl mb-2">📊</div>
              <div className="text-2xl font-bold text-slate-900">
                {Math.round(
                  playersWithScores.reduce((sum, p) => sum + p.totalScore, 0) /
                    playersWithScores.length
                )}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Average
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-xl mb-2">🔥</div>
              <div className="text-2xl font-bold text-slate-900">
                {playersWithScores.filter((p) => p.totalToPar < 0).length}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Under Par
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-xl mb-2">✅</div>
              <div className="text-2xl font-bold text-slate-900">
                {tour.rounds.filter((r) => r.status === "completed").length}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Rounds Complete
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
