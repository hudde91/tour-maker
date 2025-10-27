import { HoleNavigation } from "@/components/scoring/HoleNavigation";
import { LiveLeaderboard } from "@/components/scoring/LiveLeaderboard";
import { getScoreInfo } from "@/lib/scoreUtils";
import { storage } from "@/lib/storage";
import { formatUtils } from "@/types/formats";
import { Tour, Round, Player, HoleInfo, PlayerScore } from "@/types";
import { useState, useEffect, useRef } from "react";
import { useUpdateCompetitionWinner } from "@/hooks/useScoring";
import { useParams } from "react-router-dom";

interface SwipeableIndividualScoringProps {
  tour: Tour;
  round: Round;
  onPlayerScoreChange: (
    playerId: string,
    holeIndex: number,
    score: number | null
  ) => void;
  onFinishRound?: () => void;
}

type TabType = "score" | "holes" | "leaderboard";

export const SwipeableIndividualScoring = ({
  tour,
  round,
  onPlayerScoreChange,
  onFinishRound,
}: SwipeableIndividualScoringProps) => {
  const { tourId } = useParams<{ tourId: string }>();
  const updateCompetitionWinner = useUpdateCompetitionWinner(tourId!, round.id);

  const [currentHole, setCurrentHole] = useState(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("score");

  const currentPlayer = tour.players[currentPlayerIndex];
  const currentHoleInfo = round.holeInfo[currentHole - 1];
  const isLastPlayer = currentPlayerIndex === tour.players.length - 1;

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Track if we've already prompted to finish the round
  const hasPromptedToFinish = useRef(false);

  // Check if all players have completed all holes
  const areAllScoresComplete = () => {
    return tour.players.every((player) => {
      const playerScore = round.scores[player.id];
      if (!playerScore) return false;

      // Check if all holes have a score > 0
      return playerScore.scores.every((score) => score !== null && score > 0);
    });
  };

  // Check if all scores are complete on every score update
  useEffect(() => {
    if (round.status === "in-progress" && !hasPromptedToFinish.current && onFinishRound) {
      if (areAllScoresComplete()) {
        hasPromptedToFinish.current = true;
        onFinishRound();
      }
    }
  }, [round.scores, round.status, onFinishRound]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setIsTransitioning(true);
      setTimeout(() => {
        // If not the last player, move to next player
        if (currentPlayerIndex < tour.players.length - 1) {
          setCurrentPlayerIndex(currentPlayerIndex + 1);
        }
        // If last player and not last hole, move to next hole and reset to first player
        else if (currentHole < round.holes) {
          setCurrentHole(currentHole + 1);
          setCurrentPlayerIndex(0);
        }
        // On last player and last hole, do nothing (validation happens in useEffect)
        setIsTransitioning(false);
      }, 200);
    }

    if (isRightSwipe) {
      setIsTransitioning(true);
      setTimeout(() => {
        // If not the first player, move to previous player
        if (currentPlayerIndex > 0) {
          setCurrentPlayerIndex(currentPlayerIndex - 1);
        }
        // If first player and not first hole, move to previous hole and go to last player
        else if (currentHole > 1) {
          setCurrentHole(currentHole - 1);
          setCurrentPlayerIndex(tour.players.length - 1);
        }
        setIsTransitioning(false);
      }, 200);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex">
          <button
            onClick={() => setActiveTab("score")}
            className={`flex-1 px-4 py-4 text-sm font-semibold transition-all ${
              activeTab === "score"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Score
            </div>
          </button>
          <button
            onClick={() => setActiveTab("holes")}
            className={`flex-1 px-4 py-4 text-sm font-semibold transition-all ${
              activeTab === "holes"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Holes
            </div>
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 px-4 py-4 text-sm font-semibold transition-all ${
              activeTab === "leaderboard"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Leaderboard
            </div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {activeTab === "score" && (
          <div
            className="space-y-4 p-4"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ touchAction: "pan-y" }}
          >
            <div
              className={`card relative transition-opacity duration-200 ${
                isTransitioning ? "opacity-50" : "opacity-100"
              }`}
            >
              {/* Swipe indicators - Left arrow */}
              {currentPlayerIndex > 0 || currentHole > 1 ? (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
                  <svg
                    className="w-6 h-6 text-slate-400 animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </div>
              ) : null}

              {/* Swipe indicators - Right arrow */}
              {currentPlayerIndex < tour.players.length - 1 ||
              currentHole < round.holes ? (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
                  <svg
                    className="w-6 h-6 text-slate-400 animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              ) : null}

              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-slate-600">
                  Player {currentPlayerIndex + 1} of {tour.players.length}
                </h3>
                {currentPlayerIndex < tour.players.length - 1 ? (
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    Swipe to {tour.players[currentPlayerIndex + 1].name}
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
                  </div>
                ) : currentHole < round.holes ? (
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    Swipe to Hole {currentHole + 1}
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
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                {tour.players.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                      index === currentPlayerIndex
                        ? "bg-emerald-600"
                        : index < currentPlayerIndex
                        ? "bg-emerald-300"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <PlayerScoreCard
              player={currentPlayer}
              holeInfo={currentHoleInfo}
              playerScore={round.scores[currentPlayer.id]}
              currentHole={currentHole}
              onScoreChange={(score) =>
                onPlayerScoreChange(currentPlayer.id, currentHole - 1, score)
              }
              strokesGiven={round.settings.strokesGiven}
              round={round}
              tour={tour}
              onCompetitionWinnerChange={isLastPlayer ? (holeNumber, competitionType, winnerId, distance) => {
                updateCompetitionWinner.mutate({
                  holeNumber,
                  competitionType,
                  winnerId,
                  distance,
                });
              } : undefined}
            />
          </div>
        )}

        {activeTab === "holes" && (
          <div className="p-4 space-y-4">
            <div className="card">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-slate-600">
                  Player {currentPlayerIndex + 1} of {tour.players.length}
                </h3>
                {currentPlayerIndex < tour.players.length - 1 && (
                  <div className="text-xs text-slate-500">
                    Swipe to {tour.players[currentPlayerIndex + 1].name} →
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {tour.players.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                      index === currentPlayerIndex
                        ? "bg-emerald-600"
                        : index < currentPlayerIndex
                        ? "bg-emerald-300"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className={`transition-opacity duration-200 ${
                isTransitioning ? "opacity-50" : "opacity-100"
              }`}
              style={{ touchAction: "pan-y" }}
            >
              <HoleNavigation
                holes={round.holeInfo}
                currentHole={currentHole}
                onHoleChange={setCurrentHole}
                playerScores={{
                  [currentPlayer.id]:
                    round.scores[currentPlayer.id]?.scores || [],
                }}
              />
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="p-4">
            <LiveLeaderboard tour={tour} round={round} />
          </div>
        )}
      </div>
    </div>
  );
};

interface PlayerScoreCardProps {
  player: Player;
  holeInfo: HoleInfo;
  playerScore: PlayerScore;
  currentHole: number;
  onScoreChange: (score: number | null) => void;
  strokesGiven: boolean;
  round: Round;
  tour: Tour;
  onCompetitionWinnerChange?: (holeNumber: number, competitionType: 'closestToPin' | 'longestDrive', winnerId: string | null, distance?: number) => void;
}

const PlayerScoreCard = ({
  player,
  holeInfo,
  playerScore,
  currentHole,
  onScoreChange,
  strokesGiven,
  round,
  tour,
  onCompetitionWinnerChange,
}: PlayerScoreCardProps) => {
  const currentScore = playerScore?.scores[currentHole - 1];
  const [localScore, setLocalScore] = useState<number | null>(currentScore ?? 0);
  const [closestToPinDistance, setClosestToPinDistance] = useState<string>('');
  const [longestDriveDistance, setLongestDriveDistance] = useState<string>('');
  const par = holeInfo.par;

  // Reset local score and distances when hole changes
  useEffect(() => {
    setLocalScore(playerScore?.scores[currentHole - 1] ?? 0);
    // Load existing distances if they exist (individual rounds have single entry)
    const ctpWinners = round.competitionWinners?.closestToPin?.[currentHole] || [];
    const ldWinners = round.competitionWinners?.longestDrive?.[currentHole] || [];
    const ctpWinner = ctpWinners[0]; // Individual rounds have only one entry
    const ldWinner = ldWinners[0];
    setClosestToPinDistance(ctpWinner?.distance?.toString() || '');
    setLongestDriveDistance(ldWinner?.distance?.toString() || '');
  }, [currentHole, playerScore, round.competitionWinners]);

  // Calculate strokes for this hole
  const strokesForHole =
    strokesGiven && player.handicap && holeInfo.handicap
      ? storage.calculateStrokesForHole(player.handicap, holeInfo.handicap)
      : 0;

  const effectivePar = par;
  const isMatchPlay = formatUtils.isMatchPlay(round.format);
  const scoreInfo = getScoreInfo(localScore, effectivePar, isMatchPlay);

  const handleScoreSelect = (score: number | null) => {
    setLocalScore(score);
    onScoreChange(score);
  };

  // Generate score options
  const generateScoreOptions = () => {
    const options = [];
    const minScore = 1;
    const maxScore = Math.max(10, effectivePar + 5); // At least up to effective par + 5

    for (let score = minScore; score <= maxScore; score++) {
      const info = getScoreInfo(score, effectivePar, isMatchPlay);
      options.push({
        score,
        name: info.name,
        bg: info.bg,
        text: info.text,
      });
    }

    return options;
  };

  const scoreOptions = generateScoreOptions();

  return (
    <div className="space-y-4">
      <div className="card bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
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
              {strokesForHole > 0 && (
                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-md">
                  {strokesForHole > 1 ? strokesForHole : "S"}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {player.name}
              </h3>
              <div className="flex items-center gap-3 text-sm">
                {player.handicap !== undefined && (
                  <span className="text-slate-600 font-medium">
                    HC {player.handicap}
                  </span>
                )}
                {strokesForHole > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                    {strokesForHole} Stroke{strokesForHole > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                <span className="font-semibold">Hole {currentHole}</span>
                <span>•</span>
                <span>Par {holeInfo.par}</span>
                <span>•</span>
                <span>{holeInfo.yardage} yards</span>
              </div>
              {(holeInfo.closestToPin || holeInfo.longestDrive) && (
                <div className="flex items-center gap-2 mt-2">
                  {holeInfo.closestToPin && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
                      </svg>
                      Closest to Pin
                    </span>
                  )}
                  {holeInfo.longestDrive && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                      </svg>
                      Longest Drive
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div
              className={`text-4xl font-bold px-5 py-3 rounded-xl border-2 shadow-md transition-all duration-200 ${scoreInfo.bg} ${scoreInfo.text}`}
            >
              {localScore === null ? "-" : localScore || "–"}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h4 className="text-sm font-semibold text-slate-800 mb-4">
          Select Score
        </h4>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-4">
          {scoreOptions.slice(0, 10).map((option) => (
            <button
              key={option.score}
              type="button"
              onClick={() => handleScoreSelect(option.score)}
              disabled={round.status === "completed"}
              className={`relative p-3 sm:p-4 rounded-xl border-2 font-bold
                  flex flex-col items-center justify-center min-h-[72px] sm:min-h-[80px]
                  transition-all duration-200 hover:scale-105 active:scale-95
                  outline-none shadow-sm hover:shadow-md ${
                    round.status === "completed"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  } ${
                localScore === option.score
                  ? `${option.bg} ${option.text} border-emerald-400 ring-2 ring-emerald-300 scale-105`
                  : option.score === par
                  ? "bg-blue-50 text-slate-700 border-blue-300 active:border-blue-400"
                  : "bg-white text-slate-700 border-slate-300 active:border-slate-400"
              }`}
            >
              <div className="text-xl sm:text-2xl font-bold mb-0.5">
                {option.score}
              </div>

              <div className="text-[10px] sm:text-xs font-medium leading-tight text-center">
                {option.score === par
                  ? "Par"
                  : option.score === par + 1
                  ? "Bogey"
                  : option.score === par + 2
                  ? "Double"
                  : option.score === par - 1
                  ? "Birdie"
                  : option.score === par - 2
                  ? "Eagle"
                  : option.score === 1
                  ? "Ace!"
                  : ""}
              </div>

              {localScore === option.score && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 8 8"
                  >
                    <path d="M3 6L1 4l.7-.7L3 4.6l3.3-3.3L7 2z" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Concede Button */}
        <button
          type="button"
          onClick={() => handleScoreSelect(null)}
          disabled={round.status === "completed"}
          className={`w-full p-3 rounded-xl border-2 font-semibold
            flex items-center justify-center gap-2
            transition-all duration-200 hover:scale-[1.02] active:scale-95
            outline-none shadow-sm hover:shadow-md ${
              round.status === "completed"
                ? "opacity-50 cursor-not-allowed"
                : ""
            } ${
            localScore === null
              ? "bg-slate-100 text-slate-700 border-slate-400 ring-2 ring-slate-300"
              : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
          }`}
        >
          <svg
            className="w-5 h-5"
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
          <span>Concede Hole</span>
          {localScore === null && (
            <svg
              className="w-5 h-5 text-emerald-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Competition Winner Selection */}
      {(holeInfo.closestToPin || holeInfo.longestDrive) && onCompetitionWinnerChange && (
        <div className="space-y-3">
          {holeInfo.closestToPin && (
            <div className="card border-2 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
                </svg>
                <h5 className="text-sm font-semibold text-blue-900">Closest to Pin Winner</h5>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {tour.players.map((p) => {
                  const winners = round.competitionWinners?.closestToPin?.[currentHole] || [];
                  const isWinner = winners.some(w => w.playerId === p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        const distance = closestToPinDistance ? parseFloat(closestToPinDistance) : undefined;
                        onCompetitionWinnerChange(currentHole, 'closestToPin', isWinner ? null : p.id, distance);
                      }}
                      disabled={round.status === "completed"}
                      className={`p-2 rounded-lg border-2 font-medium text-sm transition-all ${
                        round.status === "completed"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      } ${
                        isWinner
                          ? "bg-blue-600 text-white border-blue-700 shadow-md"
                          : "bg-white text-slate-700 border-slate-300 hover:border-blue-400"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => onCompetitionWinnerChange(currentHole, 'closestToPin', null)}
                  disabled={round.status === "completed"}
                  className={`p-2 rounded-lg border-2 font-medium text-sm transition-all ${
                    round.status === "completed"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  } ${
                    !(round.competitionWinners?.closestToPin?.[currentHole] || []).length
                      ? "bg-slate-100 text-slate-700 border-slate-400"
                      : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                  }`}
                >
                  None
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-900 mb-1">
                  Distance from Pin (feet/meters)
                </label>
                <input
                  type="number"
                  value={closestToPinDistance}
                  onChange={(e) => setClosestToPinDistance(e.target.value)}
                  onBlur={() => {
                    // Update when user finishes typing
                    const winners = round.competitionWinners?.closestToPin?.[currentHole] || [];
                    const currentWinner = winners[0]; // Individual rounds have only one entry
                    if (currentWinner?.playerId) {
                      const distance = closestToPinDistance ? parseFloat(closestToPinDistance) : undefined;
                      onCompetitionWinnerChange(currentHole, 'closestToPin', currentWinner.playerId, distance);
                    }
                  }}
                  disabled={round.status === "completed"}
                  placeholder="Enter distance"
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
          )}

          {holeInfo.longestDrive && (
            <div className="card border-2 border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                </svg>
                <h5 className="text-sm font-semibold text-amber-900">Longest Drive Winner</h5>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {tour.players.map((p) => {
                  const winners = round.competitionWinners?.longestDrive?.[currentHole] || [];
                  const isWinner = winners.some(w => w.playerId === p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        const distance = longestDriveDistance ? parseFloat(longestDriveDistance) : undefined;
                        onCompetitionWinnerChange(currentHole, 'longestDrive', isWinner ? null : p.id, distance);
                      }}
                      disabled={round.status === "completed"}
                      className={`p-2 rounded-lg border-2 font-medium text-sm transition-all ${
                        round.status === "completed"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      } ${
                        isWinner
                          ? "bg-amber-600 text-white border-amber-700 shadow-md"
                          : "bg-white text-slate-700 border-slate-300 hover:border-amber-400"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => onCompetitionWinnerChange(currentHole, 'longestDrive', null)}
                  disabled={round.status === "completed"}
                  className={`p-2 rounded-lg border-2 font-medium text-sm transition-all ${
                    round.status === "completed"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  } ${
                    !(round.competitionWinners?.longestDrive?.[currentHole] || []).length
                      ? "bg-slate-100 text-slate-700 border-slate-400"
                      : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                  }`}
                >
                  None
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-900 mb-1">
                  Drive Distance (yards/meters)
                </label>
                <input
                  type="number"
                  value={longestDriveDistance}
                  onChange={(e) => setLongestDriveDistance(e.target.value)}
                  onBlur={() => {
                    // Update when user finishes typing
                    const winners = round.competitionWinners?.longestDrive?.[currentHole] || [];
                    const currentWinner = winners[0]; // Individual rounds have only one entry
                    if (currentWinner?.playerId) {
                      const distance = longestDriveDistance ? parseFloat(longestDriveDistance) : undefined;
                      onCompetitionWinnerChange(currentHole, 'longestDrive', currentWinner.playerId, distance);
                    }
                  }}
                  disabled={round.status === "completed"}
                  placeholder="Enter distance"
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card bg-slate-50">
        <h5 className="text-sm font-semibold text-slate-800 mb-3">
          Round Stats
        </h5>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {playerScore?.totalScore || 0}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
              Total
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {playerScore?.scores.filter((s) => s !== null && s > 0).length}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
              Holes
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {(() => {
                const scores = playerScore?.scores || [];
                const holesPlayed = scores.filter((s) => s !== null && s > 0).length;
                if (holesPlayed === 0) return "–";
                const totalScore = playerScore?.totalScore || 0;
                const totalPar = scores
                  .map((_) => holeInfo.par || 4)
                  .slice(0, holesPlayed)
                  .reduce((sum, p) => sum + p, 0);
                const diff = totalScore - totalPar;
                return diff > 0 ? `+${diff}` : diff;
              })()}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
              To Par
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
