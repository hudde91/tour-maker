import { Link } from "react-router-dom";
import { Tour, Round } from "../types";
import { FormatConfig, calculateProgress } from "../lib/roundFormatManager";

interface RoundHeaderProps {
  tour: Tour;
  round: Round;
  formatConfig: FormatConfig;
  showLeaderboard: boolean;
  onToggleLeaderboard: () => void;
  onCompleteRound: () => void;
}

export const RoundHeader = ({
  tour,
  round,
  formatConfig,
  showLeaderboard,
  onToggleLeaderboard,
  onCompleteRound,
}: RoundHeaderProps) => {
  const progress = calculateProgress(tour, round);

  return (
    <div className="golf-hero-bg sticky top-0 z-40 shadow-lg">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Link to={`/tour/${tour.id}`} className="nav-back mr-4">
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
            <div>
              <h1 className="text-xl font-bold text-white">{round.name}</h1>
              <p className="text-emerald-100 text-sm">{round.courseName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLeaderboard}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                showLeaderboard
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
              }`}
            >
              <div className="flex items-center gap-2">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                {/* Leaderboard */}
              </div>
            </button>

            {round.status === "in-progress" && (
              <button
                onClick={onCompleteRound}
                className="bg-white bg-opacity-20 text-white px-3 py-2 rounded-lg font-medium text-sm hover:bg-opacity-30 transition-all"
              >
                <div className="flex items-center gap-2">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Complete Round
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Tournament Status Bar */}
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center gap-1">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="font-medium">{formatConfig.displayName}</span>
              </div>

              {/* {formatConfig.isTeamBased && (
                <div className="flex items-center gap-1">
                  <span className="text-lg">👥</span>
                  <span>Team Competition</span>
                </div>
              )} */}
            </div>

            <div className="flex items-center gap-4 text-emerald-100">
              <span>
                {progress.completed} of {progress.total} {progress.type} scoring
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  round.status === "completed"
                    ? "bg-blue-500 text-white"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {round.status === "completed" ? "Completed" : "Live"}
              </span>
              {formatConfig.isTeamBased && (
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs font-semibold">
                  {formatConfig.type === "scramble" ? "🤝" : "👥"}{" "}
                  {formatConfig.displayName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
