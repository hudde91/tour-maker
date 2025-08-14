import { useState } from "react";
import { Tour, Round } from "../../../types";
import { ScrambleTeamScorecard } from "./ScrambleTeamScorecard";
import { storage } from "../../../lib/storage";

interface ScrambleScoringInterfaceProps {
  tour: Tour;
  round: Round;
  onTeamScoreChange: (teamId: string, holeIndex: number, score: number) => void;
  onTeamTotalScoreChange: (teamId: string, totalScore: number) => void;
}

export const ScrambleScoringInterface = ({
  tour,
  round,
  onTeamScoreChange,
  onTeamTotalScoreChange,
}: ScrambleScoringInterfaceProps) => {
  const [currentHole, setCurrentHole] = useState(1);
  const [scoringMode, setScoringMode] = useState<"individual" | "total">(
    "individual"
  );

  const currentHoleInfo = round.holeInfo[currentHole - 1];
  const totalPar = storage.getTotalPar(round);

  if (!tour.teams || tour.teams.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto card-spacing">
          <span className="text-4xl">👥</span>
        </div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3">
          No Teams Found
        </h3>
        <p className="text-slate-500">
          Scramble format requires teams to be created and players assigned.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Mode Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="section-header">
          {scoringMode === "individual"
            ? `Team Scramble - Hole ${currentHole}`
            : "Team Scramble - Total Score Entry"}
        </h2>

        {/* Scoring Mode Toggle */}
        <div className="bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          <button
            onClick={() => setScoringMode("individual")}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              scoringMode === "individual"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hole by Hole
          </button>
          <button
            onClick={() => setScoringMode("total")}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              scoringMode === "total"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Total Score
          </button>
        </div>
      </div>

      {/* Scramble Format Info */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🤝</span>
          <h3 className="font-semibold text-emerald-900">Scramble Format</h3>
          {scoringMode === "individual" && (
            <span className="text-emerald-700 text-sm">
              Hole {currentHole} of {round.holes} • Par {currentHoleInfo.par}
            </span>
          )}
        </div>
        <p className="text-sm text-emerald-800">
          All team members tee off, choose the best shot, and all players hit
          from that location. One score recorded per team{" "}
          {scoringMode === "individual" ? "per hole" : "total"}.
        </p>
      </div>

      {/* Team Score Cards */}
      <div className="space-y-4">
        {tour.teams.map((team) => {
          const teamScore = storage.getTeamScore(tour, round.id, team.id);
          const currentScore = teamScore?.scores[currentHole - 1] || 0;
          const totalScore = teamScore?.totalScore || 0;

          return scoringMode === "total" ? (
            <div key={team.id} className="card-elevated">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                    style={{ backgroundColor: team.color }}
                  >
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {team.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Team Total Score Entry
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    {totalScore || "–"}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={totalScore || ""}
                    onChange={(e) => {
                      const score = parseInt(e.target.value);
                      if (score > 0) {
                        onTeamTotalScoreChange(team.id, score);
                      }
                    }}
                    className="input-field flex-1 text-center text-xl font-bold"
                    placeholder="Enter team total score"
                    min="18"
                    max="200"
                  />
                  <button
                    onClick={() => onTeamTotalScoreChange(team.id, totalPar)}
                    className="btn-secondary"
                  >
                    Par ({totalPar})
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ScrambleTeamScorecard
              key={team.id}
              team={team}
              tour={tour}
              holeInfo={currentHoleInfo}
              currentScore={currentScore}
              teamScore={teamScore}
              onScoreChange={(score) =>
                onTeamScoreChange(team.id, currentHole - 1, score)
              }
            />
          );
        })}
      </div>

      {/* Hole Navigation - Only show in hole-by-hole mode */}
      {scoringMode === "individual" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Hole Navigation</h3>
            <div className="text-sm text-slate-500">
              Hole {currentHole} of {round.holes}
            </div>
          </div>

          {/* Simple hole grid for scramble */}
          <div className="grid grid-cols-9 gap-2 card-spacing">
            {round.holeInfo.map((hole) => (
              <button
                key={hole.number}
                onClick={() => setCurrentHole(hole.number)}
                className={`relative h-12 rounded-lg border-2 font-semibold text-sm transition-all duration-200 hover:scale-105 focus:scale-105 outline-none ${
                  hole.number === currentHole
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-lg ring-2 ring-emerald-200 scale-105"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="font-bold">{hole.number}</div>
                  <div className="text-xs opacity-75">P{hole.par}</div>
                </div>
                {hole.number === currentHole && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
                )}
              </button>
            ))}
          </div>

          {/* Current Hole Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                    {currentHole}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Hole {currentHole}
                    </div>
                    <div className="text-sm text-slate-600">
                      Par {currentHoleInfo.par}
                    </div>
                  </div>
                </div>

                {currentHoleInfo.yardage && (
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">
                      {currentHoleInfo.yardage}
                    </span>{" "}
                    yards
                  </div>
                )}
              </div>

              {/* Navigation Arrows */}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    currentHole > 1 && setCurrentHole(currentHole - 1)
                  }
                  disabled={currentHole === 1}
                  className="w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-slate-600"
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
                    currentHole < round.holes && setCurrentHole(currentHole + 1)
                  }
                  disabled={currentHole === round.holes}
                  className="w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-slate-600"
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
      )}
    </div>
  );
};
