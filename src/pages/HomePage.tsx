import { useState } from "react";
import { Link } from "react-router-dom";
import { useTours, useDeleteTour } from "../hooks/useTours";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

export const HomePage = () => {
  const { data: tours = [], isLoading } = useTours();
  const deleteTour = useDeleteTour();
  const { showToast, ToastComponent } = useToast();

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    tourId: string;
    tourName: string;
  }>({
    isOpen: false,
    tourId: "",
    tourName: "",
  });

  const handleDeleteTour = (
    e: React.MouseEvent,
    tourId: string,
    tourName: string
  ) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Stop event bubbling

    setDeleteConfirm({
      isOpen: true,
      tourId,
      tourName,
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteTour.mutateAsync(deleteConfirm.tourId);
      setDeleteConfirm({ isOpen: false, tourId: "", tourName: "" });
      showToast("Tournament deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete tournament:", error);
      showToast("Failed to delete tournament. Please try again.", "error");
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, tourId: "", tourName: "" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 font-medium">Loading tournaments...</div>
      </div>
    );
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "individual":
        return "👤"; // Person icon - clear for individual
      case "team":
        return "👥"; // Group icon - clear for teams
      case "ryder-cup":
        return "🏆"; // Trophy icon - premium/championship feel
      default:
        return "⛳"; // Golf flag as default
    }
  };

  const getStatusInfo = (tour: any) => {
    if (!tour.isActive) {
      return {
        text: "Completed",
        style: "bg-blue-100 text-blue-800 border-blue-200",
      };
    }

    const hasActiveRounds = tour.rounds.some(
      (r: any) => r.status === "in-progress"
    );
    if (hasActiveRounds) {
      return {
        text: "Live",
        style: "bg-red-100 text-red-800 border-red-200 animate-pulse",
      };
    }

    return {
      text: "Active",
      style: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
  };

  return (
    <div className="min-h-screen golf-bg-pattern w-full">
      {/* Hero Section - Full Width */}
      <div className="golf-hero-bg safe-area-top w-full">
        <div className="p-6 pb-12 w-full max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Tour Maker
            </h1>
            <p className="text-emerald-100 text-lg md:text-xl font-medium">
              Professional Golf Tournament Management
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 pb-8 w-full max-w-6xl mx-auto">
        {/* Create Tournament Card */}
        <div className="card-elevated mb-8 w-full max-w-2xl mx-auto">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-3xl">⛳</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              Create New Tournament
            </h2>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
              Set up a professional golf tournament with players, teams, and
              multiple rounds
            </p>
            <Link
              to="/create"
              className="btn-primary text-lg py-4 px-8 shadow-lg w-full sm:w-auto"
            >
              Create Tournament
            </Link>
          </div>
        </div>

        {/* Tournaments Section */}
        <div className="section-spacing">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 w-full max-w-5xl mx-auto">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Your Tournaments
              </h2>
              <p className="text-slate-600 text-base md:text-lg">
                Manage and track all your golf competitions
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-semibold border border-emerald-200 self-start sm:self-auto">
              {tours.length} Total
            </span>
          </div>

          {tours.length === 0 ? (
            <div className="card-elevated w-full max-w-2xl mx-auto">
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📋</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mb-4">
                  No Tournaments Yet
                </h3>
                <p className="text-slate-500 text-lg mb-8 leading-relaxed max-w-md mx-auto">
                  Create your first tournament to get started with professional
                  golf management
                </p>
                <Link to="/create" className="btn-primary text-lg py-3 px-6">
                  Get Started
                </Link>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto space-y-4">
              {tours.map((tour) => {
                const statusInfo = getStatusInfo(tour);

                return (
                  <div
                    key={tour.id}
                    className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 md:p-6 hover:shadow-xl transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <Link to={`/tour/${tour.id}`} className="flex-1 min-w-0">
                        <div className="space-y-3">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Tournament Icon & Header */}
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                  <span className="text-xl md:text-2xl">
                                    {getFormatIcon(tour.format)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <h3 className="text-lg md:text-xl font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                                    {tour.name}
                                  </h3>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold border self-start ${statusInfo.style}`}
                                  >
                                    {statusInfo.text}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Tournament Stats */}
                            <div className="grid grid-cols-2 md:flex md:items-center gap-3 md:gap-6 text-xs md:text-sm text-slate-500">
                              <div className="flex items-center gap-1">
                                <span className="text-sm">👥</span>
                                <span className="font-medium">
                                  {tour.players.length} Players
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-sm">📋</span>
                                <span className="font-medium">
                                  {tour.rounds.length} Rounds
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-sm">🏷️</span>
                                <span className="font-medium capitalize">
                                  {tour.format.replace("-", " ")}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-sm">📅</span>
                                <span className="font-medium">
                                  {new Date(
                                    tour.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Tournament Description - positioned below stats but aligned with tournament name */}
                          {tour.description && (
                            <div className="flex items-start gap-4">
                              <div className="w-12 md:w-16 flex-shrink-0"></div>
                              <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed flex-1 min-w-0">
                                {tour.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="flex items-center gap-2 ml-2">
                        {/* Delete Button */}
                        <button
                          onClick={(e) =>
                            handleDeleteTour(e, tour.id, tour.name)
                          }
                          disabled={deleteTour.isPending}
                          className="p-2 md:p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 touch-manipulation"
                          title="Delete tournament"
                        >
                          <svg
                            className="w-4 h-4 md:w-5 md:h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>

                        {/* Navigation Arrow */}
                        <div className="flex-shrink-0">
                          <svg
                            className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-emerald-600 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Tournament"
        message={`Delete tournament "${deleteConfirm.tourName}"? All players, teams, rounds, and scores will be permanently lost. This action cannot be undone.`}
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
