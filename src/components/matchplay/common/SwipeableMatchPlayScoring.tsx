import { useState, useEffect, useMemo } from "react";
import { Tour, Round, HoleInfo } from "../../../types";
import { HoleNavigation } from "../../scoring/HoleNavigation";
import { MatchPlayLeaderboard } from "./MatchPlayLeaderboard";
import { CompetitionWinnerSelector } from "./CompetitionWinnerSelector";
import { useParams } from "react-router-dom";
import { useUpdateCompetitionWinner } from "../../../hooks/useScoring";
import { useAuth } from "../../../contexts/AuthContext";
import { canUserScore } from "../../../lib/auth/permissions";

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
  const { tourId } = useParams<{ tourId: string }>();
  const { user } = useAuth();
  const updateCompetitionWinner = useUpdateCompetitionWinner(tourId!, round.id);
  const [matchHoles, setMatchHoles] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<TabType>("score");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showingCompetitionSelector, setShowingCompetitionSelector] =
    useState(false);

  // Filter matches to only those that authenticated user can score for
  // TODO: Implement backend authorization to restrict which matches a user can score for
  const scoreableMatches = useMemo(() => {
    // Only authenticated users can score
    if (!canUserScore(user)) {
      return [];
    }

    const allMatches = round.ryderCup?.matches || [];

    // Filter by round participants (1-4 players max)
    // If round.playerIds is not set, all tournament players can participate (backward compatibility)
    const roundPlayerIds = round.playerIds ? new Set(round.playerIds) : null;

    return allMatches.filter((match: any) => {
      // Check if match has players in the round
      const teamAPlayerIds = match.teamA?.playerIds || [];
      const teamBPlayerIds = match.teamB?.playerIds || [];
      const allPlayerIds = [...teamAPlayerIds, ...teamBPlayerIds];

      // Filter by players in this round
      const playersInRound = roundPlayerIds
        ? allPlayerIds.filter((id: string) => roundPlayerIds.has(id))
        : allPlayerIds;

      return playersInRound.length > 0;
    });
  }, [user, round.ryderCup?.matches, round.playerIds]);

  const matches = scoreableMatches;

  // Scroll to top when navigating to a match or changing tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Reset competition selector when changing tabs or matches
    setShowingCompetitionSelector(false);
  }, [selectedMatchId, activeTab]);

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

  // Get team info (name, color, players)
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

  // Match Selection View
  const renderMatchSelection = () => {
    return (
      <div className="p-4 space-y-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            Select Your Match
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Click on your match to start scoring
          </p>
        </div>

        {matches.map((match: any) => {
          const teamAInfo = getTeamInfo(match.teamA.id, match.teamA.playerIds);
          const teamBInfo = getTeamInfo(match.teamB.id, match.teamB.playerIds);
          const isMatchComplete =
            match.status === "completed" || match.isComplete;

          return (
            <button
              key={match.id}
              onClick={() => setSelectedMatchId(match.id)}
              className="w-full card hover:shadow-lg transition-all active:scale-[0.99] text-left"
            >
              {/* Match Format Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  {match.format.charAt(0).toUpperCase() + match.format.slice(1)}{" "}
                  Match
                </span>
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

              {/* Team A */}
              <div
                className="p-4 rounded-lg mb-3"
                style={{
                  borderLeft: `4px solid ${teamAInfo.color}`,
                  backgroundColor: teamAInfo.color + "08",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md flex-shrink-0"
                    style={{ backgroundColor: teamAInfo.color }}
                  >
                    <span className="text-white font-bold">A</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {teamAInfo.name}
                    </h3>
                    <p className="text-slate-700 font-medium">
                      {teamAInfo.players.join(" & ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex items-center justify-center my-3">
                <div className="px-4 py-1 bg-slate-100 rounded-full text-slate-600 font-bold text-sm">
                  VS
                </div>
              </div>

              {/* Team B */}
              <div
                className="p-4 rounded-lg"
                style={{
                  borderLeft: `4px solid ${teamBInfo.color}`,
                  backgroundColor: teamBInfo.color + "08",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md flex-shrink-0"
                    style={{ backgroundColor: teamBInfo.color }}
                  >
                    <span className="text-white font-bold">B</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {teamBInfo.name}
                    </h3>
                    <p className="text-slate-700 font-medium">
                      {teamBInfo.players.join(" & ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Match Status */}
              {match.statusText && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-center">
                    <span className="text-sm font-semibold text-blue-900">
                      {match.statusText}
                    </span>
                  </div>
                </div>
              )}

              {/* Click to Score Indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 font-semibold">
                <span>Tap to score this match</span>
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔒</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No Matches Available to Score
          </h3>
          <p className="text-slate-600 mb-4">
            You don't have any players claimed in any match. Visit the Players page to claim a player before you can enter scores.
          </p>
          <p className="text-sm text-slate-500">
            In match play, you can only score for matches where you have claimed at least one player.
          </p>
        </div>
      </div>
    );
  }

  // If no match is selected, show match selection view
  if (!selectedMatchId) {
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
                Matches
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
          {activeTab === "score" && renderMatchSelection()}
          {activeTab === "leaderboard" && (
            <div className="p-4">
              <MatchPlayLeaderboard tour={tour} round={round} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Selected match view - show scoring for single match
  const selectedMatch = matches.find((m: any) => m.id === selectedMatchId);
  if (!selectedMatch) {
    setSelectedMatchId(null);
    return null;
  }

  const currentHole = getCurrentHoleForMatch(selectedMatch.id);
  const teamAInfo = getTeamInfo(
    selectedMatch.teamA.id,
    selectedMatch.teamA.playerIds
  );
  const teamBInfo = getTeamInfo(
    selectedMatch.teamB.id,
    selectedMatch.teamB.playerIds
  );

  return (
    <div className="flex flex-col h-full">
      {/* Back Button and Header */}
      <div className="bg-white border-b border-slate-200 top-0">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => setSelectedMatchId(null)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            All Matches
          </button>
        </div>

        {/* Match Header - Players */}
        <div className="px-4 pb-4">
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-4 border border-blue-200">
            <div className="text-center mb-3">
              <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                {selectedMatch.format.charAt(0).toUpperCase() +
                  selectedMatch.format.slice(1)}{" "}
                Match
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center">
                <div className="font-bold text-slate-900 mb-1">
                  {teamAInfo.name}
                </div>
                <div className="text-sm text-slate-700">
                  {teamAInfo.players.join(" & ")}
                </div>
              </div>
              <div className="px-3 py-1 bg-white rounded-full text-slate-600 font-bold text-sm shadow">
                VS
              </div>
              <div className="flex-1 text-center">
                <div className="font-bold text-slate-900 mb-1">
                  {teamBInfo.name}
                </div>
                <div className="text-sm text-slate-700">
                  {teamBInfo.players.join(" & ")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
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
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {activeTab === "score" && !showingCompetitionSelector && (
          <div className="p-4 space-y-4">
            <MatchScoringCard
              match={selectedMatch}
              tour={tour}
              round={round}
              currentHole={currentHole}
              onHoleUpdate={(holeNumber, teamAScore, teamBScore) => {
                onMatchHoleUpdate(
                  selectedMatch.id,
                  holeNumber,
                  teamAScore,
                  teamBScore
                );
              }}
              onHoleChange={(newHole) => {
                setCurrentHoleForMatch(selectedMatch.id, newHole);
                setShowingCompetitionSelector(false);
              }}
              onCompetitionWinnerChange={(
                holeNumber,
                competitionType,
                winnerId,
                distance
              ) => {
                updateCompetitionWinner.mutate({
                  holeNumber,
                  competitionType,
                  winnerId,
                  distance,
                  matchId: selectedMatch.id,
                });
              }}
              onShowCompetitionSelector={() =>
                setShowingCompetitionSelector(true)
              }
            />
          </div>
        )}

        {activeTab === "score" && showingCompetitionSelector && (
          <CompetitionWinnerSelector
            match={selectedMatch}
            tour={tour}
            round={round}
            currentHole={currentHole}
            currentHoleInfo={
              round.holeInfo[currentHole - 1] || {
                number: currentHole,
                par: 4,
                yardage: 400,
              }
            }
            onCompetitionWinnerChange={(
              holeNumber,
              competitionType,
              winnerId,
              distance
            ) => {
              updateCompetitionWinner.mutate({
                holeNumber,
                competitionType,
                winnerId,
                distance,
                matchId: selectedMatch.id,
              });
            }}
            onContinue={() => {
              setShowingCompetitionSelector(false);
              setCurrentHoleForMatch(selectedMatch.id, currentHole + 1);
            }}
          />
        )}

        {activeTab === "holes" && (
          <div className="p-4">
            <div className="card">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {teamAInfo.players.join(" & ")} vs{" "}
                  {teamBInfo.players.join(" & ")}
                </h3>
                <div className="text-sm text-slate-600">
                  {teamAInfo.name} vs {teamBInfo.name}
                </div>
              </div>
              <HoleNavigation
                holes={round.holeInfo}
                currentHole={currentHole}
                onHoleChange={(newHole) =>
                  setCurrentHoleForMatch(selectedMatch.id, newHole)
                }
                playerScores={getMatchPlayScores(selectedMatch.id)}
              />
            </div>
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
  onCompetitionWinnerChange?: (
    holeNumber: number,
    competitionType: "closestToPin" | "longestDrive",
    winnerId: string | null,
    distance?: number
  ) => void;
  onShowCompetitionSelector?: () => void;
}

const MatchScoringCard = ({
  match,
  tour,
  round,
  currentHole,
  onHoleUpdate,
  onHoleChange,
  onCompetitionWinnerChange,
  onShowCompetitionSelector,
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
            <span className="text-sm">Prev</span>
          </button>

          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              Hole {currentHole}
            </div>
            <div className="text-xs text-slate-500">of {round.holes}</div>
          </div>

          <button
            onClick={() => {
              if (currentHole < round.holes) {
                // Check if there are competitions on the current hole
                const hasCompetitions =
                  currentHoleInfo.closestToPin || currentHoleInfo.longestDrive;
                // Check if both scores are entered for the current hole
                const hole = match.holes?.[currentHole - 1];
                const scoresEntered =
                  hole?.teamAScore > 0 && hole?.teamBScore > 0;

                if (
                  hasCompetitions &&
                  scoresEntered &&
                  onShowCompetitionSelector
                ) {
                  onShowCompetitionSelector();
                } else {
                  onHoleChange(currentHole + 1);
                }
              }
            }}
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
              onClick={() => setTeamBScore(score)}
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
