import { Tour, Round } from "../../types";
import { storage } from "../../lib/storage";

interface TeamLeaderboardProps {
  tour: Tour;
  round: Round;
}

export const TeamLeaderboard = ({ tour, round }: TeamLeaderboardProps) => {
  const teamLeaderboard = storage.calculateTeamLeaderboard(tour, round.id);
  const teamsWithScores = teamLeaderboard.filter(
    (entry) => entry.totalScore > 0
  );

  if (teamsWithScores.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto card-spacing">
          <span className="text-4xl">👥</span>
        </div>
        <h4 className="text-lg font-semibold text-slate-700 mb-2">
          Teams Getting Ready
        </h4>
        <p className="text-slate-500">
          Team standings will appear as players enter scores
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Team Standings */}
      <div className="space-y-4">
        {teamsWithScores.map((teamEntry, index) => {
          const captain = tour.players.find(
            (p) => p.id === teamEntry.team.captainId
          );
          const teamPlayers = tour.players.filter(
            (p) => p.teamId === teamEntry.team.id
          );

          const teamStableford = storage.calculateTeamStablefordForRound(
            tour as any,
            round as any,
            teamEntry.team.id
          );
          const tournamentTeamStableford =
            storage.calculateTournamentTeamStableford(
              tour as any,
              teamEntry.team.id
            );
          const isLeadingTeam = index === 0;
          const isTop3 = index < 3;

          return (
            <div
              key={teamEntry.team.id}
              className={`card-elevated transition-all duration-200 ${
                isLeadingTeam
                  ? "ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50"
                  : isTop3
                  ? "border-amber-200 bg-amber-50"
                  : ""
              }`}
            >
              {/* Team Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 card-spacing">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Team Position Badge */}
                  <div
                    className={`w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold shadow-lg ${
                      isLeadingTeam
                        ? "bg-yellow-500 text-white shadow-yellow-200"
                        : index === 1
                        ? "bg-slate-400 text-white"
                        : index === 2
                        ? "bg-amber-600 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isLeadingTeam ? (
                      <span>🥇</span>
                    ) : index === 1 ? (
                      <span>🥈</span>
                    ) : index === 2 ? (
                      <span>🥉</span>
                    ) : (
                      teamEntry.position
                    )}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: teamEntry.team.color }}
                        />
                        <h3
                          className={`font-bold ${
                            isLeadingTeam
                              ? "text-xl md:text-2xl text-yellow-900"
                              : "text-lg md:text-xl text-slate-900"
                          }`}
                        >
                          {teamEntry.team.name}
                        </h3>
                      </div>

                      {isLeadingTeam && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold border border-yellow-300 self-start">
                          🏆 Leading Team
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      {captain && (
                        <div className="flex items-center gap-1">
                          <span className="text-base">👑</span>
                          <span className="font-medium">
                            Captain: {captain.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Score Display */}
                <div className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <div
                      className={`text-3xl md:text-4xl font-bold mb-1 ${
                        isLeadingTeam ? "text-yellow-900" : "text-slate-900"
                      }`}
                    >
                      {teamEntry.netScore !== undefined
                        ? teamEntry.netScore
                        : teamEntry.totalScore}
                    </div>

                    {/* Show team handicap strokes if applied */}
                    <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      Total strokes: {teamEntry.totalScore}
                      {teamEntry.totalHandicapStrokes &&
                      teamEntry.totalHandicapStrokes > 0
                        ? ` (-${teamEntry.totalHandicapStrokes} HC)`
                        : ""}
                    </div>
                    <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      Team Stableford: {teamStableford}
                    </div>
                    <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      Tournament Team Stableford: {tournamentTeamStableford}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Player Breakdown */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="subsection-header mb-3 flex items-center gap-2">
                  <span className="text-lg">👥</span>
                  Team {teamEntry.team.name} Performance
                </h4>
                <div className="grid gap-3">
                  {teamPlayers.map((player) => {
                    const playerScore = round.scores[player.id];
                    const isCaptain = player.id === teamEntry.team.captainId;

                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center">
                            <span className="text-sm">👤</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900 truncate">
                                {player.name}
                              </span>
                              {isCaptain && (
                                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold border border-amber-200">
                                  👑 C
                                </span>
                              )}
                            </div>
                            {player.handicap !== undefined && (
                              <span className="text-sm text-slate-500 flex items-center gap-1">
                                <span className="text-xs">⛳</span>
                                HC: {player.handicap}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          {playerScore && playerScore.totalScore > 0 ? (
                            <>
                              <div className="text-lg font-bold text-slate-900">
                                {playerScore.netScore || playerScore.totalScore}
                              </div>
                              {playerScore.handicapStrokes && (
                                <div className="text-xs text-slate-500">
                                  Gross: {playerScore.totalScore}
                                </div>
                              )}
                              <div className="text-xs text-slate-500">
                                Strokes
                              </div>
                            </>
                          ) : (
                            <div className="text-slate-400 font-medium flex items-center gap-1">
                              <span className="text-base">⏳</span>
                              Not Started
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
