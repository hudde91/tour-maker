import { Round, PlayerScore } from "../types";
import { DetailedPlayerStats, RoundSummary, HoleWinner } from "../types/scoring";

/**
 * Calculate detailed statistics for a player's round
 */
export const calculateDetailedPlayerStats = (
  round: Round,
  playerId: string
): DetailedPlayerStats | null => {
  const playerScore = round.scores[playerId] as PlayerScore;
  if (!playerScore || !playerScore.scores) {
    return null;
  }

  const { scores } = playerScore;
  const holes = round.holeInfo;

  // Initialize counters
  let birdieCount = 0;
  let parCount = 0;
  let bogeyCount = 0;
  let doubleBogeyOrWorse = 0;
  let eagleOrBetter = 0;

  let bestHole: { holeNumber: number; score: number; toPar: number } | null = null;
  let worstHole: { holeNumber: number; score: number; toPar: number } | null = null;

  // Front 9 and Back 9 summaries
  const front9Summary: RoundSummary = {
    score: 0,
    toPar: 0,
    birdies: 0,
    pars: 0,
    bogeys: 0,
    holesPlayed: 0,
  };

  const back9Summary: RoundSummary = {
    score: 0,
    toPar: 0,
    birdies: 0,
    pars: 0,
    bogeys: 0,
    holesPlayed: 0,
  };

  // Track streak information
  let currentStreakType: "birdie" | "par" | "bogey" | "under-par" | "over-par" | "none" = "none";
  let currentStreakLength = 0;
  let lastHoleRelation: number | null = null;

  // Process each hole
  scores.forEach((score, index) => {
    // Skip holes without scores
    if (!score || score === 0 || index >= holes.length) {
      // Reset streak on skipped hole
      if (lastHoleRelation !== null) {
        currentStreakType = "none";
        currentStreakLength = 0;
        lastHoleRelation = null;
      }
      return;
    }

    const hole = holes[index];
    const par = hole.par;
    const toPar = score - par;

    // Count score types
    if (toPar <= -2) {
      eagleOrBetter++;
    } else if (toPar === -1) {
      birdieCount++;
    } else if (toPar === 0) {
      parCount++;
    } else if (toPar === 1) {
      bogeyCount++;
    } else if (toPar >= 2) {
      doubleBogeyOrWorse++;
    }

    // Track best and worst holes
    if (bestHole === null || toPar < bestHole.toPar) {
      bestHole = { holeNumber: index + 1, score, toPar };
    }
    if (worstHole === null || toPar > worstHole.toPar) {
      worstHole = { holeNumber: index + 1, score, toPar };
    }

    // Add to appropriate 9-hole summary
    const summary = index < 9 ? front9Summary : back9Summary;
    summary.score += score;
    summary.toPar += toPar;
    summary.holesPlayed++;

    if (toPar === -1) summary.birdies++;
    else if (toPar === 0) summary.pars++;
    else if (toPar === 1) summary.bogeys++;

    // Calculate streaks
    if (lastHoleRelation === null) {
      // First hole with a score
      if (toPar === -1) {
        currentStreakType = "birdie";
        currentStreakLength = 1;
      } else if (toPar === 0) {
        currentStreakType = "par";
        currentStreakLength = 1;
      } else if (toPar === 1) {
        currentStreakType = "bogey";
        currentStreakLength = 1;
      } else if (toPar < 0) {
        currentStreakType = "under-par";
        currentStreakLength = 1;
      } else if (toPar > 0) {
        currentStreakType = "over-par";
        currentStreakLength = 1;
      }
      lastHoleRelation = toPar;
    } else {
      // Continue or break streak
      let streakContinues = false;

      switch (currentStreakType) {
        case "birdie":
          streakContinues = toPar === -1;
          break;
        case "par":
          streakContinues = toPar === 0;
          break;
        case "bogey":
          streakContinues = toPar === 1;
          break;
        case "under-par":
          streakContinues = toPar < 0;
          break;
        case "over-par":
          streakContinues = toPar > 0;
          break;
      }

      if (streakContinues) {
        currentStreakLength++;
      } else {
        // Start new streak
        if (toPar === -1) {
          currentStreakType = "birdie";
          currentStreakLength = 1;
        } else if (toPar === 0) {
          currentStreakType = "par";
          currentStreakLength = 1;
        } else if (toPar === 1) {
          currentStreakType = "bogey";
          currentStreakLength = 1;
        } else if (toPar < 0) {
          currentStreakType = "under-par";
          currentStreakLength = 1;
        } else if (toPar > 0) {
          currentStreakType = "over-par";
          currentStreakLength = 1;
        } else {
          currentStreakType = "none";
          currentStreakLength = 0;
        }
      }

      lastHoleRelation = toPar;
    }
  });

  return {
    playerId,
    roundId: round.id,
    birdieCount,
    parCount,
    bogeyCount,
    doubleBogeyOrWorse,
    eagleOrBetter,
    bestHole,
    worstHole,
    currentStreak: {
      type: currentStreakType,
      length: currentStreakLength,
    },
    front9: front9Summary,
    back9: back9Summary,
  };
};

/**
 * Calculate hole winners for a round (for skins or competitive formats)
 */
export const calculateHoleWinners = (
  round: Round,
  playerIds?: string[]
): HoleWinner[] => {
  const holes = round.holeInfo;
  const holeWinners: HoleWinner[] = [];

  // Get all player IDs to consider
  const playersToConsider = playerIds || Object.keys(round.scores);

  // Process each hole
  for (let holeIndex = 0; holeIndex < holes.length; holeIndex++) {
    const hole = holes[holeIndex];
    const par = hole.par;

    // Get all scores for this hole
    const holeScores: { playerId: string; score: number; toPar: number }[] = [];

    playersToConsider.forEach((playerId) => {
      const playerScore = round.scores[playerId] as PlayerScore;
      if (playerScore && playerScore.scores && playerScore.scores[holeIndex]) {
        const score = playerScore.scores[holeIndex] as number;
        holeScores.push({
          playerId,
          score,
          toPar: score - par,
        });
      }
    });

    // Find the lowest score(s)
    if (holeScores.length > 0) {
      const lowestScore = Math.min(...holeScores.map((hs) => hs.score));
      const winners = holeScores.filter((hs) => hs.score === lowestScore);

      holeWinners.push({
        holeNumber: holeIndex + 1,
        winnerIds: winners.map((w) => w.playerId),
        score: lowestScore,
        toPar: lowestScore - par,
        isTied: winners.length > 1,
      });
    }
  }

  return holeWinners;
};

/**
 * Calculate aggregate statistics across multiple rounds for a player
 */
export const calculateAggregatePlayerStats = (
  rounds: Round[],
  playerId: string
): {
  totalBirdies: number;
  totalPars: number;
  totalBogeys: number;
  totalDoubleBogeyOrWorse: number;
  totalEagleOrBetter: number;
  averageScorePerRound: number;
  bestRoundScore: number;
  bestRound?: Round;
} => {
  let totalBirdies = 0;
  let totalPars = 0;
  let totalBogeys = 0;
  let totalDoubleBogeyOrWorse = 0;
  let totalEagleOrBetter = 0;
  let totalScore = 0;
  let roundsPlayed = 0;
  let bestRoundScore = Infinity;
  let bestRound: Round | undefined;

  rounds.forEach((round) => {
    // Skip match play rounds
    if (round.isMatchPlay) return;

    const stats = calculateDetailedPlayerStats(round, playerId);
    if (stats) {
      totalBirdies += stats.birdieCount;
      totalPars += stats.parCount;
      totalBogeys += stats.bogeyCount;
      totalDoubleBogeyOrWorse += stats.doubleBogeyOrWorse;
      totalEagleOrBetter += stats.eagleOrBetter;

      const playerScore = round.scores[playerId] as PlayerScore;
      if (playerScore) {
        totalScore += playerScore.totalScore;
        roundsPlayed++;

        if (playerScore.totalScore < bestRoundScore) {
          bestRoundScore = playerScore.totalScore;
          bestRound = round;
        }
      }
    }
  });

  return {
    totalBirdies,
    totalPars,
    totalBogeys,
    totalDoubleBogeyOrWorse,
    totalEagleOrBetter,
    averageScorePerRound: roundsPlayed > 0 ? totalScore / roundsPlayed : 0,
    bestRoundScore: bestRoundScore === Infinity ? 0 : bestRoundScore,
    bestRound,
  };
};

/**
 * Format a streak for display
 */
export const formatStreak = (streak: {
  type: "birdie" | "par" | "bogey" | "under-par" | "over-par" | "none";
  length: number;
}): string => {
  if (streak.type === "none" || streak.length === 0) {
    return "No active streak";
  }

  const typeLabel = {
    birdie: "Birdie",
    par: "Par",
    bogey: "Bogey",
    "under-par": "Under Par",
    "over-par": "Over Par",
  }[streak.type];

  return `${typeLabel} streak: ${streak.length} hole${streak.length > 1 ? "s" : ""}`;
};
