import { useState } from "react";
import { Link } from "react-router-dom";
import { Round, Tour, GOLF_FORMATS } from "../types";
import { useDeleteRound } from "../hooks/useRounds";
import { storage } from "../lib/storage";
import { ConfirmDialog } from "./ConfirmDialog";

interface RoundCardProps {
  round: Round;
  tour: Tour;
}

export const RoundCard = ({ round, tour }: RoundCardProps) => {
  const deleteRound = useDeleteRound(tour.id);
  const formatInfo = GOLF_FORMATS[round.format];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const totalPar = storage.getTotalPar(round);
  const playersWithScores = Object.keys(round.scores).length;
  const totalPlayers = tour.players.length;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteRound.mutateAsync(round.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Failed to delete round:", error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const getStatusInfo = () => {
    switch (round.status) {
      case "completed":
        return {
          emoji: "🏁",
          text: "Completed",
          style: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "in-progress":
        return {
          emoji: "🔴",
          text: "Live",
          style:
            "bg-emerald-100 text-emerald-800 border-emerald-200 animate-pulse",
        };
      default:
        return {
          emoji: "⏳",
          text: "Ready",
          style: "bg-slate-100 text-slate-600 border-slate-200",
        };
    }
  };

  const getFormatEmoji = (format: string) => {
    switch (format) {
      case "stroke-play":
        return "🏌️";
      case "match-play":
        return "⚔️";
      case "scramble":
        return "🤝";
      case "best-ball":
        return "⭐";
      case "alternate-shot":
        return "🔄";
      case "skins":
        return "💰";
      default:
        return "🏌️";
    }
  };

  const statusInfo = getStatusInfo();
  const completionPercentage =
    totalPlayers > 0 ? Math.round((playersWithScores / totalPlayers) * 100) : 0;

  return (
    <>
      <Link
        to={`/tour/${tour.id}/round/${round.id}`}
        className="block rounded-xl p-4 md:p-6 shadow-professional hover:shadow-elevated transition-all duration-200 border-2 border-slate-200 bg-white hover:border-emerald-300"
      >
        {/* Mobile-Optimized Header */}
        <div className="flex items-start gap-3 md:gap-4 mb-4">
          {/* Format Icon */}
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-xl md:text-2xl">
              {getFormatEmoji(round.format)}
            </span>
          </div>

          {/* Round Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-base md:text-lg font-bold text-slate-900 truncate mb-1">
                  {round.name}
                </h3>
                <p className="text-slate-600 font-medium text-sm md:text-base truncate flex items-center gap-1">
                  <span className="text-base">🏌️</span>
                  {round.courseName}
                </p>
              </div>

              {/* Status Badge + Delete Button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-semibold border flex items-center gap-1 ${statusInfo.style}`}
                >
                  <span>{statusInfo.emoji}</span>
                  {statusInfo.text}
                </span>
                <button
                  onClick={handleDelete}
                  disabled={deleteRound.isPending}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                  title="Delete round"
                >
                  <span className="text-base">🗑️</span>
                </button>
              </div>
            </div>

            {/* Format and Settings Tags - Mobile Optimized */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <span>{getFormatEmoji(round.format)}</span>
                {formatInfo.name}
              </span>
              {round.settings.strokesGiven && (
                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <span>⛳</span>
                  Handicap Applied
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Grid - Mobile: 2 cols, Desktop: 4 cols */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
          <div className="text-center bg-slate-50 rounded-lg p-3">
            <div className="text-lg md:text-xl mb-1">🏕️</div>
            <div className="text-lg md:text-xl font-bold text-slate-900">
              {round.holes}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Holes
            </div>
          </div>
          <div className="text-center bg-slate-50 rounded-lg p-3">
            <div className="text-lg md:text-xl mb-1">⛳</div>
            <div className="text-lg md:text-xl font-bold text-slate-900">
              {totalPar}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Par
            </div>
          </div>
          <div className="text-center bg-slate-50 rounded-lg p-3">
            <div className="text-lg md:text-xl mb-1">👥</div>
            <div className="text-lg md:text-xl font-bold text-slate-900">
              {playersWithScores}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Playing
            </div>
          </div>
          <div className="text-center bg-slate-50 rounded-lg p-3">
            <div className="text-lg md:text-xl mb-1">📊</div>
            <div className="text-lg md:text-xl font-bold text-slate-900">
              {completionPercentage}%
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Complete
            </div>
          </div>
        </div>

        {/* Progress Bar - Only for in-progress rounds */}
        {round.status === "in-progress" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <span className="text-base">📈</span>
                Round Progress
              </span>
              <span className="text-sm text-slate-500">
                {playersWithScores} of {totalPlayers} players
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer - Call to Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-600 flex items-center gap-1">
            <span className="text-base">📅</span>
            {round.status === "completed" && round.completedAt
              ? `Completed ${new Date(round.completedAt).toLocaleDateString()}`
              : round.status === "in-progress" && round.startedAt
              ? `Started ${new Date(round.startedAt).toLocaleDateString()}`
              : `Created ${new Date(round.createdAt).toLocaleDateString()}`}
          </div>

          <div className="flex items-center text-emerald-600 font-medium text-sm hover:text-emerald-700 transition-colors self-start sm:self-auto">
            <span className="mr-2">
              {round.status === "created"
                ? "🚀 Start Round"
                : round.status === "in-progress"
                ? "▶️ Continue"
                : "📊 View Results"}
            </span>
            <span className="text-base">▶️</span>
          </div>
        </div>
      </Link>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Round"
        message={`Delete round "${round.name}"? All scores will be permanently lost.`}
        confirmLabel="Delete Round"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDestructive={true}
      />
    </>
  );
};
