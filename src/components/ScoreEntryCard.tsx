import { useState } from "react";
import { Player, HoleInfo, PlayerScore } from "../types";

interface ScoreEntryCardProps {
  player: Player;
  holeInfo: HoleInfo;
  currentScore: number;
  playerScore: PlayerScore;
  onScoreChange: (score: number) => void;
  strokesGiven: boolean;
}

export const ScoreEntryCard = ({
  player,
  holeInfo,
  currentScore,
  playerScore,
  onScoreChange,
  strokesGiven,
}: ScoreEntryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const par = holeInfo.par;
  const strokeHole =
    strokesGiven && player.handicap && holeInfo.handicap
      ? holeInfo.handicap <= player.handicap
      : false;

  const getScoreStyles = (score: number) => {
    if (score === 0)
      return {
        bg: "bg-slate-100 border-slate-200",
        text: "text-slate-400",
        badge: "No Score",
      };

    const effectivePar = strokeHole ? par + 1 : par;
    const scoreToPar = score - effectivePar;

    if (scoreToPar <= -3)
      return {
        bg: "bg-purple-100 border-purple-300 shadow-purple-100",
        text: "text-purple-900",
        badge: "Albatross",
      };
    if (scoreToPar === -2)
      return {
        bg: "bg-yellow-100 border-yellow-300 shadow-yellow-100",
        text: "text-yellow-900",
        badge: "Eagle",
      };
    if (scoreToPar === -1)
      return {
        bg: "bg-red-100 border-red-300 shadow-red-100",
        text: "text-red-900",
        badge: "Birdie",
      };
    if (scoreToPar === 0)
      return {
        bg: "bg-blue-100 border-blue-300 shadow-blue-100",
        text: "text-blue-900",
        badge: "Par",
      };
    if (scoreToPar === 1)
      return {
        bg: "bg-orange-100 border-orange-300 shadow-orange-100",
        text: "text-orange-900",
        badge: "Bogey",
      };
    if (scoreToPar === 2)
      return {
        bg: "bg-red-200 border-red-400 shadow-red-200",
        text: "text-red-900",
        badge: "Double Bogey",
      };
    return {
      bg: "bg-red-300 border-red-500 shadow-red-300",
      text: "text-red-900",
      badge: `+${scoreToPar}`,
    };
  };

  // Here's the missing function with correct border classes!
  const getScoreButtonStyles = (score: number) => {
    const effectivePar = strokeHole ? par + 1 : par;
    const scoreToPar = score - effectivePar;

    if (scoreToPar <= -3)
      return "bg-purple-500 hover:bg-purple-600 focus:bg-purple-600 text-white border-2 border-purple-600 hover:border-purple-700 focus:border-purple-700 focus:ring-purple-200";
    if (scoreToPar === -2)
      return "bg-yellow-500 hover:bg-yellow-600 focus:bg-yellow-600 text-white border-2 border-yellow-600 hover:border-yellow-700 focus:border-yellow-700 focus:ring-yellow-200";
    if (scoreToPar === -1)
      return "bg-red-500 hover:bg-red-600 focus:bg-red-600 text-white border-2 border-red-600 hover:border-red-700 focus:border-red-700 focus:ring-red-200";
    if (scoreToPar === 0)
      return "bg-blue-500 hover:bg-blue-600 focus:bg-blue-600 text-white border-2 border-blue-600 hover:border-blue-700 focus:border-blue-700 focus:ring-blue-200";
    if (scoreToPar === 1)
      return "bg-orange-500 hover:bg-orange-600 focus:bg-orange-600 text-white border-2 border-orange-600 hover:border-orange-700 focus:border-orange-700 focus:ring-orange-200";
    return "bg-red-600 hover:bg-red-700 focus:bg-red-700 text-white border-2 border-red-700 hover:border-red-800 focus:border-red-800 focus:ring-red-200";
  };

  const scoreStyles = getScoreStyles(currentScore);
  const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="card hover:shadow-elevated transition-all duration-200">
      {/* Player Header */}
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {/* Player Avatar */}
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-7 h-7 text-white"
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
            {strokeHole && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                S
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">{player.name}</h3>
            <div className="flex items-center gap-3 text-sm">
              {player.handicap !== undefined && (
                <span className="text-slate-600 font-medium">
                  HC {player.handicap}
                </span>
              )}
              {strokeHole && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold border border-blue-200">
                  Stroke Hole
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Current Score Display */}
          <div className="text-right">
            <div
              className={`text-4xl font-bold px-4 py-2 rounded-xl border-2 shadow-sm ${scoreStyles.bg} ${scoreStyles.text}`}
            >
              {currentScore || "–"}
            </div>
            {currentScore > 0 && (
              <div className="text-center mt-2">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${scoreStyles.bg} ${scoreStyles.text} border`}
                >
                  {scoreStyles.badge}
                </span>
              </div>
            )}
          </div>

          {/* Expand Indicator */}
          <div
            className={`transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            <svg
              className="w-6 h-6 text-slate-400"
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

      {/* Score Selection Panel */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-slate-200 animate-fade-in">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-slate-800 mb-2">
              Select Score
            </h4>
            <div className="text-sm text-slate-600">
              Hole {holeInfo.number} • Par {par}
              {strokeHole && " • Stroke Hole (+1)"}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 mb-6">
            {scores.map((score) => (
              <button
                key={score}
                onClick={() => {
                  onScoreChange(score);
                  setIsExpanded(false);
                }}
                className={`score-button ${
                  currentScore === score
                    ? "bg-emerald-600 text-white border-emerald-700 ring-4 ring-emerald-200 scale-105"
                    : getScoreButtonStyles(score)
                }`}
                aria-label={`Score ${score} strokes`}
              >
                {score}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const parScore = strokeHole ? par + 1 : par;
                onScoreChange(parScore);
                setIsExpanded(false);
              }}
              className="btn-primary py-3"
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Quick Par ({strokeHole ? par + 1 : par})
              </div>
            </button>

            {currentScore > 0 && (
              <button
                onClick={() => {
                  onScoreChange(0);
                  setIsExpanded(false);
                }}
                className="btn-secondary py-3"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Clear Score
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Player Round Summary */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-slate-900">
            {playerScore.totalScore || 0}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Total
          </div>
        </div>
        <div>
          <div
            className={`text-2xl font-bold ${
              playerScore.totalToPar < 0
                ? "text-red-600"
                : playerScore.totalToPar > 0
                ? "text-orange-600"
                : "text-blue-600"
            }`}
          >
            {playerScore.totalToPar > 0 ? "+" : ""}
            {playerScore.totalToPar || 0}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            To Par
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">
            {playerScore.scores.filter((s) => s > 0).length}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Holes
          </div>
        </div>
      </div>
    </div>
  );
};
