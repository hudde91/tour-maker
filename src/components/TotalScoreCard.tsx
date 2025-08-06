import { useState, useEffect } from "react";
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
  const [handicapStrokes, setHandicapStrokes] = useState(
    player.handicap?.toString() || "0"
  );

  const totalPar = storage.getTotalPar(round);
  const scoreToPar = currentTotalScore - totalPar;
  const effectiveHandicap = parseInt(handicapStrokes) || 0;
  const netScore = currentTotalScore - effectiveHandicap;
  const netToPar = netScore - totalPar;

  // Update input values when props change
  useEffect(() => {
    setInputScore(currentTotalScore.toString());
  }, [currentTotalScore]);

  // Update handicap strokes when player handicap changes
  useEffect(() => {
    setHandicapStrokes(player.handicap?.toString() || "0");
  }, [player.handicap]);

  const handleSaveScore = () => {
    const score = parseInt(inputScore);
    if (score > 0 && score <= 200) {
      onTotalScoreChange(score);
    }
  };

  const handleCancel = () => {
    setInputScore(currentTotalScore.toString());
  };

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
          <div className="text-right">
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total Score
              </label>
              <input
                type="number"
                value={inputScore}
                onChange={(e) => setInputScore(e.target.value)}
                className="w-24 text-4xl font-bold text-center border-2 border-emerald-500 rounded-xl px-2 py-1 focus:ring-2 focus:ring-emerald-200"
                min="18"
                max="200"
                placeholder="72"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveScore();
                  if (e.key === "Escape") handleCancel();
                }}
              />
            </div>

            <div className="text-center space-x-2">
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
        </div>
      </div>

      {/* Handicap Strokes Section */}
      {!isEditing && currentTotalScore > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-lg font-semibold text-slate-800 mb-1">
                Handicap Calculation
              </h4>
              <p className="text-sm text-slate-600">
                Adjust handicap strokes for net scoring competition
              </p>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Handicap Strokes:
                </label>
                <input
                  type="number"
                  value={handicapStrokes}
                  onChange={(e) => setHandicapStrokes(e.target.value)}
                  className="w-16 px-2 py-1 text-center border border-slate-300 rounded focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                  min="0"
                  max="54"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-slate-500">
                Based on player's handicap: {player.handicap || 0}
              </p>
            </div>
          </div>

          {/* Net Score Display */}
          {effectiveHandicap > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-emerald-800 mb-1">
                    Net Score (After Handicap)
                  </div>
                  <div className="text-xs text-emerald-700">
                    {currentTotalScore} - {effectiveHandicap} strokes ={" "}
                    {netScore}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-800 mb-1">
                    {netScore}
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      netToPar < 0
                        ? "text-red-600"
                        : netToPar > 0
                        ? "text-orange-600"
                        : "text-blue-600"
                    }`}
                  >
                    {netToPar === 0 ? "E" : netToPar > 0 ? "+" : ""}
                    {netToPar || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Round Summary */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {currentTotalScore || 0}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Gross Score
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
            <div className="text-2xl font-bold text-slate-900">
              {effectiveHandicap}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              HC Strokes
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">
              {netScore > 0 ? netScore : "–"}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Net Score
            </div>
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
