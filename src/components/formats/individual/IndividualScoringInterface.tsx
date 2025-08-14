import { useState } from "react";
import { Tour, Round } from "../../../types";
import { ScoreEntryCard } from "../../scoring/ScoreEntryCard";
import { TotalScoreCard } from "../../scoring/TotalScoreCard";
import { HoleNavigation } from "../../scoring/HoleNavigation";

interface IndividualScoringInterfaceProps {
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
    handicapStrokes?: number
  ) => void;
}

export const IndividualScoringInterface = ({
  tour,
  round,
  onPlayerScoreChange,
  onPlayerTotalScoreChange,
}: IndividualScoringInterfaceProps) => {
  const [currentHole, setCurrentHole] = useState(1);
  const [scoringMode, setScoringMode] = useState<"individual" | "total">(
    "individual"
  );

  const currentHoleInfo = round.holeInfo[currentHole - 1];

  // Get player scores for hole navigation
  const getPlayerScores = () => {
    const scores: Record<string, number[]> = {};
    Object.entries(round.scores).forEach(([playerId, playerScore]) => {
      scores[playerId] = playerScore.scores;
    });
    return scores;
  };

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

      {/* Header with Mode Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="section-header">
          {scoringMode === "individual"
            ? `Hole ${currentHole}`
            : "Total Score Entry"}
        </h2>

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
      </div>

      {/* Player Score Cards */}
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
              onTotalScoreChange={(score, handicapStrokes) =>
                onPlayerTotalScoreChange(player.id, score, handicapStrokes)
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
