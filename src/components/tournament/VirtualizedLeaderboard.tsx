import { useRef, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LeaderboardEntry } from "../../types";
import { LeaderboardRow } from "./LeaderboardRow";

interface VirtualizedLeaderboardProps {
  entries: LeaderboardEntry[];
  hasSomeStableford: boolean;
  isMatchPlay: boolean;
  hasHandicaps: boolean;
  view: "overall" | "current-round" | "by-round";
  roundsToInclude: any[];
  playerStablefordPoints: Map<string, number>;
  playerMatchesWon: Map<string, number>;
  isPointsPerRound?: boolean;
}

/**
 * Virtualized leaderboard for large player lists
 * Only renders visible entries for better performance
 */
const VirtualizedLeaderboardComponent = ({
  entries,
  hasSomeStableford,
  isMatchPlay,
  hasHandicaps,
  view,
  roundsToInclude,
  playerStablefordPoints,
  playerMatchesWon,
  isPointsPerRound = false,
}: VirtualizedLeaderboardProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
      {/* Column headers */}
      <div className="flex items-center gap-3 px-3 py-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/30 border-b border-white/10 bg-white/[0.03]">
        <div className="w-8 text-center">Pos</div>
        <div className="w-5" />
        <div className="flex-1">Player</div>
        {isPointsPerRound && view === "overall" ? (
          <>
            <div className="min-w-[40px] text-right">Pts</div>
            <div className="min-w-[36px] text-right">Strk</div>
          </>
        ) : hasSomeStableford ? (
          <>
            <div className="min-w-[40px] text-right">Stb</div>
            <div className="min-w-[36px] text-right">Strk</div>
          </>
        ) : isMatchPlay ? (
          <div className="min-w-[40px] text-right">Won</div>
        ) : (
          <>
            <div className="min-w-[44px] text-right">
              {hasHandicaps ? "Net" : "Par"}
            </div>
            <div className="min-w-[36px] text-right">Strk</div>
          </>
        )}
      </div>

      <div
        ref={parentRef}
        className="max-h-[800px] overflow-y-auto"
        style={{ contain: "strict" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const entry = entries[virtualItem.index];
            const index = virtualItem.index;

            return (
              <div
                key={entry.player.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <LeaderboardRow
                  entry={entry}
                  index={index}
                  hasSomeStableford={hasSomeStableford}
                  isMatchPlay={isMatchPlay}
                  hasHandicaps={hasHandicaps}
                  isPointsPerRound={isPointsPerRound}
                  view={view}
                  roundsToInclude={roundsToInclude}
                  stablefordPoints={
                    playerStablefordPoints.get(entry.player.id) || 0
                  }
                  matchesWon={playerMatchesWon.get(entry.player.id) || 0}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const VirtualizedLeaderboard = memo(VirtualizedLeaderboardComponent);
