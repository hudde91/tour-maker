import { useState, useEffect, useRef } from "react";
import { Tour, Round, MatchPlayRound } from "../../../types";
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
  onFinishRound,
}: SwipeableMatchPlayScoringProps) => {
  const [currentHole, setCurrentHole] = useState(1);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("score");

  const matches = round.ryderCup?.matches || [];
  const currentMatch = matches[currentMatchIndex];

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setIsTransitioning(true);
      setTimeout(() => {
        // If not the last match, move to next match
        if (currentMatchIndex < matches.length - 1) {
          setCurrentMatchIndex(currentMatchIndex + 1);
        }
        // If last match and not last hole, move to next hole and reset to first match
        else if (currentHole < round.holes) {
          setCurrentHole(currentHole + 1);
          setCurrentMatchIndex(0);
        }
        // If last match on last hole, trigger finish round
        else if (currentHole === round.holes && onFinishRound) {
          onFinishRound();
        }
        setIsTransitioning(false);
      }, 200);
    }

    if (isRightSwipe) {
      setIsTransitioning(true);
      setTimeout(() => {
        // If not the first match, move to previous match
        if (currentMatchIndex > 0) {
          setCurrentMatchIndex(currentMatchIndex - 1);
        }
        // If first match and not first hole, move to previous hole and go to last match
        else if (currentHole > 1) {
          setCurrentHole(currentHole - 1);
          setCurrentMatchIndex(matches.length - 1);
        }
        setIsTransitioning(false);
      }, 200);
    }
  };

  const getPlayerNames = (playerIds: string[]) => {
    return playerIds
      .map((id) => tour.players.find((p) => p.id === id)?.name || "Unknown")
      .join(" & ");
  };

  const handleMatchHoleUpdate = (
    holeNumber: number,
    teamAScore: number,
    teamBScore: number
  ) => {
    if (!currentMatch) return;
    onMatchHoleUpdate(currentMatch.id, holeNumber, teamAScore, teamBScore);
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
              Points
            </div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {activeTab === "score" && (
          <div className="space-y-4 p-4">
            <div className="card">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-slate-600">
                  Match {currentMatchIndex + 1} of {matches.length}
                </h3>
                {currentMatchIndex < matches.length - 1 ? (
                  <div className="text-xs text-slate-500">
                    Swipe to{" "}
                    {getPlayerNames(
                      matches[currentMatchIndex + 1].teamA.playerIds
                    )}{" "}
                    vs{" "}
                    {getPlayerNames(
                      matches[currentMatchIndex + 1].teamB.playerIds
                    )}{" "}
                    →
                  </div>
                ) : currentHole < round.holes ? (
                  <div className="text-xs text-slate-500">
                    Swipe to Hole {currentHole + 1} →
                  </div>
                ) : (
                  <div className="text-xs text-emerald-600 font-semibold">
                    Swipe to Finish Round →
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {matches.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                      index === currentMatchIndex
                        ? "bg-emerald-600"
                        : index < currentMatchIndex
                        ? "bg-emerald-300"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Swipeable Match Scorecard */}
            <div
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className={`transition-opacity duration-200 ${
                isTransitioning ? "opacity-50" : "opacity-100"
              }`}
              style={{ touchAction: "pan-y" }}
            >
              {currentMatch && (
                <MatchScorecard
                  match={currentMatch}
                  tour={tour}
                  round={round}
                  currentHole={currentHole}
                  onHoleUpdate={handleMatchHoleUpdate}
                  onFinishRound={onFinishRound}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "holes" && (
          <div className="p-4 space-y-4">
            {/* Match selector for holes view */}
            <div className="card">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-slate-600">
                  Match {currentMatchIndex + 1} of {matches.length}
                </h3>
                {currentMatchIndex < matches.length - 1 && (
                  <div className="text-xs text-slate-500">
                    Swipe to{" "}
                    {getPlayerNames(
                      matches[currentMatchIndex + 1].teamA.playerIds
                    )}{" "}
                    vs{" "}
                    {getPlayerNames(
                      matches[currentMatchIndex + 1].teamB.playerIds
                    )}{" "}
                    →
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {matches.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                      index === currentMatchIndex
                        ? "bg-emerald-600"
                        : index < currentMatchIndex
                        ? "bg-emerald-300"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Swipeable hole navigation */}
            <div
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className={`transition-opacity duration-200 ${
                isTransitioning ? "opacity-50" : "opacity-100"
              }`}
              style={{ touchAction: "pan-y" }}
            >
              {currentMatch && (
                <HoleNavigation
                  holes={round.holeInfo}
                  currentHole={currentHole}
                  onHoleChange={setCurrentHole}
                  playerScores={{
                    [currentMatch.id]: currentMatch.holes.map((h) =>
                      h.teamAScore > 0 && h.teamBScore > 0 ? 1 : 0
                    ),
                  }}
                />
              )}
            </div>
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

interface MatchScorecardProps {
  match: MatchPlayRound;
  tour: Tour;
  round: Round;
  currentHole: number;
  onHoleUpdate: (
    holeNumber: number,
    teamAScore: number,
    teamBScore: number
  ) => void;
  onFinishRound?: () => void;
}

const MatchScorecard = ({
  match,
  tour,
  round,
  currentHole,
  onHoleUpdate,
}: MatchScorecardProps) => {
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

  // Refs to track current scores for saving on hole change
  const scoresRef = useRef({ teamA: teamAScore, teamB: teamBScore });
  const previousHoleRef = useRef(currentHole);

  // Update ref whenever scores change
  useEffect(() => {
    scoresRef.current = { teamA: teamAScore, teamB: teamBScore };
  }, [teamAScore, teamBScore]);

  // Save scores when hole changes
  useEffect(() => {
    if (previousHoleRef.current !== currentHole) {
      // Save scores from previous hole
      const prevScores = scoresRef.current;

      // Save if we have at least one valid score
      if (prevScores.teamA > 0 || prevScores.teamB > 0) {
        onHoleUpdate(
          previousHoleRef.current,
          prevScores.teamA,
          prevScores.teamB
        );
      }

      previousHoleRef.current = currentHole;
    }
  }, [currentHole, onHoleUpdate]);

  // Reset scores when hole changes or match changes
  useEffect(() => {
    const holeData = match.holes.find((h) => h.holeNumber === currentHole);
    setTeamAScore(holeData?.teamAScore || 0);
    setTeamBScore(holeData?.teamBScore || 0);
  }, [currentHole, match.id]);

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
    return `p-3 rounded-lg font-bold text-center transition-all border-2 ${
      isSelected
        ? "bg-emerald-600 text-white border-emerald-600 scale-105"
        : "bg-white text-slate-700 border-slate-300 active:border-slate-400 active:scale-95"
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
              match.status === "completed"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {match.status === "completed" ? "Completed" : "In Progress"}
          </span>
        </div>

        <div className="text-sm text-slate-600 mb-3">
          {teamAInfo.name} vs {teamBInfo.name}
        </div>

        {/* Match Status */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full text-sm font-semibold text-slate-700">
            <span className="text-base">⚔️</span>
            {match.holes.length > 0
              ? match.holes[match.holes.length - 1]?.matchStatus || "All Square"
              : "All Square"}
          </span>
        </div>
      </div>

      {/* Team A Scoring */}
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
              onClick={() => {
                setTeamAScore(score);
                if (teamBScore > 0) {
                  setTimeout(() => handleScoreUpdate(), 100);
                }
              }}
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

      {/* Team B Scoring */}
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
