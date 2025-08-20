import { useState } from "react";
import { Tour, Round } from "../../../types";
import { BestBallTeamScorecard } from "./BestBallTeamScorecard";
import { ScoreEntryCard } from "../../scoring/ScoreEntryCard";
import { TotalScoreCard } from "../../scoring/TotalScoreCard";
import { HoleNavigation } from "../../scoring/HoleNavigation";

interface BestBallScoringInterfaceProps {
  tour: Tour;
  round: Round;
  onPlayerScoreChange: (
    playerId: string,
    holeIndex: number,
    score: number
  ) => void;
  onPlayerTotalScoreChange: (
    playerId: string,
    totalScore: number,
    handicapStrokes?: number,
    stablefordPoints?: number
  ) => void;
}

export const BestBallScoringInterface = ({
  tour,
  round,
  onPlayerScoreChange,
  onPlayerTotalScoreChange,
}: BestBallScoringInterfaceProps) => {
  const [currentHole, setCurrentHole] = useState(1);
  const [scoringMode, setScoringMode] = useState<"individual" | "total">(
    "individual"
  );
  const [viewMode, setViewMode] = useState<"teams" | "players">("teams");

  const currentHoleInfo = round.holeInfo[currentHole - 1];

  // Get player scores for hole navigation
  const getPlayerScores = () => {
    const scores: Record<string, number[]> = {};
    Object.entries(round.scores).forEach(([playerId, playerScore]) => {
      scores[playerId] = playerScore.scores;
    });
    return scores;
  };

  if (!tour.teams || tour.teams.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto card-spacing">
          <span className="text-4xl">👥</span>
        </div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3">
          No Teams Found
        </h3>
        <p className="text-slate-500">
          Best Ball format requires teams to be created and players assigned.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hole Navigation - Only show in hole-by-hole mode */}
      {scoringMode === "individual" && (
        <HoleNavigation
          holes={round.holeInfo}
          currentHole={currentHole}
          onHoleChange={setCurrentHole}
          playerScores={getPlayerScores()}
        />
      )}

      {/* Header with Mode Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="section-header">
          {scoringMode === "individual"
            ? `Best Ball - Hole ${currentHole}`
            : "Best Ball - Total Score Entry"}
        </h2>

        <div className="flex gap-2">
          {/* Scoring Mode Toggle */}
          <div className="bg-white rounded-lg p-1 shadow-sm border border-slate-200">
            <button
              onClick={() => setScoringMode("individual")}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                scoringMode === "individual"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hole by Hole
            </button>
            <button
              onClick={() => setScoringMode("total")}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                scoringMode === "total"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Total Score
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-white rounded-lg p-1 shadow-sm border border-slate-200">
            <button
              onClick={() => setViewMode("teams")}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                viewMode === "teams"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              👥 Teams
            </button>
            <button
              onClick={() => setViewMode("players")}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                viewMode === "players"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              👤 Players
            </button>
          </div>
        </div>
      </div>

      {/* Best Ball Format Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">⭐</span>
          <h3 className="font-semibold text-blue-900">Best Ball Format</h3>
          {scoringMode === "individual" && (
            <span className="text-blue-700 text-sm">
              Hole {currentHole} of {round.holes} • Par {currentHoleInfo.par}
            </span>
          )}
        </div>
        <p className="text-sm text-blue-800">
          Each player scores individually. Team score is the best (lowest) score
          from team members on each hole.
        </p>
      </div>

      {/* Scoring Interface */}
      {viewMode === "teams" ? (
        /* Team View - Show teams with individual player scores */
        <div className="space-y-6">
          {tour.teams.map((team) => (
            <BestBallTeamScorecard
              key={team.id}
              team={team}
              tour={tour}
              round={round}
              currentHole={currentHole}
              scoringMode={scoringMode}
              onPlayerScoreChange={onPlayerScoreChange}
              onPlayerTotalScoreChange={onPlayerTotalScoreChange}
            />
          ))}
        </div>
      ) : (
        /* Individual Player View */
        <div className="space-y-4">
          {tour.players.map((player) => {
            const playerScore = round.scores[player.id];
            const currentScore = playerScore?.scores[currentHole - 1] || 0;
            const totalScore = playerScore?.totalScore || 0;

            return scoringMode === "total" ? (
              <TotalScoreCard
                key={player.id}
                player={player}
                round={round}
                currentTotalScore={totalScore}
                onTotalScoreChange={(
                  score,
                  handicapStrokes,
                  stablefordPoints
                ) =>
                  onPlayerTotalScoreChange(
                    player.id,
                    score,
                    handicapStrokes,
                    stablefordPoints
                  )
                }
              />
            ) : (
              <ScoreEntryCard
                key={player.id}
                player={player}
                holeInfo={currentHoleInfo}
                currentScore={currentScore}
                playerScore={playerScore}
                onScoreChange={(score) =>
                  onPlayerScoreChange(player.id, currentHole - 1, score)
                }
                strokesGiven={round.settings.strokesGiven}
              />
            );
          })}
        </div>
      )}

      {/* Fixed Bottom Navigation - Only show in hole-by-hole mode */}
      {scoringMode === "individual" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 safe-area-bottom shadow-lg">
          <div className="flex gap-3 max-w-md mx-auto">
            <button
              onClick={() => currentHole > 1 && setCurrentHole(currentHole - 1)}
              disabled={currentHole === 1}
              className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Previous
              </div>
            </button>

            <button
              onClick={() =>
                currentHole < round.holes && setCurrentHole(currentHole + 1)
              }
              disabled={currentHole === round.holes}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                Next
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
