import { useMemo } from "react";
import { Tour, Player, Round } from "../../types/core";
import { storage } from "../../lib/storage";
import { isRoundCompleted } from "../../lib/roundUtils";
import { calculateDetailedPlayerStats } from "../../lib/playerStatsUtils";
import PlayerScorecardHeader from "./PlayerScorecardHeader";
import PlayerScoreGrid9 from "./PlayerScoreGrid9";
import { RoundStatistics } from "./RoundStatistics";
import { PlayerClaimButton } from "./PlayerClaimButton";

type Props = {
  tour: Tour;
  player: Player;
  isExpanded?: boolean;
  onToggle?: () => void;
  className?: string;
  hideClaimButton?: boolean;
};

export const PlayerScorecard = ({
  tour,
  player,
  isExpanded = false,
  onToggle,
  className = "",
  hideClaimButton = false,
}: Props) => {
  const playerRounds = useMemo(() => {
    return (tour.rounds || []).filter((round) => {
      const s = round.scores?.[player.id];
      return (
        !!s &&
        (s.totalScore > 0 ||
          (s.scores ?? []).some((v) => typeof v === "number" && v > 0))
      );
    });
  }, [tour.rounds, player.id]);

  const totalStrokes = useMemo(() => {
    return playerRounds.reduce((sum, r) => {
      const s = r.scores?.[player.id];
      return sum + (s?.totalScore && s.totalScore > 0 ? s.totalScore : 0);
    }, 0);
  }, [playerRounds, player.id]);

  const tournamentStableford = useMemo(() => {
    try {
      return storage.calculateTournamentStableford(tour, player.id);
    } catch {
      return undefined;
    }
  }, [tour, player.id]);

  const liveStableford = useMemo(() => {
    try {
      return (tour.rounds || []).reduce(
        (sum, r) => sum + storage.calculateStablefordForPlayer(r, player.id),
        0
      );
    } catch {
      return undefined;
    }
  }, [tour, player.id]);

  const displayedStableford = useMemo(() => {
    const hasCompleted = (tour.rounds || []).some(
      (r) => r?.status === "completed" || !!r?.completedAt
    );
    if (
      typeof tournamentStableford === "number" &&
      (tournamentStableford > 0 || hasCompleted)
    ) {
      return tournamentStableford;
    }
    return typeof liveStableford === "number" ? liveStableford : undefined;
  }, [tour.rounds, tournamentStableford, liveStableford]);

  return (
    <div className={`w-full ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left relative active:scale-100"
      >
        <PlayerScorecardHeader
          playerName={player.name}
          totalStrokes={totalStrokes}
          stableford={
            typeof displayedStableford === "number"
              ? displayedStableford
              : undefined
          }
        />
      </button>

      {!hideClaimButton && (
        <div className="px-4 py-3 border-t border-slate-200">
          <PlayerClaimButton
            tourId={tour.id}
            player={player}
            allPlayers={tour.players}
          />
        </div>
      )}

      {isExpanded && (
        <div className="space-y-4">
          {playerRounds.map((round) => {
            const holesCount =
              (typeof round.holes === "number" && round.holes > 0
                ? round.holes
                : (round as any).holeInfo?.length) ?? 18;

            const pars: number[] = Array.from(
              { length: holesCount },
              (_, i) => {
                const par = (round as any).holeInfo?.[i]?.par ?? 4;
                return typeof par === "number" ? par : 4;
              }
            );

            const si: number[] = Array.from({ length: holesCount }, (_, i) => {
              const idx =
                (round as any).holeInfo?.[i]?.index ??
                (round as any).holeInfo?.[i]?.hcp ??
                i + 1;
              return typeof idx === "number" ? idx : i + 1;
            });

            const scores: (number | null)[] =
              round.scores?.[player.id]?.scores?.slice(0, holesCount) ?? [];

            // Calculate detailed statistics for this round
            const roundStats = calculateDetailedPlayerStats(round, player.id);

            return (
              <div
                key={round.id}
                className="rounded-xl border bg-white shadow-sm"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">
                      {round.name || "Round"}
                    </div>
                    {!isRoundCompleted(round) ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        In progress
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600">
                    Total strokes:{" "}
                    <span className="font-semibold">
                      {(() => {
                        const s = round.scores?.[player.id]?.totalScore;
                        return s && s > 0 ? s : "—";
                      })()}
                    </span>
                  </div>
                </div>

                <div className="p-3 flex flex-col gap-3">
                  <PlayerScoreGrid9
                    title="Front 9"
                    start={0}
                    pars={pars}
                    si={si}
                    scores={scores}
                    holesCount={holesCount}
                  />
                  {holesCount > 9 && (
                    <PlayerScoreGrid9
                      title="Back 9"
                      start={9}
                      pars={pars}
                      si={si}
                      scores={scores}
                      holesCount={holesCount}
                    />
                  )}

                  {/* Display detailed statistics if available */}
                  {roundStats && (
                    <RoundStatistics stats={roundStats} className="mt-2" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
