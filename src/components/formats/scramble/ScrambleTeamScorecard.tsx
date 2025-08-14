import { getScoreInfo } from "../../../lib/scoreUtils";
import { Team, Tour, HoleInfo } from "../../../types";

interface ScrambleTeamScorecardProps {
  team: Team;
  tour: Tour;
  holeInfo: HoleInfo;
  currentScore: number;
  teamScore: any; // We'll define this better
  onScoreChange: (score: number) => void;
}

export const ScrambleTeamScorecard = ({
  team,
  tour,
  holeInfo,
  currentScore,
  teamScore,
  onScoreChange,
}: ScrambleTeamScorecardProps) => {
  const par = holeInfo.par;
  const teamPlayers = tour.players.filter((p) => p.teamId === team.id);
  const captain = teamPlayers.find((p) => p.id === team.captainId);

  const handleScoreChange = (newScore: number) => {
    onScoreChange(newScore);
  };

  const handleClearScore = () => {
    onScoreChange(0);
  };

  const scoreInfo = getScoreInfo(currentScore, par);

  // Generate score options (typically 1-10 for most holes)
  const generateScoreOptions = () => {
    const options = [];
    const minScore = 1;
    const maxScore = Math.max(10, par + 6);

    for (let score = minScore; score <= maxScore; score++) {
      const info = getScoreInfo(score, par);
      options.push({
        score,
        name: info.name,
        bg: info.bg,
        text: info.text,
        badgeColor: info.badgeColor,
      });
    }

    return options;
  };

  const scoreOptions = generateScoreOptions();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Team Header */}
      <div className="flex justify-between items-center p-5">
        <div className="flex items-center gap-4">
          {/* Team Avatar */}
          <div className="relative">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
              style={{ backgroundColor: team.color }}
            >
              <span className="text-2xl">👥</span>
            </div>
            {/* Scramble indicator */}
            <div className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-md">
              S
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {team.name}
            </h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-600 font-medium">
                {teamPlayers.length} Players
              </span>
              {captain && (
                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-semibold border border-amber-200">
                  👑 {captain.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Current Score Display */}
        <div className="text-right">
          <div
            className={`text-3xl font-bold px-4 py-2 rounded-xl border-2 shadow-sm transition-all duration-200 ${scoreInfo.bg} ${scoreInfo.text}`}
          >
            {currentScore || "–"}
          </div>
        </div>
      </div>

      {/* Team Members Display */}
      <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-700">Team:</span>
          {teamPlayers.map((player, index) => (
            <span key={player.id} className="flex items-center">
              <span className="text-sm text-slate-600">{player.name}</span>
              {player.handicap !== undefined && (
                <span className="text-xs text-slate-500 ml-1">
                  (HC: {player.handicap})
                </span>
              )}
              {index < teamPlayers.length - 1 && (
                <span className="text-slate-400 mx-1">•</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Professional Score Selection Interface */}
      <div className="border-t border-slate-200 p-5 bg-slate-50">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                Team Score - Hole {holeInfo.number}
              </h4>
              <div className="text-xs text-slate-600">
                Par {par} • Scramble Format
              </div>
            </div>
            <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">
              <span className="text-emerald-600 font-semibold">
                TEAM SCRAMBLE
              </span>
            </div>
          </div>

          {/* Professional Score Options Grid */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {scoreOptions.slice(0, 10).map((option) => (
              <button
                key={option.score}
                type="button"
                onClick={() => handleScoreChange(option.score)}
                className={`relative p-3 rounded-xl border-2 font-bold text-center transition-all duration-200 hover:scale-105 focus:scale-105 outline-none shadow-sm hover:shadow-md ${
                  currentScore === option.score
                    ? `${option.bg} ${option.text} border-slate-400 ring-2 ring-emerald-300 scale-105`
                    : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                }`}
              >
                <div className="text-lg font-bold mb-1">{option.score}</div>
                <div className="text-xs leading-tight">
                  {option.score === par
                    ? "Par"
                    : option.score === par + 1
                    ? "Bogey"
                    : option.score === par + 2
                    ? "Double"
                    : option.score === par - 1
                    ? "Birdie"
                    : option.score === par - 2
                    ? "Eagle"
                    : option.score === 1
                    ? "Ace!"
                    : `${option.score > par ? "+" : ""}${option.score - par}`}
                </div>

                {/* Selection indicator */}
                {currentScore === option.score && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                    <svg
                      className="w-2 h-2 text-white"
                      fill="currentColor"
                      viewBox="0 0 8 8"
                    >
                      <path d="M3 6L1 4l.7-.7L3 4.6l3.3-3.3L7 2z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Score Name Display */}
          {currentScore > 0 && (
            <div className="text-center mb-4">
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${scoreInfo.badgeColor}`}
              >
                <span>{scoreInfo.name}</span>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => handleScoreChange(par)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-semibold text-sm transition-colors"
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Quick Par ({par})
            </button>

            {currentScore > 0 && (
              <button
                onClick={handleClearScore}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-sm transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Team Round Summary */}
      <div className="border-t border-slate-100 p-4 bg-white rounded-b-xl">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-slate-900">
              {teamScore?.totalScore || 0}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Team Total
            </div>
          </div>
          <div>
            <div
              className={`text-xl font-bold ${
                (teamScore?.totalToPar || 0) < 0
                  ? "text-red-600"
                  : (teamScore?.totalToPar || 0) > 0
                  ? "text-orange-600"
                  : "text-blue-600"
              }`}
            >
              {(teamScore?.totalToPar || 0) > 0 ? "+" : ""}
              {teamScore?.totalToPar || 0}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              To Par
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {teamScore?.scores?.filter((s: number) => s > 0).length || 0}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Holes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
