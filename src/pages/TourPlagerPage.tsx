import { AddPlayerSheet } from "@/components/players/AddPlayerSheet";
import { PlayerScorecard } from "@/components/players/PlayerScorecard";
import { CreateTeamSheet } from "@/components/teams/CreateTeamSheet";
import { TeamCard } from "@/components/teams/TeamCard";
import { useTour } from "@/hooks/useTours";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";

export const TourPlayersPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const { data: tour, isLoading } = useTour(tourId!);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const handlePlayerToggle = (playerId: string) => {
    setExpandedPlayer(expandedPlayer === playerId ? null : playerId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">👥</span>
          </div>
          <div className="text-lg font-semibold text-slate-700">
            Loading players...
          </div>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-slate-50 safe-area-top">
        <div className="p-4 md:p-6">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-3">
              Tournament Not Found
            </h3>
            <Link to="/" className="btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isTeamFormat = tour.format === "team" || tour.format === "ryder-cup";

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top">
      <div className="golf-hero-bg">
        <div className="p-4 md:p-6 w-full max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Link to="/" className="nav-back">
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>

            <button
              onClick={() => setShowAddPlayer(true)}
              className="flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-medium transition-all hover:bg-opacity-30 text-sm"
            >
              <span className="text-base">➕</span>
              <span>Add Player</span>
            </button>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              Players
            </h1>
            <p className="text-emerald-100 text-sm md:text-base">
              {tour.players.length} player{tour.players.length !== 1 ? "s" : ""}{" "}
              in {tour.name}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-8 w-full max-w-6xl mx-auto space-y-6">
        <div className="card-elevated card-spacing">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-header">All Players</h2>
            <span className="text-sm text-slate-500">
              {tour.players.length} total
            </span>
          </div>

          {tour.players.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-3">
                No Players Yet
              </h3>
              <p className="text-slate-500 mb-6">
                Add players to get your tournament started
              </p>
              <button
                onClick={() => setShowAddPlayer(true)}
                className="btn-primary"
              >
                Add First Player
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tour.players.map((player) => (
                <PlayerScorecard
                  key={player.id}
                  player={player}
                  tour={tour}
                  isExpanded={expandedPlayer === player.id}
                  onToggle={() => handlePlayerToggle(player.id)}
                />
              ))}
            </div>
          )}
        </div>

        {isTeamFormat && (
          <div className="card card-spacing">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="section-header">Teams</h2>
                <p className="text-slate-600 text-sm">
                  {tour.teams?.length || 0} team
                  {tour.teams?.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="btn-secondary text-sm"
              >
                <span className="text-base mr-2">🏗️</span>
                Create Team
              </button>
            </div>

            {!tour.teams || tour.teams.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🏗️</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-3">
                  No Teams Created
                </h3>
                <p className="text-slate-500 mb-6">
                  Create teams to organize your tournament competition
                </p>
                <button
                  onClick={() => setShowCreateTeam(true)}
                  className="btn-primary"
                >
                  Create First Team
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {tour.teams.map((team) => (
                  <TeamCard key={team.id} team={team} tour={tour} />
                ))}

                {tour.players.filter((p) => !p.teamId).length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-1">
                          {tour.players.filter((p) => !p.teamId).length}{" "}
                          Unassigned Player
                          {tour.players.filter((p) => !p.teamId).length !== 1
                            ? "s"
                            : ""}
                        </h4>
                        <p className="text-sm text-amber-800 mb-2">
                          These players need to be assigned to teams:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tour.players
                            .filter((p) => !p.teamId)
                            .map((player) => (
                              <span
                                key={player.id}
                                className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm font-medium"
                              >
                                {player.name}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <AddPlayerSheet
        tour={tour}
        isOpen={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
      />

      {isTeamFormat && (
        <CreateTeamSheet
          tour={tour}
          isOpen={showCreateTeam}
          onClose={() => setShowCreateTeam(false)}
        />
      )}
    </div>
  );
};
