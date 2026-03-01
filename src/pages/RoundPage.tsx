import { useState, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTour } from "../hooks/useTours";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  useUpdateScore,
  useStartRound,
  useCompleteRound,
  useUpdateTeamScore,
} from "../hooks/useScoring";
import { useUpdateMatchHole } from "../hooks/useMatchPlay";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { getFormatConfig } from "../lib/roundFormatManager";
import { storage } from "../lib/storage";
import { PreRoundComponent } from "../components/rounds/PreRoundComponent";
import { RoundHeader } from "../components/rounds/RoundHeader";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { SwipeableIndividualScoring } from "../components/formats/individual/SwipeableIndividualScoring";
import { SwipeableTeamScoring } from "../components/formats/SwipeableTeamScoring";
import { SwipeableMatchPlayScoring } from "../components/matchplay/common/SwipeableMatchPlayScoring";
import { BottomNav } from "../components/BottomNav";
import { Home, Users, ClipboardList, Trophy } from "lucide-react";

export const RoundPage = () => {
  const { tourId, roundId } = useParams<{ tourId: string; roundId: string }>();
  const { data: tour, isLoading } = useTour(tourId!);

  const navigate = useNavigate();

  const updateScore = useUpdateScore(tourId!, roundId!);
  const updateTeamScore = useUpdateTeamScore(tourId!, roundId!);
  const startRound = useStartRound(tourId!);
  const completeRound = useCompleteRound(tourId!);

  const updateMatchHole = useUpdateMatchHole(tourId!, roundId!);

  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Memoize round to prevent recreation on every render
  const round = useMemo(() => {
    return tour?.rounds.find((r) => r.id === roundId);
  }, [tour?.rounds, roundId]);

  useDocumentTitle(round ? `${round.name} - ${tour?.name}` : "Round");

  const formatConfig = useMemo(() => {
    return round ? getFormatConfig(round) : null;
  }, [round]);

  const tabs = useMemo(
    () => [
      {
        id: "home",
        label: "Home",
        icon: <Home className="w-5 h-5" />,
        path: "/",
      },
      {
        id: "players",
        label: "Players",
        icon: <Users className="w-5 h-5" />,
        path: `/tour/${tourId}`,
      },
      {
        id: "rounds",
        label: "Rounds",
        icon: <ClipboardList className="w-5 h-5" />,
        path: `/tour/${tourId}/rounds`,
      },
      {
        id: "leaderboard",
        label: "Leaderboard",
        icon: <Trophy className="w-5 h-5" />,
        path: `/tour/${tourId}/leaderboard`,
      },
    ],
    [tourId],
  );

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
    async (playerId: string, holeIndex: number, score: number | null) => {
      if (!round) return;
      const playerScore = round.scores[playerId];
      const currentScores =
        playerScore?.scores || new Array(round.holes).fill(null);

      const newScores = [...currentScores];
      newScores[holeIndex] = score;

      try {
        await updateScore.mutateAsync({ playerId, scores: newScores });
      } catch (error) {
        console.error("Failed to update score:", error);
      }
    },
    [round?.scores, round?.holes, updateScore],
  );

  const handleTeamScoreChange = useCallback(
    async (teamId: string, holeIndex: number, score: number) => {
      if (!tour || !round) return;
      const teamScore = storage.getTeamScore(tour.id, round.id, teamId);
      const currentScores = teamScore?.scores || new Array(round.holes).fill(0);
      const newScores = [...currentScores];
      newScores[holeIndex] = score;

      try {
        await updateTeamScore.mutateAsync({ teamId, scores: newScores });
      } catch (error) {
        console.error("Failed to update team score:", error);
      }
    },
    [tour?.id, round?.id, round?.holes, updateTeamScore],
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
      },
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
    [round?.format, round?.scores, updateMatchHole, updateScore],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-8 h-8 text-emerald-400"
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
          <div className="text-lg font-semibold text-white/70">
            Loading Tournament Round...
          </div>
          <div className="text-white/40 mt-1">Preparing scoring interface</div>
        </div>
      </div>
    );
  }

  // Error State
  if (!tour || !round || !formatConfig) {
    return (
      <div className="min-h-screen safe-area-top">
        <div className="p-6 w-full max-w-6xl mx-auto">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-red-500/15 rounded-full flex items-center justify-center mx-auto card-spacing">
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
            <h3 className="text-xl font-semibold text-white/70 mb-3">
              Round Not Found
            </h3>
            <p className="text-white/40 card-spacing">
              The tournament round you're looking for doesn't exist or has been
              removed.
            </p>
            <Link to={`/tour/${tourId}/rounds`} className="btn-primary">
              Back to Tournament
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            needsCaptainPairing
              ? () => navigate(`/tour/${tourId}/round/${roundId}/pairing`)
              : undefined
          }
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary resetKey={`${tour?.id}:${round?.id}`}>
      <div className="min-h-screen safe-area-bottom">
        <RoundHeader
          tour={tour}
          round={round}
          formatConfig={formatConfig}
          onCompleteRound={handleCompleteRound}
        />

        <div className="pb-24 w-full max-w-6xl mx-auto">
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
        <BottomNav tabs={tabs} />
      </div>
    </ErrorBoundary>
  );
};
