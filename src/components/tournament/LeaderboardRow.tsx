import { LeaderboardEntry } from "../../types";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  index: number;
  hasSomeStableford: boolean;
  isMatchPlay: boolean;
  hasHandicaps: boolean;
  isPointsPerRound?: boolean;
  view: "overall" | "current-round" | "by-round";
  roundsToInclude: any[];
  stablefordPoints: number;
  matchesWon: number;
}

/** Format to-par score like TV broadcasts: E for even, -3 in red, +2 in blue */
const formatToPar = (toPar: number): string => {
  if (toPar === 0) return "E";
  return toPar > 0 ? `+${toPar}` : `${toPar}`;
};

/** Get the CSS class for a to-par score */
const getToParClass = (toPar: number): string => {
  if (toPar < 0) return "lb-score-under";
  if (toPar > 0) return "lb-score-over";
  return "lb-score-even";
};

export const LeaderboardRow = ({
  entry,
  index,
  hasSomeStableford,
  isMatchPlay,
  hasHandicaps,
  isPointsPerRound = false,
  view,
  roundsToInclude,
}: LeaderboardRowProps) => {
  const posClass =
    index === 0
      ? "lb-pos-1"
      : index === 1
        ? "lb-pos-2"
        : index === 2
          ? "lb-pos-3"
          : "";

  const rowClass =
    index === 0
      ? "lb-row-leader"
      : index === 1
        ? "lb-row-2"
        : index === 2
          ? "lb-row-3"
          : "";

  const moveClass =
    entry.positionChange !== undefined && entry.positionChange > 0
      ? "lb-move-up"
      : entry.positionChange !== undefined && entry.positionChange < 0
        ? "lb-move-down"
        : "";

  // Determine the primary score display
  const displayScore = hasHandicaps
    ? (entry.netScore ?? entry.totalScore)
    : entry.totalScore;

  const toPar =
    hasHandicaps && entry.netToPar !== undefined
      ? entry.netToPar
      : entry.totalToPar;

  // "Thru X holes" for active rounds
  const getThruHoles = () => {
    if (view !== "current-round") return null;
    const activeRound = roundsToInclude[0];
    if (!activeRound || activeRound.status !== "in-progress") return null;
    const playerScores = activeRound.scores[entry.player.id];
    if (!playerScores) return null;
    const holesCompleted = playerScores.scores.filter(
      (score: number | null) => score !== null && score > 0
    ).length;
    if (holesCompleted > 0 && holesCompleted < 18) return holesCompleted;
    return null;
  };

  const thruHoles = getThruHoles();

  return (
    <div className={`lb-row ${rowClass} ${moveClass}`}>
      {/* Position */}
      <div className={`lb-pos ${posClass}`}>
        {entry.position}
      </div>

      {/* Position change arrow */}
      <div className="w-5 flex-shrink-0 text-center">
        {entry.positionChange !== undefined && entry.positionChange !== 0 ? (
          <div
            className={`text-xs font-bold flex items-center justify-center ${
              entry.positionChange > 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            <svg
              className={`w-3 h-3 ${entry.positionChange < 0 ? "rotate-180" : ""}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[10px]">{Math.abs(entry.positionChange)}</span>
          </div>
        ) : entry.positionChange === 0 ? (
          <span className="text-white/20 text-xs">-</span>
        ) : null}
      </div>

      {/* Player name and meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-white text-sm sm:text-base truncate">
            {entry.player.name}
          </span>
          {entry.isCaptain && (
            <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
          {index === 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/15 px-1.5 py-0.5 rounded flex-shrink-0">
              Leader
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] sm:text-xs text-white/40 mt-0.5">
          {entry.player.handicap !== undefined && (
            <span>HC {entry.player.handicap}</span>
          )}
          {entry.team && (
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: entry.team.color }}
              />
              {entry.team.name}
            </span>
          )}
          {thruHoles && (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Thru {thruHoles}
            </span>
          )}
          {!thruHoles && (
            <span>
              {entry.roundsPlayed} R{entry.roundsPlayed !== 1 ? "ds" : "d"}
            </span>
          )}
        </div>
      </div>

      {/* Score section - right aligned */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 text-right">
        {isPointsPerRound && view === "overall" ? (
          <>
            <div className="min-w-[40px]">
              <div className="text-lg sm:text-xl font-bold text-amber-400">
                {entry.tournamentPoints ?? 0}
              </div>
              <div className="text-[10px] text-white/30 uppercase">Pts</div>
            </div>
            <div className="min-w-[36px] text-white/40">
              <div className="text-sm font-medium">{entry.totalScore}</div>
              <div className="text-[10px]">Strk</div>
            </div>
          </>
        ) : hasSomeStableford ? (
          <>
            <div className="min-w-[40px]">
              <div className="text-lg sm:text-xl font-bold text-emerald-400">
                {entry.tournamentPoints ?? displayScore}
              </div>
              <div className="text-[10px] text-white/30 uppercase">Stb</div>
            </div>
            <div className="min-w-[36px] text-white/40">
              <div className="text-sm font-medium">{entry.totalScore}</div>
              <div className="text-[10px]">Strk</div>
            </div>
          </>
        ) : isMatchPlay ? (
          <div className="min-w-[40px]">
            <div className="text-lg sm:text-xl font-bold text-white">
              {entry.totalScore}
            </div>
            <div className="text-[10px] text-white/30 uppercase">Won</div>
          </div>
        ) : (
          <>
            {/* To Par (the big number like TV) */}
            <div className="min-w-[44px]">
              <div className={`text-lg sm:text-xl font-bold ${getToParClass(toPar)}`}>
                {formatToPar(toPar)}
              </div>
              <div className="text-[10px] text-white/30 uppercase">
                {hasHandicaps ? "Net" : "Par"}
              </div>
            </div>
            {/* Total strokes */}
            <div className="min-w-[36px] text-white/40">
              <div className="text-sm font-medium">{displayScore}</div>
              <div className="text-[10px]">
                {hasHandicaps && entry.handicapStrokes
                  ? `(-${entry.handicapStrokes})`
                  : "Strk"}
              </div>
            </div>
            {/* Today's score */}
            {view === "overall" && entry.currentRoundScore !== undefined && (
              <div className="min-w-[36px] border-l border-white/10 pl-3">
                <div
                  className={`text-sm font-medium ${
                    entry.currentRoundToPar !== undefined
                      ? getToParClass(entry.currentRoundToPar)
                      : "text-white/50"
                  }`}
                >
                  {entry.currentRoundToPar !== undefined
                    ? formatToPar(entry.currentRoundToPar)
                    : entry.currentRoundScore}
                </div>
                <div className="text-[10px] text-white/30">Today</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
