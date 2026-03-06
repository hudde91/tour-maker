import React, { useMemo } from "react";
import { Tour, Round, Team } from "../../types";
import { BroadcastHeader } from "../tournament/BroadcastHeader";

interface TeamRoundLeaderboardProps {
  tour: Tour;
  round: Round;
}

interface HoleResult {
  holeNumber: number;
  par: number;
  teamScores: { team: Team; score: number | null }[];
  winningTeamIds: string[];
  isTied: boolean;
}

export const TeamRoundLeaderboard: React.FC<TeamRoundLeaderboardProps> = ({
  tour,
  round,
}) => {
  const teams = tour.teams || [];

  const holeResults = useMemo((): HoleResult[] => {
    return round.holeInfo.map((hole, index) => {
      const teamScores = teams.map((team) => {
        const scoreData = round.scores[`team_${team.id}`];
        const score = scoreData?.scores[index] ?? null;
        return { team, score: score && score > 0 ? score : null };
      });

      // Determine winner(s) - lowest score wins
      const validScores = teamScores.filter((ts) => ts.score !== null);
      let winningTeamIds: string[] = [];
      let isTied = false;

      if (validScores.length > 0) {
        const minScore = Math.min(
          ...validScores.map((ts) => ts.score as number)
        );
        const winners = validScores.filter((ts) => ts.score === minScore);
        if (winners.length === 1) {
          winningTeamIds = [winners[0].team.id];
        } else if (winners.length > 1 && winners.length < validScores.length) {
          isTied = true;
          winningTeamIds = winners.map((w) => w.team.id);
        } else if (winners.length === validScores.length && validScores.length > 1) {
          isTied = true;
          winningTeamIds = [];
        }
      }

      return {
        holeNumber: hole.number,
        par: hole.par,
        teamScores,
        winningTeamIds,
        isTied,
      };
    });
  }, [round.holeInfo, round.scores, teams]);

  const holesWonByTeam = useMemo(() => {
    const counts: Record<string, number> = {};
    teams.forEach((t) => (counts[t.id] = 0));
    let tiedCount = 0;

    holeResults.forEach((hr) => {
      if (hr.winningTeamIds.length === 1) {
        counts[hr.winningTeamIds[0]]++;
      } else if (hr.isTied) {
        tiedCount++;
      }
    });

    return { counts, tiedCount };
  }, [holeResults, teams]);

  const totalStrokesByTeam = useMemo(() => {
    const totals: Record<string, number> = {};
    teams.forEach((team) => {
      const scoreData = round.scores[`team_${team.id}`];
      totals[team.id] = scoreData?.totalScore || 0;
    });
    return totals;
  }, [round.scores, teams]);

  if (teams.length === 0) {
    return (
      <div className="text-center py-8 text-white/50">
        No teams found for this round.
      </div>
    );
  }

  // Split into front 9 and back 9 for 18-hole rounds
  const isFull18 = round.holes === 18;
  const front9 = holeResults.slice(0, 9);
  const back9 = isFull18 ? holeResults.slice(9, 18) : [];

  // Sort teams by total strokes for the standings
  const sortedTeams = [...teams].sort(
    (a, b) => (totalStrokesByTeam[a.id] || 0) - (totalStrokesByTeam[b.id] || 0)
  );

  const isLive = round.status === "in-progress";

  return (
    <div className="space-y-4">
      {/* Team Standings - Broadcast Style */}
      <div className="leaderboard-broadcast">
        <BroadcastHeader
          tournamentName={round.name || "Team Standings"}
          subtitle={round.courseName || "Team scoring"}
          isLive={isLive}
        />

        <div className="rounded-b-xl border border-t-0 border-white/10 overflow-hidden bg-white/[0.02]">
          {/* Column headers */}
          <div className="flex items-center gap-3 px-3 py-2 sm:px-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/30 border-b border-white/10 bg-white/[0.03]">
            <div className="w-8 text-center">Pos</div>
            <div className="flex-1">Team</div>
            <div className="min-w-[40px] text-right">Won</div>
            <div className="min-w-[36px] text-right">Strk</div>
          </div>

          {/* Team rows */}
          {sortedTeams.map((team, index) => {
            const won = holesWonByTeam.counts[team.id];
            const strokes = totalStrokesByTeam[team.id] || 0;
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

            return (
              <div key={team.id} className={`lb-row ${rowClass}`}>
                <div className={`lb-pos ${posClass}`}>{index + 1}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="font-semibold text-white text-sm sm:text-base truncate">
                      {team.name}
                    </span>
                    {index === 0 && strokes > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/15 px-1.5 py-0.5 rounded flex-shrink-0">
                        Leader
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 text-right">
                  <div className="min-w-[40px]">
                    <div className="text-lg sm:text-xl font-bold text-emerald-400">
                      {won}
                    </div>
                    <div className="text-[10px] text-white/30 uppercase">Won</div>
                  </div>
                  <div className="min-w-[36px] text-white/40">
                    <div className="text-sm font-medium">{strokes || "–"}</div>
                    <div className="text-[10px]">Strk</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tied holes indicator */}
          {holesWonByTeam.tiedCount > 0 && (
            <div className="text-center py-2 text-xs text-white/30 border-t border-white/10 bg-white/[0.02]">
              {holesWonByTeam.tiedCount} hole{holesWonByTeam.tiedCount !== 1 ? "s" : ""} tied
            </div>
          )}
        </div>
      </div>

      {/* Hole-by-hole results */}
      <HoleResultsTable
        title={isFull18 ? "Front 9" : "Holes"}
        holes={front9}
        teams={teams}
      />
      {isFull18 && back9.length > 0 && (
        <HoleResultsTable title="Back 9" holes={back9} teams={teams} />
      )}
    </div>
  );
};

// Sub-component for the hole-by-hole table
interface HoleResultsTableProps {
  title: string;
  holes: HoleResult[];
  teams: Team[];
}

const HoleResultsTable: React.FC<HoleResultsTableProps> = ({
  title,
  holes,
  teams,
}) => {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
      <div className="px-4 py-2.5 border-b border-white/10 bg-white/[0.03]">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-white/40 font-medium py-2 pl-4 pr-2 sticky left-0 bg-[#0a0f1a]">
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
              <td className="text-left text-white/30 font-medium py-1 pl-4 pr-2 text-xs sticky left-0 bg-[#0a0f1a]">
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
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-b border-white/5">
                <td className="py-2 pl-4 pr-2 sticky left-0 bg-[#0a0f1a]">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="text-white text-xs font-medium truncate max-w-[80px]">
                      {team.name}
                    </span>
                  </div>
                </td>
                {holes.map((hr) => {
                  const teamScore = hr.teamScores.find(
                    (ts) => ts.team.id === team.id
                  );
                  const score = teamScore?.score;
                  const isWinner = hr.winningTeamIds.includes(team.id) && !hr.isTied;
                  const isTiedWinner = hr.winningTeamIds.includes(team.id) && hr.isTied;

                  return (
                    <td key={hr.holeNumber} className="text-center py-2 px-1">
                      {score !== null && score !== undefined ? (
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            isWinner
                              ? "text-white"
                              : isTiedWinner
                                ? "text-white/80 border border-white/20"
                                : "text-white/50"
                          }`}
                          style={
                            isWinner
                              ? { backgroundColor: team.color }
                              : isTiedWinner
                                ? { backgroundColor: `${team.color}40` }
                                : undefined
                          }
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
    </div>
  );
};
