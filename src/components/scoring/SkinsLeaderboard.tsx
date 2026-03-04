import React, { useMemo, useState } from "react";
import { Tour, Round, Player } from "../../types";
import { shortenName } from "../../lib/nameUtils";

interface SkinsLeaderboardProps {
  tour: Tour;
  round: Round;
}

interface SkinHoleResult {
  holeNumber: number;
  par: number;
  playerScores: { player: Player; score: number | null }[];
  skinValue: number;
  winnerId: string | null;
  isCarryover: boolean;
}

export const SkinsLeaderboard: React.FC<SkinsLeaderboardProps> = ({
  tour,
  round,
}) => {
  const players = tour.players;
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const holeResults = useMemo((): SkinHoleResult[] => {
    const results: SkinHoleResult[] = [];
    let carryover = 0;

    for (let i = 0; i < round.holeInfo.length; i++) {
      const hole = round.holeInfo[i];
      const skinValue = 1 + carryover;

      const playerScores = players.map((player) => {
        const scoreData = round.scores[player.id];
        const score = scoreData?.scores[i] ?? null;
        return { player, score: score && score > 0 ? score : null };
      });

      // Determine winner - lowest score wins, ties carry over
      const validScores = playerScores.filter((ps) => ps.score !== null);
      let winnerId: string | null = null;
      let isCarryover = false;

      if (validScores.length > 0) {
        const minScore = Math.min(
          ...validScores.map((ps) => ps.score as number)
        );
        const winners = validScores.filter((ps) => ps.score === minScore);

        if (winners.length === 1) {
          winnerId = winners[0].player.id;
          carryover = 0;
        } else {
          // Tie - skin carries over
          isCarryover = true;
          carryover = skinValue;
        }
      }

      results.push({
        holeNumber: hole.number,
        par: hole.par,
        playerScores,
        skinValue,
        winnerId,
        isCarryover,
      });
    }

    return results;
  }, [round.holeInfo, round.scores, players]);

  const skinsWonByPlayer = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach((p) => (counts[p.id] = 0));

    holeResults.forEach((hr) => {
      if (hr.winnerId) {
        counts[hr.winnerId] += hr.skinValue;
      }
    });

    return counts;
  }, [holeResults, players]);

  const totalSkins = useMemo(() => {
    return Object.values(skinsWonByPlayer).reduce((sum, v) => sum + v, 0);
  }, [skinsWonByPlayer]);

  const unawarded = useMemo(() => {
    const totalPossible = round.holeInfo.length;
    return totalPossible - totalSkins;
  }, [round.holeInfo.length, totalSkins]);

  const rankedPlayers = useMemo(() => {
    return [...players].sort(
      (a, b) => (skinsWonByPlayer[b.id] || 0) - (skinsWonByPlayer[a.id] || 0)
    );
  }, [players, skinsWonByPlayer]);

  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-white/50">
        No players found for this round.
      </div>
    );
  }

  const isFull18 = round.holes === 18;
  const front9 = holeResults.slice(0, 9);
  const back9 = isFull18 ? holeResults.slice(9, 18) : [];

  return (
    <div className="space-y-4">
      {/* Skins Summary */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">
          Skins Won
        </h3>
        <div className="space-y-2">
          {rankedPlayers.map((player, idx) => {
            const won = skinsWonByPlayer[player.id];
            const percentage =
              round.holeInfo.length > 0
                ? (won / round.holeInfo.length) * 100
                : 0;

            return (
              <div key={player.id} className="flex items-center gap-3">
                <div className="w-6 text-right text-sm font-semibold text-white/50">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white truncate">
                      {shortenName(player.name)}
                    </span>
                    <span className="text-sm font-bold text-white ml-2">
                      {won}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500 bg-amber-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {unawarded > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-6" />
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm font-medium text-white/40">
                  Carryover
                </span>
                <span className="text-sm font-bold text-white/40">
                  {unawarded}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hole-by-hole results */}
      <SkinsHoleTable
        title={isFull18 ? "Front 9" : "Holes"}
        holes={front9}
        players={players}
        expandedSection={expandedSection}
        onToggle={() =>
          setExpandedSection(
            expandedSection === "front" ? null : "front"
          )
        }
        sectionKey="front"
      />
      {isFull18 && back9.length > 0 && (
        <SkinsHoleTable
          title="Back 9"
          holes={back9}
          players={players}
          expandedSection={expandedSection}
          onToggle={() =>
            setExpandedSection(
              expandedSection === "back" ? null : "back"
            )
          }
          sectionKey="back"
        />
      )}
    </div>
  );
};

// Sub-component for hole-by-hole skins table
interface SkinsHoleTableProps {
  title: string;
  holes: SkinHoleResult[];
  players: Player[];
  expandedSection: string | null;
  onToggle: () => void;
  sectionKey: string;
}

const SkinsHoleTable: React.FC<SkinsHoleTableProps> = ({
  title,
  holes,
  players,
  expandedSection,
  onToggle,
  sectionKey,
}) => {
  const isExpanded = expandedSection === sectionKey;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-2"
      >
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wide">
          {title}
        </h3>
        <svg
          className={`w-4 h-4 text-white/30 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Compact view - always visible */}
      <div className="flex flex-wrap gap-1.5">
        {holes.map((hr) => {
          const winner = hr.winnerId
            ? players.find((p) => p.id === hr.winnerId)
            : null;

          return (
            <div
              key={hr.holeNumber}
              className={`flex flex-col items-center justify-center rounded-lg border px-2 py-1.5 min-w-[36px] ${
                hr.winnerId
                  ? "border-amber-500/40 bg-amber-500/15"
                  : hr.isCarryover
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-white/10 bg-white/5"
              }`}
            >
              <span className="text-[10px] text-white/40 leading-none">
                {hr.holeNumber}
              </span>
              {hr.winnerId && winner ? (
                <span className="text-xs font-bold text-amber-400 leading-tight mt-0.5 truncate max-w-[48px]">
                  {shortenName(winner.name)}
                </span>
              ) : hr.isCarryover ? (
                <span className="text-[10px] font-medium text-red-400 leading-tight mt-0.5">
                  C/O
                </span>
              ) : (
                <span className="text-xs text-white/20 leading-tight mt-0.5">
                  –
                </span>
              )}
              {hr.skinValue > 1 && (
                <span className="text-[9px] text-amber-300/70 leading-none mt-0.5">
                  x{hr.skinValue}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded view - full table */}
      {isExpanded && (
        <div className="overflow-x-auto -mx-4 px-4 mt-3 border-t border-white/10 pt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/40 font-medium py-2 pr-2 sticky left-0 bg-slate-950">
                  Hole
                </th>
                {holes.map((hr) => (
                  <th
                    key={hr.holeNumber}
                    className="text-center text-white/40 font-medium py-2 px-1 min-w-[32px]"
                  >
                    {hr.holeNumber}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-white/10">
                <td className="text-left text-white/30 font-medium py-1 pr-2 text-xs sticky left-0 bg-slate-950">
                  Par
                </td>
                {holes.map((hr) => (
                  <td
                    key={hr.holeNumber}
                    className="text-center text-white/30 py-1 px-1 text-xs"
                  >
                    {hr.par}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-white/10">
                <td className="text-left text-amber-400/60 font-medium py-1 pr-2 text-xs sticky left-0 bg-slate-950">
                  Skins
                </td>
                {holes.map((hr) => (
                  <td
                    key={hr.holeNumber}
                    className={`text-center py-1 px-1 text-xs font-bold ${
                      hr.skinValue > 1
                        ? "text-amber-400"
                        : "text-white/30"
                    }`}
                  >
                    {hr.skinValue}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-b border-white/5">
                  <td className="py-2 pr-2 sticky left-0 bg-slate-950">
                    <span className="text-white text-xs font-medium truncate block max-w-[80px]">
                      {shortenName(player.name)}
                    </span>
                  </td>
                  {holes.map((hr) => {
                    const ps = hr.playerScores.find(
                      (s) => s.player.id === player.id
                    );
                    const score = ps?.score;
                    const isWinner = hr.winnerId === player.id;

                    return (
                      <td
                        key={hr.holeNumber}
                        className="text-center py-2 px-1"
                      >
                        {score !== null && score !== undefined ? (
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              isWinner
                                ? "bg-amber-500 text-white"
                                : "text-white/50"
                            }`}
                          >
                            {score}
                          </span>
                        ) : (
                          <span className="text-white/20">–</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
