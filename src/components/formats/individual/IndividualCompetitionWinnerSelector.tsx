import { useState, useEffect } from "react";
import { Tour, Round, HoleInfo } from "../../../types";

interface IndividualCompetitionWinnerSelectorProps {
  tour: Tour;
  round: Round;
  currentHole: number;
  currentHoleInfo: HoleInfo;
  onCompetitionWinnerChange: (
    holeNumber: number,
    competitionType: "closestToPin" | "longestDrive",
    winnerId: string | null,
    distance?: number
  ) => void;
  onContinue: () => void;
  autoAdvance?: boolean;
}

export const IndividualCompetitionWinnerSelector = ({
  tour,
  round,
  currentHole,
  currentHoleInfo,
  onCompetitionWinnerChange,
  onContinue,
  autoAdvance = false,
}: IndividualCompetitionWinnerSelectorProps) => {
  const [closestToPinDistance, setClosestToPinDistance] = useState<string>("");
  const [longestDriveDistance, setLongestDriveDistance] = useState<string>("");

  useEffect(() => {
    // Load existing distances if they exist (individual rounds have single entry per hole)
    const ctpWinners =
      round.competitionWinners?.closestToPin?.[currentHole] || [];
    const ldWinners =
      round.competitionWinners?.longestDrive?.[currentHole] || [];
    const ctpWinner = ctpWinners[0]; // Individual rounds have only one entry
    const ldWinner = ldWinners[0];
    setClosestToPinDistance(ctpWinner?.distance?.toString() || "");
    setLongestDriveDistance(ldWinner?.distance?.toString() || "");
  }, [currentHole, round.competitionWinners]);

  const hasClosestToPin = currentHoleInfo.closestToPin;
  const hasLongestDrive = currentHoleInfo.longestDrive;

  // If there are no competitions on this hole, just continue
  if (!hasClosestToPin && !hasLongestDrive) {
    onContinue();
    return null;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="card bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-blue-200">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Hole {currentHole} Competitions
          </h3>
          <p className="text-sm text-slate-600">
            Select winners for this hole's competitions, then continue to the next hole
          </p>
        </div>
      </div>

      {hasClosestToPin && (
        <div className="card border-2 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
            </svg>
            <h5 className="text-sm font-semibold text-blue-900">
              Closest to Pin Winner
            </h5>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {tour.players.map((p) => {
              const winners =
                round.competitionWinners?.closestToPin?.[currentHole] || [];
              // For individual rounds, check without matchId
              const isWinner = winners.some((w) => w.playerId === p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const distance = closestToPinDistance
                      ? parseFloat(closestToPinDistance)
                      : undefined;
                    onCompetitionWinnerChange(
                      currentHole,
                      "closestToPin",
                      isWinner ? null : p.id,
                      distance
                    );
                  }}
                  disabled={round.status === "completed"}
                  className={`p-3 rounded-lg border-2 font-medium text-sm transition-all ${
                    round.status === "completed"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  } ${
                    isWinner
                      ? "bg-blue-600 text-white border-blue-700 shadow-lg ring-4 ring-blue-300 scale-105 font-bold"
                      : "bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:shadow-md active:scale-95"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() =>
                onCompetitionWinnerChange(currentHole, "closestToPin", null)
              }
              disabled={round.status === "completed"}
              className={`p-3 rounded-lg border-2 font-medium text-sm transition-all col-span-2 ${
                round.status === "completed"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              } ${
                !(
                  round.competitionWinners?.closestToPin?.[currentHole] || []
                ).length
                  ? "bg-slate-600 text-white border-slate-700 shadow-lg ring-4 ring-slate-300 scale-105 font-bold"
                  : "bg-white text-slate-600 border-slate-300 hover:border-slate-400 active:scale-95"
              }`}
            >
              None
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-blue-900 mb-1">
              Distance from Pin (feet/meters) - Optional
            </label>
            <input
              type="number"
              value={closestToPinDistance}
              onChange={(e) => setClosestToPinDistance(e.target.value)}
              onBlur={() => {
                const winners =
                  round.competitionWinners?.closestToPin?.[currentHole] || [];
                const currentWinner = winners[0]; // Individual rounds have only one entry
                if (currentWinner?.playerId) {
                  const distance = closestToPinDistance
                    ? parseFloat(closestToPinDistance)
                    : undefined;
                  onCompetitionWinnerChange(
                    currentHole,
                    "closestToPin",
                    currentWinner.playerId,
                    distance
                  );
                }
              }}
              disabled={round.status === "completed"}
              placeholder="Enter distance (optional)"
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              step="0.1"
              min="0"
            />
          </div>
        </div>
      )}

      {hasLongestDrive && (
        <div className="card border-2 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-amber-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                clipRule="evenodd"
              />
            </svg>
            <h5 className="text-sm font-semibold text-amber-900">
              Longest Drive Winner
            </h5>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {tour.players.map((p) => {
              const winners =
                round.competitionWinners?.longestDrive?.[currentHole] || [];
              // For individual rounds, check without matchId
              const isWinner = winners.some((w) => w.playerId === p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const distance = longestDriveDistance
                      ? parseFloat(longestDriveDistance)
                      : undefined;
                    onCompetitionWinnerChange(
                      currentHole,
                      "longestDrive",
                      isWinner ? null : p.id,
                      distance
                    );
                  }}
                  disabled={round.status === "completed"}
                  className={`p-3 rounded-lg border-2 font-medium text-sm transition-all ${
                    round.status === "completed"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  } ${
                    isWinner
                      ? "bg-amber-600 text-white border-amber-700 shadow-lg ring-4 ring-amber-300 scale-105 font-bold"
                      : "bg-white text-slate-700 border-slate-300 hover:border-amber-400 hover:shadow-md active:scale-95"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() =>
                onCompetitionWinnerChange(currentHole, "longestDrive", null)
              }
              disabled={round.status === "completed"}
              className={`p-3 rounded-lg border-2 font-medium text-sm transition-all col-span-2 ${
                round.status === "completed"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              } ${
                !(
                  round.competitionWinners?.longestDrive?.[currentHole] || []
                ).length
                  ? "bg-slate-600 text-white border-slate-700 shadow-lg ring-4 ring-slate-300 scale-105 font-bold"
                  : "bg-white text-slate-600 border-slate-300 hover:border-slate-400 active:scale-95"
              }`}
            >
              None
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-amber-900 mb-1">
              Drive Distance (yards/meters) - Optional
            </label>
            <input
              type="number"
              value={longestDriveDistance}
              onChange={(e) => setLongestDriveDistance(e.target.value)}
              onBlur={() => {
                const winners =
                  round.competitionWinners?.longestDrive?.[currentHole] || [];
                const currentWinner = winners[0]; // Individual rounds have only one entry
                if (currentWinner?.playerId) {
                  const distance = longestDriveDistance
                    ? parseFloat(longestDriveDistance)
                    : undefined;
                  onCompetitionWinnerChange(
                    currentHole,
                    "longestDrive",
                    currentWinner.playerId,
                    distance
                  );
                }
              }}
              disabled={round.status === "completed"}
              placeholder="Enter distance (optional)"
              className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
              step="0.1"
              min="0"
            />
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full bg-emerald-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-emerald-700 transition-all active:scale-95 shadow-lg"
      >
        {autoAdvance ? 'Continue to Next Hole' : 'Done'}
      </button>
    </div>
  );
};
