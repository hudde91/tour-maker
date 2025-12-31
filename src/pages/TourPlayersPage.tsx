import { AddPlayerSheet } from "@/components/players/AddPlayerSheet";
import { PlayerScorecard } from "@/components/players/PlayerScorecard";
import { CreateTeamSheet } from "@/components/teams/CreateTeamSheet";
import { TeamCard } from "@/components/teams/TeamCard";
import { useTour } from "@/hooks/useTours";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Users,
  XCircle,
  Home,
  Flag,
  Plus,
  Building2,
  AlertTriangle,
  Crown,
} from "lucide-react";

export const TourPlayersPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const { data: tour, isLoading } = useTour(tourId!);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  // Scroll to top when page loads to ensure PageHeader is visible
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePlayerToggle = (playerId: string) => {
    setExpandedPlayer(expandedPlayer === playerId ? null : playerId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-8 h-8 text-emerald-600" />
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
              <XCircle className="w-10 h-10 text-red-600" />
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
  const isRyderCup = tour.format === "ryder-cup";

  const breadcrumbs = [
    { label: "Tours", path: "/", icon: <Home className="w-4 h-4" /> },
    {
      label: tour.name,
      path: `/tour/${tourId}/players`,
      icon: <Flag className="w-4 h-4" />,
    },
    {
      label: isTeamFormat ? "Teams & Players" : "Players",
      icon: <Users className="w-4 h-4" />,
    },
  ];

  const playerCount = tour.players.length;
  const teamCount = tour.teams?.length || 0;
  const subtitle =
    isTeamFormat && teamCount > 0
      ? `${playerCount} player${
          playerCount !== 1 ? "s" : ""
        } • ${teamCount} team${teamCount !== 1 ? "s" : ""}`
      : `${playerCount} player${playerCount !== 1 ? "s" : ""}`;

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top">
      <PageHeader
        title={tour.name}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        actions={
          <button
            onClick={() => setShowAddPlayer(true)}
            className="flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-medium transition-all hover:bg-opacity-30 text-sm shadow-lg"
            data-testid="add-player-button"
          >
            <Plus className="w-4 h-4" />
            <span>Add Player</span>
          </button>
        }
      />

      <div className="-mt-4 pb-8 w-full max-w-6xl mx-auto space-y-6">
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
                data-testid="add-team-button"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Add Team
              </button>
            </div>

            {!tour.teams || tour.teams.length === 0 ? (
              <EmptyState
                icon={<Building2 className="w-8 h-8 text-slate-400" />}
                title="No Teams Created"
                description="Create teams to organize your tournament competition"
                action={{
                  label: "Add First Team",
                  onClick: () => setShowCreateTeam(true),
                  variant: "primary",
                }}
                size="medium"
              />
            ) : (
              <div className="space-y-6">
                {tour.teams.map((team) => (
                  <TeamCard key={team.id} team={team} tour={tour} />
                ))}

                {tour.players.filter((p) => !p.teamId).length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
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

        {/* All Players Section - Different display based on format */}
        <div className="card-elevated card-spacing">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="section-header">All Players</h2>
              {isTeamFormat && (
                <p className="text-slate-600 text-xs mt-1">
                  {isRyderCup
                    ? "Individual scores shown on Leaderboard tab"
                    : "View individual player details"}
                </p>
              )}
            </div>
            <span className="text-sm text-slate-500">
              {tour.players.length} total
            </span>
          </div>

          {tour.players.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-slate-400" />}
              title="No Players Yet"
              description="Add players to get your tournament started"
              action={{
                label: "Add First Player",
                onClick: () => setShowAddPlayer(true),
                variant: "primary",
              }}
              size="medium"
            />
          ) : isTeamFormat ? (
            // For team formats, show simplified player list
            <div className="space-y-2">
              {tour.players.map((player) => {
                const team = tour.teams?.find((t) => t.id === player.teamId);
                const isCaptain = team?.captainId === player.id;

                return (
                  <div
                    key={player.id}
                    className="p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-semibold text-slate-700">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              {player.name}
                            </span>
                            {isCaptain && (
                              <Crown className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          {team && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: team.color }}
                              />
                              <span className="text-sm text-slate-600">
                                {team.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {player.handicap !== undefined && (
                        <div className="text-sm text-slate-600">
                          HC {player.handicap}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // For individual format, show detailed scorecards
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
