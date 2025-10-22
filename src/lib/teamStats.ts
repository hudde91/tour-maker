import { Tour, Team, Player, Round } from "../types";

export interface PlayerStats {
  player: Player;
  roundsPlayed: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  bestRound?: Round;
  toPar: number;
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
      const scoreKey = `player_${player.id}`;
      return round.scores[scoreKey] !== undefined;
    });

    const roundScores = playerRounds.map((round) => {
      const scoreKey = `player_${player.id}`;
      const score = round.scores[scoreKey];
      // PlayerScore interface has totalScore property
      if (typeof score === "object" && score.totalScore !== undefined) {
        return score.totalScore;
      }
      // Fallback for legacy format
      return typeof score === "number" ? score : 0;
    });

    const totalScore = roundScores.reduce((sum, score) => sum + score, 0);
    const bestScore = roundScores.length > 0 ? Math.min(...roundScores) : 0;
    const bestRoundIndex = roundScores.indexOf(bestScore);
    const bestRound =
      bestRoundIndex >= 0 ? playerRounds[bestRoundIndex] : undefined;

    // Calculate to par
    const playerToPar = playerRounds.reduce((sum, round, index) => {
      const par = round.totalPar || round.holeInfo.reduce((s, h) => s + h.par, 0);
      return sum + (roundScores[index] - par);
    }, 0);

    return {
      player,
      roundsPlayed: playerRounds.length,
      totalScore,
      averageScore: roundScores.length > 0 ? totalScore / roundScores.length : 0,
      bestScore: roundScores.length > 0 ? bestScore : 0,
      bestRound,
      toPar: playerToPar,
    };
  });

  // Calculate team-level stats based on format
  let teamRoundScores: number[] = [];
  let teamToPar = 0;

  if (tour.format === "scramble" || tour.format === "alternate-shot") {
    // Team formats use team scores
    const teamRounds = tour.rounds.filter((round) => {
      const scoreKey = `team_${teamId}`;
      return round.scores[scoreKey] !== undefined;
    });

    teamRoundScores = teamRounds.map((round) => {
      const scoreKey = `team_${teamId}`;
      const score = round.scores[scoreKey];
      if (typeof score === "object" && score.totalScore !== undefined) {
        return score.totalScore;
      }
      return typeof score === "number" ? score : 0;
    });

    teamToPar = teamRounds.reduce((sum, round, index) => {
      const par = round.totalPar || round.holeInfo.reduce((s, h) => s + h.par, 0);
      return sum + (teamRoundScores[index] - par);
    }, 0);
  } else {
    // Individual or best ball formats - sum player scores
    const commonRounds = tour.rounds.filter((round) => {
      // Check if at least one team player has a score
      return teamPlayers.some((player) => {
        const scoreKey = `player_${player.id}`;
        return round.scores[scoreKey] !== undefined;
      });
    });

    teamRoundScores = commonRounds.map((round) => {
      if (tour.format === "best-ball") {
        // Best ball: take the lowest score per hole
        const holes = round.holeInfo.length;
        let bestBallTotal = 0;

        for (let holeIndex = 0; holeIndex < holes; holeIndex++) {
          const holeScores = teamPlayers
            .map((player) => {
              const scoreKey = `player_${player.id}`;
              const score = round.scores[scoreKey];
              // PlayerScore has scores array, not holes
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
        // Sum all player scores for the round
        return teamPlayers.reduce((sum, player) => {
          const scoreKey = `player_${player.id}`;
          const score = round.scores[scoreKey];
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
      const parForTeam = tour.format === "best-ball" ? par : par * teamPlayers.length;
      return sum + (teamRoundScores[index] - parForTeam);
    }, 0);
  }

  const roundsPlayed = teamRoundScores.length;
  const totalScore = teamRoundScores.reduce((sum, score) => sum + score, 0);
  const averageScore = roundsPlayed > 0 ? totalScore / roundsPlayed : 0;
  const bestScore = roundsPlayed > 0 ? Math.min(...teamRoundScores) : 0;
  const worstScore = roundsPlayed > 0 ? Math.max(...teamRoundScores) : 0;

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
  const bestPerformers = [...playerStats]
    .filter((ps) => ps.roundsPlayed > 0)
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 3);

  return {
    team,
    roundsPlayed,
    totalScore,
    averageScore,
    bestScore,
    worstScore,
    toPar: teamToPar,
    bestPerformers,
    momentum,
    recentScores,
    playerStats: playerStats.filter((ps) => ps.roundsPlayed > 0),
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
