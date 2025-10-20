import { useState, useEffect, useRef } from "react";
import { Tour, Round } from "../../../types";
import { HoleNavigation } from "../../scoring/HoleNavigation";
import { MatchPlayLeaderboard } from "./MatchPlayLeaderboard";
import { useToast } from "../../ui/Toast";

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

  // Toast notifications
  const { showToast, ToastComponent } = useToast();

  // Track completed matches to show notification only once
  const completedMatchesRef = useRef<Set<string>>(new Set());

  const matches = round.ryderCup?.matches || [];
  const currentMatch = matches[currentMatchIndex];

  // Get team names
  const getTeamName = (teamId: string) => {
    const team = tour.teams?.find((t) => t.id === teamId);
    return team?.name || "Team";
  };

  // Convert match play holes to playerScores format for HoleNavigation
  const getMatchPlayScores = () => {
    const scores: Record<string, number[]> = {};

    // For each match, create a "player" entry
    matches.forEach((match: any, index: number) => {
      const teamAScores: number[] = [];
      const teamBScores: number[] = [];

      // Get scores for each hole
      for (let i = 0; i < round.holes; i++) {
        const hole = match.holes?.[i];
        teamAScores.push(hole?.teamAScore || 0);
        teamBScores.push(hole?.teamBScore || 0);
      }

      scores[`match-${index}-teamA`] = teamAScores;
      scores[`match-${index}-teamB`] = teamBScores;
    });

    return scores;
  };

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Check for newly completed matches and show notifications
  // Only show if the round is NOT already completed (avoid showing on page load for completed rounds)
  useEffect(() => {
    // Don't show winner toasts if round is already completed
    if (round.status === "completed") {
      return;
    }

    matches.forEach((match: any) => {
      const isComplete = match.status === "completed" || match.isComplete;
      const matchId = match.id;

      // If match just completed and we haven't notified yet
      if (isComplete && !completedMatchesRef.current.has(matchId)) {
        completedMatchesRef.current.add(matchId);

        // Get team names
        const teamAName = getTeamName(match.teamA.id);
        const teamBName = getTeamName(match.teamB.id);

        // Determine winner and show notification
        if (match.winner === "team-a") {
          showToast(`🏆 ${teamAName} wins the match!`, "success");
        } else if (match.winner === "team-b") {
          showToast(`🏆 ${teamBName} wins the match!`, "success");
        } else if (match.winner === "halved") {
          showToast(
            `🤝 Match halved between ${teamAName} and ${teamBName}`,
            "info"
          );
        }
      }
    });
  }, [matches, showToast, tour.teams, round.status]);

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
              Leaderboard
            </div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "score" && (
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className={`transition-opacity duration-200 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="p-4 space-y-4">
              <MatchScoringCard
                match={currentMatch}
                tour={tour}
                round={round}
                currentHole={currentHole}
                onHoleUpdate={handleMatchHoleUpdate}
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="text-center text-sm text-slate-600 mb-2">
                Match {currentMatchIndex + 1} of {matches.length}
              </div>
              <div className="flex gap-2">
                {matches.map((_, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 h-2 rounded ${
                      idx === currentMatchIndex
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    }`}
                  />
                ))}
              </div>
              <div className="text-center text-xs text-slate-500 mt-2">
                Swipe to navigate between matches
              </div>
            </div>
          </div>
        )}

        {activeTab === "holes" && (
          <div className="p-4">
            <HoleNavigation
              holes={round.holeInfo}
              currentHole={currentHole}
              onHoleChange={setCurrentHole}
              playerScores={getMatchPlayScores()}
            />
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="p-4">
            <MatchPlayLeaderboard tour={tour} round={round} />
          </div>
        )}
      </div>

      <ToastComponent />
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
}

const MatchScoringCard = ({
  match,
  tour,
  round,
  currentHole,
  onHoleUpdate,
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
              onClick={() => {
                setTeamAScore(score);
                if (teamBScore > 0) {
                  setTimeout(() => handleScoreUpdate(), 100);
                }
              }}
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
