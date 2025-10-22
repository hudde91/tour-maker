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

  // Get all matches from all rounds
  const allMatches = useMemo(() => {
    const matches: Array<{
      match: any;
      roundName: string;
      roundId: string;
    }> = [];

    tour.rounds.forEach((round) => {
      if (round.ryderCup?.matches) {
        round.ryderCup.matches.forEach((match) => {
          matches.push({
            match,
            roundName: round.name,
            roundId: round.id,
          });
        });
      }
    });

    return matches;
  }, [tour.rounds]);

  // Get all matches for SessionSummaryView
  const allRawMatches = useMemo(() => {
    const matches: any[] = [];
    tour.rounds.forEach((round) => {
      if (round.ryderCup?.matches) {
        matches.push(...round.ryderCup.matches);
      }
    });
    return matches;
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

      {/* Session Summary View */}
      {allRawMatches.length > 0 && (
        <div className="card-spacing">
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-lg">📅</span>
            Session Breakdown
          </h4>
          <SessionSummaryView
            matches={allRawMatches}
            teamAName={teamA.name}
            teamBName={teamB.name}
            teamAColor={teamA.color}
            teamBColor={teamB.color}
          />
        </div>
      )}

      {/* Match Results by Round */}
      {allMatches.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-lg">📋</span>
            All Match Results
          </h4>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Group matches by round */}
            {tour.rounds
              .filter(
                (r) => r.ryderCup?.matches && r.ryderCup.matches.length > 0
              )
              .map((round) => (
                <div key={round.id}>
                  <h5 className="text-sm font-semibold text-slate-700 mb-2 sticky top-0 bg-white py-1">
                    {round.name}
                  </h5>
                  <div className="space-y-2">
                    {round.ryderCup!.matches.map((match, index) => {
                      const getPlayerNames = (playerIds: string[]) =>
                        playerIds
                          .map(
                            (id) =>
                              tour.players.find((p) => p.id === id)?.name ||
                              "Unknown"
                          )
                          .join(" & ");

                      const isComplete = match.status === "completed";
                      const winner =
                        match.result === "team-a"
                          ? teamA.name
                          : match.result === "team-b"
                          ? teamB.name
                          : null;

                      // Calculate holes completed for in-progress matches
                      const holesCompleted =
                        !isComplete && match.holes
                          ? match.holes.filter(
                              (hole) =>
                                hole.teamAScore > 0 || hole.teamBScore > 0
                            ).length
                          : 0;

                      return (
                        <div
                          key={match.id}
                          className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="text-xs font-medium text-slate-600 mb-0.5">
                                {match.format.charAt(0).toUpperCase() +
                                  match.format.slice(1)}
                              </div>
                              <div className="text-sm text-slate-800">
                                {getPlayerNames(match.teamA.playerIds)}
                              </div>
                              <div className="text-sm text-slate-800">
                                {getPlayerNames(match.teamB.playerIds)}
                              </div>
                            </div>

                            {isComplete ? (
                              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                Complete
                              </span>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                  In Progress
                                </span>
                                {holesCompleted < 18 && (
                                  <span className="text-xs text-slate-600 font-medium">
                                    Thru {holesCompleted}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Points Display */}
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <div
                                  className="text-base font-bold"
                                  style={{ color: teamA.color }}
                                >
                                  {match.points.teamA}
                                </div>
                                <div className="text-xs text-slate-500">
                                  pts
                                </div>
                              </div>
                              <span className="text-slate-400 text-sm">vs</span>
                              <div className="text-center">
                                <div
                                  className="text-base font-bold"
                                  style={{ color: teamB.color }}
                                >
                                  {match.points.teamB}
                                </div>
                                <div className="text-xs text-slate-500">
                                  pts
                                </div>
                              </div>
                            </div>

                            {winner && (
                              <div className="text-xs font-semibold text-emerald-600">
                                {winner} wins
                              </div>
                            )}
                            {match.result === "tie" && (
                              <div className="text-xs font-semibold text-slate-600">
                                Halved
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
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

      {/* Info Box */}
      {!championDecided && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">ℹ️ Scoring:</span> Win = 1 point,
            Tie (Halved) = 0.5 points each, Loss = 0 points
          </p>
        </div>
      )}
    </div>
  );
};
