import { Link } from "react-router-dom";
import { Tour, Round } from "../../types";
import { FormatConfig } from "../../lib/roundFormatManager";

interface RoundHeaderProps {
  tour: Tour;
  round: Round;
  formatConfig: FormatConfig;
  showLeaderboard: boolean;
  onToggleLeaderboard: () => void;
  onCompleteRound: () => void;
  onCaptainPairing?: () => void;
}

export const RoundHeader = ({
  tour,
  round,
  formatConfig,
  showLeaderboard,
  onToggleLeaderboard,
  onCompleteRound,
  onCaptainPairing,
}: RoundHeaderProps) => {
  const getStatusColor = () => {
    switch (round.status) {
      case "in-progress":
        return "bg-red-100 text-red-800 border-red-200 animate-pulse";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getStatusText = () => {
    switch (round.status) {
      case "in-progress":
        return "🟢 Live Round";
      case "completed":
        return "🏁 Completed";
      default:
        return "⏳ Created";
    }
  };

  const isRyderCupFormat = [
    "foursomes-match-play",
    "four-ball-match-play",
    "singles-match-play",
  ].includes(round.format);

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
            {onCaptainPairing && isRyderCupFormat && (
              <button
                onClick={onCaptainPairing}
                className="flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-medium transition-all hover:bg-opacity-30 text-sm"
              >
                <span className="text-base">👑</span>
                <span className="hidden sm:inline">Captain Pairings</span>
              </button>
            )}

            <button
              onClick={onToggleLeaderboard}
              className="flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-medium transition-all hover:bg-opacity-30 text-sm"
            >
              <span className="text-base">📊</span>
              <span className="hidden sm:inline">
                {showLeaderboard ? "Hide" : "Show"} Leaderboard
              </span>
            </button>

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
              {/* <span
                className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor()}`}
              >
                {getStatusText()}
              </span> */}
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
              {/* <span className="flex items-center gap-1">
                <span className="text-base">⛳</span>
                {round.holes} holes
              </span> */}
              {/* {round.startTime && (
                <span className="flex items-center gap-1">
                  <span className="text-base">🕐</span>
                  {new Date(round.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )} */}
            </div>
          </div>

          {/* <div className="text-right">
            <div className="text-emerald-100 font-medium">{tour.name}</div>
            <div className="text-sm text-emerald-200">
              {tour.players.length} Players
              {tour.teams && tour.teams.length > 0 && (
                <span> • {tour.teams.length} Teams</span>
              )}
            </div>
          </div> */}
        </div>

        {/* {isRyderCupFormat && round.ryderCup && (
          <div className="mt-4 p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="font-semibold text-white">
                    Ryder Cup Competition
                  </h3>
                  <p className="text-sm text-emerald-100">
                    First to {round.ryderCup.targetPoints} points wins
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {tour.teams?.map((team, index) => (
                  <div key={team.id} className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {index === 0
                        ? round.ryderCup?.teamAPoints
                        : round.ryderCup?.teamBPoints}
                    </div>
                    <div className="text-xs text-emerald-100">{team.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};
