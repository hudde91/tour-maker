import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTour, useDeleteTour } from "../hooks/useTours";
import { AddPlayerSheet } from "../components/AddPlayerSheet";
import { PlayerScorecard } from "../components/PlayerScorecard";
import { CreateTeamSheet } from "../components/CreateTeamSheet";
import { TeamCard } from "../components/TeamCard";
import { RoundCard } from "../components/RoundCard";
import { TournamentLeaderboard } from "../components/TournamentLeaderboard";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";

export const TourPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const { data: tour, isLoading } = useTour(tourId!);
  const deleteTour = useDeleteTour();
  const { showToast, ToastComponent } = useToast();

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePlayerToggle = (playerId: string) => {
    setExpandedPlayer(expandedPlayer === playerId ? null : playerId);
  };

  const handleDeleteTournament = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!tour) return;

    try {
      await deleteTour.mutateAsync(tour.id);
      navigate("/"); // Navigate back to home after deletion
    } catch (error) {
      console.error("Failed to delete tournament:", error);
      alert("Failed to delete tournament. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleShareTournament = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Tournament link copied to clipboard!", "success");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 font-medium">Loading tournament...</div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-slate-50 safe-area-top">
        <div className="p-6">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-3">
              Tournament Not Found
            </h3>
            <p className="text-slate-500 mb-6">
              The tournament you're looking for doesn't exist or has been
              removed.
            </p>
            <Link to="/" className="btn-primary">
              Back to Tournaments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top">
      {/* Professional Header */}
      <div className="golf-hero-bg">
        <div className="p-6 w-full max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
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

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareTournament}
                className="flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-medium transition-all hover:bg-opacity-30 text-sm"
              >
                <span className="text-base">🔗</span>
                <span className="hidden sm:inline">Share</span>
              </button>

              <button
                onClick={handleDeleteTournament}
                disabled={deleteTour.isPending}
                className="flex items-center gap-2 bg-red-600 bg-opacity-20 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-medium transition-all hover:bg-opacity-30 disabled:opacity-50 text-sm"
                title="Delete tournament"
              >
                <span className="text-base">🗑️</span>
                <span className="hidden sm:inline">
                  {deleteTour.isPending ? "Deleting..." : "Delete"}
                </span>
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {tour.name}
            </h1>
            {tour.description && (
              <p className="text-emerald-100 text-base md:text-lg">
                {tour.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-8 w-full max-w-6xl mx-auto">
        {/* Tournament Overview */}
        <div className="card-elevated mb-6 w-full max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="section-header">Tournament Overview</h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold self-start sm:self-auto ${
                tour.isActive ? "status-active" : "status-completed"
              }`}
            >
              {tour.isActive ? "🟢 Active Tournament" : "🔵 Completed"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                {tour.players.length}
              </div>
              <div className="text-xs md:text-sm text-slate-500 font-medium">
                Players Registered
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                {tour.rounds.length}
              </div>
              <div className="text-xs md:text-sm text-slate-500 font-medium">
                Tournament Rounds
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">
                {tour.format === "individual"
                  ? "👤"
                  : tour.format === "team"
                  ? "👥"
                  : "🏆"}
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                {tour.teams?.length ||
                  (tour.format === "individual" ? "Solo" : "0")}
              </div>
              <div className="text-xs md:text-sm text-slate-500 font-medium">
                {tour.format === "individual"
                  ? "Individual Format"
                  : "Teams Created"}
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🏷️</div>
              <div className="text-lg md:text-xl font-bold text-slate-900 mb-1 capitalize">
                {tour.format.replace("-", " ")}
              </div>
              <div className="text-xs md:text-sm text-slate-500 font-medium">
                Competition Format
              </div>
            </div>
          </div>
        </div>

        {/* Players Section with Scorecards */}
        <div className="card mb-6 w-full max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="section-header">Tournament Players</h2>
              <p className="text-slate-600 text-sm">
                {tour.players.length} registered participants
              </p>
            </div>
            <button
              onClick={() => setShowAddPlayer(true)}
              className="btn-secondary self-start sm:self-auto"
            >
              <span className="text-base mr-2">➕</span>
              Add Player
            </button>
          </div>

          {tour.players.length === 0 ? (
            <div className="text-center py-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-3">
                No Players Registered
              </h3>
              <p className="text-slate-500 mb-6">
                Add players to get your tournament started
              </p>
              <button
                onClick={() => setShowAddPlayer(true)}
                className="btn-primary"
              >
                Register First Player
              </button>
            </div>
          ) : (
            <div className="space-y-4 w-full max-w-4xl mx-auto">
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

        {/* Teams Section - Only for team formats */}
        {(tour.format === "team" || tour.format === "ryder-cup") && (
          <div className="card mb-6 w-full max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="section-header">Tournament Teams</h2>
                <p className="text-slate-600 text-sm">
                  {tour.teams?.length || 0} teams competing
                </p>
              </div>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="btn-secondary self-start sm:self-auto"
              >
                <span className="text-base mr-2">🏗️</span>
                Create Team
              </button>
            </div>

            {!tour.teams || tour.teams.length === 0 ? (
              <div className="text-center py-12 max-w-md mx-auto">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
              <div className="space-y-6 w-full max-w-4xl mx-auto">
                {tour.teams.map((team) => (
                  <TeamCard key={team.id} team={team} tour={tour} />
                ))}

                {/* Unassigned Players Warning */}
                {tour.players.filter((p) => !p.teamId).length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-1">
                          {tour.players.filter((p) => !p.teamId).length}{" "}
                          Unassigned Players
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

        {/* Tournament Leaderboard Section */}
        {tour.players.length > 0 && tour.rounds.length > 0 && (
          <div className="mb-6">
            <TournamentLeaderboard tour={tour} />
          </div>
        )}

        {/* Rounds Section */}
        <div className="card mb-6 w-full max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="section-header">Tournament Rounds</h2>
              <p className="text-slate-600 text-sm">
                {tour.rounds.length} rounds configured
              </p>
            </div>
            <Link
              to={`/tour/${tourId}/create-round`}
              className="btn-secondary self-start sm:self-auto"
            >
              <span className="text-base mr-2">🏌️</span>
              Create Round
            </Link>
          </div>

          {tour.rounds.length === 0 ? (
            <div className="text-center py-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🏌️</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-3">
                No Rounds Created
              </h3>
              <p className="text-slate-500 mb-6">
                Create tournament rounds to start playing golf
              </p>
              <Link to={`/tour/${tourId}/create-round`} className="btn-primary">
                Create First Round
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 w-full max-w-4xl mx-auto">
              {tour.rounds.map((round) => (
                <RoundCard key={round.id} round={round} tour={tour} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sheets */}
      <AddPlayerSheet
        tour={tour}
        isOpen={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
      />

      <CreateTeamSheet
        tour={tour}
        isOpen={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Tournament"
        message={`Delete tournament "${tour.name}"? All players, teams, rounds, and scores will be permanently lost. This action cannot be undone.`}
        confirmLabel="Delete Tournament"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDestructive={true}
      />

      {/* Toast Notifications */}
      <ToastComponent />
    </div>
  );
};
