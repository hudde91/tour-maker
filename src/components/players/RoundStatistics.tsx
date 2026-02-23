import { DetailedPlayerStats } from "../../types/scoring";
import { formatStreak } from "../../lib/playerStatsUtils";

type Props = {
  stats: DetailedPlayerStats;
  className?: string;
};

export const RoundStatistics = ({ stats, className = "" }: Props) => {
  const {
    birdieCount,
    parCount,
    bogeyCount,
    doubleBogeyOrWorse,
    eagleOrBetter,
    bestHole,
    worstHole,
    currentStreak,
    front9,
    back9
  } = stats;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Scoring Breakdown */}
      <div className="rounded-lg border p-3">
        <h4 className="text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">
          Scoring Breakdown
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {eagleOrBetter > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{eagleOrBetter}</div>
              <div className="text-[10px] text-white/50">Eagle+</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{birdieCount}</div>
            <div className="text-[10px] text-white/50">Birdie</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white/70">{parCount}</div>
            <div className="text-[10px] text-white/50">Par</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white/40">{bogeyCount}</div>
            <div className="text-[10px] text-white/50">Bogey</div>
          </div>
          {doubleBogeyOrWorse > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-white/50">{doubleBogeyOrWorse}</div>
              <div className="text-[10px] text-white/50">Double+</div>
            </div>
          )}
        </div>
      </div>

      {/* Front 9 vs Back 9 */}
      {front9.holesPlayed > 0 && back9.holesPlayed > 0 && (
        <div className="rounded-lg border p-3">
          <h4 className="text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">
            9-Hole Performance
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-white/50 mb-1">Front 9</div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white">{front9.score}</span>
                <span className={`text-sm font-medium ${
                  front9.toPar < 0 ? 'text-red-400' :
                  front9.toPar === 0 ? 'text-white/50' :
                  'text-white/40'
                }`}>
                  {front9.toPar === 0 ? 'E' : front9.toPar > 0 ? `+${front9.toPar}` : front9.toPar}
                </span>
              </div>
              <div className="text-[10px] text-white/40 mt-1">
                {front9.birdies}B · {front9.pars}P · {front9.bogeys}Bo
              </div>
            </div>
            <div>
              <div className="text-xs text-white/50 mb-1">Back 9</div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white">{back9.score}</span>
                <span className={`text-sm font-medium ${
                  back9.toPar < 0 ? 'text-red-400' :
                  back9.toPar === 0 ? 'text-white/50' :
                  'text-white/40'
                }`}>
                  {back9.toPar === 0 ? 'E' : back9.toPar > 0 ? `+${back9.toPar}` : back9.toPar}
                </span>
              </div>
              <div className="text-[10px] text-white/40 mt-1">
                {back9.birdies}B · {back9.pars}P · {back9.bogeys}Bo
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Best/Worst Holes & Streak */}
      <div className="grid grid-cols-1 gap-2">
        {bestHole && (
          <div className="rounded-lg border bg-emerald-500/15 border-emerald-500/30 p-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-emerald-400">Best Hole</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400">Hole {bestHole.holeNumber}</span>
                <span className="text-sm font-bold text-emerald-400">{bestHole.score}</span>
                <span className="text-xs text-emerald-400">
                  ({bestHole.toPar === 0 ? 'E' : bestHole.toPar > 0 ? `+${bestHole.toPar}` : bestHole.toPar})
                </span>
              </div>
            </div>
          </div>
        )}

        {worstHole && (
          <div className="rounded-lg border border-white/10 p-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-white/70">Worst Hole</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Hole {worstHole.holeNumber}</span>
                <span className="text-sm font-bold text-white">{worstHole.score}</span>
                <span className="text-xs text-white/50">
                  ({worstHole.toPar === 0 ? 'E' : worstHole.toPar > 0 ? `+${worstHole.toPar}` : worstHole.toPar})
                </span>
              </div>
            </div>
          </div>
        )}

        {currentStreak.type !== 'none' && currentStreak.length > 1 && (
          <div className={`rounded-lg border p-2 ${
            currentStreak.type === 'birdie' || currentStreak.type === 'under-par'
              ? 'bg-blue-500/15 border-blue-500/30'
              : currentStreak.type === 'par'
              ? 'border-white/10'
              : 'bg-orange-500/15 border-orange-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`text-xs font-medium ${
                currentStreak.type === 'birdie' || currentStreak.type === 'under-par'
                  ? 'text-blue-400'
                  : currentStreak.type === 'par'
                  ? 'text-white/70'
                  : 'text-orange-400'
              }`}>
                Current Streak
              </div>
              <div className={`text-sm font-bold ${
                currentStreak.type === 'birdie' || currentStreak.type === 'under-par'
                  ? 'text-blue-400'
                  : currentStreak.type === 'par'
                  ? 'text-white'
                  : 'text-orange-400'
              }`}>
                {formatStreak(currentStreak)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
