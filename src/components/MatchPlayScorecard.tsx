import { useState } from "react";
import { Tour, Round, MatchPlayRound } from "../types";

interface MatchPlayScorecardProps {
  match: MatchPlayRound;
  tour: Tour;
  round: Round;
  currentHole: number;
  onHoleUpdate: (
    holeNumber: number,
    teamAScore: number,
    teamBScore: number
  ) => void;
}

export const MatchPlayScorecard = ({
  match,
  tour,
  round,
  currentHole,
  onHoleUpdate,
}: MatchPlayScorecardProps) => {
  const currentHoleInfo = round.holeInfo[currentHole - 1];
  const currentHoleData = match.holes.find(
    (h) => h.holeNumber === currentHole
  ) || {
    holeNumber: currentHole,
    teamAScore: 0,
    teamBScore: 0,
    result: "tie" as const,
    matchStatus: "",
  };

  const [teamAScore, setTeamAScore] = useState(currentHoleData.teamAScore);
  const [teamBScore, setTeamBScore] = useState(currentHoleData.teamBScore);

  const getTeamInfo = (teamId: string, playerIds: string[]) => {
    const team = tour.teams?.find((t) => t.id === teamId);
    const players = playerIds
      .map((id) => tour.players.find((p) => p.id === id)?.name)
      .filter(Boolean);
    return {
      name: team?.name || `Team ${teamId}`,
      color: team?.color || "#6b7280",
      players,
    };
  };

  const teamAInfo = getTeamInfo(match.teamA.id, match.teamA.playerIds);
  const teamBInfo = getTeamInfo(match.teamB.id, match.teamB.playerIds);

  const handleScoreUpdate = () => {
    if (teamAScore > 0 && teamBScore > 0) {
      onHoleUpdate(currentHole, teamAScore, teamBScore);
    }
  };

  const getScoreButtonClass = (score: number, currentTeamScore: number) => {
    const isSelected = score === currentTeamScore;
    return `p-2 rounded-lg font-bold text-center transition-all border-2 ${
      isSelected
        ? "bg-emerald-600 text-white border-emerald-600 scale-105"
        : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:scale-105"
    }`;
  };

  const getHoleResultDisplay = () => {
    if (teamAScore === 0 || teamBScore === 0) return null;

    if (teamAScore < teamBScore) {
      return (
        <div className="text-center py-2">
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-semibold">
            {teamAInfo.name} wins hole
          </span>
        </div>
      );
    } else if (teamBScore < teamAScore) {
      return (
        <div className="text-center py-2">
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-semibold">
            {teamBInfo.name} wins hole
          </span>
        </div>
      );
    } else {
      return (
        <div className="text-center py-2">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
            Hole Tied
          </span>
        </div>
      );
    }
  };

  return (
    <div className="card-elevated">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Hole {currentHole} - Par {currentHoleInfo.par}
          </h3>
          <p className="text-slate-600">
            {match.format.charAt(0).toUpperCase() + match.format.slice(1)} Match
          </p>
        </div>
        <div className="text-right">
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold">
            ⚔️ Match Play
          </span>
        </div>
      </div>

      {/* Team Scoring Areas */}
      <div className="space-y-6">
        {/* Team A */}
        <div
          className="border-2 rounded-xl p-5"
          style={{
            borderColor: teamAInfo.color + "40",
            backgroundColor: teamAInfo.color + "08",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: teamAInfo.color }}
              >
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">
                  {teamAInfo.name}
                </h4>
                <p className="text-sm text-slate-600">
                  {teamAInfo.players.join(" & ")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {teamAScore || "–"}
              </div>
              <div className="text-xs text-slate-500">Strokes</div>
            </div>
          </div>

          {/* Score Selection */}
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((score) => (
              <button
                key={score}
                onClick={() => {
                  setTeamAScore(score);
                  // Auto-update if both scores are set
                  if (teamBScore > 0) {
                    setTimeout(
                      () => onHoleUpdate(currentHole, score, teamBScore),
                      100
                    );
                  }
                }}
                className={getScoreButtonClass(score, teamAScore)}
              >
                {score}
              </button>
            ))}
          </div>
        </div>

        {/* VS Divider with hole result */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-slate-50 px-4 py-2 rounded-full border border-slate-300">
              <span className="text-slate-600 font-semibold">VS</span>
            </div>
          </div>
        </div>

        {/* Team B */}
        <div
          className="border-2 rounded-xl p-5"
          style={{
            borderColor: teamBInfo.color + "40",
            backgroundColor: teamBInfo.color + "08",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: teamBInfo.color }}
              >
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">
                  {teamBInfo.name}
                </h4>
                <p className="text-sm text-slate-600">
                  {teamBInfo.players.join(" & ")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {teamBScore || "–"}
              </div>
              <div className="text-xs text-slate-500">Strokes</div>
            </div>
          </div>

          {/* Score Selection */}
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((score) => (
              <button
                key={score}
                onClick={() => {
                  setTeamBScore(score);
                  // Auto-update if both scores are set
                  if (teamAScore > 0) {
                    setTimeout(
                      () => onHoleUpdate(currentHole, teamAScore, score),
                      100
                    );
                  }
                }}
                className={getScoreButtonClass(score, teamBScore)}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hole Result */}
      {getHoleResultDisplay()}

      {/* Update Button */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => {
            setTeamAScore(0);
            setTeamBScore(0);
          }}
          className="btn-secondary flex-1"
        >
          Clear Scores
        </button>
        <button
          onClick={handleScoreUpdate}
          disabled={teamAScore === 0 || teamBScore === 0}
          className="btn-primary flex-1 disabled:opacity-50"
        >
          {teamAScore > 0 && teamBScore > 0
            ? "Update Scores"
            : "Enter Both Scores"}
        </button>
      </div>

      {/* Match Progress Summary */}
      <div className="mt-6 pt-6 border-t border-slate-200 bg-slate-50 rounded-lg p-4">
        <h5 className="font-semibold text-slate-800 mb-3">Match Progress</h5>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-slate-900">
              {match.holes.filter((h) => h.result === "team-a").length}
            </div>
            <div className="text-xs text-slate-500">{teamAInfo.name} Wins</div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {match.holes.filter((h) => h.result === "tie").length}
            </div>
            <div className="text-xs text-slate-500">Ties</div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {match.holes.filter((h) => h.result === "team-b").length}
            </div>
            <div className="text-xs text-slate-500">{teamBInfo.name} Wins</div>
          </div>
        </div>
      </div>
    </div>
  );
};
