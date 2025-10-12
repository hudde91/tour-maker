import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useTour } from "../hooks/useTours";
import {
  useUpdateScore,
  useStartRound,
  useCompleteRound,
  useUpdateTeamScore,
} from "../hooks/useScoring";
import { useUpdateMatchHole } from "../hooks/useMatchPlay";
import { LiveLeaderboard } from "../components/scoring/LiveLeaderboard";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { getFormatConfig } from "../lib/roundFormatManager";
import { storage } from "../lib/storage";
import { CaptainPairingInterface } from "../components/matchplay/rydercup/CaptainPairingInterface";
import { PreRoundComponent } from "../components/rounds/PreRoundComponent";
import { RoundHeader } from "../components/rounds/RoundHeader";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { SwipeableIndividualScoring } from "../components/formats/individual/SwipeableIndividualScoring";
import { SwipeableTeamScoring } from "../components/formats/SwipeableTeamScoring";
import { SwipeableMatchPlayScoring } from "../components/matchplay/common/SwipeableMatchPlayScoring";

export const RoundPage = () => {
  const { tourId, roundId } = useParams<{ tourId: string; roundId: string }>();
  const { data: tour, isLoading } = useTour(tourId!);

  const autoOpenedRef = useRef(false);

  const updateScore = useUpdateScore(tourId!, roundId!);
  const updateTeamScore = useUpdateTeamScore(tourId!, roundId!);
  const startRound = useStartRound(tourId!);
  const completeRound = useCompleteRound(tourId!);

  const updateMatchHole = useUpdateMatchHole(tourId!, roundId!);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCaptainPairing, setShowCaptainPairing] = useState(false);

  // Memoize round to prevent recreation on every render
  const round = useMemo(() => {
    return tour?.rounds.find((r) => r.id === roundId);
  }, [tour?.rounds, roundId]);

  const formatConfig = useMemo(() => {
    return round ? getFormatConfig(round) : null;
  }, [round]);

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

  const handleStartRound = useCallback(async () => {
    if (!round) return;
    try {
      await startRound.mutateAsync(round.id);
    } catch (error) {
      console.error("Failed to start round:", error);
    }
  }, [round?.id, startRound]);

  const handleCompleteRound = useCallback(() => {
    setShowCompleteConfirm(true);
  }, []);

  const confirmCompleteRound = useCallback(async () => {
    if (!round) return;
    try {
      await completeRound.mutateAsync(round.id);
      setShowCompleteConfirm(false);
    } catch (error) {
      console.error("Failed to complete round:", error);
    }
  }, [round?.id, completeRound]);

  const cancelCompleteRound = useCallback(() => {
    setShowCompleteConfirm(false);
  }, []);

  const handlePlayerScoreChange = useCallback(
    async (playerId: string, holeIndex: number, score: number) => {
      if (!round) return;
      const playerScore = round.scores[playerId];
      if (!playerScore) return;

      const newScores = [...playerScore.scores];
      newScores[holeIndex] = score;

      try {
        await updateScore.mutateAsync({ playerId, scores: newScores });
      } catch (error) {
        console.error("Failed to update score:", error);
      }
    },
    [round?.scores, updateScore]
  );

  const handleTeamScoreChange = useCallback(
    async (teamId: string, holeIndex: number, score: number) => {
      if (!tour || !round) return;
      const teamScore = storage.getTeamScore(tour, round.id, teamId);
      const currentScores = teamScore?.scores || new Array(round.holes).fill(0);
      const newScores = [...currentScores];
      newScores[holeIndex] = score;

      try {
        await updateTeamScore.mutateAsync({ teamId, scores: newScores });
      } catch (error) {
        console.error("Failed to update team score:", error);
      }
    },
    [tour?.id, round?.id, round?.holes, updateTeamScore]
  );

  const handleMatchHoleUpdate = useCallback(
    async (
      matchId: string,
      holeNumber: number,
      teamAScore: number,
      teamBScore: number,
      individualScores?: {
        teamA: { [playerId: string]: number };
        teamB: { [playerId: string]: number };
      }
    ) => {
      if (!round) return;
      try {
        await updateMatchHole.mutateAsync({
          matchId,
          holeNumber,
          teamAScore,
          teamBScore,
        });

        // For Four-Ball, also update individual player scores
        if (individualScores && round.format === "four-ball-match-play") {
          const allScores = {
            ...individualScores.teamA,
            ...individualScores.teamB,
          };

          for (const [playerId, score] of Object.entries(allScores)) {
            const playerScore = round.scores[playerId];
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
    },
    [round?.format, round?.scores, updateMatchHole, updateScore]
  );

  useEffect(() => {
    if (!round || !needsCaptainPairing || autoOpenedRef.current) return;

    // Fungerar både med äldre "matches" och nya "sessions"
    const hasAnyMatches = Array.isArray(round?.ryderCup?.matches)
      ? round.ryderCup!.matches.length > 0
      : round?.ryderCup?.sessions
      ? Object.values(round.ryderCup.sessions).some(
          (arr: any) => Array.isArray(arr) && arr.length > 0
        )
      : false;

    const isCreated = round.status === "created" || !round.status;

    if (isCreated && !hasAnyMatches) {
      setShowCaptainPairing(true);
      autoOpenedRef.current = true; // ⬅️ bara en gång per sidladdning
    }
  }, [round?.id, round?.status, needsCaptainPairing]);

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
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto card-spacing">
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
            <p className="text-slate-500 card-spacing">
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
      <ErrorBoundary resetKey={`${tour?.id}:${round?.id}`}>
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
        {showCaptainPairing && (
          <CaptainPairingInterface
            round={round}
            tour={tour}
            onClose={() => setShowCaptainPairing(false)}
            onPaired={() => {
              setShowCaptainPairing(false);
              autoOpenedRef.current = true; // hindra auto-open igen
            }}
          />
        )}
      </ErrorBoundary>
    );
  }

  // Active Round Interface
  return (
    <ErrorBoundary resetKey={`${tour?.id}:${round?.id}`}>
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
          {showLeaderboard && (
            <div className="card-spacing animate-fade-in w-full max-w-5xl mx-auto">
              <LiveLeaderboard tour={tour} round={round} />
            </div>
          )}

          <div className="w-full max-w-5xl mx-auto">
            {(() => {
              switch (round.format) {
                case "scramble":
                  return (
                    <SwipeableTeamScoring
                      tour={tour}
                      round={round}
                      formatName="Scramble"
                      onTeamScoreChange={handleTeamScoreChange}
                    />
                  );

                case "best-ball":
                  return (
                    <SwipeableTeamScoring
                      tour={tour}
                      round={round}
                      formatName="Best Ball"
                      onTeamScoreChange={handleTeamScoreChange}
                    />
                  );

                case "foursomes-match-play":
                case "four-ball-match-play":
                case "singles-match-play":
                  return (
                    <SwipeableMatchPlayScoring
                      tour={tour}
                      round={round}
                      onMatchHoleUpdate={handleMatchHoleUpdate}
                      onFinishRound={handleCompleteRound}
                    />
                  );

                default:
                  return (
                    <SwipeableIndividualScoring
                      tour={tour}
                      round={round}
                      onPlayerScoreChange={handlePlayerScoreChange}
                      onFinishRound={handleCompleteRound}
                    />
                  );
              }
            })()}
          </div>
        </div>

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
    </ErrorBoundary>
  );
};
