import React, { useMemo } from "react";
import { Tour, Round, Team } from "../../types";

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
          // All tied among some teams
          isTied = true;
          winningTeamIds = winners.map((w) => w.team.id);
        } else if (winners.length === validScores.length && validScores.length > 1) {
          // All teams tied
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

  return (
    <div className="space-y-4">
      {/* Summary - Holes Won */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">
          Holes Won
        </h3>
        <div className="space-y-2">
          {teams.map((team) => {
            const won = holesWonByTeam.counts[team.id];
            const totalPlayedHoles = holeResults.filter(
              (hr) => hr.teamScores.some((ts) => ts.team.id === team.id && ts.score !== null)
            ).length;
            const percentage =
              totalPlayedHoles > 0 ? (won / totalPlayedHoles) * 100 : 0;

            return (
              <div key={team.id} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: team.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white truncate">
                      {team.name}
                    </span>
                    <span className="text-sm font-bold text-white ml-2">
                      {won}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: team.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {holesWonByTeam.tiedCount > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0 bg-white/30" />
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm font-medium text-white/60">
                  Tied
                </span>
                <span className="text-sm font-bold text-white/60">
                  {holesWonByTeam.tiedCount}
                </span>
              </div>
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

      {/* Total strokes */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">
          Total Strokes
        </h3>
        <div className="space-y-2">
          {[...teams]
            .sort(
              (a, b) =>
                (totalStrokesByTeam[a.id] || 0) -
                (totalStrokesByTeam[b.id] || 0)
            )
            .map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="text-sm font-medium text-white">
                    {team.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-white">
                  {totalStrokesByTeam[team.id] || 0}
                </span>
              </div>
            ))}
        </div>
      </div>
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
    <div className="card overflow-hidden">
      <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="overflow-x-auto -mx-4 px-4">
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
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-b border-white/5">
                <td className="py-2 pr-2 sticky left-0 bg-slate-950">
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
