import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTour } from "../hooks/useTours";
import { AddPlayerModal } from "../components/AddPlayerModal";
import { PlayerCard } from "../components/PlayerCard";
import { PlayerScorecard } from "../components/PlayerScorecard";
import { CreateTeamModal } from "../components/CreateTeamModal";
import { TeamCard } from "../components/TeamCard";
import { RoundCard } from "../components/RoundCard";
import { TournamentLeaderboard } from "../components/TournamentLeaderboard";

export const TourPage = () => {
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 12.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
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

  const handleShareTournament = () => {
    navigator.clipboard.writeText(window.location.href);
    // You could add a toast notification here
    alert("Tournament link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top">
      {/* Professional Header */}
      <div className="golf-hero-bg">
        <div className="p-6">
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

            <button
              onClick={handleShareTournament}
              className="flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition-all hover:bg-opacity-30"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              Share Tournament
            </button>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{tour.name}</h1>
            {tour.description && (
              <p className="text-emerald-100 text-lg">{tour.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-8 max-w-6xl mx-auto">
        {/* Tournament Overview */}
        <div className="card-elevated mb-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <h2 className="section-header">Tournament Overview</h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                tour.isActive ? "status-active" : "status-completed"
              }`}
            >
              {tour.isActive ? "Active Tournament" : "Completed"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {tour.players.length}
              </div>
              <div className="text-caption">Players Registered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {tour.rounds.length}
              </div>
              <div className="text-caption">Tournament Rounds</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {tour.teams?.length || 0}
              </div>
              <div className="text-caption">
                {tour.format === "individual"
                  ? "Individual Format"
                  : "Teams Created"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1 capitalize">
                {tour.format.replace("-", " ")}
              </div>
              <div className="text-caption">Competition Format</div>
            </div>
          </div>
        </div>

        {/* Players Section with Scorecards */}
        <div className="card mb-6 max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="section-header">
              Tournament Players ({tour.players.length})
            </h2>
            <button
              onClick={() => setShowAddPlayer(true)}
              className="btn-secondary"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Player
            </button>
          </div>

          {tour.players.length === 0 ? (
            <div className="text-center py-12 max-w-md mx-auto">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 715.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 414 0zM7 10a2 2 0 11-4 0 2 2 0 414 0z"
                  />
                </svg>
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
            <div className="space-y-4 max-w-4xl mx-auto">
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
          <div className="card mb-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="section-header">
                Tournament Teams ({tour.teams?.length || 0})
              </h2>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="btn-secondary"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Team
              </button>
            </div>

            {!tour.teams || tour.teams.length === 0 ? (
              <div className="text-center py-12 max-w-md mx-auto">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 715.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 414 0zM7 10a2 2 0 11-4 0 2 2 0 414 0z"
                    />
                  </svg>
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
              <div className="space-y-6 max-w-4xl mx-auto">
                {tour.teams.map((team) => (
                  <TeamCard key={team.id} team={team} tour={tour} />
                ))}

                {/* Unassigned Players Warning */}
                {tour.players.filter((p) => !p.teamId).length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-amber-100 rounded">
                        <svg
                          className="w-4 h-4 text-amber-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 12.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      </div>
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
        <div className="card mb-6 max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="section-header">
              Tournament Rounds ({tour.rounds.length})
            </h2>
            <Link to={`/tour/${tourId}/create-round`} className="btn-secondary">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Round
            </Link>
          </div>

          {tour.rounds.length === 0 ? (
            <div className="text-center py-12 max-w-md mx-auto">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
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
            <div className="grid gap-4 max-w-4xl mx-auto">
              {tour.rounds.map((round) => (
                <RoundCard key={round.id} round={round} tour={tour} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddPlayerModal
        tour={tour}
        isOpen={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
      />

      <CreateTeamModal
        tour={tour}
        isOpen={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
      />
    </div>
  );
};
