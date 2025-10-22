import { useState, useEffect } from "react";
import { Tour, Round } from "../../../types";
import { HoleNavigation } from "../../scoring/HoleNavigation";
import { MatchPlayLeaderboard } from "./MatchPlayLeaderboard";

interface SwipeableMatchPlayScoringProps {
  tour: Tour;
  round: Round;
  onMatchHoleUpdate: (
    matchId: string,
    holeNumber: number,
    teamAScore: number,
    teamBScore: number
  ) => void;
  onFinishRound?: () => void;
}

type TabType = "score" | "holes" | "leaderboard";

export const SwipeableMatchPlayScoring = ({
  tour,
  round,
  onMatchHoleUpdate,
}: SwipeableMatchPlayScoringProps) => {
  const [matchHoles, setMatchHoles] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<TabType>("score");

  const matches = round.ryderCup?.matches || [];

  // Initialize match holes on mount
  useEffect(() => {
    const initialHoles: Record<string, number> = {};
    matches.forEach((match: any) => {
      if (!matchHoles[match.id]) {
        // Find the first unscored hole or default to hole 1
        let firstUnscoredHole = 1;
        if (match.holes) {
          for (let i = 0; i < match.holes.length; i++) {
            const hole = match.holes[i];
            if (!hole || hole.teamAScore === 0 || hole.teamBScore === 0) {
              firstUnscoredHole = i + 1;
              break;
            }
          }
          // If all holes are scored, stay on the last hole
          if (firstUnscoredHole === 1 && match.holes.length > 0) {
            const allScored = match.holes.every(
              (h: any) => h && h.teamAScore > 0 && h.teamBScore > 0
            );
            if (allScored) {
              firstUnscoredHole = match.holes.length;
            }
          }
        }
        initialHoles[match.id] = firstUnscoredHole;
      }
    });
    if (Object.keys(initialHoles).length > 0) {
      setMatchHoles((prev) => ({ ...prev, ...initialHoles }));
    }
  }, [matches]);

  const getCurrentHoleForMatch = (matchId: string) => {
    return matchHoles[matchId] || 1;
  };

  const setCurrentHoleForMatch = (matchId: string, hole: number) => {
    setMatchHoles((prev) => ({ ...prev, [matchId]: hole }));
  };

  // Get team names
  const getTeamName = (teamId: string) => {
    const team = tour.teams?.find((t) => t.id === teamId);
    return team?.name || "Team";
  };

  // Convert match play holes to playerScores format for HoleNavigation
  const getMatchPlayScores = (matchId: string) => {
    const scores: Record<string, number[]> = {};
    const match = matches.find((m: any) => m.id === matchId);

    if (!match) return scores;

    const teamAScores: number[] = [];
    const teamBScores: number[] = [];

    // Get scores for each hole
    for (let i = 0; i < round.holes; i++) {
      const hole = match.holes?.[i];
      teamAScores.push(hole?.teamAScore || 0);
      teamBScores.push(hole?.teamBScore || 0);
    }

    scores[`${matchId}-teamA`] = teamAScores;
    scores[`${matchId}-teamB`] = teamBScores;

    return scores;
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
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex">
          <button
            onClick={() => setActiveTab("score")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "score"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Score
            </div>
          </button>
          <button
            onClick={() => setActiveTab("holes")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "holes"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Holes
            </div>
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "leaderboard"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Leaderboard
            </div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {activeTab === "score" && (
          <div className="p-4 space-y-4">
            {matches.map((match: any) => {
              const currentHole = getCurrentHoleForMatch(match.id);
              return (
                <MatchScoringCard
                  key={match.id}
                  match={match}
                  tour={tour}
                  round={round}
                  currentHole={currentHole}
                  onHoleUpdate={(holeNumber, teamAScore, teamBScore) => {
                    onMatchHoleUpdate(
                      match.id,
                      holeNumber,
                      teamAScore,
                      teamBScore
                    );
                  }}
                  onHoleChange={(newHole) =>
                    setCurrentHoleForMatch(match.id, newHole)
                  }
                />
              );
            })}
          </div>
        )}

        {activeTab === "holes" && (
          <div className="p-4 space-y-4">
            {matches.map((match: any) => {
              const currentHole = getCurrentHoleForMatch(match.id);
              const teamAName = getTeamName(match.teamA.id);
              const teamBName = getTeamName(match.teamB.id);

              return (
                <div key={match.id} className="card">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {teamAName} vs {teamBName}
                  </h3>
                  <HoleNavigation
                    holes={round.holeInfo}
                    currentHole={currentHole}
                    onHoleChange={(newHole) =>
                      setCurrentHoleForMatch(match.id, newHole)
                    }
                    playerScores={getMatchPlayScores(match.id)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="p-4">
            <MatchPlayLeaderboard tour={tour} round={round} />
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Match Scoring Card with dormy completion logic
interface MatchScoringCardProps {
  match: any;
  tour: Tour;
  round: Round;
  currentHole: number;
  onHoleUpdate: (
    holeNumber: number,
    teamAScore: number,
    teamBScore: number
  ) => void;
  onHoleChange: (newHole: number) => void;
}

const MatchScoringCard = ({
  match,
  tour,
  round,
  currentHole,
  onHoleUpdate,
  onHoleChange,
}: MatchScoringCardProps) => {
  const currentHoleInfo = round.holeInfo[currentHole - 1] || {
    number: currentHole,
    par: 4,
    yardage: 400,
  };

  const existingHole = match.holes?.[currentHole - 1];
  const [teamAScore, setTeamAScore] = useState(existingHole?.teamAScore || 0);
  const [teamBScore, setTeamBScore] = useState(existingHole?.teamBScore || 0);

  useEffect(() => {
    const hole = match.holes?.[currentHole - 1];
    setTeamAScore(hole?.teamAScore || 0);
    setTeamBScore(hole?.teamBScore || 0);
  }, [currentHole, match.holes]);

  // Auto-save and advance when both scores are entered
  useEffect(() => {
    if (teamAScore > 0 && teamBScore > 0) {
      const existingHole = match.holes?.[currentHole - 1];
      // Only update if scores changed
      if (
        existingHole?.teamAScore !== teamAScore ||
        existingHole?.teamBScore !== teamBScore
      ) {
        handleScoreUpdate();
      }
    }
  }, [teamAScore, teamBScore]);

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

  // Check if match is completed (won by dormy or finished)
  const isMatchComplete = match.status === "completed" || match.isComplete;

  const handleScoreUpdate = () => {
    if (teamAScore > 0 && teamBScore > 0) {
      onHoleUpdate(currentHole, teamAScore, teamBScore);

      // Auto-advance to next hole if not on last hole and match not complete
      if (currentHole < round.holes && !isMatchComplete) {
        setTimeout(() => {
          onHoleChange(currentHole + 1);
        }, 500); // Small delay for visual feedback
      }
    }
  };

  const getScoreButtonClass = (score: number, currentTeamScore: number) => {
    const isSelected = score === currentTeamScore;
    const baseClasses =
      "p-3 rounded-lg font-bold text-center transition-all border-2";

    // Disable scoring if round is completed OR match is completed
    const isDisabled = round.status === "completed" || isMatchComplete;
    const disabledClasses = isDisabled ? "opacity-50 cursor-not-allowed" : "";

    if (isSelected) {
      return `${baseClasses} bg-emerald-600 text-white border-emerald-600 scale-105 ${disabledClasses}`;
    }
    return `${baseClasses} bg-white text-slate-700 border-slate-300 active:border-slate-400 active:scale-95 ${disabledClasses}`;
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
    <div className="space-y-4">
      {/* Match Info Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-blue-900">
              {match.format.charAt(0).toUpperCase() + match.format.slice(1)}{" "}
              Match
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
              <span className="font-semibold">Hole {currentHole}</span>
              <span>•</span>
              <span>Par {currentHoleInfo.par}</span>
              <span>•</span>
              <span>{currentHoleInfo.yardage} yards</span>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isMatchComplete
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {isMatchComplete ? "Completed" : "In Progress"}
          </span>
        </div>

        <div className="text-sm text-slate-600 mb-3">
          {teamAInfo.name} vs {teamBInfo.name}
        </div>

        {/* Match Status Display */}
        {match.statusText && (
          <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200">
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span className="font-bold text-blue-900 text-lg">
                {match.statusText}
              </span>
            </div>
            {match.statusCode === "dormie" && (
              <div className="text-center text-xs text-blue-700 mt-1">
                Match can be decided this hole
              </div>
            )}
          </div>
        )}

        {/* Hole Navigation */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            onClick={() => currentHole > 1 && onHoleChange(currentHole - 1)}
            disabled={currentHole === 1}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all ${
              currentHole === 1
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300 active:scale-95"
            }`}
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm">Previous</span>
          </button>

          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              Hole {currentHole}
            </div>
            <div className="text-xs text-slate-500">of {round.holes}</div>
          </div>

          <button
            onClick={() =>
              currentHole < round.holes && onHoleChange(currentHole + 1)
            }
            disabled={currentHole === round.holes}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all ${
              currentHole === round.holes
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300 active:scale-95"
            }`}
          >
            <span className="text-sm">Next</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Display match result if completed */}
        {isMatchComplete && match.resultSummary && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-green-800 font-semibold">
                {match.resultSummary}
              </span>
            </div>
            <div className="text-xs text-green-700 mt-1">
              Match completed - scoring disabled
            </div>
          </div>
        )}
      </div>

      {/* First Team Scoring */}
      <div
        className="card"
        style={{
          borderLeft: `4px solid ${teamAInfo.color}`,
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
              <h4 className="font-semibold text-slate-900">{teamAInfo.name}</h4>
              <p className="text-sm text-slate-600">
                {teamAInfo.players.join(" & ")}
              </p>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {teamAScore || "–"}
          </div>
        </div>

        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: 8 }, (_, i) => i + 1).map((score) => (
            <button
              key={score}
              onClick={() => setTeamAScore(score)}
              disabled={round.status === "completed" || isMatchComplete}
              className={getScoreButtonClass(score, teamAScore)}
            >
              {score}
            </button>
          ))}
        </div>
      </div>

      {/* VS Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300"></div>
        </div>
        <div className="relative flex justify-center">
          <div className="bg-white px-4 py-1 rounded-full border border-slate-300 text-slate-600 font-semibold text-sm">
            VS
          </div>
        </div>
      </div>

      {/* Second Team Scoring */}
      <div
        className="card"
        style={{
          borderLeft: `4px solid ${teamBInfo.color}`,
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
              <h4 className="font-semibold text-slate-900">{teamBInfo.name}</h4>
              <p className="text-sm text-slate-600">
                {teamBInfo.players.join(" & ")}
              </p>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {teamBScore || "–"}
          </div>
        </div>

        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: 8 }, (_, i) => i + 1).map((score) => (
            <button
              key={score}
              onClick={() => {
                setTeamBScore(score);
                if (teamAScore > 0) {
                  setTimeout(() => handleScoreUpdate(), 100);
                }
              }}
              disabled={round.status === "completed" || isMatchComplete}
              className={getScoreButtonClass(score, teamBScore)}
            >
              {score}
            </button>
          ))}
        </div>
      </div>

      {/* Hole Result */}
      {getHoleResultDisplay()}

      {/* Match Progress Summary */}
      <div className="card bg-slate-50">
        <h5 className="font-semibold text-slate-800 mb-3">Match Progress</h5>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-slate-900">
              {match.holes.filter((h: any) => h.result === "team-a").length}
            </div>
            <div className="text-xs text-slate-500">{teamAInfo.name} Wins</div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {match.holes.filter((h: any) => h.result === "tie").length}
            </div>
            <div className="text-xs text-slate-500">Ties</div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {match.holes.filter((h: any) => h.result === "team-b").length}
            </div>
            <div className="text-xs text-slate-500">{teamBInfo.name} Wins</div>
          </div>
        </div>

        {/* Show current match status */}
        {match.statusText && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-center">
              <span
                className={`text-sm font-semibold ${
                  match.statusCode === "dormie"
                    ? "text-amber-700"
                    : match.statusCode === "complete"
                    ? "text-green-700"
                    : "text-slate-700"
                }`}
              >
                {match.statusText}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
