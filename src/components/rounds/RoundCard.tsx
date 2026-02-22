import { useState, memo } from "react";
import { Link } from "react-router-dom";
import { Round, Tour, GOLF_FORMATS } from "../../types";
import { useDeleteRound } from "../../hooks/useRounds";
import { storage } from "../../lib/storage";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { RoundSettingsModal } from "./RoundSettingsModal";

interface RoundCardProps {
  round: Round;
  tour: Tour;
}

const RoundCardComponent = ({ round, tour }: RoundCardProps) => {
  const deleteRound = useDeleteRound(tour.id);
  const formatInfo = GOLF_FORMATS[round.format];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const totalPar = storage.getTotalPar(round);
  const playersWithScores = Object.keys(round.scores).length;

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

  const handleSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSettings(true);
  };

  const getStatusInfo = () => {
    switch (round.status) {
      case "completed":
        return {
          text: "Completed",
          badge: "bg-emerald-500/15 text-emerald-400",
        };
      case "in-progress":
        return {
          text: "Live",
          badge: "bg-red-500/15 text-red-700",
        };
      default:
        return {
          text: "Ready to start",
          badge: "bg-white/5 text-white/50",
        };
    }
  };

  const getFormatIcon = (format: string) => {
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

  return (
    <Link
      to={`/tour/${tour.id}/round/${round.id}`}
      className="block bg-white/5 rounded-xl border-2 border-white/10 hover:border-emerald-400 transition-all p-4 sm:p-5"
      data-testid={`round-card-${round.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-2xl">{getFormatIcon(round.format)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg sm:text-xl text-white mb-1 truncate">
              {round.name}
            </h3>
            <p className="text-sm text-white/50 mb-2">{round.courseName}</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.badge}`}
            >
              {round.status === "in-progress" && (
                <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
              )}
              {statusInfo.text}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSettings}
            className="p-2 text-white/30 hover:text-emerald-400 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
            title="Round settings"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          <button
            onClick={handleDelete}
            disabled={deleteRound.isPending}
            className="p-2 text-white/30 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
            title="Delete round"
          >
            <svg
              className="w-5 h-5"
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
        </div>
      </div>

      <div className="mb-4">
        <span className="inline-flex items-center gap-2 bg-white/5 text-white/70 px-3 py-1.5 rounded-lg text-sm font-medium">
          <span>{getFormatIcon(round.format)}</span>
          {formatInfo.name}
          {round.settings.strokesGiven && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-400">⛳ Handicap Applied</span>
            </>
          )}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{round.holes}</div>
          <div className="text-xs text-white/40 mt-1 uppercase tracking-wide">
            Holes
          </div>
        </div>

        <div className="rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{totalPar}</div>
          <div className="text-xs text-white/40 mt-1 uppercase tracking-wide">
            Par
          </div>
        </div>

        <div className="rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">
            {playersWithScores}
          </div>
          <div className="text-xs text-white/40 mt-1 uppercase tracking-wide">
            Playing
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="text-sm text-white/40">
          {round.status === "completed" && round.completedAt
            ? `Completed ${new Date(round.completedAt).toLocaleDateString()}`
            : round.status === "in-progress" && round.startedAt
            ? `Started ${new Date(round.startedAt).toLocaleDateString()}`
            : `Created ${new Date(round.createdAt).toLocaleDateString()}`}
        </div>

        <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
          {round.status === "created"
            ? "Start Round"
            : round.status === "in-progress"
            ? "Continue"
            : "View Results"}
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>

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

      <RoundSettingsModal
        tourId={tour.id}
        round={round}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </Link>
  );
};

// Memoize RoundCard to prevent unnecessary re-renders
export const RoundCard = memo(RoundCardComponent, (prevProps, nextProps) => {
  // Only re-render if round or tour.id changes
  return (
    prevProps.round.id === nextProps.round.id &&
    prevProps.round.status === nextProps.round.status &&
    prevProps.round.name === nextProps.round.name &&
    Object.keys(prevProps.round.scores).length === Object.keys(nextProps.round.scores).length &&
    prevProps.tour.id === nextProps.tour.id
  );
});
