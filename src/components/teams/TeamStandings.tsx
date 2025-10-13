import { Tour } from "@/types/core";
import { TeamLeaderboardEntry } from "@/types/scoring";
import { storage } from "@/lib/storage";
import { useMemo } from "react";

interface TeamStandingsProps {
  tour: Tour;
}

export const TeamStandings = ({ tour }: TeamStandingsProps) => {
  const isRyderCup = tour.format === "ryder-cup";

  const teamStandings = useMemo<TeamLeaderboardEntry[]>(() => {
    const teamLeaderboard = storage.calculateTeamLeaderboard(tour);

    // If Ryder Cup, calculate total points for each team
    if (isRyderCup && tour.teams) {
      // Get total Ryder Cup points across all rounds
      const teamARyderPoints = tour.rounds
        .filter((r) => r.ryderCup)
        .reduce((sum, r) => sum + (r.ryderCup?.teamAPoints || 0), 0);

      const teamBRyderPoints = tour.rounds
        .filter((r) => r.ryderCup)
        .reduce((sum, r) => sum + (r.ryderCup?.teamBPoints || 0), 0);

      return teamLeaderboard.map((entry, index) => ({
        ...entry,
        ryderCupPoints: index === 0 ? teamARyderPoints : teamBRyderPoints,
      }));
    }

    return teamLeaderboard;
  }, [tour, isRyderCup]);

  const teamsWithScores = teamStandings.filter(
    (entry) =>
      entry.totalScore > 0 ||
      (entry.ryderCupPoints !== undefined && entry.ryderCupPoints > 0)
  );

  const hasCompletedRounds = tour.rounds.some(
    (r) => r.status === "completed" || r.completedAt
  );

  if (!hasCompletedRounds || teamsWithScores.length === 0) {
    return (
      <div className="card card-spacing">
        <h2 className="section-header mb-4">Team Standings</h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-slate-600 text-sm">
            Team standings will appear once rounds are completed
          </p>
        </div>
      </div>
    );
  }

  const sortedTeams: TeamLeaderboardEntry[] = [...teamsWithScores].sort(
    (a, b) => {
      if (isRyderCup) {
        return (b.ryderCupPoints || 0) - (a.ryderCupPoints || 0);
      }
      const aScore = a.netScore || a.totalScore;
      const bScore = b.netScore || b.totalScore;
      return aScore - bScore;
    }
  );

  return (
    <div className="card-elevated card-spacing">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="section-header">Team Standings</h2>
          <p className="text-slate-600 text-sm">
            {isRyderCup
              ? "Ryder Cup points and team performance"
              : "Overall team performance across all rounds"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {sortedTeams.map((teamEntry, index) => {
          const isLeading = index === 0;
          const captain = tour.players.find(
            (p) => p.id === teamEntry.team.captainId
          );

          return (
            <div
              key={teamEntry.team.id}
              className={`p-4 bg-white border-2 rounded-xl transition-all ${
                isLeading
                  ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                    isLeading
                      ? "bg-yellow-500 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {index === 0
                    ? "🥇"
                    : index === 1
                    ? "🥈"
                    : index === 2
                    ? "🥉"
                    : index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: teamEntry.team.color }}
                    />
                    <h3 className="font-bold text-lg text-slate-900 truncate">
                      {teamEntry.team.name}
                    </h3>
                    {isLeading && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                        Leading
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span>{teamEntry.playersWithScores} players</span>
                    {captain && (
                      <span className="flex items-center gap-1">
                        <span>👑</span>
                        <span>{captain.name}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  {isRyderCup ? (
                    <>
                      <div className="text-3xl font-bold text-slate-900">
                        {teamEntry.ryderCupPoints?.toFixed(1) || "0"}
                      </div>
                      <div className="text-xs text-slate-500">Points</div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-slate-900">
                        {teamEntry.netScore || teamEntry.totalScore}
                      </div>
                      <div className="text-xs text-slate-500">
                        {teamEntry.totalScore} strokes
                        {teamEntry.netScore && teamEntry.totalHandicapStrokes
                          ? ` (-${teamEntry.totalHandicapStrokes} HC)`
                          : ""}
                      </div>
                      {teamEntry.totalToPar !== undefined && (
                        <div className="text-xs text-emerald-600 font-medium mt-1">
                          {teamEntry.netToPar !== undefined
                            ? `${teamEntry.netToPar > 0 ? "+" : ""}${
                                teamEntry.netToPar
                              } vs Par (Net)`
                            : `${teamEntry.totalToPar > 0 ? "+" : ""}${
                                teamEntry.totalToPar
                              } vs Par`}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isRyderCup && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">ℹ️ Ryder Cup Scoring:</span> First
            team to {tour.rounds[0]?.ryderCup?.targetPoints || 14.5} points wins
          </p>
        </div>
      )}
    </div>
  );
};
