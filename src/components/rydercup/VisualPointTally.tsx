interface VisualPointTallyProps {
  teamAName: string;
  teamBName: string;
  teamAPoints: number;
  teamBPoints: number;
  targetPoints: number;
  teamAColor?: string;
  teamBColor?: string;
}

export const VisualPointTally = ({
  teamAName,
  teamBName,
  teamAPoints,
  teamBPoints,
  targetPoints,
  teamAColor = "#1e40af",
  teamBColor = "#dc2626",
}: VisualPointTallyProps) => {
  const totalPoints = teamAPoints + teamBPoints;
  const maxPoints = Math.max(targetPoints * 2, totalPoints);

  // Calculate percentages for the bar
  const teamAPercentage = (teamAPoints / maxPoints) * 100;
  const teamBPercentage = (teamBPoints / maxPoints) * 100;

  // Determine leader
  const isTeamALeading = teamAPoints > teamBPoints;
  const isTeamBLeading = teamBPoints > teamAPoints;
  const isTied = teamAPoints === teamBPoints;

  // Check if anyone has won
  const hasTeamAWon = teamAPoints >= targetPoints;
  const hasTeamBWon = teamBPoints >= targetPoints;

  return (
    <div className="space-y-4">
      {/* Score Headers */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: teamAColor }}
          >
            <span className="text-white font-bold text-lg">
              {teamAName.charAt(0)}
            </span>
          </div>
          <div>
            <div className="font-semibold text-slate-900">{teamAName}</div>
            <div className="text-sm text-slate-500">
              {teamAPoints.toFixed(1)} points
            </div>
          </div>
          {hasTeamAWon && (
            <div className="ml-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-semibold">
                WINNER
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasTeamBWon && (
            <div className="mr-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-semibold">
                WINNER
              </span>
            </div>
          )}
          <div className="text-right">
            <div className="font-semibold text-slate-900">{teamBName}</div>
            <div className="text-sm text-slate-500">
              {teamBPoints.toFixed(1)} points
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: teamBColor }}
          >
            <span className="text-white font-bold text-lg">
              {teamBName.charAt(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Bar */}
      <div className="space-y-2">
        <div className="relative h-12 bg-slate-100 rounded-lg overflow-hidden">
          {/* Team A Bar */}
          <div
            className="absolute left-0 top-0 h-full transition-all duration-500 ease-out"
            style={{
              width: `${teamAPercentage}%`,
              backgroundColor: teamAColor,
              opacity: 0.9,
            }}
          />

          {/* Team B Bar */}
          <div
            className="absolute right-0 top-0 h-full transition-all duration-500 ease-out"
            style={{
              width: `${teamBPercentage}%`,
              backgroundColor: teamBColor,
              opacity: 0.9,
            }}
          />

          {/* Target line */}
          <div
            className="absolute top-0 h-full w-0.5 bg-slate-900 z-10"
            style={{
              left: `${(targetPoints / maxPoints) * 100}%`,
            }}
          >
            <div className="absolute left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
              Target: {targetPoints}
            </div>
          </div>

          {/* Score Labels */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <div className="text-white font-bold text-xl drop-shadow-lg">
              {teamAPoints.toFixed(1)}
            </div>
            <div className="text-white font-bold text-xl drop-shadow-lg">
              {teamBPoints.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="text-center text-sm">
          {hasTeamAWon || hasTeamBWon ? (
            <span className="font-semibold text-emerald-600">
              {hasTeamAWon ? teamAName : teamBName} wins the tournament!
            </span>
          ) : isTied ? (
            <span className="text-slate-600">All square</span>
          ) : (
            <span className="text-slate-600">
              {isTeamALeading ? teamAName : teamBName} leads by{" "}
              {Math.abs(teamAPoints - teamBPoints).toFixed(1)}{" "}
              {Math.abs(teamAPoints - teamBPoints) === 1 ? "point" : "points"}
            </span>
          )}
        </div>
      </div>

      {/* Points to Win */}
      {!hasTeamAWon && !hasTeamBWon && (
        <div className="flex justify-between text-sm text-slate-600">
          <div>
            Needs{" "}
            <span className="font-semibold text-slate-900">
              {(targetPoints - teamAPoints).toFixed(1)}
            </span>{" "}
            to win
          </div>
          <div className="text-right">
            Needs{" "}
            <span className="font-semibold text-slate-900">
              {(targetPoints - teamBPoints).toFixed(1)}
            </span>{" "}
            to win
          </div>
        </div>
      )}
    </div>
  );
};
