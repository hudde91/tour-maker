import { Link } from "react-router-dom";
import { Tour, Round } from "../../types";
import { FormatConfig } from "../../lib/roundFormatManager";

interface RoundHeaderProps {
  tour: Tour;
  round: Round;
  formatConfig: FormatConfig;
  onCompleteRound: () => void;
}

export const RoundHeader = ({
  tour,
  round,
  formatConfig,
  onCompleteRound,
}: RoundHeaderProps) => {
  return (
    <div className="golf-hero-bg">
      <div className="p-6 w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link to={`/tour/${tour.id}`} className="nav-back">
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

          <div className="flex items-center gap-3">
            {round.status === "in-progress" && (
              <button
                onClick={onCompleteRound}
                className="flex items-center gap-2 bg-emerald-600 bg-opacity-80 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-medium transition-all hover:bg-opacity-90 text-sm"
              >
                <span className="text-base">🏁</span>
                <span className="hidden sm:inline">Complete Round</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {round.name}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-emerald-100">
              <span className="flex items-center gap-1">
                <span className="text-base">🏌️</span>
                {round.courseName}
              </span>
              <span className="flex items-center gap-1">
                <span className="text-base">
                  {formatConfig.type === "scramble"
                    ? "🤝"
                    : formatConfig.type === "best-ball"
                    ? "⭐"
                    : formatConfig.type === "individual"
                    ? "👤"
                    : "⚔️"}
                </span>
                {formatConfig.displayName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
