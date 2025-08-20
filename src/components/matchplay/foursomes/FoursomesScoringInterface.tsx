// src/components/FoursomesScoringInterface.tsx
import { useState } from "react";
import { Tour, Round, MatchPlayRound } from "../../../types";
import { FoursomesMatchScorecard } from "./FoursomesMatchScorecard";
import { MatchPlayLeaderboard } from "../common/MatchPlayLeaderboard";
import { HoleNavigation } from "../../scoring/HoleNavigation";
import MatchStatusBadge from "../rydercup/MatchStatusBadge";

interface FoursomesScoringInterfaceProps {
  tour: Tour;
  round: Round;
  onMatchHoleUpdate: (
    matchId: string,
    holeNumber: number,
    teamAScore: number,
    teamBScore: number
  ) => void;
}

export const FoursomesScoringInterface = ({
  tour,
  round,
  onMatchHoleUpdate,
}: FoursomesScoringInterfaceProps) => {
  const [currentHole, setCurrentHole] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  const matches = round.ryderCup?.matches || [];
  const currentMatch =
    matches.find((m) => m.id === selectedMatch) || matches[0];

  // Get team names for display
  const getTeamName = (teamId: string) => {
    return tour.teams?.find((t) => t.id === teamId)?.name || `Team ${teamId}`;
  };

  // Get match progress for hole navigation
  const getMatchProgress = () => {
    const progress: Record<string, number[]> = {};
    matches.forEach((match) => {
      const holeResults = new Array(round.holes).fill(0);
      match.holes.forEach((hole) => {
        holeResults[hole.holeNumber - 1] = 1;
      });
      progress[match.id] = holeResults;
    });
    return progress;
  };

  if (matches.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto card-spacing">
          <span className="text-4xl">🔄</span>
        </div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3">
          No Foursomes Matches Created
        </h3>
        <p className="text-slate-500">
          Foursomes requires team pairings to be set up by team captains.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Format Info Header */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🔄</span>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Foursomes - Hole {currentHole}
            </h2>
            <p className="text-slate-600">Alternate Shot Match Play</p>
            <MatchStatusBadge
              match={currentMatch}
              totalHoles={round.holes ?? 18}
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Foursomes Rules</h3>
          <p className="text-sm text-blue-800 mb-2">
            Partners take turns hitting the same ball. Player A tees off on odd
            holes, Player B on even holes. Then they alternate shots until the
            ball is holed.
          </p>
          <p className="text-sm text-blue-800">
            <strong>Scoring:</strong> Win hole = 1 point to team, Tie = 0.5
            points each, Lose = 0 points
          </p>
        </div>

        {/* Match Selector */}
        {matches.length > 1 && (
          <div className="mt-4">
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
      </div>

      {/* Hole Navigation */}
      <HoleNavigation
        holes={round.holeInfo}
        currentHole={currentHole}
        onHoleChange={setCurrentHole}
        playerScores={getMatchProgress()}
      />

      {/* Foursomes Match Scorecard */}
      {currentMatch && (
        <FoursomesMatchScorecard
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
            className="btn-secondary flex-1 disabled:opacity-50"
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
            className="btn-primary flex-1 disabled:opacity-50"
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
