import { Tour } from "@/types";
import { useMemo } from "react";

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

      {/* Points Display */}
      <div className="grid grid-cols-2 gap-4 card-spacing">
        {/* Team A */}
        <div
          className={`text-center p-6 rounded-xl border-2 transition-all ${
            championDecided && teamAPoints >= target
              ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50"
              : ""
          }`}
          style={
            !championDecided || teamAPoints < target
              ? {
                  borderColor: teamA.color,
                  backgroundColor: teamA.color + "10",
                }
              : undefined
          }
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
            style={{ backgroundColor: teamA.color }}
          >
            <span className="text-2xl text-white font-bold">A</span>
          </div>
          <h4 className="text-lg font-bold text-slate-900 mb-1">
            {teamA.name}
          </h4>
          <div
            className="text-5xl font-bold mb-2"
            style={{ color: teamA.color }}
          >
            {teamAPoints}
          </div>
          <div className="text-sm text-slate-600">
            {teamAPoints === 1 ? "1 point" : `${teamAPoints} points`}
          </div>
          {teamAPoints >= target && (
            <div className="mt-3">
              <span className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-2">
                <span className="text-lg">🏆</span>
                CHAMPION!
              </span>
            </div>
          )}
        </div>

        {/* Team B */}
        <div
          className={`text-center p-6 rounded-xl border-2 transition-all ${
            championDecided && teamBPoints >= target
              ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50"
              : ""
          }`}
          style={
            !championDecided || teamBPoints < target
              ? {
                  borderColor: teamB.color,
                  backgroundColor: teamB.color + "10",
                }
              : undefined
          }
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
            style={{ backgroundColor: teamB.color }}
          >
            <span className="text-2xl text-white font-bold">B</span>
          </div>
          <h4 className="text-lg font-bold text-slate-900 mb-1">
            {teamB.name}
          </h4>
          <div
            className="text-5xl font-bold mb-2"
            style={{ color: teamB.color }}
          >
            {teamBPoints}
          </div>
          <div className="text-sm text-slate-600">
            {teamBPoints === 1 ? "1 point" : `${teamBPoints} points`}
          </div>
          {teamBPoints >= target && (
            <div className="mt-3">
              <span className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-2">
                <span className="text-lg">🏆</span>
                CHAMPION!
              </span>
            </div>
          )}
        </div>
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
                              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                In Progress
                              </span>
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
