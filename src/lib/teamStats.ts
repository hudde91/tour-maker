import { Tour, Team, Player, Round } from "../types";
import { calculateAggregatePlayerStats } from "./playerStatsUtils";

export interface PlayerStats {
  player: Player;
  roundsPlayed: number; // Stroke play rounds only
  totalRoundsParticipated: number; // All rounds including match play
  totalScore: number;
  averageScore: number;
  bestScore: number;
  bestRound?: Round;
  toPar: number;
  // Detailed scoring statistics (across all stroke play rounds)
  birdieCount?: number;
  parCount?: number;
  bogeyCount?: number;
  doubleBogeyOrWorse?: number;
  eagleOrBetter?: number;
}

export interface TeamStats {
  team: Team;
  roundsPlayed: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  toPar: number;
  bestPerformers: PlayerStats[];
  momentum: "improving" | "stable" | "declining" | "no-data";
  recentScores: number[]; // Last 3 rounds
  playerStats: PlayerStats[];
}

/**
 * Calculate comprehensive statistics for a team
 */
export const calculateTeamStats = (
  tour: Tour,
  teamId: string
): TeamStats | null => {
  const team = tour.teams?.find((t) => t.id === teamId);
  if (!team) return null;

  const teamPlayers = tour.players.filter((p) => p.teamId === teamId);
  if (teamPlayers.length === 0) {
    return {
      team,
      roundsPlayed: 0,
      totalScore: 0,
      averageScore: 0,
      bestScore: 0,
      worstScore: 0,
      toPar: 0,
      bestPerformers: [],
      momentum: "no-data",
      recentScores: [],
      playerStats: [],
    };
  }

  // Calculate player stats
  const playerStats: PlayerStats[] = teamPlayers.map((player) => {
    const playerRounds = tour.rounds.filter((round) => {
      // For match play/Ryder Cup rounds, check if player is in any match
      if (round.isMatchPlay && round.ryderCup?.matches) {
        return round.ryderCup.matches.some((match) =>
          match.teamA.playerIds.includes(player.id) ||
          match.teamB.playerIds.includes(player.id)
        );
      }
      // For regular rounds, check scores object
      return round.scores[player.id] !== undefined;
    });

    const roundScores = playerRounds.map((round) => {
      // For match play/Ryder Cup rounds, we don't have individual stroke scores
      // We'll return 0 for now as match play is about holes won, not strokes
      if (round.isMatchPlay) {
        return 0;
      }

      const score = round.scores[player.id];
      // PlayerScore interface has totalScore property
      if (typeof score === "object" && score.totalScore !== undefined) {
        return score.totalScore;
      }
      // Fallback for legacy format
      return typeof score === "number" ? score : 0;
    });

    // Only calculate scores for non-match-play rounds
    const strokePlayRounds = playerRounds.filter(r => !r.isMatchPlay);
    const strokePlayScores = roundScores.filter((_, index) => !playerRounds[index].isMatchPlay);

    const totalScore = strokePlayScores.reduce((sum, score) => sum + score, 0);
    const bestScore = strokePlayScores.length > 0 ? Math.min(...strokePlayScores) : 0;
    const bestRoundIndex = strokePlayScores.indexOf(bestScore);
    const bestRound = bestRoundIndex >= 0 ? strokePlayRounds[bestRoundIndex] : undefined;

    // Calculate to par (only for stroke play rounds)
    const playerToPar = strokePlayRounds.reduce((sum, round, index) => {
      const par = round.totalPar || round.holeInfo.reduce((s, h) => s + h.par, 0);
      return sum + (strokePlayScores[index] - par);
    }, 0);

    // Calculate aggregate detailed statistics
    const aggregateStats = calculateAggregatePlayerStats(strokePlayRounds, player.id);

    return {
      player,
      roundsPlayed: strokePlayRounds.length, // Only count stroke play rounds
      totalRoundsParticipated: playerRounds.length, // Total rounds including match play
      totalScore,
      averageScore: strokePlayScores.length > 0 ? totalScore / strokePlayScores.length : 0,
      bestScore: strokePlayScores.length > 0 ? bestScore : 0,
      bestRound,
      toPar: playerToPar,
      // Add detailed stats
      birdieCount: aggregateStats.totalBirdies,
      parCount: aggregateStats.totalPars,
      bogeyCount: aggregateStats.totalBogeys,
      doubleBogeyOrWorse: aggregateStats.totalDoubleBogeyOrWorse,
      eagleOrBetter: aggregateStats.totalEagleOrBetter,
    };
  });

  // Calculate team-level stats based on format
  let teamRoundScores: number[] = [];
  let teamToPar = 0;
  let ryderCupRoundsCount = 0;

  // Check for Ryder Cup rounds where team players participated
  const ryderCupRounds = tour.rounds.filter((round) => {
    if (round.isMatchPlay && round.ryderCup?.matches) {
      return round.ryderCup.matches.some((match) =>
        teamPlayers.some(player =>
          match.teamA.playerIds.includes(player.id) ||
          match.teamB.playerIds.includes(player.id)
        )
      );
    }
    return false;
  });
  ryderCupRoundsCount = ryderCupRounds.length;

  // Check if any rounds use team scoring formats (scramble/alternate-shot)
  const teamScoringRounds = tour.rounds.filter((round) => {
    const scoreKey = `team_${teamId}`;
    return round.scores[scoreKey] !== undefined && round.scores[scoreKey].isTeamScore;
  });

  if (teamScoringRounds.length > 0) {
    // Team formats use team scores (scramble, alternate-shot, etc.)
    teamRoundScores = teamScoringRounds.map((round) => {
      const scoreKey = `team_${teamId}`;
      const score = round.scores[scoreKey];
      if (typeof score === "object" && score.totalScore !== undefined) {
        return score.totalScore;
      }
      return typeof score === "number" ? score : 0;
    });

    teamToPar = teamScoringRounds.reduce((sum, round, index) => {
      const par = round.totalPar || round.holeInfo.reduce((s, h) => s + h.par, 0);
      return sum + (teamRoundScores[index] - par);
    }, 0);
  } else {
    // Individual-based scoring - check each round's format
    const commonRounds = tour.rounds.filter((round) => {
      // Check if at least one team player has a score
      return teamPlayers.some((player) => {
        return round.scores[player.id] !== undefined;
      });
    });

    teamRoundScores = commonRounds.map((round) => {
      if (round.format === "best-ball") {
        // Best ball: take the lowest score per hole
        const holes = round.holeInfo.length;
        let bestBallTotal = 0;

        for (let holeIndex = 0; holeIndex < holes; holeIndex++) {
          const holeScores = teamPlayers
            .map((player) => {
              const score = round.scores[player.id];
              // PlayerScore has scores array
              if (typeof score === "object" && score.scores?.[holeIndex] !== undefined) {
                return score.scores[holeIndex];
              }
              return null;
            })
            .filter((s): s is number => s !== null);

          if (holeScores.length > 0) {
            bestBallTotal += Math.min(...holeScores);
          }
        }

        return bestBallTotal;
      } else {
        // Sum all player scores for the round (stroke play, etc.)
        return teamPlayers.reduce((sum, player) => {
          const score = round.scores[player.id];
          if (typeof score === "object" && score.totalScore !== undefined) {
            return sum + score.totalScore;
          }
          const roundScore = typeof score === "number" ? score : 0;
          return sum + roundScore;
        }, 0);
      }
    });

    teamToPar = commonRounds.reduce((sum, round, index) => {
      const par = round.totalPar || round.holeInfo.reduce((s, h) => s + h.par, 0);
      // For best-ball, par is just the course par
      // For individual formats, multiply par by number of players
      const parForTeam = round.format === "best-ball" ? par : par * teamPlayers.length;
      return sum + (teamRoundScores[index] - parForTeam);
    }, 0);
  }

  const strokePlayRoundsCount = teamRoundScores.length;
  const totalRoundsPlayed = strokePlayRoundsCount + ryderCupRoundsCount;
  const totalScore = teamRoundScores.reduce((sum, score) => sum + score, 0);
  const averageScore = strokePlayRoundsCount > 0 ? totalScore / strokePlayRoundsCount : 0;
  const bestScore = strokePlayRoundsCount > 0 ? Math.min(...teamRoundScores) : 0;
  const worstScore = strokePlayRoundsCount > 0 ? Math.max(...teamRoundScores) : 0;

  // Get recent scores (last 3 rounds) for momentum calculation
  const recentScores = teamRoundScores.slice(-3);

  // Calculate momentum based on recent performance
  let momentum: "improving" | "stable" | "declining" | "no-data" = "no-data";
  if (recentScores.length >= 2) {
    const firstHalf = recentScores.slice(0, Math.ceil(recentScores.length / 2));
    const secondHalf = recentScores.slice(Math.ceil(recentScores.length / 2));

    const firstHalfAvg =
      firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;

    const improvement = firstHalfAvg - secondHalfAvg;

    if (improvement > 2) {
      momentum = "improving";
    } else if (improvement < -2) {
      momentum = "declining";
    } else {
      momentum = "stable";
    }
  }

  // Sort players by average score to find best performers (top 3)
  // Only include players with stroke play rounds for performance comparison
  const bestPerformers = [...playerStats]
    .filter((ps) => ps.roundsPlayed > 0)
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 3);

  return {
    team,
    roundsPlayed: totalRoundsPlayed, // Total rounds including Ryder Cup
    totalScore,
    averageScore,
    bestScore,
    worstScore,
    toPar: teamToPar,
    bestPerformers,
    momentum,
    recentScores,
    // Include all players who participated in any rounds (stroke play or match play)
    playerStats: playerStats.filter((ps) => ps.totalRoundsParticipated > 0),
  };
};

/**
 * Format score relative to par
 */
export const formatToPar = (toPar: number): string => {
  if (toPar === 0) return "E";
  return toPar > 0 ? `+${toPar}` : `${toPar}`;
};

/**
 * Get momentum indicator emoji
 */
export const getMomentumIndicator = (
  momentum: "improving" | "stable" | "declining" | "no-data"
): string => {
  switch (momentum) {
    case "improving":
      return "📈";
    case "declining":
      return "📉";
    case "stable":
      return "➡️";
    default:
      return "❓";
  }
};

/**
 * Get momentum color classes
 */
export const getMomentumColorClass = (
  momentum: "improving" | "stable" | "declining" | "no-data"
): string => {
  switch (momentum) {
    case "improving":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "declining":
      return "text-red-600 bg-red-50 border-red-200";
    case "stable":
      return "text-blue-600 bg-blue-50 border-blue-200";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
};
