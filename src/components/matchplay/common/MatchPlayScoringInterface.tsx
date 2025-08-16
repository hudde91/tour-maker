import { useState } from "react";
import { Tour, Round } from "../../../types";
import { MatchPlayScorecard } from "./MatchPlayScorecard";
import { MatchPlayLeaderboard } from "./MatchPlayLeaderboard";
import { HoleNavigation } from "../../scoring/HoleNavigation";

interface MatchPlayScoringInterfaceProps {
  tour: Tour;
  round: Round;
  onMatchHoleUpdate: (
    matchId: string,
    holeNumber: number,
    teamAScore: number,
    teamBScore: number
  ) => void;
}

export const MatchPlayScoringInterface = ({
  tour,
  round,
  onMatchHoleUpdate,
}: MatchPlayScoringInterfaceProps) => {
  const [currentHole, setCurrentHole] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  const matches = round.ryderCup?.matches || [];
  const currentMatch =
    matches.find((m) => m.id === selectedMatch) || matches[0];

  // Get team names for display
  const getTeamName = (teamId: string) => {
    return tour.teams?.find((t) => t.id === teamId)?.name || `Team ${teamId}`;
  };

  const getPlayerNames = (playerIds: string[]) => {
    return playerIds
      .map((id) => tour.players.find((p) => p.id === id)?.name || "Unknown")
      .join(" & ");
  };

  // Get player scores for hole navigation (show match progress)
  const getMatchProgress = () => {
    const progress: Record<string, number[]> = {};
    matches.forEach((match) => {
      const holeResults = new Array(round.holes).fill(0);
      match.holes.forEach((hole) => {
        holeResults[hole.holeNumber - 1] = 1; // mark as completed
      });
      progress[match.id] = holeResults;
    });
    return progress;
  };

  if (matches.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto card-spacing">
          <span className="text-4xl">⚔️</span>
        </div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3">
          No Matches Created
        </h3>
        <p className="text-slate-500">
          Match play rounds require matches to be set up between teams.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Match Selection & Status */}
      <div className="card">
        <h2 className="section-header mb-4">Match Play - Hole {currentHole}</h2>

        {/* Match Selector */}
        {matches.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Match:
            </label>
            <select
              value={currentMatch?.id || ""}
              onChange={(e) => setSelectedMatch(e.target.value)}
              className="input-field"
            >
              {matches.map((match, index) => (
                <option key={match.id} value={match.id}>
                  Match {index + 1}: {getTeamName(match.teamA.id)} vs{" "}
                  {getTeamName(match.teamB.id)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Current Match Info */}
        {currentMatch && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-blue-900">
                {currentMatch.format.charAt(0).toUpperCase() +
                  currentMatch.format.slice(1)}{" "}
                Match
              </h3>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  currentMatch.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {currentMatch.status === "completed"
                  ? "Completed"
                  : "In Progress"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded p-3">
                <div className="font-medium text-slate-900 mb-1">
                  {getTeamName(currentMatch.teamA.id)}
                </div>
                <div className="text-slate-600">
                  {getPlayerNames(currentMatch.teamA.playerIds)}
                </div>
                <div className="text-xl font-bold text-emerald-600 mt-2">
                  {currentMatch.points.teamA}{" "}
                  {currentMatch.points.teamA === 1 ? "point" : "points"}
                </div>
              </div>

              <div className="bg-white rounded p-3">
                <div className="font-medium text-slate-900 mb-1">
                  {getTeamName(currentMatch.teamB.id)}
                </div>
                <div className="text-slate-600">
                  {getPlayerNames(currentMatch.teamB.playerIds)}
                </div>
                <div className="text-xl font-bold text-emerald-600 mt-2">
                  {currentMatch.points.teamB}{" "}
                  {currentMatch.points.teamB === 1 ? "point" : "points"}
                </div>
              </div>
            </div>

            {/* Match Status */}
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm font-semibold text-slate-700">
                <span className="text-base">⚔️</span>
                {currentMatch.holes.length > 0
                  ? currentMatch.holes[currentMatch.holes.length - 1]
                      ?.matchStatus || "All Square"
                  : "All Square"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Hole Navigation */}
      <HoleNavigation
        holes={round.holeInfo}
        currentHole={currentHole}
        onHoleChange={setCurrentHole}
        playerScores={getMatchProgress()}
      />

      {/* Match Scorecard */}
      {currentMatch && (
        <MatchPlayScorecard
          match={currentMatch}
          tour={tour}
          round={round}
          currentHole={currentHole}
          onHoleUpdate={(holeNumber, teamAScore, teamBScore) =>
            onMatchHoleUpdate(
              currentMatch.id,
              holeNumber,
              teamAScore,
              teamBScore
            )
          }
        />
      )}

      {/* Match Play Leaderboard */}
      <MatchPlayLeaderboard tour={tour} round={round} />

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 safe-area-bottom shadow-lg">
        <div className="flex gap-3 max-w-md mx-auto">
          <button
            onClick={() => currentHole > 1 && setCurrentHole(currentHole - 1)}
            disabled={currentHole === 1}
            className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2">
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Previous
            </div>
          </button>

          <button
            onClick={() =>
              currentHole < round.holes && setCurrentHole(currentHole + 1)
            }
            disabled={currentHole === round.holes}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2">
              Next
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
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
