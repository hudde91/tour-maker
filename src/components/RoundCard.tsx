import { Link } from "react-router-dom";
import { Round, Tour, GOLF_FORMATS } from "../types";
import { useDeleteRound } from "../hooks/useRounds";
import { storage } from "../lib/storage";

interface RoundCardProps {
  round: Round;
  tour: Tour;
}

export const RoundCard = ({ round, tour }: RoundCardProps) => {
  const deleteRound = useDeleteRound(tour.id);
  const formatInfo = GOLF_FORMATS[round.format];

  const totalPar = storage.getTotalPar(round);
  const playersWithScores = Object.keys(round.scores).length;
  const totalPlayers = tour.players.length;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      window.confirm(
        `Delete round "${round.name}"? All scores will be permanently lost.`
      )
    ) {
      try {
        await deleteRound.mutateAsync(round.id);
      } catch (error) {
        console.error("Failed to delete round:", error);
      }
    }
  };

  const getStatusStyles = () => {
    switch (round.status) {
      case "completed":
        return {
          badge: "status-completed",
          card: "border-blue-200 bg-blue-50",
          text: "Completed",
        };
      case "in-progress":
        return {
          badge: "status-active",
          card: "border-emerald-200 bg-emerald-50",
          text: "In Progress",
        };
      default:
        return {
          badge: "status-pending",
          card: "border-slate-200 bg-white",
          text: "Ready to Start",
        };
    }
  };

  const statusStyles = getStatusStyles();
  const completionPercentage =
    totalPlayers > 0 ? Math.round((playersWithScores / totalPlayers) * 100) : 0;

  return (
    <Link
      to={`/tour/${tour.id}/round/${round.id}`}
      className={`block rounded-xl p-6 shadow-professional hover:shadow-elevated transition-all duration-200 border-2 ${statusStyles.card}`}
    >
      {/* Round Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Format Icon */}
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-2xl">{formatInfo.icon}</span>
          </div>
          {/* Progress Information */}
          <div className="flex items-center justify-between mb-4 text-sm">
            <div className="flex items-center gap-4">
              <span className="text-slate-600">
                <span className="font-bold text-slate-900">
                  {playersWithScores}
                </span>{" "}
                of {totalPlayers} players scoring
              </span>
              <span className="text-slate-600">
                <span className="font-bold text-slate-900">
                  {completionPercentage}%
                </span>{" "}
                complete
              </span>
            </div>
            {round.startTime && (
              <div className="text-slate-500">
                {new Date(round.startTime).toLocaleString()}
              </div>
            )}
          </div>{" "}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-900 truncate mb-1">
              {round.name}
            </h3>
            <p className="text-slate-600 font-medium mb-2">
              {round.courseName}
            </p>

            <div className="flex items-center gap-4 text-sm">
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
                {formatInfo.name}
              </span>
              {round.teeBoxes && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  {round.teeBoxes}
                </span>
              )}
              {round.settings.strokesGiven && (
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                  Handicap Applied
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyles.badge}`}
          >
            {statusStyles.text}
          </span>

          <button
            onClick={handleDelete}
            disabled={deleteRound.isPending}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete round"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Round Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{round.holes}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Holes
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{totalPar}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Par
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">
            {playersWithScores}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Scored
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">
            {completionPercentage}%
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Complete
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {round.status === "in-progress" && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">
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

      {/* Round Details */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {round.status === "completed" && round.completedAt
                ? `Completed ${new Date(
                    round.completedAt
                  ).toLocaleDateString()}`
                : round.status === "in-progress" && round.startedAt
                ? `Started ${new Date(round.startedAt).toLocaleDateString()}`
                : `Created ${new Date(round.createdAt).toLocaleDateString()}`}
            </span>
          </div>
        </div>

        <div className="flex items-center text-emerald-600">
          <span className="text-sm font-medium mr-2">
            {round.status === "created"
              ? "Start Round"
              : round.status === "in-progress"
              ? "Continue"
              : "View Results"}
          </span>
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
    </Link>
  );
};
