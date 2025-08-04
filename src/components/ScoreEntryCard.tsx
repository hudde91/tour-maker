import { useState, useRef, useEffect } from "react";
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
  const par = holeInfo.par;
  const strokeHole =
    strokesGiven && player.handicap && holeInfo.handicap
      ? holeInfo.handicap <= player.handicap
      : false;

  const effectivePar = strokeHole ? par + 1 : par;
  const [selectedScore, setSelectedScore] = useState(
    currentScore || effectivePar
  );
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const touchStartRef = useRef<{ x: number; time: number } | null>(null);

  // Update selected score when currentScore changes from external source
  useEffect(() => {
    if (currentScore > 0) {
      setSelectedScore(currentScore);
    } else {
      setSelectedScore(effectivePar);
    }
  }, [currentScore, effectivePar]);

  const getScoreInfo = (score: number) => {
    if (score === 0 || !score)
      return {
        bg: "bg-slate-100 border-slate-200",
        text: "text-slate-400",
        badge: "No Score",
        badgeColor: "bg-slate-100 text-slate-500",
      };

    // Handle hole-in-one first (always score = 1)
    if (score === 1) {
      return {
        bg: "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300 shadow-lg",
        text: "text-purple-900",
        badge: "Hole-in-One! 🏌️‍♂️",
        badgeColor: "bg-purple-500 text-white",
      };
    }

    const scoreToPar = score - effectivePar;

    if (scoreToPar <= -3)
      return {
        bg: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-md",
        text: "text-purple-900",
        badge: "Double Eagle",
        badgeColor: "bg-purple-500 text-white",
      };
    if (scoreToPar === -2)
      return {
        bg: "bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-300 shadow-md",
        text: "text-amber-900",
        badge: "Eagle",
        badgeColor: "bg-amber-500 text-white",
      };
    if (scoreToPar === -1)
      return {
        bg: "bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-md",
        text: "text-red-900",
        badge: "Birdie",
        badgeColor: "bg-red-500 text-white",
      };
    if (scoreToPar === 0)
      return {
        bg: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-md",
        text: "text-blue-900",
        badge: "Par",
        badgeColor: "bg-blue-500 text-white",
      };
    if (scoreToPar === 1)
      return {
        bg: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 shadow-md",
        text: "text-orange-900",
        badge: "Bogey",
        badgeColor: "bg-orange-500 text-white",
      };
    if (scoreToPar === 2)
      return {
        bg: "bg-gradient-to-br from-red-100 to-red-200 border-red-400 shadow-md",
        text: "text-red-900",
        badge: "Double Bogey",
        badgeColor: "bg-red-600 text-white",
      };
    return {
      bg: "bg-gradient-to-br from-red-200 to-red-300 border-red-500 shadow-md",
      text: "text-red-900",
      badge: `+${scoreToPar}`,
      badgeColor: "bg-red-700 text-white",
    };
  };

  const getPickerButtonStyle = (isCenter: boolean = false) => {
    if (isCenter) {
      return "bg-white border-2 border-slate-300 text-slate-900 scale-125 shadow-lg";
    } else {
      return "bg-white border border-slate-200 text-slate-600 scale-90";
    }
  };

  const handleScoreChange = (newScore: number) => {
    const clampedScore = Math.max(1, Math.min(10, newScore));
    setSelectedScore(clampedScore);
    onScoreChange(clampedScore);
  };

  const handlePrevScore = () => {
    if (selectedScore > 1) {
      const newScore = selectedScore - 1;
      handleScoreChange(newScore);
      setIsScrolling(true);

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 300);
    }
  };

  const handleNextScore = () => {
    if (selectedScore < 10) {
      const newScore = selectedScore + 1;
      handleScoreChange(newScore);
      setIsScrolling(true);

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 300);
    }
  };

  const handleQuickPar = () => {
    handleScoreChange(effectivePar);
  };

  const handleClearScore = () => {
    setSelectedScore(effectivePar);
    onScoreChange(0);
  };

  const scoreInfo = getScoreInfo(currentScore || selectedScore);
  const displayScore = currentScore || selectedScore;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Player Header */}
      <div className="flex justify-between items-center p-5">
        <div className="flex items-center gap-4">
          {/* Player Avatar */}
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
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
            {strokeHole && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md">
                S
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {player.name}
            </h3>
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

        {/* Current Score Display */}
        <div className="text-right">
          <div
            className={`text-3xl font-bold px-4 py-2 rounded-xl border-2 shadow-sm ${scoreInfo.bg} ${scoreInfo.text}`}
          >
            {currentScore || "–"}
          </div>
          {(currentScore || (selectedScore && currentScore === 0)) && (
            <div className="text-center mt-2">
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${scoreInfo.badgeColor}`}
              >
                {scoreInfo.badge}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Score Picker Interface */}
      <div className="border-t border-slate-200 p-5 bg-slate-50">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                Hole {holeInfo.number} Score
              </h4>
              <div className="text-xs text-slate-600">
                Par {par}
                {strokeHole && " • Stroke Hole (+1)"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-slate-900">
                {displayScore}
              </div>
              <div className="text-xs text-slate-500">
                {displayScore === effectivePar
                  ? "Par"
                  : displayScore < effectivePar
                  ? `${effectivePar - displayScore} under`
                  : `${displayScore - effectivePar} over`}
              </div>
            </div>
          </div>

          {/* Single Score Picker */}
          <div className="relative h-20 flex items-center justify-center">
            {/* Navigation Arrows */}
            <button
              onClick={handlePrevScore}
              disabled={selectedScore <= 1}
              className="absolute left-0 w-10 h-10 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all z-10"
            >
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={handleNextScore}
              disabled={selectedScore >= 10}
              className="absolute right-0 w-10 h-10 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all z-10"
            >
              <svg
                className="w-5 h-5 text-slate-600"
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
            </button>

            {/* Score Display Area */}
            <div className="flex items-center justify-center relative w-32">
              {/* Previous Score (fading out) */}
              {isScrolling && selectedScore > 1 && (
                <div
                  className={`absolute w-16 h-16 rounded-full font-bold text-lg flex items-center justify-center transition-all duration-300 transform -translate-x-8 ${getPickerButtonStyle(
                    false
                  )}`}
                  style={{ opacity: 0.3 }}
                >
                  {selectedScore - 1}
                </div>
              )}

              {/* Current Score (center) */}
              <div
                className={`w-16 h-16 rounded-full font-bold text-xl flex items-center justify-center transition-all duration-300 ${getPickerButtonStyle(
                  true
                )}`}
              >
                {selectedScore}
              </div>

              {/* Next Score (fading in) */}
              {isScrolling && selectedScore < 10 && (
                <div
                  className={`absolute w-16 h-16 rounded-full font-bold text-lg flex items-center justify-center transition-all duration-300 transform translate-x-8 ${getPickerButtonStyle(
                    false
                  )}`}
                  style={{ opacity: 0.3 }}
                >
                  {selectedScore + 1}
                </div>
              )}
            </div>

            {/* Enhanced Touch/Swipe Area */}
            <div
              className="absolute inset-0 touch-pan-x"
              onTouchStart={(e) => {
                touchStartRef.current = {
                  x: e.touches[0].clientX,
                  time: Date.now(),
                };
              }}
              onTouchEnd={(e) => {
                if (!touchStartRef.current) return;

                const endX = e.changedTouches[0].clientX;
                const endTime = Date.now();

                const distance = touchStartRef.current.x - endX;
                const duration = endTime - touchStartRef.current.time;
                const velocity = Math.abs(distance) / duration;

                // Calculate increment based on distance and velocity
                let increment = 1;
                if (Math.abs(distance) > 60) increment = 2;
                if (Math.abs(distance) > 120) increment = 3;
                if (velocity > 0.5) increment = Math.min(increment + 1, 4);

                if (distance > 30) {
                  // Swipe left (increase score)
                  const newScore = Math.min(10, selectedScore + increment);
                  handleScoreChange(newScore);
                  setIsScrolling(true);
                  if (scrollTimeoutRef.current)
                    clearTimeout(scrollTimeoutRef.current);
                  scrollTimeoutRef.current = setTimeout(
                    () => setIsScrolling(false),
                    300
                  );
                } else if (distance < -30) {
                  // Swipe right (decrease score)
                  const newScore = Math.max(1, selectedScore - increment);
                  handleScoreChange(newScore);
                  setIsScrolling(true);
                  if (scrollTimeoutRef.current)
                    clearTimeout(scrollTimeoutRef.current);
                  scrollTimeoutRef.current = setTimeout(
                    () => setIsScrolling(false),
                    300
                  );
                }

                touchStartRef.current = null;
              }}
            />
          </div>

          {/* Par Reference */}
          <div className="flex justify-center mt-2">
            <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">
              <span className="text-blue-600 font-semibold">
                PAR {effectivePar}
              </span>
              {strokeHole && (
                <span className="ml-1 text-blue-500">(+1 stroke)</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleQuickPar}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-semibold text-sm transition-colors"
          >
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
            Par ({effectivePar})
          </button>

          {currentScore > 0 && (
            <button
              onClick={handleClearScore}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-sm transition-colors"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Player Round Summary */}
      <div className="border-t border-slate-100 p-4 bg-white rounded-b-xl">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-slate-900">
              {playerScore.totalScore || 0}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Total
            </div>
          </div>
          <div>
            <div
              className={`text-xl font-bold ${
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
            <div className="text-xl font-bold text-slate-900">
              {playerScore.scores.filter((s) => s > 0).length}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Holes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
