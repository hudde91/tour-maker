export type LeaderboardView = "overall" | "current-round" | "by-round";
export type LeaderboardSort =
  | "score-asc"
  | "score-desc"
  | "points-desc"
  | "holes-desc";

interface LeaderboardFiltersProps {
  view: LeaderboardView;
  onViewChange: (view: LeaderboardView) => void;
  sort: LeaderboardSort;
  onSortChange: (sort: LeaderboardSort) => void;
  rounds?: Array<{ id: string; name: string; status: string }>;
  selectedRoundId?: string;
  onRoundSelect?: (roundId: string) => void;
  showViewToggle?: boolean;
  showSortOptions?: boolean;
  isStableford?: boolean;
  isMatchPlay?: boolean;
}

export const LeaderboardFilters = ({
  view,
  onViewChange,
  sort,
  onSortChange,
  rounds = [],
  selectedRoundId,
  onRoundSelect,
  showViewToggle = true,
  showSortOptions = true,
  isStableford = false,
  isMatchPlay = false,
}: LeaderboardFiltersProps) => {

  const getSortLabel = (sortType: LeaderboardSort) => {
    switch (sortType) {
      case "score-asc":
        return "↑ Score (Low to High)";
      case "score-desc":
        return "↓ Score (High to Low)";
      case "points-desc":
        return "↓ Points (High to Low)";
      case "holes-desc":
        return "↓ Matches Won (High to Low)";
      default:
        return "Sort";
    }
  };

  const defaultSortOptions: LeaderboardSort[] = isStableford
    ? ["points-desc", "score-asc", "score-desc"]
    : isMatchPlay
    ? ["holes-desc", "score-desc", "score-asc"]
    : ["score-asc", "score-desc"];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      {/* View Toggle */}
      {showViewToggle && (
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block uppercase tracking-wide">
            View
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onViewChange("overall")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                view === "overall"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Overall
            </button>
            <button
              onClick={() => onViewChange("current-round")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                view === "current-round"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => onViewChange("by-round")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                view === "by-round"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              By Round
            </button>
          </div>
        </div>
      )}

      {/* Round Selector (shown when "by-round" is selected) */}
      {view === "by-round" && rounds.length > 0 && onRoundSelect && (
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block uppercase tracking-wide">
            Select Round
          </label>
          <select
            value={selectedRoundId || ""}
            onChange={(e) => onRoundSelect(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.name}{" "}
                {round.status === "in-progress"
                  ? "(Live)"
                  : round.status === "completed"
                  ? "(Completed)"
                  : "(Upcoming)"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sort Options */}
      {showSortOptions && (
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block uppercase tracking-wide">
            Sort By
          </label>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as LeaderboardSort)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {defaultSortOptions.map((option) => (
              <option key={option} value={option}>
                {getSortLabel(option)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
