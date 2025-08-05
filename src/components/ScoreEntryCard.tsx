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

  // New state for smooth swiping
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [momentum, setMomentum] = useState(0);
  const touchStartRef = useRef<{
    x: number;
    time: number;
    score: number;
  } | null>(null);
  const lastTouchRef = useRef<{ x: number; time: number } | null>(null);
  const animationRef = useRef<number>();

  // Update selected score when currentScore changes from external source
  useEffect(() => {
    if (currentScore > 0) {
      setSelectedScore(currentScore);
    } else {
      setSelectedScore(effectivePar);
    }
  }, [currentScore, effectivePar]);

  // Calculate the virtual score based on swipe offset
  const getVirtualScore = (offset: number = swipeOffset) => {
    const scoreFromOffset = selectedScore + offset / 50; // Adjusted sensitivity for 72px elements
    return Math.max(1, Math.min(10, Math.round(scoreFromOffset)));
  };

  const virtualScore = getVirtualScore();

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

  const handleScoreChange = (newScore: number) => {
    const clampedScore = Math.max(1, Math.min(10, newScore));
    setSelectedScore(clampedScore);
    onScoreChange(clampedScore);
  };

  const handleStart = (clientX: number) => {
    setIsActive(true);
    setMomentum(0);
    touchStartRef.current = {
      x: clientX,
      time: Date.now(),
      score: selectedScore,
    };
    lastTouchRef.current = {
      x: clientX,
      time: Date.now(),
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMove = (clientX: number) => {
    if (!touchStartRef.current) return;

    const currentTime = Date.now();

    // Calculate offset from start position (positive = right swipe, negative = left swipe)
    const totalOffset = clientX - touchStartRef.current.x;
    setSwipeOffset(totalOffset);

    // Calculate velocity for momentum
    if (lastTouchRef.current) {
      const timeDelta = currentTime - lastTouchRef.current.time;
      const xDelta = clientX - lastTouchRef.current.x;
      if (timeDelta > 0) {
        setMomentum(xDelta / timeDelta);
      }
    }

    lastTouchRef.current = { x: clientX, time: currentTime };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStartRef.current) {
      e.preventDefault();
      handleMove(e.clientX);
    }
  };

  const handleEnd = () => {
    if (!touchStartRef.current) return;

    setIsActive(false);

    // Apply momentum for natural feeling
    const finalScore = getVirtualScore();

    // Animate to final position
    const animateToFinal = () => {
      setSwipeOffset((prevOffset) => {
        const targetOffset = (finalScore - selectedScore) * 50; // Match the sensitivity
        const diff = targetOffset - prevOffset;

        if (Math.abs(diff) < 1) {
          // Animation complete
          setSwipeOffset(0);
          handleScoreChange(finalScore);
          return 0;
        }

        // Smooth animation towards target
        const newOffset = prevOffset + diff * 0.3;
        animationRef.current = requestAnimationFrame(animateToFinal);
        return newOffset;
      });
    };

    animateToFinal();

    touchStartRef.current = null;
    lastTouchRef.current = null;
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Add global mouse event listeners for desktop support
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (touchStartRef.current) {
        const currentTime = Date.now();
        const totalOffset = e.clientX - touchStartRef.current.x;
        setSwipeOffset(totalOffset);

        // Calculate velocity for momentum
        if (lastTouchRef.current) {
          const timeDelta = currentTime - lastTouchRef.current.time;
          const xDelta = e.clientX - lastTouchRef.current.x;
          if (timeDelta > 0) {
            setMomentum(xDelta / timeDelta);
          }
        }
        lastTouchRef.current = { x: e.clientX, time: currentTime };
      }
    };

    const handleGlobalMouseUp = () => {
      if (touchStartRef.current) {
        handleEnd();
      }
    };

    if (isActive) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isActive]);

  const handleQuickPar = () => {
    handleScoreChange(effectivePar);
  };

  const handleClearScore = () => {
    setSelectedScore(effectivePar);
    onScoreChange(0);
  };

  const scoreInfo = getScoreInfo(currentScore || virtualScore);
  const displayScore = currentScore || virtualScore;

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
            className={`text-3xl font-bold px-4 py-2 rounded-xl border-2 shadow-sm transition-all duration-200 ${scoreInfo.bg} ${scoreInfo.text}`}
          >
            {currentScore || "–"}
          </div>
          {(currentScore || (virtualScore && currentScore === 0)) && (
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

      {/* Enhanced Score Picker Interface */}
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

          {/* Smooth Horizontal Score Picker */}
          <div className="relative h-24 flex items-center justify-center overflow-hidden bg-white rounded-lg border-2 border-slate-200 shadow-inner">
            {/* Score Options - these move while center selection stays fixed */}
            <div
              className="flex items-center transition-transform duration-100 ease-out"
              style={{
                // Calculate offset to keep virtualScore centered, then add swipe offset
                transform: `translateX(${
                  -(virtualScore - 1) * 68 + 272 - swipeOffset
                }px)`, // 272px = 4 * 68px to center in view
              }}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
                const isCenter = score === virtualScore;
                const distanceFromCenter = score - virtualScore;
                const absDistance = Math.abs(distanceFromCenter);
                const opacity = Math.max(0.2, 1 - absDistance * 0.25);
                const scale = isCenter
                  ? 1.2
                  : Math.max(0.6, 1 - absDistance * 0.2);

                return (
                  <div
                    key={score}
                    className={`flex-shrink-0 w-16 h-16 mx-1 rounded-xl font-bold text-xl flex items-center justify-center transition-all duration-150 ${
                      isCenter
                        ? "bg-emerald-600 text-white border-2 border-emerald-700 shadow-lg z-10"
                        : "bg-white text-slate-600 border border-slate-300"
                    }`}
                    style={{
                      opacity,
                      transform: `scale(${scale})`,
                    }}
                  >
                    {score}
                  </div>
                );
              })}
            </div>

            {/* Touch/Mouse Area */}
            <div
              className="absolute inset-0 touch-pan-x cursor-grab active:cursor-grabbing select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />

            {/* Center Selection Indicator - Fixed position */}
            <div className="absolute inset-x-0 top-0 h-full flex items-center justify-center pointer-events-none z-20">
              <div className="w-20 h-20 border-4 border-emerald-500 rounded-xl bg-emerald-50 bg-opacity-50 flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-600 rounded-full" />
              </div>
            </div>

            {/* Navigation Hints */}
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
              <div className="flex flex-col items-center">
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="text-xs mt-1">Lower</span>
              </div>
            </div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
              <div className="flex flex-col items-center">
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="text-xs mt-1">Higher</span>
              </div>
            </div>
          </div>

          {/* Live Preview of Score */}
          {isActive && (
            <div className="mt-3 text-center animate-fade-in">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                  getScoreInfo(virtualScore).badgeColor
                }`}
              >
                <span>{getScoreInfo(virtualScore).badge}</span>
                {virtualScore !== selectedScore && (
                  <span className="text-xs opacity-75">
                    ({virtualScore > selectedScore ? "+" : ""}
                    {virtualScore - selectedScore})
                  </span>
                )}
              </div>
            </div>
          )}

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
