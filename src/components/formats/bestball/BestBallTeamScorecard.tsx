import { Team, Tour, Round } from "../../../types";
import { ScoreEntryCard } from "../../scoring/ScoreEntryCard";
import { TotalScoreCard } from "../../scoring/TotalScoreCard";

interface BestBallTeamScorecardProps {
  team: Team;
  tour: Tour;
  round: Round;
  currentHole: number;
  scoringMode: "individual" | "total";
  onPlayerScoreChange: (
    playerId: string,
    holeIndex: number,
    score: number
  ) => void;
  onPlayerTotalScoreChange: (
    playerId: string,
    totalScore: number,
    handicapStrokes?: number
  ) => void;
}

export const BestBallTeamScorecard = ({
  team,
  tour,
  round,
  currentHole,
  scoringMode,
  onPlayerScoreChange,
  onPlayerTotalScoreChange,
}: BestBallTeamScorecardProps) => {
  const teamPlayers = tour.players.filter((p) => p.teamId === team.id);
  const captain = teamPlayers.find((p) => p.id === team.captainId);

  // Calculate team scores using best ball logic
  const calculateTeamScores = () => {
    const teamHoleScores: number[] = [];
    let teamTotal = 0;

    for (let hole = 0; hole < round.holes; hole++) {
      const holeScores = teamPlayers
        .map((player) => round.scores[player.id]?.scores[hole] || 0)
        .filter((score) => score > 0);

      if (holeScores.length > 0) {
        const bestScore = Math.min(...holeScores);
        teamHoleScores.push(bestScore);
        teamTotal += bestScore;
      } else {
        teamHoleScores.push(0);
      }
    }

    return {
      holeScores: teamHoleScores,
      totalScore: teamTotal,
    };
  };

  // Get best score for current hole
  const getBestScoreForHole = (holeIndex: number) => {
    const holeScores = teamPlayers
      .map((player) => {
        const score = round.scores[player.id]?.scores[holeIndex] || 0;
        return { playerId: player.id, score };
      })
      .filter((s) => s.score > 0);

    if (holeScores.length === 0) return null;

    const bestScore = Math.min(...holeScores.map((s) => s.score));
    const bestPlayers = holeScores.filter((s) => s.score === bestScore);

    return {
      score: bestScore,
      playerIds: bestPlayers.map((p) => p.playerId),
    };
  };

  const teamScores = calculateTeamScores();
  const currentHoleBest = getBestScoreForHole(currentHole - 1);

  return (
    <div className="card-elevated">
      {/* Team Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
            style={{ backgroundColor: team.color }}
          >
            <span className="text-2xl">⭐</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {team.name}
            </h3>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span>{teamPlayers.length} Players</span>
              {captain && (
                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-semibold border border-amber-200">
                  👑 {captain.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Team Score Display */}
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">
            {teamScores.totalScore || "–"}
          </div>
          <div className="text-sm font-medium text-slate-600">
            Total Strokes
          </div>
        </div>
      </div>

      {/* Current Hole Best Score Display - Only for hole-by-hole mode */}
      {scoringMode === "individual" && currentHoleBest && (
        <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-emerald-800">
              Team Best Score - Hole {currentHole}:
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-emerald-900">
                {currentHoleBest.score} strokes
              </span>
              <span className="text-xs text-emerald-700">
                by{" "}
                {currentHoleBest.playerIds.length === 1
                  ? tour.players.find(
                      (p) => p.id === currentHoleBest.playerIds[0]
                    )?.name
                  : `${currentHoleBest.playerIds.length} players`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Player Scores */}
      <div className="p-6 space-y-4">
        {teamPlayers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-slate-500 font-medium">
              No players assigned to this team
            </p>
          </div>
        ) : (
          teamPlayers.map((player) => {
            const playerScore = round.scores[player.id];
            const currentScore = playerScore?.scores[currentHole - 1] || 0;
            const totalScore = playerScore?.totalScore || 0;

            // Check if this player has the best score for current hole
            const hasBestScore =
              currentHoleBest?.playerIds.includes(player.id) || false;

            return (
              <div
                key={player.id}
                className={`relative ${
                  scoringMode === "individual" && hasBestScore
                    ? "ring-2 ring-emerald-400 rounded-xl"
                    : ""
                }`}
              >
                {/* Best Score Indicator */}
                {scoringMode === "individual" && hasBestScore && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center z-10">
                    <span className="text-white text-xs font-bold">★</span>
                  </div>
                )}

                {scoringMode === "total" ? (
                  <TotalScoreCard
                    player={player}
                    round={round}
                    currentTotalScore={totalScore}
                    onTotalScoreChange={(score, handicapStrokes) =>
                      onPlayerTotalScoreChange(
                        player.id,
                        score,
                        handicapStrokes
                      )
                    }
                  />
                ) : (
                  <ScoreEntryCard
                    player={player}
                    holeInfo={round.holeInfo[currentHole - 1]}
                    currentScore={currentScore}
                    playerScore={playerScore}
                    onScoreChange={(score) =>
                      onPlayerScoreChange(player.id, currentHole - 1, score)
                    }
                    strokesGiven={round.settings.strokesGiven}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Team Summary */}
      <div className="border-t border-slate-200 p-4 bg-slate-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-slate-900">
              {teamScores.totalScore || 0}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Team Total
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {teamScores.holeScores.filter((s) => s > 0).length}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Holes Played
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {teamScores.holeScores.filter((s) => s > 0).length > 0
                ? Math.round(
                    teamScores.totalScore /
                      teamScores.holeScores.filter((s) => s > 0).length
                  )
                : 0}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Avg per Hole
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
