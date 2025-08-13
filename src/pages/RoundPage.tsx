import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTour } from "../hooks/useTours";
import {
  useUpdateScore,
  useStartRound,
  useCompleteRound,
  useUpdateTotalScoreWithHandicap,
  useUpdateTeamScore,
  useUpdateTeamTotalScore,
  useUpdateTotalScore,
} from "../hooks/useScoring";
import { useUpdateMatchHole } from "../hooks/useMatchPlay";
import { LiveLeaderboard } from "../components/LiveLeaderboard";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { RoundHeader } from "../components/RoundHeader";
import { PreRoundComponent } from "../components/PreRoundComponent";
import { IndividualScoringInterface } from "../components/IndividualScoringInterface";
import { ScrambleScoringInterface } from "../components/ScrambleScoringInterface";
import { BestBallScoringInterface } from "../components/BestBallScoringInterface";
import { FoursomesScoringInterface } from "../components/FoursomesScoringInterface";
import { FourBallMatchPlayInterface } from "../components/FourBallMatchPlayInterface";
import { SinglesMatchPlayInterface } from "../components/SinglesMatchPlayInterface";
import { CaptainPairingInterface } from "../components/CaptainPairingInterface";
import { getFormatConfig } from "../lib/roundFormatManager";
import { storage } from "../lib/storage";

export const RoundPage = () => {
  const { tourId, roundId } = useParams<{ tourId: string; roundId: string }>();
  const { data: tour, isLoading } = useTour(tourId!);

  const updateScore = useUpdateScore(tourId!, roundId!);
  const updateTeamScore = useUpdateTeamScore(tourId!, roundId!);
  const updateTeamTotalScore = useUpdateTeamTotalScore(tourId!, roundId!);
  const startRound = useStartRound(tourId!);
  const completeRound = useCompleteRound(tourId!);
  const updateTotalScore = useUpdateTotalScore(tourId!, roundId!);
  const updateTotalScoreWithHandicap = useUpdateTotalScoreWithHandicap(
    tourId!,
    roundId!
  );
  const updateMatchHole = useUpdateMatchHole(tourId!, roundId!);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCaptainPairing, setShowCaptainPairing] = useState(false);

  const round = tour?.rounds.find((r) => r.id === roundId);
  const formatConfig = round ? getFormatConfig(round) : null;

  // Check if this is a Ryder Cup format
  const isRyderCupFormat =
    round &&
    [
      "foursomes-match-play",
      "four-ball-match-play",
      "singles-match-play",
    ].includes(round.format);

  // Check if round needs team captains and pairings
  const needsCaptainPairing = tour?.format === "ryder-cup" && isRyderCupFormat;

  const handleStartRound = async () => {
    try {
      await startRound.mutateAsync(round!.id);
    } catch (error) {
      console.error("Failed to start round:", error);
    }
  };

  const handleCompleteRound = () => {
    setShowCompleteConfirm(true);
  };

  const confirmCompleteRound = async () => {
    try {
      await completeRound.mutateAsync(round!.id);
      setShowCompleteConfirm(false);
    } catch (error) {
      console.error("Failed to complete round:", error);
    }
  };

  const cancelCompleteRound = () => {
    setShowCompleteConfirm(false);
  };

  const handlePlayerScoreChange = async (
    playerId: string,
    holeIndex: number,
    score: number
  ) => {
    const playerScore = round!.scores[playerId];
    if (!playerScore) return;

    const newScores = [...playerScore.scores];
    newScores[holeIndex] = score;

    try {
      await updateScore.mutateAsync({ playerId, scores: newScores });
    } catch (error) {
      console.error("Failed to update score:", error);
    }
  };

  const handlePlayerTotalScoreChange = async (
    playerId: string,
    totalScore: number,
    handicapStrokes?: number
  ) => {
    try {
      if (handicapStrokes !== undefined) {
        await updateTotalScoreWithHandicap.mutateAsync({
          playerId,
          totalScore,
          handicapStrokes,
        });
      } else {
        await updateTotalScore.mutateAsync({
          playerId,
          totalScore,
        });
      }
    } catch (error) {
      console.error("Failed to update total score:", error);
    }
  };

  const handleTeamScoreChange = async (
    teamId: string,
    holeIndex: number,
    score: number
  ) => {
    const teamScore = storage.getTeamScore(tour!, round!.id, teamId);
    const currentScores = teamScore?.scores || new Array(round!.holes).fill(0);
    const newScores = [...currentScores];
    newScores[holeIndex] = score;

    try {
      await updateTeamScore.mutateAsync({ teamId, scores: newScores });
    } catch (error) {
      console.error("Failed to update team score:", error);
    }
  };

  const handleTeamTotalScoreChange = async (
    teamId: string,
    totalScore: number
  ) => {
    try {
      await updateTeamTotalScore.mutateAsync({ teamId, totalScore });
    } catch (error) {
      console.error("Failed to update team total score:", error);
    }
  };

  const handleMatchHoleUpdate = async (
    matchId: string,
    holeNumber: number,
    teamAScore: number,
    teamBScore: number,
    individualScores?: {
      teamA: { [playerId: string]: number };
      teamB: { [playerId: string]: number };
    }
  ) => {
    try {
      await updateMatchHole.mutateAsync({
        matchId,
        holeNumber,
        teamAScore,
        teamBScore,
      });

      // For Four-Ball, also update individual player scores
      if (individualScores && round!.format === "four-ball-match-play") {
        const allScores = {
          ...individualScores.teamA,
          ...individualScores.teamB,
        };

        for (const [playerId, score] of Object.entries(allScores)) {
          const playerScore = round!.scores[playerId];
          if (playerScore) {
            const newScores = [...playerScore.scores];
            newScores[holeNumber - 1] = score;
            await updateScore.mutateAsync({ playerId, scores: newScores });
          }
        }
      }
    } catch (error) {
      console.error("Failed to update match hole:", error);
    }
  };

  // Loading State
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

  // Error State
  if (!tour || !round || !formatConfig) {
    return (
      <div className="min-h-screen bg-slate-50 safe-area-top">
        <div className="p-6 w-full max-w-6xl mx-auto">
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

  // Pre-round Screen with Captain Pairing for Ryder Cup formats
  if (round.status === "created") {
    return (
      <>
        <PreRoundComponent
          tour={tour}
          round={round}
          formatConfig={formatConfig}
          onStartRound={handleStartRound}
          isStarting={startRound.isPending}
          onCaptainPairing={
            needsCaptainPairing ? () => setShowCaptainPairing(true) : undefined
          }
        />

        {/* Captain Pairing Interface */}
        {needsCaptainPairing && (
          <CaptainPairingInterface
            tour={tour}
            round={round}
            isOpen={showCaptainPairing}
            onClose={() => setShowCaptainPairing(false)}
          />
        )}
      </>
    );
  }

  // Active Round Interface
  return (
    <div className="min-h-screen bg-slate-50 safe-area-top safe-area-bottom">
      {/* Round Header */}
      <RoundHeader
        tour={tour}
        round={round}
        formatConfig={formatConfig}
        showLeaderboard={showLeaderboard}
        onToggleLeaderboard={() => setShowLeaderboard(!showLeaderboard)}
        onCompleteRound={handleCompleteRound}
        onCaptainPairing={
          needsCaptainPairing ? () => setShowCaptainPairing(true) : undefined
        }
      />

      <div className="px-4 mt-4 pb-24 w-full max-w-6xl mx-auto">
        {/* Live Leaderboard (Collapsible) */}
        {showLeaderboard && (
          <div className="mb-6 animate-fade-in w-full max-w-5xl mx-auto">
            <LiveLeaderboard tour={tour} round={round} />
          </div>
        )}

        {/* Format-Specific Scoring Interface */}
        <div className="w-full max-w-5xl mx-auto">
          {(() => {
            switch (round.format) {
              case "scramble":
                return (
                  <ScrambleScoringInterface
                    tour={tour}
                    round={round}
                    onTeamScoreChange={handleTeamScoreChange}
                    onTeamTotalScoreChange={handleTeamTotalScoreChange}
                  />
                );

              case "best-ball":
                return (
                  <BestBallScoringInterface
                    tour={tour}
                    round={round}
                    onPlayerScoreChange={handlePlayerScoreChange}
                    onPlayerTotalScoreChange={handlePlayerTotalScoreChange}
                  />
                );

              case "foursomes-match-play":
                return (
                  <FoursomesScoringInterface
                    tour={tour}
                    round={round}
                    onMatchHoleUpdate={handleMatchHoleUpdate}
                  />
                );

              case "four-ball-match-play":
                return (
                  <FourBallMatchPlayInterface
                    tour={tour}
                    round={round}
                    onMatchHoleUpdate={handleMatchHoleUpdate}
                  />
                );

              case "singles-match-play":
                return (
                  <SinglesMatchPlayInterface
                    tour={tour}
                    round={round}
                    onMatchHoleUpdate={handleMatchHoleUpdate}
                  />
                );

              default:
                return (
                  <IndividualScoringInterface
                    tour={tour}
                    round={round}
                    onPlayerScoreChange={handlePlayerScoreChange}
                    onPlayerTotalScoreChange={handlePlayerTotalScoreChange}
                  />
                );
            }
          })()}
        </div>
      </div>

      {/* Captain Pairing Interface for active rounds */}
      {needsCaptainPairing && (
        <CaptainPairingInterface
          tour={tour}
          round={round}
          isOpen={showCaptainPairing}
          onClose={() => setShowCaptainPairing(false)}
        />
      )}

      {/* Complete Round Confirmation */}
      <ConfirmDialog
        isOpen={showCompleteConfirm}
        title="Complete Tournament Round"
        message="Complete this tournament round? No additional scores can be entered after completion."
        confirmLabel="Complete Round"
        cancelLabel="Cancel"
        onConfirm={confirmCompleteRound}
        onCancel={cancelCompleteRound}
        isDestructive={false}
      />
    </div>
  );
};
