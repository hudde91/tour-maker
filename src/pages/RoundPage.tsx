import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTour } from "../hooks/useTours";
import {
  useUpdateScore,
  useStartRound,
  useCompleteRound,
  useUpdateTotalScoreWithHandicap,
} from "../hooks/useScoring";
import { ScoreEntryCard } from "../components/ScoreEntryCard";
import { HoleNavigation } from "../components/HoleNavigation";
import { LiveLeaderboard } from "../components/LiveLeaderboard";
import { TotalScoreCard } from "../components/TotalScoreCard";
import { useUpdateTotalScore } from "../hooks/useScoring";
import { storage } from "../lib/storage";

export const RoundPage = () => {
  const { tourId, roundId } = useParams<{ tourId: string; roundId: string }>();
  const { data: tour, isLoading } = useTour(tourId!);
  const updateScore = useUpdateScore(tourId!, roundId!);
  const startRound = useStartRound(tourId!);
  const completeRound = useCompleteRound(tourId!);
  const updateTotalScore = useUpdateTotalScore(tourId!, roundId!);
  const updateTotalScoreWithHandicap = useUpdateTotalScoreWithHandicap(
    tourId!,
    roundId!
  );

  const [currentHole, setCurrentHole] = useState(1);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const [scoringMode, setScoringMode] = useState<"individual" | "total">(
    "individual"
  );

  const round = tour?.rounds.find((r) => r.id === roundId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-lg font-semibold text-slate-700">
            Loading Tournament Round...
          </div>
          <div className="text-slate-500 mt-1">Preparing scoring interface</div>
        </div>
      </div>
    );
  }

  if (!tour || !round) {
    return (
      <div className="min-h-screen bg-slate-50 safe-area-top">
        <div className="p-6">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 12.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-3">
              Round Not Found
            </h3>
            <p className="text-slate-500 mb-6">
              The tournament round you're looking for doesn't exist or has been
              removed.
            </p>
            <Link to={`/tour/${tourId}`} className="btn-primary">
              Back to Tournament
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentHoleInfo = round.holeInfo[currentHole - 1];
  const totalPar = storage.getTotalPar(round);
  const playersWithScores = Object.keys(round.scores).filter((playerId) =>
    round.scores[playerId].scores.some((score) => score > 0)
  ).length;

  const handleStartRound = async () => {
    try {
      await startRound.mutateAsync(round.id);
    } catch (error) {
      console.error("Failed to start round:", error);
    }
  };

  const handleCompleteRound = async () => {
    if (
      window.confirm(
        "Complete this tournament round? No additional scores can be entered after completion."
      )
    ) {
      try {
        await completeRound.mutateAsync(round.id);
      } catch (error) {
        console.error("Failed to complete round:", error);
      }
    }
  };

  const handleScoreChange = async (
    playerId: string,
    holeIndex: number,
    score: number
  ) => {
    const playerScore = round.scores[playerId];
    if (!playerScore) return;

    const newScores = [...playerScore.scores];
    newScores[holeIndex] = score;

    try {
      await updateScore.mutateAsync({ playerId, scores: newScores });
    } catch (error) {
      console.error("Failed to update score:", error);
    }
  };

  const handleTotalScoreChange = async (
    playerId: string,
    totalScore: number,
    handicapStrokes?: number
  ) => {
    console.log("=== ROUND PAGE DEBUG ===");
    console.log("Player ID:", playerId);
    console.log("Total Score:", totalScore);
    console.log("Handicap Strokes:", handicapStrokes);

    try {
      if (handicapStrokes !== undefined) {
        console.log("Using updateTotalScoreWithHandicap hook");
        await updateTotalScoreWithHandicap.mutateAsync({
          playerId,
          totalScore,
          handicapStrokes,
        });
      } else {
        console.log("Using regular updateTotalScore hook");
        await updateTotalScore.mutateAsync({
          playerId,
          totalScore,
        });
      }
    } catch (error) {
      console.error("Failed to update total score:", error);
    }
  };

  // Get player scores for current hole
  const getPlayerScores = () => {
    const scores: Record<string, number[]> = {};
    Object.entries(round.scores).forEach(([playerId, playerScore]) => {
      scores[playerId] = playerScore.scores;
    });
    return scores;
  };

  // Pre-round start screen
  if (round.status === "created") {
    return (
      <div className="min-h-screen bg-slate-50 safe-area-top">
        {/* Professional Header */}
        <div className="golf-hero-bg">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Link to={`/tour/${tourId}`} className="nav-back mr-4">
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">{round.name}</h1>
                <p className="text-emerald-100 mt-1">{round.courseName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-4 pb-8">
          {/* Pre-Round Information */}
          <div className="card-elevated text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Tournament Round Ready
            </h2>
            <p className="text-slate-600 text-lg mb-8">
              All systems are ready to begin this tournament round
            </p>

            {/* Round Statistics */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {tour.players.length}
                </div>
                <div className="text-slate-500 font-medium">Players</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {round.holes}
                </div>
                <div className="text-slate-500 font-medium">Holes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {totalPar}
                </div>
                <div className="text-slate-500 font-medium">Total Par</div>
              </div>
            </div>

            <button
              onClick={handleStartRound}
              disabled={startRound.isPending}
              className="btn-primary text-lg py-4 px-8 disabled:opacity-50 shadow-lg"
            >
              {startRound.isPending ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Starting Tournament Round...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4m-6 0a2 2 0 012-2h2a2 2 0 012 2m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v1"
                    />
                  </svg>
                  Begin Tournament Round
                </div>
              )}
            </button>
          </div>

          {/* Tournament Format Info */}
          <div className="card">
            <h3 className="subsection-header mb-4">Round Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Format:</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {round.format.replace("-", " ")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Handicap Strokes:</span>
                <span
                  className={`font-semibold ${
                    round.settings.strokesGiven
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }`}
                >
                  {round.settings.strokesGiven ? "Applied" : "Not Applied"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Course:</span>
                <span className="font-semibold text-slate-900">
                  {round.courseName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Created:</span>
                <span className="font-semibold text-slate-900">
                  {new Date(round.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active tournament scoring interface
  return (
    <div className="min-h-screen bg-slate-50 safe-area-top safe-area-bottom">
      {/* Professional Tournament Header */}
      <div className="golf-hero-bg sticky top-0 z-40 shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Link to={`/tour/${tourId}`} className="nav-back mr-4">
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">{round.name}</h1>
                <p className="text-emerald-100 text-sm">{round.courseName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                  showLeaderboard
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
                }`}
              >
                <div className="flex items-center gap-2">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Leaderboard
                </div>
              </button>

              {round.status === "in-progress" && (
                <button
                  onClick={handleCompleteRound}
                  className="bg-white bg-opacity-20 text-white px-3 py-2 rounded-lg font-medium text-sm hover:bg-opacity-30 transition-all"
                >
                  <div className="flex items-center gap-2">
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Complete Round
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Tournament Status Bar - Only show hole info in individual mode */}
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-4 text-white">
                {scoringMode === "individual" && (
                  <>
                    <div className="flex items-center gap-1">
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="font-medium">Hole {currentHole}</span>
                    </div>
                    <div className="flex items-center gap-1">
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
                          d="M5 3l14 9-14 9V3z"
                        />
                      </svg>
                      <span>Par {currentHoleInfo.par}</span>
                    </div>
                    {currentHoleInfo.yardage && (
                      <div className="flex items-center gap-1">
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
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                        <span>{currentHoleInfo.yardage}y</span>
                      </div>
                    )}
                  </>
                )}

                {scoringMode === "total" && (
                  <div className="flex items-center gap-1">
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="font-medium">Total Score Entry</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-emerald-100">
                <span>
                  {playersWithScores} of {tour.players.length} scoring
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    round.status === "completed"
                      ? "bg-blue-500 text-white"
                      : "bg-emerald-500 text-white"
                  }`}
                >
                  {round.status === "completed" ? "Final" : "Live"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-24">
        {/* Hole Navigation - Only show in individual mode */}
        {scoringMode === "individual" && (
          <div className="mb-6">
            <HoleNavigation
              holes={round.holeInfo}
              currentHole={currentHole}
              onHoleChange={setCurrentHole}
              playerScores={getPlayerScores()}
            />
          </div>
        )}

        {/* Live Leaderboard (Collapsible) */}
        {showLeaderboard && (
          <div className="mb-6 animate-fade-in">
            <LiveLeaderboard tour={tour} round={round} />
          </div>
        )}

        {/* Scoring Interface */}
        <div className="space-y-4">
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
                    handleTotalScoreChange(player.id, score, handicapStrokes)
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
                    handleScoreChange(player.id, currentHole - 1, score)
                  }
                  strokesGiven={round.settings.strokesGiven}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation - Only show in individual mode */}
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
