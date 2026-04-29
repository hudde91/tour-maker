import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  useTour,
  useDeleteTour,
  useUpdateTourDetails,
  useToggleTourArchive,
  useUpdateTourFormat,
  useUpdateScoringConfig,
} from "@/hooks/useTours";
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { TourFormat, ScoringConfig } from "@/types";
import { DEFAULT_SCORING_CONFIG } from "@/types";
import { ScoringConfigStep } from "@/components/tournament/ScoringConfigStep";
import { useTourRole } from "@/hooks/useTourRole";
import {
  Settings,
  XCircle,
  Home,
  Flag,
  Edit,
  Circle,
  Archive,
  FolderOpen,
  User,
  Users,
  Trophy,
  Check,
  Link as LinkIcon,
  BarChart,
  Trash2,
  RotateCw,
  AlertTriangle,
} from "lucide-react";

export const TourSettingsPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const { data: tour, isLoading } = useTour(tourId!);
  const { isOwner } = useTourRole(tour);
  const deleteTour = useDeleteTour();
  const updateTourDetails = useUpdateTourDetails();
  const toggleArchive = useToggleTourArchive();
  const updateFormat = useUpdateTourFormat();
  const updateScoringConfig = useUpdateScoringConfig();
  const { showToast, ToastComponent } = useToast();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFormatChangeConfirm, setShowFormatChangeConfirm] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isEditingScoring, setIsEditingScoring] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newFormat, setNewFormat] = useState<TourFormat>("individual");
  const [editScoringConfig, setEditScoringConfig] = useState<ScoringConfig>({ ...DEFAULT_SCORING_CONFIG });

  const handleShareTournament = () => {
    const url = `${window.location.origin}/tour/${tourId}/join`;
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

  const startEditingDetails = () => {
    if (tour) {
      setEditName(tour.name);
      setEditDescription(tour.description || "");
      setIsEditingDetails(true);
    }
  };

  const cancelEditingDetails = () => {
    setIsEditingDetails(false);
    setEditName("");
    setEditDescription("");
  };

  const saveDetails = async () => {
    if (!tour || !editName.trim()) {
      showToast("Tournament name is required", "error");
      return;
    }

    try {
      await updateTourDetails.mutateAsync({
        tourId: tour.id,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      showToast("Tournament details updated successfully", "success");
      setIsEditingDetails(false);
    } catch (error) {
      console.error("Failed to update tournament details:", error);
      showToast("Failed to update tournament details", "error");
    }
  };

  const handleToggleArchive = async () => {
    if (!tour) return;

    try {
      await toggleArchive.mutateAsync(tour.id);
      const message = tour.archived
        ? "Tournament unarchived successfully"
        : "Tournament archived successfully";
      showToast(message, "success");
    } catch (error) {
      console.error("Failed to toggle archive status:", error);
      showToast("Failed to update archive status", "error");
    }
  };

  const handleFormatChange = (format: TourFormat) => {
    setNewFormat(format);
    setShowFormatChangeConfirm(true);
  };

  const confirmFormatChange = async () => {
    if (!tour) return;

    try {
      await updateFormat.mutateAsync({ tourId: tour.id, format: newFormat });
      showToast("Tournament format changed successfully", "success");
    } catch (error) {
      console.error("Failed to change tournament format:", error);
      showToast("Failed to change tournament format", "error");
    } finally {
      setShowFormatChangeConfirm(false);
    }
  };

  const cancelFormatChange = () => {
    setShowFormatChangeConfirm(false);
  };

  const startEditingScoring = () => {
    if (tour) {
      setEditScoringConfig(tour.scoringConfig ? { ...tour.scoringConfig } : { ...DEFAULT_SCORING_CONFIG });
      setIsEditingScoring(true);
    }
  };

  const cancelEditingScoring = () => {
    setIsEditingScoring(false);
  };

  const saveScoring = async () => {
    if (!tour) return;
    try {
      await updateScoringConfig.mutateAsync({
        tourId: tour.id,
        scoringConfig: editScoringConfig,
      });
      showToast("Scoring configuration updated", "success");
      setIsEditingScoring(false);
    } catch (error) {
      console.error("Failed to update scoring config:", error);
      showToast("Failed to update scoring configuration", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Settings className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="text-lg font-semibold text-white/70">
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen safe-area-top">
        <div className="p-4 md:p-6">
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white/70 mb-3">
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

  const breadcrumbs = [
    { label: "Home", path: "/", icon: <Home className="w-4 h-4" /> },
    {
      label: tour.name,
      path: `/tour/${tourId}`,
      icon: <Flag className="w-4 h-4" />,
    },
    { label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Settings"
        subtitle={`Manage ${tour.name}`}
        breadcrumbs={breadcrumbs}
      />

      <div className="pb-8 w-full max-w-6xl mx-auto space-y-6">
        {!isOwner && (
          <div className="card border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-300 mb-1">
                  Participant view
                </h3>
                <p className="text-sm text-amber-300/80">
                  Only the tournament owner can change settings, add players,
                  or create rounds.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header">Tournament Information</h2>
            {isOwner && !isEditingDetails && (
              <button
                onClick={startEditingDetails}
                className="text-emerald-400 hover:text-emerald-400 font-semibold text-sm flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {isEditingDetails ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white/50 block mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field"
                  placeholder="Enter tournament name"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-white/50 block mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="input-field"
                  placeholder="Enter tournament description (optional)"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveDetails}
                  disabled={updateTourDetails.isPending}
                  className="btn-primary flex-1"
                >
                  {updateTourDetails.isPending ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={cancelEditingDetails}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white/50 block mb-1">
                  Name
                </label>
                <div className="text-base text-white font-medium">
                  {tour.name}
                </div>
              </div>

              {tour.description && (
                <div>
                  <label className="text-sm font-semibold text-white/50 block mb-1">
                    Description
                  </label>
                  <div className="text-base text-white/70">
                    {tour.description}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-white/50 block mb-1">
                  Format
                </label>
                <div className="text-base text-white font-medium capitalize">
                  {tour.format.replace("-", " ")}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-white/50 block mb-1">
                  Status
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                      tour.isActive ? "status-active" : "status-completed"
                    }`}
                  >
                    <Circle
                      className={`w-3 h-3 fill-current ${tour.isActive ? "text-green-500" : "text-blue-500"}`}
                    />
                    {tour.isActive ? "Active" : "Completed"}
                  </span>
                  {tour.archived && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-white/10 text-white/70">
                      <Archive className="w-3 h-3" />
                      Archived
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-white/50 block mb-1">
                  Created
                </label>
                <div className="text-base text-white/70">
                  {new Date(tour.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {isOwner && (
          <div className="card">
            <h2 className="section-header mb-4">Tournament Format</h2>

            <div className="mb-4 p-3 bg-blue-500/15 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Changing the tournament format may affect
                existing teams and rounds. Proceed with caution.
              </p>
            </div>

            <div className="space-y-2">
              {["individual", "team", "ryder-cup"].map((format) => (
                <button
                  key={format}
                  onClick={() => handleFormatChange(format as TourFormat)}
                  disabled={tour.format === format}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors text-left ${
                    tour.format === format
                      ? "bg-emerald-500/15 border-2 border-emerald-500"
                      : "hover:bg-white/10 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tour.format === format
                          ? "bg-emerald-500/20"
                          : "bg-white/10"
                      }`}
                    >
                      {format === "individual" ? (
                        <User className="w-5 h-5 text-white/50" />
                      ) : format === "team" ? (
                        <Users className="w-5 h-5 text-white/50" />
                      ) : (
                        <Trophy className="w-5 h-5 text-white/50" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white capitalize">
                        {format.replace("-", " ")}
                      </div>
                      <div className="text-sm text-white/40">
                        {format === "individual"
                          ? "Solo tournament"
                          : format === "team"
                            ? "Team-based tournament"
                            : "Ryder Cup tournament"}
                      </div>
                    </div>
                  </div>
                  {tour.format === format && (
                    <Check className="w-5 h-5 text-emerald-400" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header">Scoring Configuration</h2>
            {isOwner && !isEditingScoring && (
              <button
                onClick={startEditingScoring}
                className="text-emerald-400 hover:text-emerald-400 font-semibold text-sm flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {isEditingScoring ? (
            <div className="space-y-4">
              <ScoringConfigStep
                config={editScoringConfig}
                onChange={setEditScoringConfig}
                hasTeams={tour.format === "team" || tour.format === "ryder-cup"}
              />

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={saveScoring}
                  disabled={updateScoringConfig.isPending}
                  className="btn-primary flex-1"
                >
                  {updateScoringConfig.isPending ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={cancelEditingScoring}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-white/50 block mb-1">
                  Scoring Method
                </label>
                <div className="text-base text-white font-medium">
                  {(tour.scoringConfig?.method || "total-score") === "total-score"
                    ? "Total Score (cumulative across rounds)"
                    : "Points Per Round (placement-based)"}
                </div>
              </div>

              {tour.scoringConfig?.method === "points-per-round" && (
                <div>
                  <label className="text-sm font-semibold text-white/50 block mb-1">
                    Points Distribution
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tour.scoringConfig.pointsDistribution.map((entry) => (
                      <span
                        key={entry.position}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 rounded-lg text-sm"
                      >
                        <span className="text-white/50">{getOrdinalSuffix(entry.position)}:</span>
                        <span className="font-semibold text-emerald-400">{entry.points}pts</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(tour.scoringConfig?.bonusStrokesForWinner ?? 0) > 0 && (
                <div>
                  <label className="text-sm font-semibold text-white/50 block mb-1">
                    Bonus Strokes
                  </label>
                  <div className="text-base text-white/70">
                    Winner gets {tour.scoringConfig!.bonusStrokesForWinner} extra stroke
                    {tour.scoringConfig!.bonusStrokesForWinner !== 1 ? "s" : ""} for the next round
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="section-header mb-4">Actions</h2>

          <div className="space-y-3">
            <button
              onClick={handleShareTournament}
              className="w-full flex items-center justify-between p-4 hover:bg-white/10 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/15 rounded-full flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">
                    Share Tournament
                  </div>
                  <div className="text-sm text-white/40">
                    Copy link to clipboard
                  </div>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-white/30"
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

            {isOwner && (
              <button
                onClick={handleToggleArchive}
                disabled={toggleArchive.isPending}
                className="w-full flex items-center justify-between p-4 hover:bg-white/10 rounded-lg transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                    {tour.archived ? (
                      <FolderOpen className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Archive className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {tour.archived
                        ? "Unarchive Tournament"
                        : "Archive Tournament"}
                    </div>
                    <div className="text-sm text-white/40">
                      {tour.archived
                        ? "Make tournament active again"
                        : "Move to archive (can be restored later)"}
                    </div>
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-white/30"
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
            )}

            <button
              disabled
              className="w-full flex items-center justify-between p-4 rounded-lg text-left opacity-50 cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/15 rounded-full flex items-center justify-center">
                  <BarChart className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">Export Data</div>
                  <div className="text-sm text-white/40">
                    Download scores and stats (Coming soon)
                  </div>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-white/30"
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

            <Link
              to="/settings"
              className="w-full flex items-center justify-between p-4 hover:bg-white/10 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Settings className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">App Settings</div>
                  <div className="text-sm text-white/40">
                    Theme, preferences, and defaults
                  </div>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-white/30"
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
            </Link>
          </div>
        </div>

        {isOwner && (
        <div className="card border-red-500/30">
          <h2 className="section-header text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h2>

          <div className="space-y-3">
            <button
              onClick={handleDeleteTournament}
              disabled={deleteTour.isPending}
              className="w-full flex items-center justify-between p-4 bg-red-500/15 hover:bg-red-500/20 rounded-lg transition-colors text-left disabled:opacity-50"
              data-testid="delete-tour-button"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="font-semibold text-red-400">
                    Delete Tournament
                  </div>
                  <div className="text-sm text-red-400/70">
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

          <div className="mt-4 p-3 bg-amber-500/15 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-400">
              <strong>Warning:</strong> Deleting this tournament will
              permanently remove all players, teams, rounds, and scores. This
              action cannot be undone.
            </p>
          </div>
        </div>
        )}

        <div className="card border-white/15">
          <div className="text-center text-white/40 text-sm">
            <p className="font-semibold text-white/70 mb-1">Tour Maker</p>
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

      <ConfirmDialog
        isOpen={showFormatChangeConfirm}
        title="Change Tournament Format"
        message={`Change tournament format to "${newFormat.replace(
          "-",
          " ",
        )}"? This may affect existing teams and rounds. Are you sure you want to continue?`}
        confirmLabel="Change Format"
        cancelLabel="Cancel"
        onConfirm={confirmFormatChange}
        onCancel={cancelFormatChange}
        isDestructive={false}
      />

      {/* Toast Notifications */}
      <ToastComponent />
    </div>
  );
};

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
