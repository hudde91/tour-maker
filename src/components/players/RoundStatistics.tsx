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
      <div className="rounded-lg border bg-slate-50 p-3">
        <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
          Scoring Breakdown
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {eagleOrBetter > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{eagleOrBetter}</div>
              <div className="text-[10px] text-slate-600">Eagle+</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{birdieCount}</div>
            <div className="text-[10px] text-slate-600">Birdie</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-700">{parCount}</div>
            <div className="text-[10px] text-slate-600">Par</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-500">{bogeyCount}</div>
            <div className="text-[10px] text-slate-600">Bogey</div>
          </div>
          {doubleBogeyOrWorse > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-600">{doubleBogeyOrWorse}</div>
              <div className="text-[10px] text-slate-600">Double+</div>
            </div>
          )}
        </div>
      </div>

      {/* Front 9 vs Back 9 */}
      {front9.holesPlayed > 0 && back9.holesPlayed > 0 && (
        <div className="rounded-lg border bg-slate-50 p-3">
          <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
            9-Hole Performance
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-600 mb-1">Front 9</div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-900">{front9.score}</span>
                <span className={`text-sm font-medium ${
                  front9.toPar < 0 ? 'text-red-600' :
                  front9.toPar === 0 ? 'text-slate-600' :
                  'text-slate-500'
                }`}>
                  {front9.toPar === 0 ? 'E' : front9.toPar > 0 ? `+${front9.toPar}` : front9.toPar}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {front9.birdies}B · {front9.pars}P · {front9.bogeys}Bo
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 mb-1">Back 9</div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-900">{back9.score}</span>
                <span className={`text-sm font-medium ${
                  back9.toPar < 0 ? 'text-red-600' :
                  back9.toPar === 0 ? 'text-slate-600' :
                  'text-slate-500'
                }`}>
                  {back9.toPar === 0 ? 'E' : back9.toPar > 0 ? `+${back9.toPar}` : back9.toPar}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {back9.birdies}B · {back9.pars}P · {back9.bogeys}Bo
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Best/Worst Holes & Streak */}
      <div className="grid grid-cols-1 gap-2">
        {bestHole && (
          <div className="rounded-lg border bg-emerald-50 border-emerald-200 p-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-emerald-900">Best Hole</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-700">Hole {bestHole.holeNumber}</span>
                <span className="text-sm font-bold text-emerald-900">{bestHole.score}</span>
                <span className="text-xs text-emerald-700">
                  ({bestHole.toPar === 0 ? 'E' : bestHole.toPar > 0 ? `+${bestHole.toPar}` : bestHole.toPar})
                </span>
              </div>
            </div>
          </div>
        )}

        {worstHole && (
          <div className="rounded-lg border bg-slate-50 border-slate-200 p-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-700">Worst Hole</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Hole {worstHole.holeNumber}</span>
                <span className="text-sm font-bold text-slate-900">{worstHole.score}</span>
                <span className="text-xs text-slate-600">
                  ({worstHole.toPar === 0 ? 'E' : worstHole.toPar > 0 ? `+${worstHole.toPar}` : worstHole.toPar})
                </span>
              </div>
            </div>
          </div>
        )}

        {currentStreak.type !== 'none' && currentStreak.length > 1 && (
          <div className={`rounded-lg border p-2 ${
            currentStreak.type === 'birdie' || currentStreak.type === 'under-par'
              ? 'bg-blue-50 border-blue-200'
              : currentStreak.type === 'par'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`text-xs font-medium ${
                currentStreak.type === 'birdie' || currentStreak.type === 'under-par'
                  ? 'text-blue-900'
                  : currentStreak.type === 'par'
                  ? 'text-slate-700'
                  : 'text-orange-900'
              }`}>
                Current Streak
              </div>
              <div className={`text-sm font-bold ${
                currentStreak.type === 'birdie' || currentStreak.type === 'under-par'
                  ? 'text-blue-900'
                  : currentStreak.type === 'par'
                  ? 'text-slate-900'
                  : 'text-orange-900'
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
