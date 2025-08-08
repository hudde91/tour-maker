import { Player, Tour } from "../types";
import { storage } from "../lib/storage";

interface PlayerScorecardProps {
  player: Player;
  tour: Tour;
  isExpanded: boolean;
  onToggle: () => void;
}

export const PlayerScorecard = ({
  player,
  tour,
  isExpanded,
  onToggle,
}: PlayerScorecardProps) => {
  const playerRounds = tour.rounds.filter(
    (round) => round.scores[player.id] && round.scores[player.id].totalScore > 0
  );

  const totalScore = playerRounds.reduce((sum, round) => {
    return sum + (round.scores[player.id]?.totalScore || 0);
  }, 0);

  const totalToPar = playerRounds.reduce((sum, round) => {
    return sum + (round.scores[player.id]?.totalToPar || 0);
  }, 0);

  const team = tour.teams?.find((t) => t.id === player.teamId);
  const isCaptain = team?.captainId === player.id;

  const getScoreColor = (toPar: number) => {
    if (toPar < 0) return "text-red-600";
    if (toPar > 0) return "text-orange-600";
    return "text-blue-600";
  };

  return (
    <div className="card hover:shadow-elevated transition-all duration-200">
      {/* Player Header - Clickable */}
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          {/* Player Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold text-slate-900 truncate">
                {player.name}
              </h3>
              {isCaptain && (
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold border border-amber-200">
                  Captain
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm">
              {player.handicap !== undefined && (
                <span className="text-slate-600 font-medium">
                  HC: {player.handicap}
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
                {tour.name} • {playerRounds.length} round
                {playerRounds.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Score & Expand Icon */}
        <div className="flex items-center gap-4">
          {totalScore > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {totalScore}
              </div>
              <div
                className={`text-sm font-semibold ${getScoreColor(totalToPar)}`}
              >
                {totalToPar === 0
                  ? "E"
                  : totalToPar > 0
                  ? `+${totalToPar}`
                  : totalToPar}
              </div>
            </div>
          )}

          <div
            className={`transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Scorecard */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-slate-200 animate-fade-in">
          <div className="mb-4">
            <p className="text-sm text-slate-600">
              Round-by-round performance in {tour.name}
            </p>
          </div>

          {playerRounds.length === 0 ? (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">
                No completed rounds yet
              </p>
            </div>
          ) : (
            <>
              {/* Round Scores */}
              <div className="space-y-3 mb-6">
                {playerRounds.map((round, index) => {
                  const playerScore = round.scores[player.id];
                  const totalPar = storage.getTotalPar(round);
                  const roundToPar =
                    playerScore.netToPar || playerScore.totalToPar; // NEW: Use net if available
                  const displayScore =
                    playerScore.netScore || playerScore.totalScore; // NEW: Use net if available

                  return (
                    <div
                      key={round.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg font-semibold text-slate-900">
                            Round {index + 1}
                          </span>
                          <span className="text-sm text-slate-500">
                            {round.name}
                          </span>
                          {/* NEW: Show handicap indicator */}
                          {playerScore.handicapStrokes &&
                            playerScore.handicapStrokes > 0 && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                                HC Applied
                              </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>{round.courseName}</span>
                          <span>Par {totalPar}</span>
                          <span>{round.holes} holes</span>
                          {/* NEW: Show handicap strokes info */}
                          {playerScore.handicapStrokes &&
                            playerScore.handicapStrokes > 0 && (
                              <span className="text-blue-600 font-medium">
                                -{playerScore.handicapStrokes} strokes
                              </span>
                            )}
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              round.status === "completed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {round.status === "completed" ? "Final" : "Live"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900 mb-1">
                          {displayScore} {/* Show net score */}
                        </div>
                        {/* Show gross score if different */}
                        {playerScore.handicapStrokes &&
                          playerScore.handicapStrokes > 0 && (
                            <div className="text-xs text-slate-500 mb-1">
                              Gross: {playerScore.totalScore}
                            </div>
                          )}
                        <div
                          className={`text-lg font-semibold ${getScoreColor(
                            roundToPar
                          )}`}
                        >
                          {roundToPar === 0
                            ? "E"
                            : roundToPar > 0
                            ? `+${roundToPar}`
                            : roundToPar}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tournament Summary */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4">
                <h5 className="font-semibold text-slate-800 mb-3">
                  Tournament Summary
                </h5>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {totalScore}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">
                      Total Score
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-2xl font-bold mb-1 ${getScoreColor(
                        totalToPar
                      )}`}
                    >
                      {totalToPar === 0
                        ? "E"
                        : totalToPar > 0
                        ? `+${totalToPar}`
                        : totalToPar}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">
                      To Par
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {playerRounds.length > 0
                        ? Math.round(totalScore / playerRounds.length)
                        : 0}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">
                      Avg Score
                    </div>
                  </div>
                </div>

                {/* Best Round */}
                {playerRounds.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">
                        Best Round:
                      </span>
                      <div className="text-right">
                        {(() => {
                          const bestRound = playerRounds.reduce(
                            (best, round) => {
                              const currentScore =
                                round.scores[player.id]?.totalScore || Infinity;
                              const bestScore = best
                                ? best.scores[player.id]?.totalScore || Infinity
                                : Infinity;
                              return currentScore < bestScore ? round : best;
                            }
                          );
                          const bestScore = bestRound.scores[player.id];
                          return (
                            <div>
                              <span className="font-bold text-slate-900">
                                {bestScore.totalScore}
                              </span>
                              <span
                                className={`ml-2 font-semibold ${getScoreColor(
                                  bestScore.totalToPar
                                )}`}
                              >
                                (
                                {bestScore.totalToPar === 0
                                  ? "E"
                                  : bestScore.totalToPar > 0
                                  ? `+${bestScore.totalToPar}`
                                  : bestScore.totalToPar}
                                )
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
