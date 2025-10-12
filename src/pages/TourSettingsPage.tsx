import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useTour, useDeleteTour } from "@/hooks/useTours";
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

export const TourSettingsPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const { data: tour, isLoading } = useTour(tourId!);
  const deleteTour = useDeleteTour();
  const { showToast, ToastComponent } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleShareTournament = () => {
    const url = `${window.location.origin}/tour/${tourId}`;
    navigator.clipboard.writeText(url);
    showToast("Tournament link copied to clipboard!", "success");
  };

  const handleDeleteTournament = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!tour) return;

    try {
      await deleteTour.mutateAsync(tour.id);
      showToast("Tournament deleted successfully", "success");
      navigate("/");
    } catch (error) {
      console.error("Failed to delete tournament:", error);
      showToast("Failed to delete tournament. Please try again.", "error");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">⚙️</span>
          </div>
          <div className="text-lg font-semibold text-slate-700">
            Loading settings...
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

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top">
      <div className="golf-hero-bg">
        <div className="p-4 md:p-6 w-full max-w-6xl mx-auto">
          <div className="flex items-center mb-3">
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
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              Settings
            </h1>
            <p className="text-emerald-100 text-sm md:text-base">
              Manage {tour.name}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-8 w-full max-w-6xl mx-auto space-y-6">
        <div className="card-elevated">
          <h2 className="section-header mb-4">Tournament Information</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">
                Name
              </label>
              <div className="text-base text-slate-900 font-medium">
                {tour.name}
              </div>
            </div>

            {tour.description && (
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-1">
                  Description
                </label>
                <div className="text-base text-slate-700">
                  {tour.description}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">
                Format
              </label>
              <div className="text-base text-slate-900 font-medium capitalize">
                {tour.format.replace("-", " ")}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">
                Status
              </label>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  tour.isActive ? "status-active" : "status-completed"
                }`}
              >
                {tour.isActive ? "🟢 Active" : "🔵 Completed"}
              </span>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">
                Created
              </label>
              <div className="text-base text-slate-700">
                {new Date(tour.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-header mb-4">Actions</h2>

          <div className="space-y-3">
            <button
              onClick={handleShareTournament}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🔗</span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    Share Tournament
                  </div>
                  <div className="text-sm text-slate-500">
                    Copy link to clipboard
                  </div>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-slate-400"
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
            </button>

            <button
              disabled
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-lg text-left opacity-50 cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    Export Data
                  </div>
                  <div className="text-sm text-slate-500">
                    Download scores and stats (Coming soon)
                  </div>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-slate-400"
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
            </button>
          </div>
        </div>

        <div className="card border-red-200">
          <h2 className="section-header text-red-700 mb-4 flex items-center gap-2">
            <span>⚠️</span>
            Danger Zone
          </h2>

          <div className="space-y-3">
            <button
              onClick={handleDeleteTournament}
              disabled={deleteTour.isPending}
              className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                  <span className="text-xl">🗑️</span>
                </div>
                <div>
                  <div className="font-semibold text-red-900">
                    Delete Tournament
                  </div>
                  <div className="text-sm text-red-700">
                    Permanently remove all data
                  </div>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-red-400"
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
            </button>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> Deleting this tournament will
              permanently remove all players, teams, rounds, and scores. This
              action cannot be undone.
            </p>
          </div>
        </div>

        <div className="card bg-slate-50 border-slate-300">
          <div className="text-center text-slate-500 text-sm">
            <p className="font-semibold text-slate-700 mb-1">Tour Maker</p>
            <p>Professional Golf Tournament Management</p>
            <p className="mt-2 text-xs">Version 1.0.0</p>
          </div>
        </div>
      </div>

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
