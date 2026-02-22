import { Round, Player } from "../../types/core";
import { HoleWinner } from "../../types/scoring";
import { calculateHoleWinners } from "../../lib/playerStatsUtils";

type Props = {
  round: Round;
  players: Player[];
  playerIds?: string[];
  className?: string;
};

export const HoleWinners = ({ round, players, playerIds, className = "" }: Props) => {
  const holeWinners = calculateHoleWinners(round, playerIds);

  // Create a map of player IDs to names for quick lookup
  const playerMap = new Map(players.map(p => [p.id, p.name]));

  if (holeWinners.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-lg border bg-white/5 shadow-sm ${className}`}>
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-white">Hole Winners</h3>
        <p className="text-xs text-white/50 mt-0.5">
          Best score on each hole
        </p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {holeWinners.map((winner) => (
            <div
              key={winner.holeNumber}
              className={`rounded-lg border p-3 ${
                winner.isTied
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white/70">
                  Hole {winner.holeNumber}
                </span>
                <span className={`text-lg font-bold ${
                  winner.toPar <= -2 ? 'text-red-700' :
                  winner.toPar === -1 ? 'text-red-400' :
                  winner.toPar === 0 ? 'text-white/70' :
                  'text-white/50'
                }`}>
                  {winner.score}
                </span>
              </div>

              <div className="text-[10px] text-white/50 truncate">
                {winner.isTied ? (
                  <span className="font-medium">Tied</span>
                ) : (
                  winner.winnerIds.map((id, idx) => (
                    <span key={id}>
                      {idx > 0 && ', '}
                      {playerMap.get(id) || 'Unknown'}
                    </span>
                  ))
                )}
              </div>

              <div className={`text-[10px] font-medium mt-1 ${
                winner.toPar < 0 ? 'text-red-400' :
                winner.toPar === 0 ? 'text-white/50' :
                'text-white/40'
              }`}>
                {winner.toPar === 0 ? 'Par' :
                 winner.toPar === -1 ? 'Birdie' :
                 winner.toPar <= -2 ? 'Eagle' :
                 winner.toPar === 1 ? 'Bogey' :
                 `+${winner.toPar}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
