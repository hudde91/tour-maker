import { Link } from "react-router-dom";
import { Tour, Round } from "../types";
import {
  FormatConfig,
  validateFormatSetup,
  getScoringEntities,
} from "../lib/roundFormatManager";
import { storage } from "../lib/storage";

interface PreRoundComponentProps {
  tour: Tour;
  round: Round;
  formatConfig: FormatConfig;
  onStartRound: () => void;
  isStarting: boolean;
}

export const PreRoundComponent = ({
  tour,
  round,
  formatConfig,
  onStartRound,
  isStarting,
}: PreRoundComponentProps) => {
  const totalPar = storage.getTotalPar(round);
  const { count, type } = getScoringEntities(tour, formatConfig);
  const validationErrors = validateFormatSetup(tour, round);

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top">
      {/* Professional Header */}
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
              <h1 className="text-2xl font-bold text-white">{round.name}</h1>
              <p className="text-emerald-100 mt-1">{round.courseName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-8 w-full max-w-6xl mx-auto">
        {/* Pre-Round Information */}
        <div className="card-elevated text-center mb-6 w-full max-w-4xl mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg
              className="w-12 h-12 text-white"
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
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Tournament Round Ready
          </h2>
          <p className="text-slate-600 text-lg mb-8">
            All systems are ready to begin this{" "}
            {formatConfig.displayName.toLowerCase()} round
          </p>

          {/* Round Statistics */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {count}
              </div>
              <div className="text-slate-500 font-medium capitalize">
                {type}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {round.holes}
              </div>
              <div className="text-slate-500 font-medium">Holes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {totalPar}
              </div>
              <div className="text-slate-500 font-medium">Total Par</div>
            </div>
          </div>

          {/* Format-specific Information */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">
                {formatConfig.type === "scramble"
                  ? "🤝"
                  : formatConfig.type === "best-ball"
                  ? "⭐"
                  : formatConfig.isTeamBased
                  ? "👥"
                  : "👤"}
              </span>
              <h3 className="font-semibold text-emerald-900">
                {formatConfig.displayName}
              </h3>
            </div>
            <p className="text-sm text-emerald-800">
              {formatConfig.description}
            </p>
          </div>

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
                <h4 className="font-semibold text-red-900 mb-2">
                  Setup Required
                </h4>
                <ul className="text-sm text-red-800 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={onStartRound}
            disabled={isStarting || validationErrors.length > 0}
            className="btn-primary text-lg py-4 px-8 disabled:opacity-50 shadow-lg"
          >
            {isStarting ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Starting Tournament Round...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4m-6 0a2 2 0 012-2h2a2 2 0 012 2m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v1"
                  />
                </svg>
                Begin Tournament Round
              </div>
            )}
          </button>
        </div>

        {/* Tournament Format Info */}
        <div className="card w-full max-w-3xl mx-auto">
          <h3 className="subsection-header mb-4">Round Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Format:</span>
              <span className="font-semibold text-slate-900">
                {formatConfig.displayName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Competition Type:</span>
              <span className="font-semibold text-slate-900">
                {formatConfig.isTeamBased ? "Team-based" : "Individual"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Handicap Strokes:</span>
              <span
                className={`font-semibold ${
                  round.settings.strokesGiven
                    ? "text-emerald-600"
                    : "text-slate-500"
                }`}
              >
                {round.settings.strokesGiven ? "Applied" : "Not Applied"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Course:</span>
              <span className="font-semibold text-slate-900">
                {round.courseName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Created:</span>
              <span className="font-semibold text-slate-900">
                {new Date(round.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
