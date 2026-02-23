import { Tour, Round } from "../../../types";
import { getMatchStatus } from "../../../lib/uiMatchPlay";

interface MatchPlayLeaderboardProps {
  tour: Tour;
  round: Round;
}

export const MatchPlayLeaderboard = ({
  tour,
  round,
}: MatchPlayLeaderboardProps) => {
  const matches = round.ryderCup?.matches || [];
  const teamAPoints = round.ryderCup?.teamAPoints || 0;
  const teamBPoints = round.ryderCup?.teamBPoints || 0;
  const target = round.ryderCup?.targetPoints || 14.5;

  // Get team info
  const teams = tour.teams || [];
  const teamA = teams[0];
  const teamB = teams[1];

  if (!teamA || !teamB) {
    return (
      <div className="card text-center py-8">
        <p className="text-white/40">Need exactly 2 teams for match play</p>
      </div>
    );
  }

  const completedMatches = matches.filter(
    (m) => m.status === "completed"
  ).length;
  const totalMatches = matches.length;

  return (
    <div className="card-elevated -mx-4">
      {/* Tournament Points Header */}
      <div className="text-center card-spacing">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <span className="text-3xl">🏆</span>
          Ryder Cup Points
        </h3>
        <p className="text-white/50">
          First to {target} points wins the tournament
        </p>
      </div>

      {/* Points Display */}
      <div className="grid grid-cols-2 gap-4 card-spacing">
        {/* First Team */}
        <div
          className="text-center p-6 rounded-xl border-2"
          style={{
            borderColor: teamA.color,
            backgroundColor: teamA.color + "10",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
            style={{ backgroundColor: teamA.color }}
          >
            <span className="text-2xl text-white font-bold">A</span>
          </div>
          <h4 className="text-lg font-bold text-white mb-1">
            {teamA.name}
          </h4>
          <div
            className="text-4xl font-bold mb-2"
            style={{ color: teamA.color }}
          >
            {teamAPoints}
          </div>
          <div className="text-sm text-white/50">
            {teamAPoints === 1 ? "1 point" : `${teamAPoints} points`}
          </div>
          {teamAPoints >= target && (
            <div className="mt-2">
              <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                🏆 CHAMPION!
              </span>
            </div>
          )}
        </div>

        {/* Second Team */}
        <div
          className="text-center p-6 rounded-xl border-2"
          style={{
            borderColor: teamB.color,
            backgroundColor: teamB.color + "10",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
            style={{ backgroundColor: teamB.color }}
          >
            <span className="text-2xl text-white font-bold">B</span>
          </div>
          <h4 className="text-lg font-bold text-white mb-1">
            {teamB.name}
          </h4>
          <div
            className="text-4xl font-bold mb-2"
            style={{ color: teamB.color }}
          >
            {teamBPoints}
          </div>
          <div className="text-sm text-white/50">
            {teamBPoints === 1 ? "1 point" : `${teamBPoints} points`}
          </div>
          {teamBPoints >= target && (
            <div className="mt-2">
              <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                🏆 CHAMPION!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card-spacing">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-white/70">
            Tournament Progress
          </span>
          <span className="text-sm text-white/40">
            {completedMatches} of {totalMatches} matches
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${
                totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Match Results */}
      {matches.length > 0 && (
        <div>
          <h4 className="font-semibold text-white/90 mb-4 flex items-center gap-2">
            <span className="text-lg">📋</span>
            Match Results
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {matches.map((match, index) => {
              const teamAInfo = {
                id: match.teamA.id,
                playerIds: match.teamA.playerIds,
              };
              const teamBInfo = {
                id: match.teamB.id,
                playerIds: match.teamB.playerIds,
              };

              const getPlayerNames = (playerIds: string[]) =>
                playerIds
                  .map(
                    (id) =>
                      tour.players.find((p) => p.id === id)?.name || "Unknown"
                  )
                  .join(" & ");

              return (
                <div
                  key={match.id}
                  className="rounded-lg p-4 border border-white/10"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white/90 mb-1">
                        Match {index + 1} -{" "}
                        {match.format.charAt(0).toUpperCase() +
                          match.format.slice(1)}
                      </div>
                      <div className="text-xs text-white/50">
                        {getPlayerNames(teamAInfo.playerIds)} vs{" "}
                        {getPlayerNames(teamBInfo.playerIds)}
                      </div>
                    </div>

                    {(() => {
                      const { text, code } = getMatchStatus(
                        match,
                        round?.holes ?? 18
                      );
                      const palette =
                        code === "complete"
                          ? "bg-green-600 text-white"
                          : code === "dormie"
                          ? "bg-amber-600 text-white"
                          : code === "in-progress"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-500 text-white";
                      return (
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${palette}`}
                        >
                          {text}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Points Display */}
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div
                          className="text-lg font-bold"
                          style={{ color: teamA.color }}
                        >
                          {match.points.teamA}
                        </div>
                        <div className="text-xs text-white/40">
                          {teamA.name}
                        </div>
                      </div>
                      <span className="text-white/30 text-sm">pts</span>
                      <div className="text-center">
                        <div
                          className="text-lg font-bold"
                          style={{ color: teamB.color }}
                        >
                          {match.points.teamB}
                        </div>
                        <div className="text-xs text-white/40">
                          {teamB.name}
                        </div>
                      </div>
                    </div>

                    {match.status === "in-progress" && (
                      <div className="text-xs text-white/40">
                        {match.holes.length} of {round.holes} holes played
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Championship Status */}
      {(teamAPoints >= target || teamBPoints >= target) && (
        <div className="mt-6 p-4 bg-yellow-500/15 border border-yellow-500/30 rounded-lg text-center">
          <h4 className="text-lg font-bold text-yellow-400 mb-2">
            🏆 Tournament Complete!
          </h4>
          <p className="text-yellow-300">
            {teamAPoints >= target ? teamA.name : teamB.name} wins the Ryder Cup
            with {Math.max(teamAPoints, teamBPoints)} points!
          </p>
        </div>
      )}
    </div>
  );
};
