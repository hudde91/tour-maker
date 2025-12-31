import { getScoreInfo } from "@/lib/scoreUtils";
import { storage } from "@/lib/storage";
import { formatUtils } from "@/types/formats";
import { Tour, Round, Team } from "@/types";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { HoleNavigation } from "../scoring/HoleNavigation";
import { LiveLeaderboard } from "../scoring/LiveLeaderboard";
import { IndividualCompetitionWinnerSelector } from "./individual/IndividualCompetitionWinnerSelector";
import { useUpdateCompetitionWinner } from "@/hooks/useScoring";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canUserScore } from "@/lib/auth/permissions";
interface SwipeableTeamScoringProps {
  tour: Tour;
  round: Round;
  formatName: "Scramble" | "Best Ball";
  onTeamScoreChange: (teamId: string, holeIndex: number, score: number) => void;
}

type TabType = "score" | "holes" | "leaderboard";

export const SwipeableTeamScoring = ({
  tour,
  round,
  formatName,
  onTeamScoreChange,
}: SwipeableTeamScoringProps) => {
  const { tourId } = useParams<{ tourId: string }>();
  const { user } = useAuth();
  const updateCompetitionWinner = useUpdateCompetitionWinner(tourId!, round.id);

  // Filter teams to only those that authenticated user can score for
  // TODO: Implement backend authorization to restrict which teams a user can score for
  const scoreableTeams = useMemo(() => {
    // Only authenticated users can score
    if (!canUserScore(user)) {
      return [];
    }

    const allTeams = tour.teams || [];

    // Filter by round participants (1-4 players max)
    // If round.playerIds is not set, all tournament players can participate (backward compatibility)
    const roundPlayerIds = round.playerIds ? new Set(round.playerIds) : null;

    return allTeams.filter((team) => {
      // Check if any player on this team is in the round
      const teamPlayersInRound = team.playerIds.filter(
        (playerId) => !roundPlayerIds || roundPlayerIds.has(playerId)
      );

      return teamPlayersInRound.length > 0;
    });
  }, [user, tour.teams, round.playerIds]);

  const [currentHole, setCurrentHole] = useState(1);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("score");
  const [showingCompetitionSelector, setShowingCompetitionSelector] =
    useState(false);
  const [
    autoTriggeredCompetitionSelector,
    setAutoTriggeredCompetitionSelector,
  ] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const teams = scoreableTeams;
  const currentTeam = teams[currentTeamIndex];
  const currentHoleInfo = round.holeInfo[currentHole - 1];

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Scroll to top when tab changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [activeTab]);

  // Check if all teams have scored the current hole
  const haveAllTeamsScoredCurrentHole = () => {
    return teams.every((team) => {
      const teamScore = storage.getTeamScore(tour.id, round.id, team.id);
      if (!teamScore) return false;

      const score = teamScore.scores[currentHole - 1];
      return score !== null && score > 0;
    });
  };

  // Check if we should show competition selector after all teams score
  useEffect(() => {
    const hasCompetitions =
      currentHoleInfo?.closestToPin || currentHoleInfo?.longestDrive;
    if (
      hasCompetitions &&
      haveAllTeamsScoredCurrentHole() &&
      !showingCompetitionSelector
    ) {
      // Show the competition selector and mark as auto-triggered
      setShowingCompetitionSelector(true);
      setAutoTriggeredCompetitionSelector(true);
    }
  }, [currentHole, showingCompetitionSelector, currentHoleInfo]);

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
        // If not the last team, move to next team
        if (currentTeamIndex < teams.length - 1) {
          setCurrentTeamIndex(currentTeamIndex + 1);
        }
        // If last team and not last hole, move to next hole and reset to first team
        else if (currentHole < round.holes) {
          setCurrentHole(currentHole + 1);
          setCurrentTeamIndex(0);
          setShowingCompetitionSelector(false);
        }
        setIsTransitioning(false);
      }, 200);
    }

    if (isRightSwipe) {
      setIsTransitioning(true);
      setTimeout(() => {
        // If not the first team, move to previous team
        if (currentTeamIndex > 0) {
          setCurrentTeamIndex(currentTeamIndex - 1);
        }
        // If first team and not first hole, move to previous hole and go to last team
        else if (currentHole > 1) {
          setCurrentHole(currentHole - 1);
          setCurrentTeamIndex(teams.length - 1);
          setShowingCompetitionSelector(false);
        }
        setIsTransitioning(false);
      }, 200);
    }
  };

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔒</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No Teams Available to Score
          </h3>
          <p className="text-slate-600 mb-4">
            Please sign in to access scoring functionality.
          </p>
          <p className="text-sm text-slate-500">
            In {formatName} format, authenticated users can score for all teams
            in the round.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="flex">
          <button
            onClick={() => setActiveTab("score")}
            className={`flex-1 px-4 py-4 text-sm font-semibold transition-all ${
              activeTab === "score"
                ? "text-emerald-600 border-b-3 border-emerald-600 bg-emerald-50 shadow-inner"
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
            className={`flex-1 px-4 py-4 text-sm font-semibold transition-all ${
              activeTab === "holes"
                ? "text-emerald-600 border-b-3 border-emerald-600 bg-emerald-50 shadow-inner"
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
            className={`flex-1 px-4 py-4 text-sm font-semibold transition-all ${
              activeTab === "leaderboard"
                ? "text-emerald-600 border-b-3 border-emerald-600 bg-emerald-50 shadow-inner"
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

      {/* Tab Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto pb-4">
        {/* Score Tab */}
        {activeTab === "score" && !showingCompetitionSelector && (
          <div
            className="space-y-4 p-4"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ touchAction: "pan-y" }}
          >
            {/* Team Progress Indicator */}
            <div
              className={`card relative transition-opacity duration-200 ${
                isTransitioning ? "opacity-50" : "opacity-100"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-slate-600">
                  Team {currentTeamIndex + 1} of {teams.length}
                </h3>
                {currentTeamIndex < teams.length - 1 ? (
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    Swipe to {teams[currentTeamIndex + 1].name}
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
                  </div>
                ) : currentHole < round.holes ? (
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    Swipe to Hole {currentHole + 1}
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
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                {teams.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                      index === currentTeamIndex
                        ? "bg-emerald-600"
                        : index < currentTeamIndex
                        ? "bg-emerald-300"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Format Info */}
            <div className="card bg-gradient-to-br from-emerald-50 to-teal-50">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">
                  {formatName === "Scramble" ? "🤝" : "⭐"}
                </span>
                <h3 className="font-semibold text-emerald-900">{formatName}</h3>
              </div>
              <p className="text-sm text-emerald-800">
                {formatName === "Scramble"
                  ? "All team members tee off, choose the best shot, and all players hit from that location."
                  : "All team members play their own ball. The best score from the team is used."}
              </p>
            </div>

            {/* Team Score Card */}
            {currentTeam && (
              <TeamScoreCard
                team={currentTeam}
                tour={tour}
                round={round}
                currentHole={currentHole}
                holeInfo={currentHoleInfo}
                onScoreChange={(score) =>
                  onTeamScoreChange(currentTeam.id, currentHole - 1, score)
                }
              />
            )}

            {/* Competition Winners Button - Show if hole has competitions */}
            {(currentHoleInfo?.closestToPin ||
              currentHoleInfo?.longestDrive) && (
              <div className="card border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-amber-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <span className="text-lg">🏅</span>
                      Hole Competitions
                    </h4>
                    <div className="space-y-1 text-xs">
                      {currentHoleInfo.closestToPin &&
                        (() => {
                          const winners =
                            round.competitionWinners?.closestToPin?.[
                              currentHole
                            ] || [];
                          const winner = winners[0];
                          const winnerPlayer = winner
                            ? tour.players.find((p) => p.id === winner.playerId)
                            : null;
                          return (
                            <div className="flex items-center gap-1 text-blue-800">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                              </svg>
                              <span className="font-semibold">
                                Closest to Pin:
                              </span>
                              {winnerPlayer ? (
                                <span>
                                  {winnerPlayer.name}
                                  {winner.distance
                                    ? ` - ${winner.distance} ft`
                                    : ""}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">
                                  Not selected
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      {currentHoleInfo.longestDrive &&
                        (() => {
                          const winners =
                            round.competitionWinners?.longestDrive?.[
                              currentHole
                            ] || [];
                          const winner = winners[0];
                          const winnerPlayer = winner
                            ? tour.players.find((p) => p.id === winner.playerId)
                            : null;
                          return (
                            <div className="flex items-center gap-1 text-amber-800">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="font-semibold">
                                Longest Drive:
                              </span>
                              {winnerPlayer ? (
                                <span>
                                  {winnerPlayer.name}
                                  {winner.distance
                                    ? ` - ${winner.distance} yds`
                                    : ""}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">
                                  Not selected
                                </span>
                              )}
                            </div>
                          );
                        })()}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowingCompetitionSelector(true);
                      setAutoTriggeredCompetitionSelector(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all active:scale-95 shadow-md"
                  >
                    {(
                      round.competitionWinners?.closestToPin?.[currentHole] ||
                      []
                    ).length > 0 ||
                    (
                      round.competitionWinners?.longestDrive?.[currentHole] ||
                      []
                    ).length > 0
                      ? "Edit"
                      : "Select"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Competition Winner Selector Modal */}
        {activeTab === "score" && showingCompetitionSelector && (
          <IndividualCompetitionWinnerSelector
            tour={tour}
            round={round}
            currentHole={currentHole}
            currentHoleInfo={currentHoleInfo}
            autoAdvance={autoTriggeredCompetitionSelector}
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
              });
            }}
            onContinue={() => {
              setShowingCompetitionSelector(false);
              // Only advance to next hole if auto-triggered (after all teams scored)
              if (
                autoTriggeredCompetitionSelector &&
                currentHole < round.holes
              ) {
                setCurrentHole(currentHole + 1);
                setCurrentTeamIndex(0);
              }
            }}
          />
        )}

        {/* Holes Tab */}
        {activeTab === "holes" && (
          <div className="p-4 space-y-4">
            {/* Team selector for holes view */}
            <div className="card">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-slate-600">
                  Team {currentTeamIndex + 1} of {teams.length}
                </h3>
                {currentTeamIndex < teams.length - 1 && (
                  <div className="text-xs text-slate-500">
                    Swipe to {teams[currentTeamIndex + 1].name} →
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {teams.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                      index === currentTeamIndex
                        ? "bg-emerald-600"
                        : index < currentTeamIndex
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
              <HoleNavigation
                holes={round.holeInfo}
                currentHole={currentHole}
                onHoleChange={setCurrentHole}
                playerScores={{
                  [currentTeam.id]:
                    storage.getTeamScore(tour.id, round.id, currentTeam.id)
                      ?.scores || [],
                }}
              />
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div className="p-4">
            <LiveLeaderboard tour={tour} round={round} />
          </div>
        )}
      </div>
    </div>
  );
};

// Team Score Card Component
interface TeamScoreCardProps {
  team: Team;
  tour: Tour;
  round: Round;
  currentHole: number;
  holeInfo: any;
  onScoreChange: (score: number) => void;
}

const TeamScoreCard = ({
  team,
  tour,
  round,
  currentHole,
  holeInfo,
  onScoreChange,
}: TeamScoreCardProps) => {
  const teamScore = storage.getTeamScore(tour.id, round.id, team.id);
  const currentScore = teamScore?.scores[currentHole - 1] || 0;
  const [localScore, setLocalScore] = useState(currentScore);
  const par = holeInfo.par;

  // Reset local score when hole changes
  useEffect(() => {
    setLocalScore(teamScore?.scores[currentHole - 1] || 0);
  }, [currentHole, teamScore]);

  const isMatchPlay = formatUtils.isMatchPlay(round.format);
  const scoreInfo = getScoreInfo(localScore, par, isMatchPlay);

  // Get team members
  const teamMembers = team.playerIds
    .map((id) => tour.players.find((p) => p.id === id)?.name)
    .filter(Boolean);

  const handleScoreSelect = (score: number) => {
    setLocalScore(score);
    onScoreChange(score);
  };

  // Generate score options
  const generateScoreOptions = () => {
    const options = [];
    const minScore = 1;
    const maxScore = Math.max(10, par + 5); // At least up to par + 5

    for (let score = minScore; score <= maxScore; score++) {
      const info = getScoreInfo(score, par, isMatchPlay);
      options.push({
        score,
        name: info.name,
        bg: info.bg,
        text: info.text,
      });
    }

    return options;
  };

  const scoreOptions = generateScoreOptions();

  return (
    <div className="space-y-4">
      {/* Team Header Card */}
      <div
        className="card"
        style={{
          background: `linear-gradient(135deg, ${team.color}20 0%, ${team.color}08 100%)`,
          borderLeft: `4px solid ${team.color}`,
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: team.color }}
            >
              <span className="text-3xl">👥</span>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900">{team.name}</h3>
              <p className="text-sm text-slate-600 mt-1">
                {teamMembers.join(", ")}
              </p>
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                <span className="font-semibold">Hole {currentHole}</span>
                <span>•</span>
                <span>Par {holeInfo.par}</span>
                <span>•</span>
                <span>{holeInfo.yardage} yards</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div
              className={`text-4xl font-bold px-5 py-3 rounded-xl border-2 shadow-md transition-all duration-200 ${scoreInfo.bg} ${scoreInfo.text}`}
            >
              {localScore || "–"}
            </div>
          </div>
        </div>
      </div>

      {/* Score Selection Card */}
      <div className="card">
        <h4 className="text-sm font-semibold text-slate-800 mb-4">
          Select Team Score
        </h4>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-4">
          {scoreOptions.slice(0, 10).map((option) => (
            <button
              key={option.score}
              type="button"
              onClick={() => handleScoreSelect(option.score)}
              disabled={round.status === "completed"}
              className={`relative p-3 sm:p-4 rounded-xl border-2 font-bold 
                  flex flex-col items-center justify-center min-h-[72px] sm:min-h-[80px]
                  transition-all duration-200 hover:scale-105 active:scale-95 
                  outline-none shadow-sm hover:shadow-md ${
                    round.status === "completed"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  } ${
                localScore === option.score
                  ? `${option.bg} ${option.text} border-emerald-400 ring-2 ring-emerald-300 scale-105`
                  : "bg-white text-slate-700 border-slate-300 active:border-slate-400"
              }`}
            >
              <div className="text-xl sm:text-2xl font-bold mb-0.5">
                {option.score}
              </div>

              <div className="text-[10px] sm:text-xs font-medium leading-tight text-center">
                {option.score === par
                  ? "Par"
                  : option.score === par + 1
                  ? "Bogey"
                  : option.score === par + 2
                  ? "Double"
                  : option.score === par - 1
                  ? "Birdie"
                  : option.score === par - 2
                  ? "Eagle"
                  : option.score === 1
                  ? "Ace!"
                  : ""}
              </div>

              {localScore === option.score && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 8 8"
                  >
                    <path d="M3 6L1 4l.7-.7L3 4.6l3.3-3.3L7 2z" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Team Stats Card */}
      <div className="card bg-slate-50">
        <h5 className="text-sm font-semibold text-slate-800 mb-3">
          Team Stats
        </h5>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {teamScore?.totalScore || 0}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
              Total
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {teamScore?.scores.filter((s) => s !== null && s > 0).length}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
              Holes
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {(() => {
                const scores = teamScore?.scores || [];
                const holesPlayed = scores.filter(
                  (s) => s !== null && s > 0
                ).length;
                if (holesPlayed === 0) return "–";
                const totalScore = teamScore?.totalScore || 0;
                const totalPar = round.holeInfo
                  .slice(0, holesPlayed)
                  .reduce((sum, hole) => sum + (hole?.par || 4), 0);
                const diff = totalScore - totalPar;
                return diff > 0 ? `+${diff}` : diff;
              })()}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
              To Par
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
