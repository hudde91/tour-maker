import { useState, useEffect } from "react";
import { Tour, Round, MatchPlayRound } from "../../../types";
import MatchStatusBadge from "../rydercup/MatchStatusBadge";
import { safeMin, formatHoleScore } from "../../../lib/scoringUtils";

interface FourBallMatchScorecardProps {
  match: MatchPlayRound;
  tour: Tour;
  round: Round;
  currentHole: number;
  onHoleUpdate: (
    holeNumber: number,
    teamAScore: number,
    teamBScore: number,
    individualScores: {
      teamA: { [playerId: string]: number };
      teamB: { [playerId: string]: number };
    }
  ) => void;
}

export const FourBallMatchScorecard = ({
  match,
  tour,
  round,
  currentHole,
  onHoleUpdate,
}: FourBallMatchScorecardProps) => {
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

  // Individual player scores
  const [teamAPlayerScores, setTeamAPlayerScores] = useState<{
    [playerId: string]: number;
  }>({
    [match.teamA.playerIds[0]]: 0,
    [match.teamA.playerIds[1]]: 0,
  });

  const [teamBPlayerScores, setTeamBPlayerScores] = useState<{
    [playerId: string]: number;
  }>({
    [match.teamB.playerIds[0]]: 0,
    [match.teamB.playerIds[1]]: 0,
  });

  // Reset player scores when hole changes - load existing scores if available
  useEffect(() => {
    const newTeamAScores: { [playerId: string]: number } = {};
    const newTeamBScores: { [playerId: string]: number } = {};

    // Load existing scores for this hole if they exist
    match.teamA.playerIds.forEach((playerId) => {
      const playerScore = round.scores[playerId];
      newTeamAScores[playerId] = playerScore?.scores[currentHole - 1] || 0;
    });

    match.teamB.playerIds.forEach((playerId) => {
      const playerScore = round.scores[playerId];
      newTeamBScores[playerId] = playerScore?.scores[currentHole - 1] || 0;
    });

    setTeamAPlayerScores(newTeamAScores);
    setTeamBPlayerScores(newTeamBScores);
  }, [currentHole, match.teamA.playerIds, match.teamB.playerIds, round.scores]);

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

  // Calculate best ball scores for each team

  const teamABestScore = safeMin(Object.values(teamAPlayerScores));
  const teamBBestScore = safeMin(Object.values(teamBPlayerScores));

  const updatePlayerScore = (
    playerId: string,
    score: number,
    team: "A" | "B"
  ) => {
    if (team === "A") {
      const newScores = { ...teamAPlayerScores, [playerId]: score };
      setTeamAPlayerScores(newScores);

      // Check if we should auto-update after this score change
      const hasAllTeamAScores = Object.values(newScores).every((s) => s > 0);
      const hasAllTeamBScores = Object.values(teamBPlayerScores).every(
        (s) => s > 0
      );

      if (hasAllTeamAScores && hasAllTeamBScores) {
        const newTeamABest = safeMin(Object.values(newScores));
        onHoleUpdate(
          currentHole,
          typeof newTeamABest === "number" ? newTeamABest : 0,
          typeof teamBBestScore === "number" ? teamBBestScore : 0,
          {
            teamA: newScores,
            teamB: teamBPlayerScores,
          }
        );
      }
    } else {
      const newScores = { ...teamBPlayerScores, [playerId]: score };
      setTeamBPlayerScores(newScores);

      // Check if we should auto-update after this score change
      const hasAllTeamAScores = Object.values(teamAPlayerScores).every(
        (s) => s > 0
      );
      const hasAllTeamBScores = Object.values(newScores).every((s) => s > 0);

      if (hasAllTeamAScores && hasAllTeamBScores) {
        const newTeamBBest = safeMin(Object.values(newScores));
        onHoleUpdate(
          currentHole,
          typeof teamABestScore === "number" ? teamABestScore : 0,
          typeof newTeamBBest === "number" ? newTeamBBest : 0,
          {
            teamA: teamAPlayerScores,
            teamB: newScores,
          }
        );
      }
    }
  };

  const getScoreButtonStyle = (score: number, currentScore: number) => {
    const isSelected = score === currentScore && currentScore > 0;
    return `p-2 rounded-lg font-bold text-center transition-all border-2 ${
      isSelected
        ? "bg-emerald-600 text-white border-emerald-600 scale-105 shadow-lg"
        : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:scale-105"
    }`;
  };

  const renderHoleResult = () => {
    if (teamABestScore === 0 || teamBBestScore === 0) return null;

    const teamABest = typeof teamABestScore === "number" ? teamABestScore : 0;
    const teamBBest = typeof teamBBestScore === "number" ? teamBBestScore : 0;

    if (teamABest < teamBBest) {
      return (
        <div className="text-center py-3">
          <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-semibold text-lg">
            🏆 {teamAInfo.name} wins hole ({teamABest} vs {teamBBest})
          </span>
        </div>
      );
    } else if (teamBBest < teamABest) {
      return (
        <div className="text-center py-3">
          <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-semibold text-lg">
            🏆 {teamBInfo.name} wins hole ({teamBBest} vs {teamABest})
          </span>
        </div>
      );
    } else {
      return (
        <div className="text-center py-3">
          <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-lg">
            🤝 Hole Tied ({teamABest} each)
          </span>
        </div>
      );
    }
  };

  const resetAllScores = () => {
    setTeamAPlayerScores({
      [match.teamA.playerIds[0]]: 0,
      [match.teamA.playerIds[1]]: 0,
    });
    setTeamBPlayerScores({
      [match.teamB.playerIds[0]]: 0,
      [match.teamB.playerIds[1]]: 0,
    });
  };

  return (
    <div className="card-elevated">
      {/* Header */}
      <div className="text-center card-spacing">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          Hole {currentHole} - Par {currentHoleInfo.par}
        </h3>
        <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
          <span className="bg-amber-100 px-3 py-1 rounded-full">
            ⭐ Four-Ball
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

      <div className="text-center card-spacing">
        <MatchStatusBadge match={match} totalHoles={round.holes ?? 18} />
      </div>

      {/* Team A - Individual Player Scoring */}
      <div
        className="border-3 rounded-xl p-6 card-spacing"
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
              <p className="text-sm text-slate-600">
                Best Ball:
                <span className="font-bold ml-1">
                  {formatHoleScore(teamABestScore)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Individual Players */}
        <div className="space-y-4">
          {teamAInfo.players.map((player) => (
            <div
              key={player.id}
              className="bg-white rounded-lg p-4 border border-slate-200"
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h5 className="font-semibold text-slate-900">
                    {player.name}
                  </h5>
                  <p className="text-sm text-slate-600">Individual Score</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    {teamAPlayerScores[player.id] || "–"}
                  </div>
                  {teamAPlayerScores[player.id] === teamABestScore &&
                    teamABestScore > 0 && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-semibold">
                        ⭐ Best
                      </span>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                {Array.from({ length: 8 }, (_, i) => i + 1).map((score) => (
                  <button
                    key={score}
                    onClick={() => updatePlayerScore(player.id, score, "A")}
                    className={getScoreButtonStyle(
                      score,
                      teamAPlayerScores[player.id]
                    )}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VS Divider with result */}
      <div className="relative card-spacing">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-slate-300"></div>
        </div>
        <div className="relative flex justify-center">
          <div className="bg-slate-50 px-6 py-3 rounded-full border-2 border-slate-300">
            <span className="text-slate-700 font-bold text-lg">FOUR-BALL</span>
          </div>
        </div>
        {renderHoleResult()}
      </div>

      {/* Team B - Individual Player Scoring */}
      <div
        className="border-3 rounded-xl p-6 card-spacing"
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
              <p className="text-sm text-slate-600">
                Best Ball:
                <span className="font-bold ml-1">
                  {formatHoleScore(teamBBestScore)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Individual Players */}
        <div className="space-y-4">
          {teamBInfo.players.map((player) => (
            <div
              key={player.id}
              className="bg-white rounded-lg p-4 border border-slate-200"
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h5 className="font-semibold text-slate-900">
                    {player.name}
                  </h5>
                  <p className="text-sm text-slate-600">Individual Score</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    {teamBPlayerScores[player.id] || "–"}
                  </div>
                  {teamBPlayerScores[player.id] === teamBBestScore &&
                    teamBBestScore > 0 && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-semibold">
                        ⭐ Best
                      </span>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                {Array.from({ length: 8 }, (_, i) => i + 1).map((score) => (
                  <button
                    key={score}
                    onClick={() => updatePlayerScore(player.id, score, "B")}
                    className={getScoreButtonStyle(
                      score,
                      teamBPlayerScores[player.id]
                    )}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 card-spacing">
        <button onClick={resetAllScores} className="btn-secondary flex-1">
          Clear All Scores
        </button>
        <button
          disabled={teamABestScore === 0 || teamBBestScore === 0}
          className="btn-primary flex-1 disabled:opacity-50 text-lg py-3"
        >
          {typeof teamABestScore === "number" &&
          typeof teamBBestScore === "number" &&
          teamABestScore > 0 &&
          teamBBestScore > 0
            ? "✅ Scores Updated"
            : "⏳ Enter All Player Scores"}
        </button>
      </div>

      {/* Match Progress Summary */}
      <div className="pt-6 border-t border-slate-200 bg-slate-50 rounded-lg p-4">
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
        <div className="pt-4 border-t border-slate-200">
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
