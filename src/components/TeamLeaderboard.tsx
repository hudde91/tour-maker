import { Tour, Round, TeamLeaderboardEntry } from "../types";
import { storage } from "../lib/storage";

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
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
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
      {/* Team Leaderboard Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="section-header">Team Championship Standings</h3>
          <p className="text-slate-600 mt-1">
            {teamsWithScores.length} of {tour.teams?.length || 0} teams
            competing
          </p>
        </div>

        {teamsWithScores.length > 0 && (
          <div className="text-right">
            <div className="text-sm text-slate-500">Leading Team Score</div>
            <div className="text-xl font-bold text-emerald-600">
              {Math.min(...teamsWithScores.map((t) => t.totalScore))}
            </div>
          </div>
        )}
      </div>

      {/* Team Standings */}
      <div className="space-y-4">
        {teamsWithScores.map((teamEntry, index) => {
          const captain = tour.players.find(
            (p) => p.id === teamEntry.team.captainId
          );
          const teamPlayers = tour.players.filter(
            (p) => p.teamId === teamEntry.team.id
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
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  {/* Team Position Badge */}
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg ${
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
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3l14 9-14 9V3z"
                        />
                      </svg>
                    ) : (
                      teamEntry.position
                    )}
                  </div>

                  {/* Team Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: teamEntry.team.color }}
                      />
                      <h3
                        className={`font-bold ${
                          isLeadingTeam
                            ? "text-2xl text-yellow-900"
                            : "text-xl text-slate-900"
                        }`}
                      >
                        {teamEntry.team.name}
                      </h3>

                      {isLeadingTeam && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold border border-yellow-300">
                          Leading Team
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span className="font-medium">
                          {teamEntry.playersWithScores} of{" "}
                          {teamEntry.totalPlayers} players scoring
                        </span>
                      </div>

                      {captain && (
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-amber-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 3l14 9-14 9V3z"
                            />
                          </svg>
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
                  <div
                    className={`text-4xl font-bold mb-1 ${
                      isLeadingTeam ? "text-yellow-900" : "text-slate-900"
                    }`}
                  >
                    {teamEntry.totalScore}
                  </div>

                  {teamEntry.totalToPar !== 0 && (
                    <div
                      className={`text-xl font-semibold ${
                        teamEntry.totalToPar < 0
                          ? "text-red-600"
                          : teamEntry.totalToPar > 0
                          ? "text-orange-600"
                          : "text-blue-600"
                      }`}
                    >
                      {teamEntry.totalToPar > 0 ? "+" : ""}
                      {teamEntry.totalToPar}
                    </div>
                  )}

                  {teamEntry.totalToPar === 0 && teamEntry.totalScore > 0 && (
                    <div className="text-xl font-semibold text-blue-600">E</div>
                  )}
                </div>
              </div>

              {/* Team Player Breakdown */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="subsection-header mb-3">
                  Team Roster Performance
                </h4>
                <div className="grid gap-3">
                  {teamPlayers.map((player) => {
                    const playerScore = round.scores[player.id];
                    const isCaptain = player.id === teamEntry.team.captainId;

                    return (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">
                                {player.name}
                              </span>
                              {isCaptain && (
                                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold border border-amber-200">
                                  C
                                </span>
                              )}
                            </div>
                            {player.handicap !== undefined && (
                              <span className="text-sm text-slate-500">
                                HC: {player.handicap}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          {playerScore && playerScore.totalScore > 0 ? (
                            <>
                              <div className="text-lg font-bold text-slate-900">
                                {playerScore.totalScore}
                              </div>
                              {playerScore.totalToPar !== 0 && (
                                <div
                                  className={`text-sm font-semibold ${
                                    playerScore.totalToPar < 0
                                      ? "text-red-600"
                                      : playerScore.totalToPar > 0
                                      ? "text-orange-600"
                                      : "text-blue-600"
                                  }`}
                                >
                                  {playerScore.totalToPar > 0 ? "+" : ""}
                                  {playerScore.totalToPar}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-slate-400 font-medium">
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

      {/* Team Championship Summary */}
      {teamsWithScores.length > 0 && (
        <div className="card mt-6">
          <h4 className="subsection-header mb-4">Championship Statistics</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {Math.min(...teamsWithScores.map((t) => t.totalScore))}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Best Team Score
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {Math.round(
                  teamsWithScores.reduce((sum, t) => sum + t.totalScore, 0) /
                    teamsWithScores.length
                )}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Average Team
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {teamsWithScores.filter((t) => t.totalToPar < 0).length}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                Teams Under Par
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
