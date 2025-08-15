import { Player, Tour } from "../../types";
import { storage } from "../../lib/storage";

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

  const team = tour.teams?.find((t) => t.id === player.teamId);
  const isCaptain = team?.captainId === player.id;

  return (
    <div className="card hover:shadow-elevated transition-all duration-200">
      {/* Player Header - Clickable */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Player Avatar */}
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-lg md:text-xl">👤</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
              <h3 className="text-base md:text-lg font-semibold text-slate-900 truncate">
                {player.name}
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                {isCaptain && (
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold border border-amber-200">
                    👑 Captain
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-slate-600">
              {player.handicap !== undefined && (
                <span className="font-medium flex items-center gap-1">
                  <span className="text-base">⛳</span>
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

              <span className="text-slate-500 flex items-center gap-1">
                {playerRounds.length} round
                {playerRounds.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Score & Expand Icon */}
        <div className="flex items-center gap-3 md:gap-4">
          {totalScore > 0 && (
            <div className="text-right">
              <div className="text-sm font-medium text-slate-600">
                Total Strokes: {totalScore}
              </div>
            </div>
          )}

          <div
            className={`transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            <span className="text-lg text-slate-400">▶️</span>
          </div>
        </div>
      </div>

      {/* Expanded Scorecard */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-slate-200 animate-fade-in">
          <div className="mb-4">
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <span className="text-base">📊</span>
              Round-by-round performance in {tour.name}
            </p>
          </div>

          {playerRounds.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <p className="text-slate-500 font-medium">
                No completed rounds yet
              </p>
            </div>
          ) : (
            <>
              {/* Round Scores */}
              <div className="space-y-3 card-spacing">
                {playerRounds.map((round, index) => {
                  const playerScore = round.scores[player.id];
                  const displayScore =
                    playerScore.netScore || playerScore.totalScore;

                  return (
                    <div
                      key={round.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                          <span className="text-base md:text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <span className="text-base">📋</span>
                            Round {index + 1}
                          </span>
                          <span className="text-sm text-slate-500">
                            {round.name}
                          </span>
                          {playerScore.handicapStrokes &&
                            playerScore.handicapStrokes > 0 && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                                ⛳ HC Applied
                              </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <span className="text-base">🏌️</span>
                            {round.courseName}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-base">⛳</span>
                            Par {storage.getTotalPar(round)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-base">🏕️</span>
                            {round.holes} holes
                          </span>
                          {playerScore.handicapStrokes &&
                            playerScore.handicapStrokes > 0 && (
                              <span className="text-blue-600 font-medium flex items-center gap-1">
                                <span className="text-base">➖</span>
                                {playerScore.handicapStrokes} strokes
                              </span>
                            )}
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                              round.status === "completed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {round.status === "completed" ? "" : "🔴"}
                            {round.status === "completed" ? "Finished" : "Live"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-xl md:text-2xl font-bold mb-1 ${
                            displayScore < 0 ? "text-red-500" : "text-slate-900"
                          }`}
                        >
                          {displayScore}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
