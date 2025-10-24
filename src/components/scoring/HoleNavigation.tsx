import { HoleInfo } from "../../types";

interface HoleNavigationProps {
  holes: HoleInfo[];
  currentHole: number;
  onHoleChange: (holeNumber: number) => void;
  playerScores: Record<string, (number | null)[]>;
}

export const HoleNavigation = ({
  holes,
  currentHole,
  onHoleChange,
  playerScores,
}: HoleNavigationProps) => {
  const getHoleStatus = (holeNumber: number) => {
    const holeIndex = holeNumber - 1;
    const hasAnyScores = Object.values(playerScores).some(
      (scores) => {
        const score = scores[holeIndex];
        return score !== null && score !== undefined && score > 0;
      }
    );

    if (holeNumber === currentHole) return "current";
    if (hasAnyScores) return "completed";
    return "pending";
  };

  const getHoleStyles = (status: string) => {
    switch (status) {
      case "current":
        return "bg-emerald-600 text-white border-emerald-600 shadow-lg ring-2 ring-emerald-200 scale-105";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100";
      case "pending":
        return "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400";
      default:
        return "bg-white text-slate-600 border-slate-300 hover:bg-slate-50";
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Course Navigation</h3>
        <div className="text-sm text-slate-500">
          Hole {currentHole} of {holes.length}
        </div>
      </div>

      {/* Responsive Hole Grid - Fewer columns on mobile to prevent overlap */}
      <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 card-spacing">
        {holes.map((hole) => {
          const status = getHoleStatus(hole.number);
          return (
            <button
              key={hole.number}
              onClick={() => onHoleChange(hole.number)}
              className={`relative h-12 sm:h-14 rounded-lg border-2 font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-105 focus:scale-105 outline-none ${getHoleStyles(
                status
              )}`}
              aria-label={`Hole ${hole.number}, Par ${hole.par}${
                status === "current" ? " - Currently selected" : ""
              }`}
              aria-pressed={status === "current"}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className="font-bold text-sm sm:text-base">
                  {hole.number}
                </div>
                <div className="text-[10px] sm:text-xs opacity-75">
                  P{hole.par}
                </div>
              </div>
              {status === "current" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
              )}
              {status === "completed" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white">
                  <svg
                    className="w-2 h-2 text-white absolute top-0 left-0"
                    fill="currentColor"
                    viewBox="0 0 8 8"
                  >
                    <path d="M3 6L1 4l.7-.7L3 4.6l3.3-3.3L7 2z" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Current Hole Info */}
      <div className="bg-slate-50 rounded-lg p-3 sm:p-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                {currentHole}
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm sm:text-base">
                  Hole {currentHole}
                </div>
                <div className="text-xs sm:text-sm text-slate-600">
                  Par {holes[currentHole - 1]?.par}
                </div>
              </div>
            </div>

            {holes[currentHole - 1]?.yardage && (
              <div className="text-xs sm:text-sm text-slate-600 hidden sm:block">
                <span className="font-medium">
                  {holes[currentHole - 1].yardage}
                </span>{" "}
                yards
              </div>
            )}
          </div>

          {/* Navigation Arrows */}
          <div className="flex gap-2">
            <button
              onClick={() => currentHole > 1 && onHoleChange(currentHole - 1)}
              disabled={currentHole === 1}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Previous hole"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() =>
                currentHole < holes.length && onHoleChange(currentHole + 1)
              }
              disabled={currentHole === holes.length}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Next hole"
            >
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
