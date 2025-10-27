import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useTour } from "../hooks/useTours";
import { PageHeader } from "../components/ui/PageHeader";
import {
  calculateTeamStats,
  formatToPar,
  getMomentumIndicator,
  getMomentumColorClass,
  PlayerStats,
} from "../lib/teamStats";

export const TeamDashboard = () => {
  const { tourId, teamId } = useParams<{ tourId: string; teamId: string }>();
  const navigate = useNavigate();
  const { data: tour, isLoading } = useTour(tourId!);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">👥</span>
          </div>
          <div className="text-lg font-semibold text-slate-700">
            Loading team...
          </div>
        </div>
      </div>
    );
  }

  if (!tour || !teamId) {
    return (
      <div className="min-h-screen bg-slate-50 safe-area-top">
        <div className="p-4 md:p-6">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-3">
              Team Not Found
            </h3>
            <p className="text-slate-500 mb-6">
              The team you're looking for doesn't exist or has been removed.
            </p>
            <button onClick={() => navigate(-1)} className="btn-primary">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const teamStats = calculateTeamStats(tour, teamId);

  if (!teamStats) {
    return (
      <div className="min-h-screen bg-slate-50 safe-area-top">
        <div className="p-4 md:p-6">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-3">
              Team Not Found
            </h3>
            <p className="text-slate-500 mb-6">
              The team you're looking for doesn't exist or has been removed.
            </p>
            <button onClick={() => navigate(-1)} className="btn-primary">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { team, momentum, bestPerformers, playerStats } = teamStats;
  const captain = tour.players.find((p) => p.id === team.captainId);
  const selectedPlayerStats = selectedPlayerId
    ? playerStats.find((ps) => ps.player.id === selectedPlayerId)
    : null;

  const breadcrumbs = [
    { label: "Home", path: "/", icon: "🏠" },
    { label: tour.name, path: `/tour/${tourId}`, icon: "⛳" },
    { label: "Teams", path: `/tour/${tourId}/players`, icon: "👥" },
    { label: team.name, icon: "🏆" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top">
      <PageHeader
        title={team.name}
        subtitle="Team Dashboard"
        breadcrumbs={breadcrumbs}
        onBack={() => navigate(-1)}
      />

      <div className="-mt-4 pb-8 w-full max-w-6xl mx-auto space-y-6">
        {/* Player Selection */}
        <div className="card-elevated card-spacing">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            View Statistics For:
          </label>
          <select
            value={selectedPlayerId || "team"}
            onChange={(e) =>
              setSelectedPlayerId(
                e.target.value === "team" ? null : e.target.value
              )
            }
            className="input-field w-full md:w-auto min-w-[250px]"
          >
            <option value="team">📊 Team Overview</option>
            <optgroup label="Team Members">
              {team.playerIds.map((playerId) => {
                const player = tour.players.find((p) => p.id === playerId);
                if (!player) return null;
                const isCaptain = team.captainId === playerId;
                return (
                  <option key={playerId} value={playerId}>
                    {isCaptain ? "👑 " : "👤 "}
                    {player.name}
                  </option>
                );
              })}
            </optgroup>
          </select>
        </div>

        {selectedPlayerStats ? (
          // Individual Player View
          <PlayerDetailView
            playerStats={selectedPlayerStats}
            tour={tour}
            team={team}
          />
        ) : (
          // Team Overview
          <>
            {/* Team Overview */}
            <div className="card-elevated card-spacing">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Team Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <span>👥</span>
                    <span className="text-sm font-medium">Team Size</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {team.playerIds.length}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <span>👑</span>
                    <span className="text-sm font-medium">Captain</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 truncate">
                    {captain?.name || "None"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <span>🏌️</span>
                    <span className="text-sm font-medium">Rounds Played</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {teamStats.roundsPlayed}
                  </p>
                </div>
              </div>
            </div>

            {/* Ryder Cup Info - when rounds exist but no stroke play stats */}
            {teamStats.roundsPlayed > 0 && teamStats.averageScore === 0 && (
              <div className="card-elevated card-spacing">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <p className="text-lg font-semibold text-blue-900 mb-2">
                    ⚔️ Ryder Cup Tournament
                  </p>
                  <p className="text-slate-600">
                    This team has participated in {teamStats.roundsPlayed} Ryder
                    Cup round{teamStats.roundsPlayed > 1 ? "s" : ""}.
                    Traditional stroke play statistics are not available for
                    match play tournaments.
                  </p>
                </div>
              </div>
            )}

            {/* Performance Stats */}
            {teamStats.roundsPlayed > 0 && teamStats.averageScore > 0 && (
              <div className="card-elevated card-spacing">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Performance Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-700 mb-1">
                      <span>📊</span>
                      <span className="text-sm font-medium">Average Score</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">
                      {teamStats.averageScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                      <span>⛳</span>
                      <span className="text-sm font-medium">To Par</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatToPar(teamStats.toPar)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 text-purple-700 mb-1">
                      <span>🏆</span>
                      <span className="text-sm font-medium">Best Score</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {teamStats.bestScore}
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-lg border ${getMomentumColorClass(
                      momentum
                    )}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getMomentumIndicator(momentum)}</span>
                      <span className="text-sm font-medium">Momentum</span>
                    </div>
                    <p className="text-2xl font-bold capitalize">{momentum}</p>
                  </div>
                </div>

                {/* Recent Scores Chart */}
                {teamStats.recentScores.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">
                      Recent Performance
                    </h3>
                    <div className="flex items-end gap-2 h-32">
                      {teamStats.recentScores.map((score, index) => {
                        const maxScore = Math.max(...teamStats.recentScores);
                        const height = (score / maxScore) * 100;
                        return (
                          <div
                            key={index}
                            className="flex-1 flex flex-col items-center"
                          >
                            <div
                              className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all"
                              style={{ height: `${height}%` }}
                            ></div>
                            <p className="text-sm font-semibold text-slate-700 mt-2">
                              {score}
                            </p>
                            <p className="text-xs text-slate-500">
                              Round{" "}
                              {tour.rounds.length -
                                teamStats.recentScores.length +
                                index +
                                1}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Best Performers */}
            {bestPerformers.length > 0 && (
              <div className="card-elevated card-spacing">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  🌟 Best Performers
                </h2>
                <div className="space-y-3">
                  {bestPerformers.map((playerStat, index) => (
                    <div
                      key={playerStat.player.id}
                      className={`p-4 rounded-lg border-2 ${
                        index === 0
                          ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300"
                          : index === 1
                          ? "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300"
                          : "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-lg text-slate-900">
                                {playerStat.player.name}
                              </p>
                              {team.captainId === playerStat.player.id && (
                                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold border border-amber-200">
                                  👑 Captain
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">
                              {playerStat.roundsPlayed} rounds played
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">
                            {playerStat.averageScore.toFixed(1)}
                          </p>
                          <p className="text-sm text-slate-600">avg score</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Player Stats */}
            {playerStats.length > 0 && (
              <div className="card-elevated card-spacing">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Player Statistics
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                          Player
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                          Stroke Play
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                          Avg Score
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                          Best
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                          To Par
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                          Handicap
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerStats
                        .sort((a, b) => a.averageScore - b.averageScore)
                        .map((stat) => (
                          <tr
                            key={stat.player.id}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">
                                  {stat.player.name}
                                </span>
                                {team.captainId === stat.player.id && (
                                  <span className="text-sm">👑</span>
                                )}
                              </div>
                            </td>
                            <td className="text-center py-3 px-4 text-slate-700">
                              {stat.roundsPlayed > 0 ? stat.roundsPlayed : "-"}
                            </td>
                            <td className="text-center py-3 px-4 font-semibold text-slate-900">
                              {stat.roundsPlayed > 0
                                ? stat.averageScore.toFixed(1)
                                : "-"}
                            </td>
                            <td className="text-center py-3 px-4 font-semibold text-emerald-700">
                              {stat.roundsPlayed > 0 ? stat.bestScore : "-"}
                            </td>
                            <td className="text-center py-3 px-4 font-semibold text-blue-700">
                              {stat.roundsPlayed > 0
                                ? formatToPar(stat.toPar)
                                : "-"}
                            </td>
                            <td className="text-center py-3 px-4 text-slate-600">
                              {stat.player.handicap !== undefined
                                ? stat.player.handicap
                                : "-"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No Data State */}
            {teamStats.roundsPlayed === 0 && (
              <div className="card-elevated card-spacing text-center">
                <div className="py-12">
                  <span className="text-6xl mb-4 block">📊</span>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    No Statistics Yet
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Start playing rounds to see team statistics and performance
                    data.
                  </p>
                  <Link
                    to={`/tour/${tourId}/rounds`}
                    className="btn-primary inline-block"
                  >
                    Add Round
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Player Detail View Component
interface PlayerDetailViewProps {
  playerStats: PlayerStats;
  tour: any;
  team: any;
}

const PlayerDetailView = ({
  playerStats,
  tour,
  team,
}: PlayerDetailViewProps) => {
  const { player, roundsPlayed, averageScore, bestScore, toPar } = playerStats;
  const isCaptain = team.captainId === player.id;

  // Get all rounds for this player (including Ryder Cup rounds)
  const playerRounds = tour.rounds
    .filter((round: any) => {
      // Check for Ryder Cup/match play rounds
      if (round.isMatchPlay && round.ryderCup?.matches) {
        return round.ryderCup.matches.some(
          (match: any) =>
            match.teamA.playerIds.includes(player.id) ||
            match.teamB.playerIds.includes(player.id)
        );
      }
      // Check for regular rounds
      return round.scores[player.id] !== undefined;
    })
    .map((round: any) => {
      // For Ryder Cup/match play rounds, show participation info instead of score
      if (round.isMatchPlay && round.ryderCup?.matches) {
        const playerMatches = round.ryderCup.matches.filter(
          (match: any) =>
            match.teamA.playerIds.includes(player.id) ||
            match.teamB.playerIds.includes(player.id)
        );

        const matchesPlayed = playerMatches.length;
        const matchesWon = playerMatches.filter((match: any) => {
          const isTeamA = match.teamA.playerIds.includes(player.id);
          return (
            (isTeamA && match.winner === "team-a") ||
            (!isTeamA && match.winner === "team-b")
          );
        }).length;

        return {
          round,
          isMatchPlay: true,
          matchesPlayed,
          matchesWon,
          score: 0,
          toPar: 0,
          par:
            round.totalPar ||
            round.holeInfo.reduce((s: number, h: any) => s + h.par, 0),
        };
      }

      // Regular stroke play round
      const score = round.scores[player.id];
      const totalScore = score.totalScore || 0;
      const par =
        round.totalPar ||
        round.holeInfo.reduce((s: number, h: any) => s + h.par, 0);
      const roundToPar = totalScore - par;

      return {
        round,
        isMatchPlay: false,
        score: totalScore,
        toPar: roundToPar,
        par,
      };
    });

  return (
    <>
      {/* Player Header */}
      <div className="card-elevated card-spacing">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">
                {player.name}
              </h2>
              {isCaptain && (
                <span className="bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full font-semibold border border-amber-200">
                  👑 Captain
                </span>
              )}
            </div>
            {player.handicap !== undefined && (
              <p className="text-slate-600">Handicap: {player.handicap}</p>
            )}
          </div>
        </div>
      </div>

      {/* Player Statistics */}
      {roundsPlayed > 0 || playerRounds.length > 0 ? (
        <>
          {roundsPlayed > 0 && (
            <div className="card-elevated card-spacing">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Performance Stats
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <span>🏌️</span>
                    <span className="text-sm font-medium">Stroke Play</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {roundsPlayed}
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-700 mb-1">
                    <span>📊</span>
                    <span className="text-sm font-medium">Avg Score</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">
                    {averageScore.toFixed(1)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 text-purple-700 mb-1">
                    <span>🏆</span>
                    <span className="text-sm font-medium">Best Score</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {bestScore}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700 mb-1">
                    <span>⛳</span>
                    <span className="text-sm font-medium">To Par</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">
                    {formatToPar(toPar)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {roundsPlayed === 0 && playerRounds.length > 0 && (
            <div className="card-elevated card-spacing">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                <p className="text-sm text-blue-700 mb-1">⚔️ Match Play Only</p>
                <p className="text-slate-600 text-sm">
                  This player has participated in {playerRounds.length} Ryder
                  Cup round{playerRounds.length > 1 ? "s" : ""}. Stroke play
                  statistics are not available for match play rounds.
                </p>
              </div>
            </div>
          )}

          {/* Round History */}
          <div className="card-elevated card-spacing">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Round History
            </h3>
            <div className="space-y-3">
              {playerRounds.map((roundData: any, index: number) => (
                <div
                  key={roundData.round.id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {roundData.isMatchPlay
                            ? "⚔️"
                            : index === 0 && roundData.score === bestScore
                            ? "🏆"
                            : "📋"}
                        </span>
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {roundData.round.name}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {roundData.round.courseName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {roundData.isMatchPlay ? (
                              <>Match Play • {roundData.round.holes} holes</>
                            ) : (
                              <>
                                Par {roundData.par} • {roundData.round.holes}{" "}
                                holes
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {roundData.isMatchPlay ? (
                        <>
                          <p className="text-2xl font-bold text-slate-900">
                            {roundData.matchesWon}/{roundData.matchesPlayed}
                          </p>
                          <p className="text-sm font-semibold text-slate-600">
                            Matches Won
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-3xl font-bold text-slate-900">
                            {roundData.score}
                          </p>
                          <p
                            className={`text-sm font-semibold ${
                              roundData.toPar < 0
                                ? "text-emerald-600"
                                : roundData.toPar > 0
                                ? "text-red-600"
                                : "text-slate-600"
                            }`}
                          >
                            {formatToPar(roundData.toPar)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card-elevated card-spacing text-center py-12">
          <span className="text-6xl mb-4 block">📊</span>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No Rounds Yet
          </h3>
          <p className="text-slate-600">
            {player.name} hasn't played any rounds yet.
          </p>
        </div>
      )}
    </>
  );
};
