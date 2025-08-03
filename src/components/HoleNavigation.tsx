import { HoleInfo } from "../types";

interface HoleNavigationProps {
  holes: HoleInfo[];
  currentHole: number;
  onHoleChange: (holeNumber: number) => void;
  playerScores: Record<string, number[]>;
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
      (scores) => scores[holeIndex] && scores[holeIndex] > 0
    );

    if (holeNumber === currentHole) return "current";
    if (hasAnyScores) return "completed";
    return "pending";
  };

  const getHoleStyles = (status: string) => {
    switch (status) {
      case "current":
        return "hole-current";
      case "completed":
        return "hole-completed";
      case "pending":
        return "hole-pending";
      default:
        return "hole-pending";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">Holes</h3>

      <div className="grid grid-cols-9 gap-2">
        {holes.map((hole) => {
          const status = getHoleStatus(hole.number);
          return (
            <button
              key={hole.number}
              onClick={() => onHoleChange(hole.number)}
              className={`hole-button ${getHoleStyles(status)}`}
              aria-label={`Hole ${hole.number}, Par ${hole.par}${
                status === "current" ? " - Currently selected" : ""
              }`}
              aria-pressed={status === "current"}
            >
              <div className="text-lg font-bold">{hole.number}</div>
              <div className="text-xs font-medium">Par {hole.par}</div>
              {hole.yardage && (
                <div className="text-xs opacity-75">{hole.yardage}y</div>
              )}
              {status === "current" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-emerald-600"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Hole Navigation Arrows */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => currentHole > 1 && onHoleChange(currentHole - 1)}
          disabled={currentHole === 1}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium touch-manipulation disabled:opacity-50"
        >
          ← Previous
        </button>

        <div className="font-semibold text-gray-900">
          Hole {currentHole} • Par {holes[currentHole - 1]?.par}
        </div>

        <button
          onClick={() =>
            currentHole < holes.length && onHoleChange(currentHole + 1)
          }
          disabled={currentHole === holes.length}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium touch-manipulation disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
};
