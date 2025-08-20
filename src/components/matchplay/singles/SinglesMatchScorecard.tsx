import { useState, useEffect } from "react";
import { Tour, Round, MatchPlayRound } from "../../../types";
import MatchStatusBadge from "../rydercup/MatchStatusBadge";

interface SinglesMatchScorecardProps {
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

export const SinglesMatchScorecard = ({
  match,
  tour,
  round,
  currentHole,
  onHoleUpdate,
}: SinglesMatchScorecardProps) => {
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

  const [playerAScore, setPlayerAScore] = useState(0);
  const [playerBScore, setPlayerBScore] = useState(0);

  // Reset scores when hole changes - load existing scores if available
  useEffect(() => {
    const playerAId = match.teamA.playerIds[0];
    const playerBId = match.teamB.playerIds[0];

    const playerAExistingScore =
      round.scores[playerAId]?.scores[currentHole - 1] || 0;
    const playerBExistingScore =
      round.scores[playerBId]?.scores[currentHole - 1] || 0;

    setPlayerAScore(playerAExistingScore);
    setPlayerBScore(playerBExistingScore);
  }, [currentHole, match.teamA.playerIds, match.teamB.playerIds, round.scores]);

  const handlePlayerAScoreChange = (score: number) => {
    setPlayerAScore(score);
    // Auto-update if both scores are now available
    if (playerBScore > 0) {
      onHoleUpdate(currentHole, score, playerBScore);
    }
  };

  const handlePlayerBScoreChange = (score: number) => {
    setPlayerBScore(score);
    // Auto-update if both scores are now available
    if (playerAScore > 0) {
      onHoleUpdate(currentHole, playerAScore, score);
    }
  };

  const getPlayerInfo = (teamId: string, playerIds: string[]) => {
    const team = tour.teams?.find((t) => t.id === teamId);
    const player = tour.players.find((p) => p.id === playerIds[0]);

    return {
      teamName: team?.name || `Team ${teamId}`,
      teamColor: team?.color || "#6b7280",
      player: player
        ? { id: player.id, name: player.name, handicap: player.handicap }
        : null,
    };
  };

  const playerAInfo = getPlayerInfo(match.teamA.id, match.teamA.playerIds);
  const playerBInfo = getPlayerInfo(match.teamB.id, match.teamB.playerIds);

  const getScoreButtonClass = (score: number, currentPlayerScore: number) => {
    const isSelected = score === currentPlayerScore && currentPlayerScore > 0;
    return `p-3 rounded-lg font-bold text-center transition-all border-2 ${
      isSelected
        ? "bg-emerald-600 text-white border-emerald-600 scale-105 shadow-lg"
        : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:scale-105"
    }`;
  };

  const getHoleResultDisplay = () => {
    if (playerAScore === 0 || playerBScore === 0) return null;

    if (playerAScore < playerBScore) {
      return (
        <div className="text-center py-3">
          <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-semibold text-lg">
            🏆 {playerAInfo.player?.name} wins hole
          </span>
        </div>
      );
    } else if (playerBScore < playerAScore) {
      return (
        <div className="text-center py-3">
          <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-semibold text-lg">
            🏆 {playerBInfo.player?.name} wins hole
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
    setPlayerAScore(0);
    setPlayerBScore(0);
  };

  return (
    <div className="card-elevated">
      {/* Header */}
      <div className="text-center card-spacing">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          Hole {currentHole} - Par {currentHoleInfo.par}
        </h3>
        <div className="flex justify-center">
          <MatchStatusBadge match={match} totalHoles={round.holes ?? 18} />
        </div>
        <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
          <span className="bg-red-100 px-3 py-1 rounded-full">👤 Singles</span>
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
      <div className="text-center card-spacing">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h4 className="font-semibold text-emerald-900 mb-2">Match Status</h4>
          <div className="text-lg font-bold text-emerald-800">
            {currentHoleData.matchStatus || "All Square"}
          </div>
        </div>
      </div>

      {/* Player Scoring Areas */}
      <div className="space-y-6">
        {/* Player A */}
        <div
          className="border-3 rounded-xl p-6"
          style={{
            borderColor: playerAInfo.teamColor,
            backgroundColor: playerAInfo.teamColor + "08",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: playerAInfo.teamColor }}
              >
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">
                  {playerAInfo.player?.name || "Player A"}
                </h4>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span>{playerAInfo.teamName}</span>
                  {playerAInfo.player?.handicap !== undefined && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                      HC: {playerAInfo.player.handicap}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">
                {playerAScore || "–"}
              </div>
              <div className="text-sm text-slate-500">Strokes</div>
            </div>
          </div>

          {/* Score Selection */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((score) => (
              <button
                key={score}
                onClick={() => handlePlayerAScoreChange(score)}
                className={getScoreButtonClass(score, playerAScore)}
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
              <span className="text-slate-700 font-bold text-lg">SINGLES</span>
            </div>
          </div>
          {getHoleResultDisplay()}
        </div>

        {/* Player B */}
        <div
          className="border-3 rounded-xl p-6"
          style={{
            borderColor: playerBInfo.teamColor,
            backgroundColor: playerBInfo.teamColor + "08",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: playerBInfo.teamColor }}
              >
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">
                  {playerBInfo.player?.name || "Player B"}
                </h4>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span>{playerBInfo.teamName}</span>
                  {playerBInfo.player?.handicap !== undefined && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                      HC: {playerBInfo.player.handicap}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">
                {playerBScore || "–"}
              </div>
              <div className="text-sm text-slate-500">Strokes</div>
            </div>
          </div>

          {/* Score Selection */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((score) => (
              <button
                key={score}
                onClick={() => handlePlayerBScoreChange(score)}
                className={getScoreButtonClass(score, playerBScore)}
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
          disabled={playerAScore === 0 || playerBScore === 0}
          className="btn-primary flex-1 disabled:opacity-50 text-lg py-3"
        >
          {playerAScore > 0 && playerBScore > 0
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
              style={{ color: playerAInfo.teamColor }}
            >
              {match.holes.filter((h) => h.result === "team-a").length}
            </div>
            <div className="text-sm text-slate-500">
              {playerAInfo.player?.name} Wins
            </div>
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
              style={{ color: playerBInfo.teamColor }}
            >
              {match.holes.filter((h) => h.result === "team-b").length}
            </div>
            <div className="text-sm text-slate-500">
              {playerBInfo.player?.name} Wins
            </div>
          </div>
        </div>

        {/* Tournament Points */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex justify-center items-center gap-8">
            <div className="text-center">
              <div
                className="text-3xl font-bold"
                style={{ color: playerAInfo.teamColor }}
              >
                {match.points.teamA}
              </div>
              <div className="text-xs text-slate-500">Tournament Points</div>
            </div>
            <span className="text-slate-400">vs</span>
            <div className="text-center">
              <div
                className="text-3xl font-bold"
                style={{ color: playerBInfo.teamColor }}
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
