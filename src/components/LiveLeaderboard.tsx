import { useState } from "react";
import { Tour, Round } from "../types";
import { storage } from "../lib/storage";
import { TeamLeaderboard } from "./TeamLeaderboard";

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
  const leaderboard = storage.calculateLeaderboard(tour, round.id);
  const playersWithScores = leaderboard.filter((entry) => entry.totalScore > 0);

  if (isCollapsed && playersWithScores.length === 0) {
    return (
      <div className="card max-w-5xl mx-auto">
        <h3 className="section-header mb-3">Live Leaderboard</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="section-header">Live Tournament Leaderboard</h3>
          <p className="text-slate-600 mt-1">
            {leaderboardView === "individual"
              ? `${playersWithScores.length} of ${tour.players.length} players scoring`
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
                  Individual
                </button>
                <button
                  onClick={() => setLeaderboardView("team")}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    leaderboardView === "team"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Team
                </button>
              </div>
            )}

          {playersWithScores.length > 0 && leaderboardView === "individual" && (
            <div className="text-right">
              <div className="text-sm text-slate-500">Low Round</div>
              <div className="text-xl font-bold text-emerald-600">
                {Math.min(...playersWithScores.map((p) => p.totalScore))}
              </div>
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
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
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
                const team = tour.teams?.find(
                  (t) => t.id === entry.player.teamId
                );
                const isCaptain = team?.captainId === entry.player.id;
                const isLeader = index === 0;
                const isTop3 = index < 3;

                return (
                  <div
                    key={entry.player.id}
                    className={`leaderboard-row transition-all duration-200 ${
                      isLeader
                        ? "leaderboard-leader scale-[1.02]"
                        : isTop3
                        ? "border-amber-200 bg-amber-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Position Badge */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${
                          isLeader
                            ? "bg-yellow-500 text-white shadow-yellow-200"
                            : index === 1
                            ? "bg-slate-400 text-white"
                            : index === 2
                            ? "bg-amber-600 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isLeader && (
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 3l14 9-14 9V3z"
                            />
                          </svg>
                        )}
                        {!isLeader && entry.position}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4
                            className={`font-bold truncate ${
                              isLeader
                                ? "text-xl text-yellow-900"
                                : "text-lg text-slate-900"
                            }`}
                          >
                            {entry.player.name}
                          </h4>

                          {isCaptain && (
                            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold border border-amber-200">
                              Captain
                            </span>
                          )}

                          {isLeader && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold border border-yellow-300">
                              Leader
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          {entry.player.handicap !== undefined && (
                            <span className="text-slate-600">
                              HC: {entry.player.handicap}
                            </span>
                          )}

                          {team && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: team.color }}
                              />
                              <span className="text-slate-700 font-medium">
                                {team.name}
                              </span>
                            </div>
                          )}

                          <span className="text-slate-500">
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
                          className={`text-3xl font-bold mb-1 ${
                            isLeader ? "text-yellow-900" : "text-slate-900"
                          }`}
                        >
                          {entry.netScore !== undefined
                            ? entry.netScore
                            : entry.totalScore}
                        </div>

                        {/* Show handicap strokes if applied - NEW */}
                        {entry.handicapStrokes && entry.handicapStrokes > 0 && (
                          <div className="text-xs text-slate-500 bg-blue-100 px-2 py-1 rounded">
                            Gross: {entry.totalScore} (-{entry.handicapStrokes}{" "}
                            HC)
                          </div>
                        )}

                        {/* To Par Display */}
                        {(entry.netToPar !== undefined
                          ? entry.netToPar
                          : entry.totalToPar) !== 0 && (
                          <div
                            className={`text-lg font-semibold ${
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

                        {(entry.netToPar !== undefined
                          ? entry.netToPar
                          : entry.totalToPar) === 0 &&
                          (entry.netScore !== undefined
                            ? entry.netScore
                            : entry.totalScore) > 0 && (
                            <div className="text-lg font-semibold text-blue-600">
                              E
                            </div>
                          )}
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
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {Math.min(...playersWithScores.map((p) => p.totalScore))}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Low Score
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {Math.round(
                    playersWithScores.reduce(
                      (sum, p) => sum + p.totalScore,
                      0
                    ) / playersWithScores.length
                  )}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Average
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {playersWithScores.filter((p) => p.totalToPar < 0).length}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Under Par
                </div>
              </div>
            </div>
          )}

          {/* Waiting Players */}
          {!isCollapsed && playersWithScores.length < tour.players.length && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="subsection-header mb-3">Players Yet to Start</h4>
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
