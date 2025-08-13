import { useState, useEffect } from "react";
import { Tour, Round, MatchPlayRound } from "../types";

interface FoursomesMatchScorecardProps {
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

export const FoursomesMatchScorecard = ({
  match,
  tour,
  round,
  currentHole,
  onHoleUpdate,
}: FoursomesMatchScorecardProps) => {
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

  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);

  // Reset scores when hole changes - load existing scores if available
  useEffect(() => {
    setTeamAScore(currentHoleData.teamAScore);
    setTeamBScore(currentHoleData.teamBScore);
  }, [currentHole, currentHoleData.teamAScore, currentHoleData.teamBScore]);

  const getTeamInfo = (teamId: string, playerIds: string[]) => {
    const team = tour.teams?.find((t) => t.id === teamId);
    const players = playerIds
      .map((id) => {
        const player = tour.players.find((p) => p.id === id);
        return player ? { id: player.id, name: player.name } : null;
      })
      .filter(Boolean);

    return {
      name: team?.name || `Team ${teamId}`,
      color: team?.color || "#6b7280",
      players: players as { id: string; name: string }[],
    };
  };

  const teamAInfo = getTeamInfo(match.teamA.id, match.teamA.playerIds);
  const teamBInfo = getTeamInfo(match.teamB.id, match.teamB.playerIds);

  // Determine who tees off (Player A on odd holes, Player B on even holes)
  const getTeeShotPlayer = (
    holeNumber: number,
    players: { id: string; name: string }[]
  ) => {
    if (players.length < 2) return players[0];
    return holeNumber % 2 === 1 ? players[0] : players[1];
  };

  const teamATeePlayer = getTeeShotPlayer(currentHole, teamAInfo.players);
  const teamBTeePlayer = getTeeShotPlayer(currentHole, teamBInfo.players);

  const handleTeamAScoreChange = (score: number) => {
    setTeamAScore(score);
    // Auto-update if both scores are now available
    if (teamBScore > 0) {
      onHoleUpdate(currentHole, score, teamBScore);
    }
  };

  const handleTeamBScoreChange = (score: number) => {
    setTeamBScore(score);
    // Auto-update if both scores are now available
    if (teamAScore > 0) {
      onHoleUpdate(currentHole, teamAScore, score);
    }
  };

  const getScoreButtonClass = (score: number, currentTeamScore: number) => {
    const isSelected = score === currentTeamScore && currentTeamScore > 0;
    return `p-3 rounded-lg font-bold text-center transition-all border-2 ${
      isSelected
        ? "bg-emerald-600 text-white border-emerald-600 scale-105 shadow-lg"
        : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:scale-105"
    }`;
  };

  const getHoleResultDisplay = () => {
    if (teamAScore === 0 || teamBScore === 0) return null;

    if (teamAScore < teamBScore) {
      return (
        <div className="text-center py-3">
          <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-semibold text-lg">
            🏆 {teamAInfo.name} wins hole
          </span>
        </div>
      );
    } else if (teamBScore < teamAScore) {
      return (
        <div className="text-center py-3">
          <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-semibold text-lg">
            🏆 {teamBInfo.name} wins hole
          </span>
        </div>
      );
    } else {
      return (
        <div className="text-center py-3">
          <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-lg">
            🤝 Hole Tied
          </span>
        </div>
      );
    }
  };

  const clearAllScores = () => {
    setTeamAScore(0);
    setTeamBScore(0);
  };

  return (
    <div className="card-elevated">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          Hole {currentHole} - Par {currentHoleInfo.par}
        </h3>
        <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
          <span className="bg-slate-100 px-3 py-1 rounded-full">
            🔄 Foursomes
          </span>
          <span className="bg-slate-100 px-3 py-1 rounded-full">
            ⚔️ Match Play
          </span>
          {currentHoleInfo.yardage && (
            <span className="bg-slate-100 px-3 py-1 rounded-full">
              📏 {currentHoleInfo.yardage} yards
            </span>
          )}
        </div>
      </div>

      {/* Current Match Status */}
      <div className="text-center mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h4 className="font-semibold text-emerald-900 mb-2">Match Status</h4>
          <div className="text-lg font-bold text-emerald-800">
            {currentHoleData.matchStatus || "All Square"}
          </div>
        </div>
      </div>

      {/* Team Scoring Areas */}
      <div className="space-y-6">
        {/* Team A */}
        <div
          className="border-3 rounded-xl p-6"
          style={{
            borderColor: teamAInfo.color,
            backgroundColor: teamAInfo.color + "08",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: teamAInfo.color }}
              >
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">
                  {teamAInfo.name}
                </h4>
                <div className="text-sm text-slate-700">
                  {teamAInfo.players.map((player, index) => (
                    <span key={player.id} className="mr-3">
                      {player.name}
                      {teamATeePlayer?.id === player.id && (
                        <span className="ml-1 text-emerald-600 font-semibold">
                          ⛳
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {teamATeePlayer?.name} tees off (Hole {currentHole})
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">
                {teamAScore || "–"}
              </div>
              <div className="text-sm text-slate-500">Team Score</div>
            </div>
          </div>

          {/* Score Selection */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((score) => (
              <button
                key={score}
                onClick={() => handleTeamAScoreChange(score)}
                className={getScoreButtonClass(score, teamAScore)}
              >
                <div className="text-lg font-bold">{score}</div>
                <div className="text-xs">
                  {score === currentHoleInfo.par
                    ? "Par"
                    : score === currentHoleInfo.par - 1
                    ? "Birdie"
                    : score === currentHoleInfo.par + 1
                    ? "Bogey"
                    : ""}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* VS Divider with result */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-slate-300"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-slate-50 px-6 py-3 rounded-full border-2 border-slate-300">
              <span className="text-slate-700 font-bold text-lg">
                FOURSOMES
              </span>
            </div>
          </div>
          {getHoleResultDisplay()}
        </div>

        {/* Team B */}
        <div
          className="border-3 rounded-xl p-6"
          style={{
            borderColor: teamBInfo.color,
            backgroundColor: teamBInfo.color + "08",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: teamBInfo.color }}
              >
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">
                  {teamBInfo.name}
                </h4>
                <div className="text-sm text-slate-700">
                  {teamBInfo.players.map((player, index) => (
                    <span key={player.id} className="mr-3">
                      {player.name}
                      {teamBTeePlayer?.id === player.id && (
                        <span className="ml-1 text-emerald-600 font-semibold">
                          ⛳
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {teamBTeePlayer?.name} tees off (Hole {currentHole})
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">
                {teamBScore || "–"}
              </div>
              <div className="text-sm text-slate-500">Team Score</div>
            </div>
          </div>

          {/* Score Selection */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((score) => (
              <button
                key={score}
                onClick={() => handleTeamBScoreChange(score)}
                className={getScoreButtonClass(score, teamBScore)}
              >
                <div className="text-lg font-bold">{score}</div>
                <div className="text-xs">
                  {score === currentHoleInfo.par
                    ? "Par"
                    : score === currentHoleInfo.par - 1
                    ? "Birdie"
                    : score === currentHoleInfo.par + 1
                    ? "Bogey"
                    : ""}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button onClick={clearAllScores} className="btn-secondary flex-1">
          Clear Scores
        </button>
        <button
          disabled={teamAScore === 0 || teamBScore === 0}
          className="btn-primary flex-1 disabled:opacity-50 text-lg py-3"
        >
          {teamAScore > 0 && teamBScore > 0
            ? "✅ Scores Updated"
            : "⏳ Enter Both Scores"}
        </button>
      </div>

      {/* Match Progress Summary */}
      <div className="mt-6 pt-6 border-t border-slate-200 bg-slate-50 rounded-lg p-4">
        <h5 className="font-semibold text-slate-800 mb-4 text-center">
          🏆 Match Progress
        </h5>
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <div
              className="text-2xl font-bold"
              style={{ color: teamAInfo.color }}
            >
              {match.holes.filter((h) => h.result === "team-a").length}
            </div>
            <div className="text-sm text-slate-500">{teamAInfo.name} Wins</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-600">
              {match.holes.filter((h) => h.result === "tie").length}
            </div>
            <div className="text-sm text-slate-500">Ties</div>
          </div>
          <div>
            <div
              className="text-2xl font-bold"
              style={{ color: teamBInfo.color }}
            >
              {match.holes.filter((h) => h.result === "team-b").length}
            </div>
            <div className="text-sm text-slate-500">{teamBInfo.name} Wins</div>
          </div>
        </div>

        {/* Tournament Points */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex justify-center items-center gap-8">
            <div className="text-center">
              <div
                className="text-3xl font-bold"
                style={{ color: teamAInfo.color }}
              >
                {match.points.teamA}
              </div>
              <div className="text-xs text-slate-500">Tournament Points</div>
            </div>
            <span className="text-slate-400">vs</span>
            <div className="text-center">
              <div
                className="text-3xl font-bold"
                style={{ color: teamBInfo.color }}
              >
                {match.points.teamB}
              </div>
              <div className="text-xs text-slate-500">Tournament Points</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
