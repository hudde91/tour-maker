import { Tour } from "@/types";
import { useMemo } from "react";
import { VisualPointTally } from "../rydercup/VisualPointTally";
import { SessionSummaryView } from "../rydercup/SessionSummaryView";

interface RyderCupTournamentLeaderboardProps {
  tour: Tour;
}

export const RyderCupTournamentLeaderboard = ({
  tour,
}: RyderCupTournamentLeaderboardProps) => {
  // Calculate total Ryder Cup points across all rounds
  const { teamAPoints, teamBPoints, completedMatches, totalMatches, target } =
    useMemo(() => {
      let teamATotal = 0;
      let teamBTotal = 0;
      let completed = 0;
      let total = 0;
      let targetPoints = 14.5;

      tour.rounds.forEach((round) => {
        if (
          round.ryderCup &&
          (round.status === "completed" || round.completedAt)
        ) {
          teamATotal += round.ryderCup.teamAPoints || 0;
          teamBTotal += round.ryderCup.teamBPoints || 0;
          completed +=
            round.ryderCup.matches?.filter((m) => m.status === "completed")
              .length || 0;
          targetPoints = round.ryderCup.targetPoints || 14.5;
        }
        if (round.ryderCup) {
          total += round.ryderCup.matches?.length || 0;
        }
      });

      return {
        teamAPoints: teamATotal,
        teamBPoints: teamBTotal,
        completedMatches: completed,
        totalMatches: total,
        target: targetPoints,
      };
    }, [tour.rounds]);

  // Get team info
  const teams = tour.teams || [];
  const teamA = teams[0];
  const teamB = teams[1];

  if (!teamA || !teamB) {
    return (
      <div className="card text-center py-8">
        <p className="text-slate-500">Need exactly 2 teams for Ryder Cup</p>
      </div>
    );
  }

  // Check if there are any matches
  const hasMatches = useMemo(() => {
    return tour.rounds.some(
      (round) => round.ryderCup?.matches && round.ryderCup.matches.length > 0
    );
  }, [tour.rounds]);

  const championDecided = teamAPoints >= target || teamBPoints >= target;

  return (
    <div className="card-elevated">
      {/* Tournament Points Header */}
      <div className="text-center card-spacing">
        <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-3">
          <span className="text-3xl">🏆</span>
          Ryder Cup Standings
        </h3>
        <p className="text-slate-600">
          First to {target} points wins the tournament
        </p>
      </div>

      {/* Visual Point Tally */}
      <div className="card-spacing">
        <VisualPointTally
          teamAName={teamA.name}
          teamBName={teamB.name}
          teamAPoints={teamAPoints}
          teamBPoints={teamBPoints}
          targetPoints={target}
          teamAColor={teamA.color}
          teamBColor={teamB.color}
        />
      </div>

      {/* Progress Bar */}
      {totalMatches > 0 && (
        <div className="card-spacing">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">
              Tournament Progress
            </span>
            <span className="text-sm text-slate-500">
              {completedMatches} of {totalMatches} matches completed
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${(completedMatches / totalMatches) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Match Results Breakdown */}
      {hasMatches && (
        <div className="card-spacing">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-lg">📋</span>
            Match Results
          </h4>
          <SessionSummaryView
            rounds={tour.rounds}
            players={tour.players}
            teamAName={teamA.name}
            teamBName={teamB.name}
            teamAColor={teamA.color}
            teamBColor={teamB.color}
          />
        </div>
      )}

      {/* Championship Status */}
      {championDecided && (
        <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl text-center">
          <h4 className="text-xl font-bold text-yellow-900 mb-2 flex items-center justify-center gap-2">
            <span className="text-2xl">🏆</span>
            Tournament Complete!
          </h4>
          <p className="text-yellow-800 font-medium">
            {teamAPoints >= target ? teamA.name : teamB.name} wins the Ryder Cup
            with {Math.max(teamAPoints, teamBPoints)} points!
          </p>
        </div>
      )}

      {/* Scoring Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">ℹ️ Scoring:</span> Win = 1 point, Tie
          (Halved) = 0.5 points each, Loss = 0 points
        </p>
      </div>
    </div>
  );
};
