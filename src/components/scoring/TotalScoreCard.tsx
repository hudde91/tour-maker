import { useState, useEffect } from "react";
import { Player, Round } from "../../types";
import { storage } from "../../lib/storage";

interface TotalScoreCardProps {
  player: Player;
  round: Round;
  currentTotalScore: number;
  onTotalScoreChange: (totalScore: number, handicapStrokes?: number) => void;
}

export const TotalScoreCard = ({
  player,
  round,
  currentTotalScore,
  onTotalScoreChange,
}: TotalScoreCardProps) => {
  if (round.format === "best-ball") {
    return null;
  }

  const [inputScore, setInputScore] = useState(currentTotalScore.toString());
  const [handicapStrokes, setHandicapStrokes] = useState<string>("");
  const [isEditing, setIsEditing] = useState(currentTotalScore === 0); // Auto-edit if no score

  const totalPar = storage.getTotalPar(round);
  const calcStrokesForHole = (playerHcp: number, holeHcp: number) => {
    const base = Math.floor(playerHcp / 18);
    const rem = playerHcp % 18;
    return base + (holeHcp <= rem ? 1 : 0);
  };

  const autoHC =
    round.settings.strokesGiven && player.handicap
      ? round.holeInfo.reduce((sum, h) => {
          return h.handicap
            ? sum + calcStrokesForHole(player.handicap!, h.handicap)
            : sum;
        }, 0)
      : 0;

  const effectiveHandicap =
    handicapStrokes.trim() !== "" ? parseInt(handicapStrokes) || 0 : autoHC;

  // Calculate preview values
  const previewScore = parseInt(inputScore) || 0;
  const previewNetScore = previewScore - effectiveHandicap;

  // Update input values when props change
  useEffect(() => {
    setInputScore(currentTotalScore.toString());
  }, [currentTotalScore]);

  // Update handicap strokes when player handicap changes
  const handleSave = () => {
    const score = parseInt(inputScore);
    const providedHC =
      handicapStrokes.trim() !== ""
        ? parseInt(handicapStrokes) || 0
        : undefined;
    if (score > 0 && score <= 200) {
      onTotalScoreChange(score, providedHC);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setInputScore(currentTotalScore.toString());
    setHandicapStrokes(player.handicap?.toString() || "0");
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="card hover:shadow-elevated transition-all duration-200 max-w-2xl mx-auto">
      {/* Player Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
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
      </div>

      {isEditing ? (
        /* EDITING MODE - Better desktop layout */
        <div className="bg-slate-50 rounded-lg p-6">
          <div className="text-center card-spacing">
            <h4 className="text-lg font-semibold text-slate-900">
              Enter Round Score
            </h4>
          </div>

          {/* Desktop: Side by side, Mobile: Stacked */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 card-spacing">
            {/* Total Score Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 text-center md:text-left">
                Total strokes *
              </label>
              <input
                type="number"
                value={inputScore}
                onChange={(e) => setInputScore(e.target.value)}
                className="w-full text-2xl font-bold text-center border-2 border-emerald-500 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600"
                min="18"
                max="200"
                placeholder="72"
                autoFocus
              />
            </div>

            {/* Handicap Strokes Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 text-center md:text-left">
                Handicap Strokes
              </label>
              <input
                type="number"
                placeholder={`auto: ${autoHC}`}
                value={handicapStrokes}
                onChange={(e) => setHandicapStrokes(e.target.value)}
                className="w-full text-lg text-center border-2 border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                min="0"
                max="54"
              />
              <p className="text-xs text-slate-500 text-center md:text-left">
                Extra strokes to subtract from total
              </p>
            </div>
          </div>

          {/* Score Preview - Compact desktop layout */}
          {previewScore > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200 card-spacing">
              <h5 className="font-medium text-slate-800 mb-3 text-center">
                Score Preview
              </h5>
              <div className="flex justify-center">
                <div className="grid grid-cols-2 gap-8 text-center max-w-md">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {previewScore}
                    </div>
                    <div className="text-xs text-slate-500">Gross Strokes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {previewNetScore}
                    </div>
                    <div className="text-xs text-slate-500">Net Strokes</div>
                  </div>
                </div>
              </div>
              {effectiveHandicap > 0 && (
                <div className="text-center mt-3 text-sm text-slate-600">
                  {previewScore} - {effectiveHandicap} handicap strokes ={" "}
                  {previewNetScore}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons - Compact on desktop */}
          <div className="flex gap-3 max-w-md mx-auto">
            <button
              onClick={handleCancel}
              className="flex-1 btn-secondary py-3"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!previewScore || previewScore < 18}
              className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Score
            </button>
          </div>
        </div>
      ) : (
        /* DISPLAY MODE - Compact desktop layout */
        <div className="space-y-4">
          {currentTotalScore > 0 ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Score Display */}
              <div className="text-center md:text-left">
                <div className="text-4xl font-bold text-slate-900 mb-2">
                  {previewNetScore}
                </div>
                {effectiveHandicap > 0 && (
                  <div className="text-sm text-slate-500 bg-blue-100 px-3 py-1 rounded-full inline-block mb-2">
                    Gross: {currentTotalScore} (-{effectiveHandicap} HC)
                  </div>
                )}
              </div>

              {/* Edit Button - Right side on desktop */}
              <div className="text-center md:text-right">
                <button onClick={handleEdit} className="btn-secondary">
                  Edit Score
                </button>
              </div>
            </div>
          ) : (
            /* No Score Yet - Centered and compact */
            <div className="text-center py-6">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-slate-700 mb-3">
                No Score Entered
              </h4>
              <button onClick={handleEdit} className="btn-primary">
                Enter Score
              </button>
            </div>
          )}

          {/* Round Summary - Horizontal layout on desktop */}
          <div className="border-t border-slate-200 pt-4">
            <div className="grid grid-cols-3 gap-4 text-center text-sm max-w-md mx-auto">
              <div>
                <div className="font-semibold text-slate-900">
                  Par {totalPar}
                </div>
                <div className="text-slate-500">Course</div>
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {round.holes}
                </div>
                <div className="text-slate-500">Holes</div>
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {effectiveHandicap}
                </div>
                <div className="text-slate-500">HC Strokes</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
