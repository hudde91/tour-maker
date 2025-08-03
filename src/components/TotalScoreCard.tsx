import { useState } from "react";
import { Player, Round } from "../types";
import { storage } from "../lib/storage";

interface TotalScoreCardProps {
  player: Player;
  round: Round;
  currentTotalScore: number;
  onTotalScoreChange: (totalScore: number) => void;
}

export const TotalScoreCard = ({
  player,
  round,
  currentTotalScore,
  onTotalScoreChange,
}: TotalScoreCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputScore, setInputScore] = useState(currentTotalScore.toString());

  const totalPar = storage.getTotalPar(round);
  const scoreToPar = currentTotalScore - totalPar;

  const getScoreStyles = () => {
    if (currentTotalScore === 0)
      return {
        bg: "bg-slate-100 border-slate-200",
        text: "text-slate-400",
        badge: "No Score",
      };

    if (scoreToPar <= -5)
      return {
        bg: "bg-purple-100 border-purple-300",
        text: "text-purple-900",
        badge: `${scoreToPar} Under`,
      };
    if (scoreToPar < 0)
      return {
        bg: "bg-red-100 border-red-300",
        text: "text-red-900",
        badge: `${Math.abs(scoreToPar)} Under Par`,
      };
    if (scoreToPar === 0)
      return {
        bg: "bg-blue-100 border-blue-300",
        text: "text-blue-900",
        badge: "Even Par",
      };
    if (scoreToPar <= 5)
      return {
        bg: "bg-orange-100 border-orange-300",
        text: "text-orange-900",
        badge: `+${scoreToPar} Over`,
      };
    return {
      bg: "bg-red-200 border-red-400",
      text: "text-red-900",
      badge: `+${scoreToPar} Over`,
    };
  };

  const handleSaveScore = () => {
    const score = parseInt(inputScore);
    if (score > 0 && score <= 200) {
      // Reasonable bounds
      onTotalScoreChange(score);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setInputScore(currentTotalScore.toString());
    setIsEditing(false);
  };

  const scoreStyles = getScoreStyles();

  return (
    <div className="card hover:shadow-elevated transition-all duration-200">
      {/* Player Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Player Avatar */}
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

          <div>
            <h3 className="text-xl font-bold text-slate-900">{player.name}</h3>
            <div className="flex items-center gap-3 text-sm">
              {player.handicap !== undefined && (
                <span className="text-slate-600 font-medium">
                  HC {player.handicap}
                </span>
              )}
              <span className="text-slate-500">Total Score Entry</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Total Score Display/Input */}
          {isEditing ? (
            <div className="text-right">
              <input
                type="number"
                value={inputScore}
                onChange={(e) => setInputScore(e.target.value)}
                className="w-24 text-4xl font-bold text-center border-2 border-emerald-500 rounded-xl px-2 py-1 focus:ring-2 focus:ring-emerald-200"
                min="18"
                max="200"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveScore();
                  if (e.key === "Escape") handleCancel();
                }}
              />
              <div className="text-center mt-2 space-x-2">
                <button
                  onClick={handleCancel}
                  className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded-full font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveScore}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-full font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="text-right">
              <button
                onClick={() => setIsEditing(true)}
                className={`text-4xl font-bold px-4 py-2 rounded-xl border-2 shadow-sm transition-all hover:scale-105 ${scoreStyles.bg} ${scoreStyles.text}`}
              >
                {currentTotalScore || "–"}
              </button>
              {currentTotalScore > 0 && (
                <div className="text-center mt-2">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${scoreStyles.bg} ${scoreStyles.text} border`}
                  >
                    {scoreStyles.badge}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Round Summary */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-slate-900">
            {currentTotalScore || 0}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Total Score
          </div>
        </div>
        <div>
          <div
            className={`text-2xl font-bold ${
              scoreToPar < 0
                ? "text-red-600"
                : scoreToPar > 0
                ? "text-orange-600"
                : "text-blue-600"
            }`}
          >
            {scoreToPar === 0 && currentTotalScore > 0
              ? "E"
              : scoreToPar > 0
              ? "+"
              : ""}
            {scoreToPar || 0}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            To Par
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{totalPar}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Course Par
          </div>
        </div>
      </div>

      {/* Clear Score Option */}
      {currentTotalScore > 0 && !isEditing && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => onTotalScoreChange(0)}
            className="w-full btn-secondary py-2 text-sm"
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
              Clear Total Score
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
