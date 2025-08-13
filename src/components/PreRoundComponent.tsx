import { Link } from "react-router-dom";
import { Tour, Round } from "../types";
import { FormatConfig, validateFormatSetup } from "../lib/roundFormatManager";

interface PreRoundComponentProps {
  tour: Tour;
  round: Round;
  formatConfig: FormatConfig;
  onStartRound: () => void;
  isStarting: boolean;
  onCaptainPairing?: () => void;
}

export const PreRoundComponent = ({
  tour,
  round,
  formatConfig,
  onStartRound,
  isStarting,
  onCaptainPairing,
}: PreRoundComponentProps) => {
  const validationErrors = validateFormatSetup(tour, round);
  const canStart = validationErrors.length === 0 && tour.players.length >= 2;

  const isRyderCupFormat = [
    "foursomes-match-play",
    "four-ball-match-play",
    "singles-match-play",
  ].includes(round.format);

  const hasMatchesCreated =
    round.ryderCup?.matches && round.ryderCup.matches.length > 0;

  const getFormatIcon = () => {
    switch (round.format) {
      case "foursomes-match-play":
        return "🔄";
      case "four-ball-match-play":
        return "⭐";
      case "singles-match-play":
        return "👤";
      default:
        return formatConfig.type === "scramble"
          ? "🤝"
          : formatConfig.type === "best-ball"
          ? "⭐"
          : "🏌️‍♂️";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top">
      {/* Header */}
      <div className="golf-hero-bg">
        <div className="p-6 w-full max-w-6xl mx-auto">
          <div className="flex items-center mb-4">
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
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {round.name}
              </h1>
              <p className="text-emerald-100 mt-1">
                {round.courseName} • {formatConfig.displayName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-8 w-full max-w-4xl mx-auto">
        {/* Round Setup Card */}
        <div className="card-elevated mb-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-3xl">{getFormatIcon()}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Round Setup
            </h2>
            <p className="text-slate-600">
              Prepare your {formatConfig.displayName} round
            </p>
          </div>

          {/* Round Information */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">Round Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {round.holes}
                </div>
                <div className="text-sm text-slate-500">Holes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {round.holeInfo.reduce((sum, hole) => sum + hole.par, 0)}
                </div>
                <div className="text-sm text-slate-500">Total Par</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {tour.players.length}
                </div>
                <div className="text-sm text-slate-500">Players</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {tour.teams?.length || 0}
                </div>
                <div className="text-sm text-slate-500">Teams</div>
              </div>
            </div>
          </div>

          {/* Format Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getFormatIcon()}</span>
              <h3 className="font-semibold text-blue-900">
                {formatConfig.displayName}
              </h3>
            </div>
            <p className="text-sm text-blue-800">{formatConfig.description}</p>
          </div>

          {/* Ryder Cup Specific Setup */}
          {isRyderCupFormat && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <h3 className="font-semibold text-amber-900">
                    Ryder Cup Format
                  </h3>
                </div>
                {onCaptainPairing && (
                  <button
                    onClick={onCaptainPairing}
                    className="btn-secondary text-sm py-2 px-3"
                  >
                    👑 Captain Pairings
                  </button>
                )}
              </div>

              {hasMatchesCreated ? (
                <div className="flex items-center gap-2 text-green-800">
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
                  <span className="text-sm font-medium">
                    {round.ryderCup?.matches.length} matches created and ready
                    to play
                  </span>
                </div>
              ) : (
                <div className="text-sm text-amber-800">
                  Team captains need to set up matches before starting the
                  round.
                  {onCaptainPairing && (
                    <button
                      onClick={onCaptainPairing}
                      className="ml-2 text-amber-900 underline font-medium"
                    >
                      Set up matches now
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
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
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">
                    Setup Required
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Player Requirements */}
          {tour.players.length < 2 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-yellow-500 mt-0.5"
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
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">
                    More Players Needed
                  </h4>
                  <p className="text-yellow-800 text-sm">
                    Add at least {2 - tour.players.length} more player(s) to
                    start the round.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Special Requirements for Ryder Cup */}
          {isRyderCupFormat && !hasMatchesCreated && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-purple-500 text-xl">👑</span>
                <div>
                  <h4 className="font-semibold text-purple-900 mb-1">
                    Captain Setup Required
                  </h4>
                  <p className="text-purple-800 text-sm">
                    Team captains must create match pairings before starting
                    this Ryder Cup round.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Link
              to={`/tour/${tour.id}`}
              className="btn-secondary flex-1 text-center"
            >
              Back to Tournament
            </Link>
            <button
              onClick={onStartRound}
              disabled={
                !canStart ||
                isStarting ||
                (isRyderCupFormat && !hasMatchesCreated)
              }
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting
                ? "Starting Round..."
                : isRyderCupFormat && !hasMatchesCreated
                ? "Set Up Matches First"
                : `Start ${formatConfig.displayName} Round`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
