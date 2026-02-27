import { HoleNavigation } from "@/components/scoring/HoleNavigation";
import { LiveLeaderboard } from "@/components/scoring/LiveLeaderboard";
import { getScoreInfo } from "@/lib/scoreUtils";
import { storage } from "@/lib/storage";
import { formatUtils } from "@/types/formats";
import { Tour, Round, Player, HoleInfo, PlayerScore } from "@/types";
import { useState, useEffect, useRef, useMemo } from "react";
import { useUpdateCompetitionWinner } from "@/hooks/useScoring";
import { useParams } from "react-router-dom";
import { IndividualCompetitionWinnerSelector } from "./IndividualCompetitionWinnerSelector";
import { useAuth } from "@/contexts/AuthContext";
import { getScoreablePlayers } from "@/lib/auth/permissions";
import { hapticLight, hapticSelection } from "@/lib/haptics";

interface SwipeableIndividualScoringProps {
  tour: Tour;
  round: Round;
  onPlayerScoreChange: (
    playerId: string,
    holeIndex: number,
    score: number,
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
  const { user } = useAuth();
  const updateCompetitionWinner = useUpdateCompetitionWinner(tourId!, round.id);

  // Filter players to only those in the round that the authenticated user can score for
  const scoreablePlayers = useMemo(() => {
    return getScoreablePlayers(user, tour, round);
  }, [user, tour, round]);

  const [currentHole, setCurrentHole] = useState(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<TabType>("score");
  const [showingCompetitionSelector, setShowingCompetitionSelector] =
    useState(false);
  const [
    autoTriggeredCompetitionSelector,
    setAutoTriggeredCompetitionSelector,
  ] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentPlayer = scoreablePlayers[currentPlayerIndex];
  const currentHoleInfo = round.holeInfo[currentHole - 1];
  const isLastPlayer = currentPlayerIndex === scoreablePlayers.length - 1;

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Track if we've already prompted to finish the round
  const hasPromptedToFinish = useRef(false);

  // Scroll to top when tab changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [activeTab]);

  // Check if all scoreable players have completed all holes
  const areAllScoresComplete = () => {
    return scoreablePlayers.every((player) => {
      const playerScore = round.scores[player.id];
      if (!playerScore) return false;

      // Check if all holes have a score > 0
      return playerScore.scores.every((score) => score !== null && score > 0);
    });
  };

  // Check if all scoreable players have scored the current hole
  const haveAllPlayersScoredCurrentHole = () => {
    return scoreablePlayers.every((player) => {
      const playerScore = round.scores[player.id];
      if (!playerScore) return false;

      const score = playerScore.scores[currentHole - 1];
      return score !== null && score > 0;
    });
  };

  // Check if all scores are complete on every score update
  useEffect(() => {
    if (
      round.status === "in-progress" &&
      !hasPromptedToFinish.current &&
      onFinishRound
    ) {
      if (areAllScoresComplete()) {
        hasPromptedToFinish.current = true;
        onFinishRound();
      }
    }
  }, [round.scores, round.status, onFinishRound]);

  // Check if we should show competition selector after all players score
  useEffect(() => {
    const hasCompetitions =
      currentHoleInfo.closestToPin || currentHoleInfo.longestDrive;
    if (
      hasCompetitions &&
      haveAllPlayersScoredCurrentHole() &&
      !showingCompetitionSelector
    ) {
      // Show the competition selector and mark as auto-triggered
      setShowingCompetitionSelector(true);
      setAutoTriggeredCompetitionSelector(true);
    }
  }, [round.scores, currentHole, showingCompetitionSelector, currentHoleInfo]);

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
      // Trigger haptic feedback for swipe
      hapticLight();
      setSwipeDirection("left");
      setIsTransitioning(true);
      setTimeout(() => {
        // If not the last player, move to next player
        if (currentPlayerIndex < scoreablePlayers.length - 1) {
          setCurrentPlayerIndex(currentPlayerIndex + 1);
          hapticSelection();
        }
        // If last player and not last hole, move to next hole and reset to first player
        else if (currentHole < round.holes) {
          setCurrentHole(currentHole + 1);
          setCurrentPlayerIndex(0);
          setShowingCompetitionSelector(false);
          hapticSelection();
        }
        // On last player and last hole, do nothing (validation happens in useEffect)
        setIsTransitioning(false);
        setSwipeDirection(null);
      }, 250);
    }

    if (isRightSwipe) {
      // Trigger haptic feedback for swipe
      hapticLight();
      setSwipeDirection("right");
      setIsTransitioning(true);
      setTimeout(() => {
        // If not the first player, move to previous player
        if (currentPlayerIndex > 0) {
          setCurrentPlayerIndex(currentPlayerIndex - 1);
          hapticSelection();
        }
        // If first player and not first hole, move to previous hole and go to last player
        else if (currentHole > 1) {
          setCurrentHole(currentHole - 1);
          setCurrentPlayerIndex(scoreablePlayers.length - 1);
          setShowingCompetitionSelector(false);
          hapticSelection();
        }
        setIsTransitioning(false);
        setSwipeDirection(null);
      }, 250);
    }
  };

  // Show message if no scoreable players
  if (scoreablePlayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔒</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Players Available to Score
          </h3>
          <p className="text-white/50 mb-4">
            Please sign in to access scoring functionality.
          </p>
          <p className="text-sm text-white/40">
            Authenticated users can score for all players in the round. Your
            backend will control who can score for which players.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white/5 border-b border-white/10 sticky top-0 z-10 shadow-sm">
        <div className="flex" role="tablist" aria-label="Scoring views">
          <button
            onClick={() => setActiveTab("score")}
            role="tab"
            aria-selected={activeTab === "score"}
            aria-controls="panel-score"
            className={`flex-1 px-4 py-4 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset outline-none ${
              activeTab === "score"
                ? "text-emerald-400 border-b-3 border-emerald-600 bg-emerald-500/15"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
            role="tab"
            aria-selected={activeTab === "holes"}
            aria-controls="panel-holes"
            className={`flex-1 px-4 py-4 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset outline-none ${
              activeTab === "holes"
                ? "text-emerald-400 border-b-3 border-emerald-600 bg-emerald-500/15"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
            role="tab"
            aria-selected={activeTab === "leaderboard"}
            aria-controls="panel-leaderboard"
            className={`flex-1 px-4 py-4 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset outline-none ${
              activeTab === "leaderboard"
                ? "text-emerald-400 border-b-3 border-emerald-600 bg-emerald-500/15"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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

      <div ref={contentRef} className="flex-1 overflow-y-auto pb-4">
        {activeTab === "score" && !showingCompetitionSelector && (
          <div
            className="space-y-4 p-4"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ touchAction: "pan-y" }}
          >
            <div
              className={`card relative transition-all duration-300 ease-out ${
                isTransitioning
                  ? "opacity-70 scale-95"
                  : "opacity-100 scale-100"
              }`}
              style={{
                transform: isTransitioning
                  ? "translateX(0) scale(0.95)"
                  : "translateX(0) scale(1)",
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-white/50">
                  Hole {currentHole}
                </h3>
                {currentPlayerIndex < scoreablePlayers.length - 1 ? (
                  <div className="text-xs text-white/40 flex items-center gap-1">
                    Swipe to {scoreablePlayers[currentPlayerIndex + 1].name}
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
                  <div className="text-xs text-white/40 flex items-center gap-1">
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
                {scoreablePlayers.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                      index === currentPlayerIndex
                        ? "bg-emerald-600"
                        : index < currentPlayerIndex
                          ? "bg-emerald-300"
                          : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div
              key={`${currentPlayer.id}-${currentHole}`}
              className={`animate-slide-in-${
                swipeDirection === "left"
                  ? "left"
                  : swipeDirection === "right"
                    ? "right"
                    : "fade"
              }`}
            >
              {/* Competition Winners Button - Show if hole has competitions */}
              {(currentHoleInfo.closestToPin ||
                currentHoleInfo.longestDrive) && (
                <div className="card mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <span className="text-lg">🏅</span>
                        Hole Competitions
                      </h4>
                      <div className="space-y-1 text-xs">
                        {currentHoleInfo.closestToPin &&
                          (() => {
                            const winners =
                              round.competitionWinners?.closestToPin?.[
                                currentHole
                              ] || [];
                            const winner = winners[0];
                            const winnerPlayer = winner
                              ? tour.players.find(
                                  (p) => p.id === winner.playerId,
                                )
                              : null;
                            return (
                              <div className="flex items-center gap-1 text-blue-300">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                                </svg>
                                <span className="font-semibold">
                                  Closest to Pin:
                                </span>
                                {winnerPlayer ? (
                                  <span>
                                    {winnerPlayer.name}
                                    {winner.distance
                                      ? ` - ${winner.distance} ft`
                                      : ""}
                                  </span>
                                ) : (
                                  <span className="text-white/40 italic">
                                    Not selected
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        {currentHoleInfo.longestDrive &&
                          (() => {
                            const winners =
                              round.competitionWinners?.longestDrive?.[
                                currentHole
                              ] || [];
                            const winner = winners[0];
                            const winnerPlayer = winner
                              ? tour.players.find(
                                  (p) => p.id === winner.playerId,
                                )
                              : null;
                            return (
                              <div className="flex items-center gap-1 text-amber-800">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="font-semibold">
                                  Longest Drive:
                                </span>
                                {winnerPlayer ? (
                                  <span>
                                    {winnerPlayer.name}
                                    {winner.distance
                                      ? ` - ${winner.distance} yds`
                                      : ""}
                                  </span>
                                ) : (
                                  <span className="text-white/40 italic">
                                    Not selected
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowingCompetitionSelector(true);
                        setAutoTriggeredCompetitionSelector(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all active:scale-95 shadow-md"
                    >
                      {(
                        round.competitionWinners?.closestToPin?.[currentHole] ||
                        []
                      ).length > 0 ||
                      (
                        round.competitionWinners?.longestDrive?.[currentHole] ||
                        []
                      ).length > 0
                        ? "Edit"
                        : "Select"}
                    </button>
                  </div>
                </div>
              )}

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
              />
            </div>
          </div>
        )}

        {activeTab === "score" && showingCompetitionSelector && (
          <IndividualCompetitionWinnerSelector
            tour={tour}
            round={round}
            currentHole={currentHole}
            currentHoleInfo={currentHoleInfo}
            autoAdvance={autoTriggeredCompetitionSelector}
            onCompetitionWinnerChange={(
              holeNumber,
              competitionType,
              winnerId,
              distance,
            ) => {
              updateCompetitionWinner.mutate({
                holeNumber,
                competitionType,
                winnerId,
                distance,
              });
            }}
            onContinue={() => {
              setShowingCompetitionSelector(false);
              // Only advance to next hole if auto-triggered (after all players scored)
              if (
                autoTriggeredCompetitionSelector &&
                currentHole < round.holes
              ) {
                setCurrentHole(currentHole + 1);
                setCurrentPlayerIndex(0);
              }
            }}
          />
        )}

        {activeTab === "holes" && (
          <div className="p-4 space-y-4">
            <div className="card">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-white/50">
                  Player {currentPlayerIndex + 1} of {scoreablePlayers.length}
                </h3>
                {currentPlayerIndex < scoreablePlayers.length - 1 && (
                  <div className="text-xs text-white/40">
                    Swipe to {scoreablePlayers[currentPlayerIndex + 1].name} →
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {scoreablePlayers.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                      index === currentPlayerIndex
                        ? "bg-emerald-600"
                        : index < currentPlayerIndex
                          ? "bg-emerald-300"
                          : "bg-white/10"
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
  onScoreChange: (score: number) => void;
  strokesGiven: boolean;
  round: Round;
  tour: Tour;
  onCompetitionWinnerChange?: (
    holeNumber: number,
    competitionType: "closestToPin" | "longestDrive",
    winnerId: string | null,
    distance?: number,
  ) => void;
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
  const [localScore, setLocalScore] = useState<number>(currentScore ?? 0);
  const [closestToPinDistance, setClosestToPinDistance] = useState<string>("");
  const [longestDriveDistance, setLongestDriveDistance] = useState<string>("");
  const par = holeInfo.par;

  // Reset local score and distances when hole changes
  useEffect(() => {
    setLocalScore(playerScore?.scores[currentHole - 1] ?? 0);
    // Load existing distances if they exist (individual rounds have single entry)
    const ctpWinners =
      round.competitionWinners?.closestToPin?.[currentHole] || [];
    const ldWinners =
      round.competitionWinners?.longestDrive?.[currentHole] || [];
    const ctpWinner = ctpWinners[0]; // Individual rounds have only one entry
    const ldWinner = ldWinners[0];
    setClosestToPinDistance(ctpWinner?.distance?.toString() || "");
    setLongestDriveDistance(ldWinner?.distance?.toString() || "");
  }, [currentHole, playerScore, round.competitionWinners]);

  // Calculate strokes for this hole
  const strokesForHole =
    strokesGiven && player.handicap && holeInfo.handicap
      ? storage.calculateStrokesForHole(player.handicap, holeInfo.handicap)
      : 0;

  const effectivePar = par;
  const isMatchPlay = formatUtils.isMatchPlay(round.format);
  const scoreInfo = getScoreInfo(localScore, effectivePar, isMatchPlay);

  const handleScoreSelect = (score: number) => {
    hapticSelection();
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
      <div className="card bg-gradient-to-br from-emerald-500/15 to-teal-500/15">
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
              <h3 className="text-xl font-bold text-white">{player.name}</h3>
              <div className="flex items-center gap-3 text-sm">
                {player.handicap !== undefined && (
                  <span className="text-white/50 font-medium">
                    HC {player.handicap}
                  </span>
                )}
                {strokesForHole > 0 && (
                  <span className="bg-blue-500/15 text-blue-300 px-2 py-1 rounded-full text-xs font-semibold">
                    {strokesForHole} Stroke{strokesForHole > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-white/50">
                <span className="font-semibold">Hole {currentHole}</span>
                <span>•</span>
                <span>Par {holeInfo.par}</span>
                <span>•</span>
                <span>{holeInfo.yardage} yards</span>
              </div>
              {(holeInfo.closestToPin || holeInfo.longestDrive) && (
                <div className="flex items-center gap-2 mt-2">
                  {holeInfo.closestToPin && (
                    <span className="bg-blue-500/15 text-blue-300 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                      </svg>
                      Closest to Pin
                    </span>
                  )}
                  {holeInfo.longestDrive && (
                    <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                          clipRule="evenodd"
                        />
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
              {localScore || "–"}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h4 className="text-sm font-semibold text-white/90 mb-4">
          Select Score
        </h4>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-4">
          {scoreOptions.slice(0, 10).map((option) => (
            <button
              key={option.score}
              type="button"
              onClick={() => handleScoreSelect(option.score)}
              disabled={round.status === "completed"}
              aria-label={`Score ${option.score}${option.score === par ? " (Par)" : option.score === par - 1 ? " (Birdie)" : option.score === par - 2 ? " (Eagle)" : option.score === par + 1 ? " (Bogey)" : option.score === par + 2 ? " (Double Bogey)" : option.score === 1 ? " (Ace)" : ""}`}
              aria-pressed={localScore === option.score}
              className={`relative p-3 sm:p-4 rounded-xl border-2 font-bold
                  flex flex-col items-center justify-center min-h-[72px] sm:min-h-[80px]
                  transition-all duration-200 hover:scale-105 active:scale-95
                  focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
                  outline-none shadow-sm hover:shadow-md ${
                    round.status === "completed"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  } ${
                    localScore === option.score
                      ? `${option.bg} ${option.text} border-emerald-400 ring-2 ring-emerald-500/40 scale-105`
                      : option.score === par
                        ? "bg-blue-500/15 text-white/70 border-blue-400/40 active:border-blue-400"
                        : "bg-white/5 text-white/70 border-white/15 active:border-slate-400"
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
      </div>

      {/* Competition Winner Selection */}
      {(holeInfo.closestToPin || holeInfo.longestDrive) &&
        onCompetitionWinnerChange && (
          <div className="space-y-3">
            {holeInfo.closestToPin && (
              <div className="card border-2 border-blue-500/30 bg-blue-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                  </svg>
                  <h5 className="text-sm font-semibold text-blue-400">
                    Closest to Pin Winner
                  </h5>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {tour.players.map((p) => {
                    const winners =
                      round.competitionWinners?.closestToPin?.[currentHole] ||
                      [];
                    const isWinner = winners.some((w) => w.playerId === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          const distance = closestToPinDistance
                            ? parseFloat(closestToPinDistance)
                            : undefined;
                          onCompetitionWinnerChange(
                            currentHole,
                            "closestToPin",
                            isWinner ? null : p.id,
                            distance,
                          );
                        }}
                        disabled={round.status === "completed"}
                        className={`p-3 min-h-[44px] rounded-lg border-2 font-medium text-sm transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none ${
                          round.status === "completed"
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        } ${
                          isWinner
                            ? "bg-blue-600 text-white border-blue-700 shadow-lg ring-4 ring-blue-500/40 scale-105 font-bold"
                            : "bg-white/5 text-white/70 border-white/15 hover:border-blue-400 hover:shadow-md"
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() =>
                      onCompetitionWinnerChange(
                        currentHole,
                        "closestToPin",
                        null,
                      )
                    }
                    disabled={round.status === "completed"}
                    className={`p-3 min-h-[44px] rounded-lg border-2 font-medium text-sm transition-all focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 outline-none ${
                      round.status === "completed"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    } ${
                      !(
                        round.competitionWinners?.closestToPin?.[currentHole] ||
                        []
                      ).length
                        ? "bg-white/5 text-white/70 border-slate-400"
                        : "bg-white/5 text-white/50 border-white/15 hover:border-slate-400"
                    }`}
                  >
                    None
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-400 mb-1">
                    Distance from Pin (feet/meters)
                  </label>
                  <input
                    type="number"
                    value={closestToPinDistance}
                    onChange={(e) => setClosestToPinDistance(e.target.value)}
                    onBlur={() => {
                      // Update when user finishes typing
                      const winners =
                        round.competitionWinners?.closestToPin?.[currentHole] ||
                        [];
                      const currentWinner = winners[0]; // Individual rounds have only one entry
                      if (currentWinner?.playerId) {
                        const distance = closestToPinDistance
                          ? parseFloat(closestToPinDistance)
                          : undefined;
                        onCompetitionWinnerChange(
                          currentHole,
                          "closestToPin",
                          currentWinner.playerId,
                          distance,
                        );
                      }
                    }}
                    disabled={round.status === "completed"}
                    placeholder="Enter distance"
                    className="input-field text-sm"
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>
            )}

            {holeInfo.longestDrive && (
              <div className="card border-2 border-amber-500/30 bg-amber-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="w-5 h-5 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h5 className="text-sm font-semibold text-amber-400">
                    Longest Drive Winner
                  </h5>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {tour.players.map((p) => {
                    const winners =
                      round.competitionWinners?.longestDrive?.[currentHole] ||
                      [];
                    const isWinner = winners.some((w) => w.playerId === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          const distance = longestDriveDistance
                            ? parseFloat(longestDriveDistance)
                            : undefined;
                          onCompetitionWinnerChange(
                            currentHole,
                            "longestDrive",
                            isWinner ? null : p.id,
                            distance,
                          );
                        }}
                        disabled={round.status === "completed"}
                        className={`p-3 min-h-[44px] rounded-lg border-2 font-medium text-sm transition-all focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 outline-none ${
                          round.status === "completed"
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        } ${
                          isWinner
                            ? "bg-amber-600 text-white border-amber-700 shadow-lg ring-4 ring-amber-500/40 scale-105 font-bold"
                            : "bg-white/5 text-white/70 border-white/15 hover:border-amber-400 hover:shadow-md"
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() =>
                      onCompetitionWinnerChange(
                        currentHole,
                        "longestDrive",
                        null,
                      )
                    }
                    disabled={round.status === "completed"}
                    className={`p-3 min-h-[44px] rounded-lg border-2 font-medium text-sm transition-all focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 outline-none ${
                      round.status === "completed"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    } ${
                      !(
                        round.competitionWinners?.longestDrive?.[currentHole] ||
                        []
                      ).length
                        ? "bg-white/5 text-white/70 border-slate-400"
                        : "bg-white/5 text-white/50 border-white/15 hover:border-slate-400"
                    }`}
                  >
                    None
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-400 mb-1">
                    Drive Distance (yards/meters)
                  </label>
                  <input
                    type="number"
                    value={longestDriveDistance}
                    onChange={(e) => setLongestDriveDistance(e.target.value)}
                    onBlur={() => {
                      // Update when user finishes typing
                      const winners =
                        round.competitionWinners?.longestDrive?.[currentHole] ||
                        [];
                      const currentWinner = winners[0]; // Individual rounds have only one entry
                      if (currentWinner?.playerId) {
                        const distance = longestDriveDistance
                          ? parseFloat(longestDriveDistance)
                          : undefined;
                        onCompetitionWinnerChange(
                          currentHole,
                          "longestDrive",
                          currentWinner.playerId,
                          distance,
                        );
                      }
                    }}
                    disabled={round.status === "completed"}
                    placeholder="Enter distance"
                    className="input-field text-sm"
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>
        )}

      <div className="card">
        <h5 className="text-sm font-semibold text-white/90 mb-3">
          Round Stats
        </h5>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">
              {playerScore?.totalScore || 0}
            </div>
            <div className="text-xs text-white/40 uppercase tracking-wide mt-1">
              Total
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {playerScore?.scores.filter((s) => s !== null && s > 0).length}
            </div>
            <div className="text-xs text-white/40 uppercase tracking-wide mt-1">
              Holes
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {(() => {
                const scores = playerScore?.scores || [];
                const holesPlayed = scores.filter(
                  (s) => s !== null && s > 0,
                ).length;
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
            <div className="text-xs text-white/40 uppercase tracking-wide mt-1">
              To Par
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
