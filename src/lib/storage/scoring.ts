import { Tour, Round, TeamLeaderboardEntry, LeaderboardEntry } from "../../types";
import type { ScoringConfig, PointsDistributionEntry } from "../../types";
import { safeMin } from "../scoringUtils";
import { isRoundCompleted } from "../roundUtils";
import { getTotalPar } from "./rounds";
import { getPlayerScoreFromRyderCup, hasRyderCupScores } from "./matchplay";
import { calculateStrokesForHole } from "./players";

/**
 * Scoring calculations and leaderboard generation
 * Handles all scoring logic including team and individual formats
 */

/**
 * Calculate best ball leaderboard for a single round
 */
export const calculateBestBallRoundLeaderboard = (
  tour: Tour,
  round: Round
): TeamLeaderboardEntry[] => {
  const teamEntries: TeamLeaderboardEntry[] = [];

  const holesCount =
    (typeof round.holes === "number" && round.holes > 0
      ? round.holes
      : round.holeInfo?.length) ?? 18;

  const getHolePar = (idx: number): number => {
    if (round.holeInfo && round.holeInfo[idx]) {
      return round.holeInfo[idx].par;
    }
    return 4; // default par
  };

  tour.teams!.forEach((team) => {
    const teamPlayers = tour.players.filter((p) => p.teamId === team.id);

    let teamTotalScore = 0;
    let countedPar = 0;

    // Best ball team score per hole
    for (let h = 0; h < holesCount; h++) {
      const holeScores = teamPlayers
        .map((player) => round.scores[player.id]?.scores?.[h])
        .filter((score): score is number =>
          typeof score === "number" && Number.isFinite(score) && score > 0
        );

      const bestScore = safeMin(holeScores);
      if (typeof bestScore === "number") {
        teamTotalScore += bestScore;
        countedPar += getHolePar(h);
      }
    }

    // Count players with any valid score in the round
    const playersWithScores = teamPlayers.filter((player) => {
      const scores = round.scores[player.id]?.scores ?? [];
      return scores.some(
        (v) => typeof v === "number" && Number.isFinite(v) && v > 0
      );
    }).length;

    const teamTotalToPar =
      countedPar > 0 ? teamTotalScore - countedPar : undefined;

    teamEntries.push({
      team,
      totalScore: teamTotalScore > 0 ? teamTotalScore : 0,
      totalToPar: teamTotalToPar ?? 0,
      netScore: undefined,
      netToPar: undefined,
      totalHandicapStrokes: undefined,
      playersWithScores,
      totalPlayers: teamPlayers.length,
      position: 0,
    });
  });

  return sortAndPositionTeams(teamEntries);
};

/**
 * Strategy that picks a team's score for one hole from teammates' individual
 * scores. Returns 0 (skipped) when no valid scores exist for that hole.
 */
export type TeamHoleScoreStrategy = (args: {
  holeScores: number[];
  holeIndex: number;
  totalHoles: number;
}) => number;

const minOf = (xs: number[]): number =>
  xs.reduce((a, b) => (a < b ? a : b), xs[0]);
const maxOf = (xs: number[]): number =>
  xs.reduce((a, b) => (a > b ? a : b), xs[0]);

/** Best ball + worst ball summed per hole. */
export const bestPlusWorstStrategy: TeamHoleScoreStrategy = ({ holeScores }) => {
  if (holeScores.length === 0) return 0;
  if (holeScores.length === 1) return holeScores[0] * 2;
  return minOf(holeScores) + maxOf(holeScores);
};

/** Best on odd display holes (hole 1, 3, ...), worst on even display holes. */
export const alternatingBestWorstStrategy: TeamHoleScoreStrategy = ({
  holeScores,
  holeIndex,
}) => {
  if (holeScores.length === 0) return 0;
  return holeIndex % 2 === 0 ? minOf(holeScores) : maxOf(holeScores);
};

/** First third best, middle third worst, last third best+worst combined. */
export const sixSixSixStrategy: TeamHoleScoreStrategy = ({
  holeScores,
  holeIndex,
  totalHoles,
}) => {
  if (holeScores.length === 0) return 0;
  const third = Math.min(2, Math.floor((holeIndex * 3) / totalHoles));
  if (third === 0) return minOf(holeScores);
  if (third === 1) return maxOf(holeScores);
  return bestPlusWorstStrategy({ holeScores, holeIndex, totalHoles });
};

/**
 * The par baseline for a hole given a strategy. Combined holes (where both
 * best and worst contribute) count par twice, so to-par stays honest.
 */
const countedParForHole = (
  strategy: TeamHoleScoreStrategy,
  holeIndex: number,
  totalHoles: number,
  holePar: number
): number => {
  if (strategy === bestPlusWorstStrategy) return holePar * 2;
  if (strategy === sixSixSixStrategy) {
    const third = Math.min(2, Math.floor((holeIndex * 3) / totalHoles));
    return third === 2 ? holePar * 2 : holePar;
  }
  return holePar;
};

/**
 * Generic team-leaderboard calculator: picks each team's hole score from
 * teammates' individual scores using the given strategy. Used by
 * best-worst-combined, best-worst-alternating, and 6-6-6.
 */
export const calculateAggregatedRoundLeaderboard = (
  tour: Tour,
  round: Round,
  strategy: TeamHoleScoreStrategy
): TeamLeaderboardEntry[] => {
  const teamEntries: TeamLeaderboardEntry[] = [];

  const totalHoles =
    (typeof round.holes === "number" && round.holes > 0
      ? round.holes
      : round.holeInfo?.length) ?? 18;

  const getHolePar = (idx: number): number =>
    round.holeInfo?.[idx]?.par ?? 4;

  tour.teams!.forEach((team) => {
    const teamPlayers = tour.players.filter((p) => p.teamId === team.id);

    let teamTotalScore = 0;
    let countedPar = 0;

    for (let h = 0; h < totalHoles; h++) {
      const holeScores = teamPlayers
        .map((p) => round.scores[p.id]?.scores?.[h])
        .filter((s): s is number =>
          typeof s === "number" && Number.isFinite(s) && s > 0
        );
      if (holeScores.length === 0) continue;
      const holeScore = strategy({
        holeScores,
        holeIndex: h,
        totalHoles,
      });
      if (holeScore > 0) {
        teamTotalScore += holeScore;
        countedPar += countedParForHole(
          strategy,
          h,
          totalHoles,
          getHolePar(h)
        );
      }
    }

    const playersWithScores = teamPlayers.filter((player) =>
      (round.scores[player.id]?.scores ?? []).some(
        (v) => typeof v === "number" && Number.isFinite(v) && v > 0
      )
    ).length;

    const teamTotalToPar =
      countedPar > 0 ? teamTotalScore - countedPar : 0;

    teamEntries.push({
      team,
      totalScore: teamTotalScore > 0 ? teamTotalScore : 0,
      totalToPar: teamTotalToPar,
      netScore: undefined,
      netToPar: undefined,
      totalHandicapStrokes: undefined,
      playersWithScores,
      totalPlayers: teamPlayers.length,
      position: 0,
    });
  });

  return sortAndPositionTeams(teamEntries);
};

/**
 * Calculate scramble leaderboard for a single round
 */
export const calculateScrambleRoundLeaderboard = (
  tour: Tour,
  round: Round
): TeamLeaderboardEntry[] => {
  const teamEntries: TeamLeaderboardEntry[] = [];

  tour.teams!.forEach((team) => {
    const teamPlayers = tour.players.filter((p) => p.teamId === team.id);
    let teamTotalScore = 0;
    let teamTotalToPar = 0;
    let playersWithScores = 0;

    // Get team score from scramble scoring (stored as team_${teamId})
    const teamScoreKey = `team_${team.id}`;
    const teamScore = round.scores[teamScoreKey];

    if (teamScore && teamScore.isTeamScore) {
      teamTotalScore = teamScore.totalScore;
      teamTotalToPar = teamScore.totalToPar;
      playersWithScores = teamScore.totalScore > 0 ? teamPlayers.length : 0;
    }

    teamEntries.push({
      team,
      totalScore: teamTotalScore,
      totalToPar: teamTotalToPar,
      netScore: undefined,
      netToPar: undefined,
      totalHandicapStrokes: undefined,
      playersWithScores,
      totalPlayers: teamPlayers.length,
      position: 0,
    });
  });

  return sortAndPositionTeams(teamEntries);
};

/**
 * Calculate individual-based team leaderboard for a single round
 */
export const calculateIndividualRoundLeaderboard = (
  tour: Tour,
  round: Round
): TeamLeaderboardEntry[] => {
  const teamEntries: TeamLeaderboardEntry[] = [];

  tour.teams!.forEach((team) => {
    const teamPlayers = tour.players.filter((p) => p.teamId === team.id);
    let teamTotalScore = 0;
    let teamTotalToPar = 0;
    let teamNetScore = 0;
    let teamNetToPar = 0;
    let teamHandicapStrokes = 0;
    let playersWithScores = 0;
    let hasHandicapApplied = false;

    teamPlayers.forEach((player) => {
      const playerScore = round.scores[player.id];
      if (playerScore && playerScore.totalScore > 0) {
        teamTotalScore += playerScore.totalScore;
        teamTotalToPar += playerScore.totalToPar;
        teamNetScore += playerScore.netScore || playerScore.totalScore;
        teamNetToPar += playerScore.netToPar || playerScore.totalToPar;
        teamHandicapStrokes += playerScore.handicapStrokes || 0;
        if (playerScore.handicapStrokes) hasHandicapApplied = true;
        playersWithScores++;
      }
    });

    teamEntries.push({
      team,
      totalScore: teamTotalScore,
      totalToPar: teamTotalToPar,
      netScore: hasHandicapApplied ? teamNetScore : undefined,
      netToPar: hasHandicapApplied ? teamNetToPar : undefined,
      totalHandicapStrokes: hasHandicapApplied
        ? teamHandicapStrokes
        : undefined,
      playersWithScores,
      totalPlayers: teamPlayers.length,
      position: 0,
    });
  });

  return sortAndPositionTeams(teamEntries);
};

/**
 * Calculate tournament-wide team leaderboard combining all rounds
 */
export const calculateTournamentTeamLeaderboard = (tour: Tour): TeamLeaderboardEntry[] => {
  const teamEntries: TeamLeaderboardEntry[] = [];

  tour.teams!.forEach((team) => {
    const teamPlayers = tour.players.filter((p) => p.teamId === team.id);
    let teamTotalScore = 0;
    let teamTotalToPar = 0;
    let teamNetScore = 0;
    let teamNetToPar = 0;
    let teamHandicapStrokes = 0;
    let playersWithScores = 0;
    let hasHandicapApplied = false;

    // Process each round with format awareness
    (tour.rounds || []).filter(isRoundCompleted).forEach((round) => {
      let roundTeamScore = 0;
      let roundTeamToPar = 0;
      let roundNetScore = 0;
      let roundNetToPar = 0;
      let roundHandicapStrokes = 0;
      let roundHasHandicap = false;

      // Handle match play rounds (Ryder Cup formats)
      if (round.isMatchPlay) {
        // For match play, sum individual player scores from matches
        teamPlayers.forEach((player) => {
          const playerScore = getPlayerScoreFromRyderCup(round, player.id);
          if (playerScore > 0) {
            roundTeamScore += playerScore;
          }
        });
        roundTeamToPar = roundTeamScore - getTotalPar(round);
      } else {
        // Handle stroke play formats
        switch (round.format) {
          case "best-ball":
            // Calculate best ball for this round
            for (let hole = 0; hole < round.holes; hole++) {
              const holeScores = teamPlayers
                .map((player) => round.scores[player.id]?.scores[hole] || 0)
                .filter((score) => score > 0);

              if (holeScores.length > 0) {
                roundTeamScore += Math.min(...holeScores);
              }
            }
            roundTeamToPar = roundTeamScore - getTotalPar(round);
            break;

          case "scramble":
            // Get scramble team score
            const teamScoreKey = `team_${team.id}`;
            const teamScore = round.scores[teamScoreKey];
            if (teamScore && teamScore.isTeamScore) {
              roundTeamScore = teamScore.totalScore;
              roundTeamToPar = teamScore.totalToPar;
            }
            break;

          case "best-worst-combined":
          case "best-worst-alternating":
          case "six-six-six": {
            const totalHoles = round.holes || round.holeInfo?.length || 18;
            const strategy =
              round.format === "best-worst-combined"
                ? bestPlusWorstStrategy
                : round.format === "best-worst-alternating"
                  ? alternatingBestWorstStrategy
                  : sixSixSixStrategy;
            let countedPar = 0;
            for (let hole = 0; hole < totalHoles; hole++) {
              const holeScores = teamPlayers
                .map((p) => round.scores[p.id]?.scores?.[hole])
                .filter(
                  (s): s is number =>
                    typeof s === "number" && Number.isFinite(s) && s > 0
                );
              if (holeScores.length === 0) continue;
              roundTeamScore += strategy({
                holeScores,
                holeIndex: hole,
                totalHoles,
              });
              countedPar += countedParForHole(
                strategy,
                hole,
                totalHoles,
                round.holeInfo?.[hole]?.par ?? 4
              );
            }
            roundTeamToPar = roundTeamScore - countedPar;
            break;
          }

          default:
            // Sum individual player scores
            teamPlayers.forEach((player) => {
              const playerScore = round.scores[player.id];
              if (playerScore && playerScore.totalScore > 0) {
                roundTeamScore += playerScore.totalScore;
                roundTeamToPar += playerScore.totalToPar;
                roundNetScore +=
                  playerScore.netScore || playerScore.totalScore;
                roundNetToPar +=
                  playerScore.netToPar || playerScore.totalToPar;
                roundHandicapStrokes += playerScore.handicapStrokes || 0;
                if (playerScore.handicapStrokes) roundHasHandicap = true;
              }
            });
            break;
        }
      }

      // Add this round's scores to team totals
      teamTotalScore += roundTeamScore;
      teamTotalToPar += roundTeamToPar;
      teamNetScore += roundNetScore;
      teamNetToPar += roundNetToPar;
      teamHandicapStrokes += roundHandicapStrokes;
      if (roundHasHandicap) hasHandicapApplied = true;
    });

    // Count players with scores across all rounds
    playersWithScores = teamPlayers.filter((player) =>
      tour.rounds.some((round) => {
        // Check traditional stroke play scores
        if (
          round.scores[player.id] &&
          round.scores[player.id].totalScore > 0
        ) {
          return true;
        }
        // Check Ryder Cup match play scores
        if (round.isMatchPlay) {
          return hasRyderCupScores(round, player.id);
        }
        return false;
      })
    ).length;

    teamEntries.push({
      team,
      totalScore: teamTotalScore,
      totalToPar: teamTotalToPar,
      netScore: hasHandicapApplied ? teamNetScore : undefined,
      netToPar: hasHandicapApplied ? teamNetToPar : undefined,
      totalHandicapStrokes: hasHandicapApplied
        ? teamHandicapStrokes
        : undefined,
      playersWithScores,
      totalPlayers: teamPlayers.length,
      position: 0,
    });
  });

  return sortAndPositionTeams(teamEntries);
};

/**
 * Helper function to sort teams and set positions
 */
export const sortAndPositionTeams = (
  teamEntries: TeamLeaderboardEntry[]
): TeamLeaderboardEntry[] => {
  // Sort by net score if handicaps are applied, otherwise by gross score
  teamEntries.sort((a, b) => {
    if (a.totalScore === 0 && b.totalScore === 0) return 0;
    if (a.totalScore === 0) return 1;
    if (b.totalScore === 0) return -1;

    const aScore = typeof a.netScore === "number" ? a.netScore : a.totalScore;
    const bScore = typeof b.netScore === "number" ? b.netScore : b.totalScore;
    return (
      (typeof aScore === "number" ? aScore : 0) -
      (typeof bScore === "number" ? bScore : 0)
    );
  });

  // Set positions
  teamEntries.forEach((entry, index) => {
    entry.position = index + 1;
  });

  return teamEntries;
};

/**
 * Calculate team leaderboard (single round or tournament-wide)
 */
export const calculateTeamLeaderboard = (
  tour: Tour,
  roundId?: string
): TeamLeaderboardEntry[] => {
  if (!tour.teams || tour.teams.length === 0) return [];

  // Single round leaderboard - use format-specific calculation
  if (roundId) {
    const round = tour.rounds.find((r) => r.id === roundId);
    if (!round) return [];

    // Route to format-specific calculation
    switch (round.format) {
      case "best-ball":
        return calculateBestBallRoundLeaderboard(tour, round);
      case "scramble":
        return calculateScrambleRoundLeaderboard(tour, round);
      case "best-worst-combined":
        return calculateAggregatedRoundLeaderboard(
          tour,
          round,
          bestPlusWorstStrategy
        );
      case "best-worst-alternating":
        return calculateAggregatedRoundLeaderboard(
          tour,
          round,
          alternatingBestWorstStrategy
        );
      case "six-six-six":
        return calculateAggregatedRoundLeaderboard(
          tour,
          round,
          sixSixSixStrategy
        );
      default:
        return calculateIndividualRoundLeaderboard(tour, round);
    }
  }

  // Tournament-wide leaderboard - combine all rounds with format awareness
  return calculateTournamentTeamLeaderboard(tour);
};

/**
 * Allocate handicap strokes per hole for a player based on total handicapStrokes and hole stroke index
 */
export const allocateHandicapStrokesPerHole = (
  round: Round,
  playerId: string
): number[] => {
  const playerScore = round.scores[playerId];
  const total = Math.max(0, playerScore?.handicapStrokes || 0);
  const holes = round.holeInfo || [];
  const n = holes.length || round.holes || 18;

  // Build stroke index list (1..n). If missing, fall back to [1..n].
  const idx = holes.map((h, i) =>
    h.handicap && h.handicap > 0 ? h.handicap : i + 1
  );
  // Map: hole order by stroke index difficulty (1 is hardest)
  const order = [...idx]
    .map((v, i) => ({ i, v }))
    .sort((a, b) => a.v - b.v)
    .map((o) => o.i);

  const base = Math.floor(total / n);
  const rem = total % n;
  const alloc = new Array(n).fill(base);

  // Distribute remaining strokes to the hardest holes
  for (let r = 0; r < rem; r++) {
    const holeIdx = order[r % n];
    alloc[holeIdx] += 1;
  }
  return alloc;
};

/**
 * Calculate Stableford points for a single player in a given round
 * Formula: points = clamp(0, 2 - (net - par)), capped at 6
 */
export const calculateStablefordForPlayer = (round: Round, playerId: string): number => {
  const playerScore = round.scores[playerId];
  if (!playerScore) return 0;

  // Check for manual override
  const manual = (playerScore as { stablefordManual?: number }).stablefordManual;
  if (typeof manual === "number" && Number.isFinite(manual)) return manual;

  const holes = round.holeInfo || [];
  const scores = playerScore.scores || [];
  const alloc = allocateHandicapStrokesPerHole(round, playerId);

  let total = 0;
  for (let i = 0; i < Math.min(scores.length, holes.length); i++) {
    const gross = scores[i] || 0;
    const par = holes[i]?.par || 4;
    if (!gross || gross <= 0) continue; // no score -> 0 points
    const net = gross - (alloc[i] || 0);
    const netToPar = net - par;
    let pts = 2 - netToPar;
    if (pts < 0) pts = 0;
    if (pts > 6) pts = 6;
    total += pts;
  }
  return total;
};

/**
 * Sum Stableford across all rounds in a tour for a player
 */
export const calculateTournamentStableford = (tour: Tour, playerId: string): number => {
  let total = 0;
  for (const r of tour.rounds) {
    if (!isRoundCompleted(r)) continue;
    total += calculateStablefordForPlayer(r, playerId);
  }
  return total;
};

/**
 * Calculate matches won by a player (includes 0.5 for halved matches)
 */
export const calculateMatchesWon = (tour: Tour, playerId: string): number => {
  let matchesWon = 0;

  for (const round of tour.rounds) {
    // Only count completed match play rounds
    if (!round.isMatchPlay || !round.ryderCup) continue;
    if (round.status !== "completed" && !round.completedAt) continue;

    for (const match of round.ryderCup.matches) {
      const isInTeamA = match.teamA?.playerIds?.includes(playerId);
      const isInTeamB = match.teamB?.playerIds?.includes(playerId);

      if (!isInTeamA && !isInTeamB) continue;

      // Only count completed matches
      const isComplete = (match as { isComplete?: boolean }).isComplete;
      if (!isComplete) continue;

      // Check if this player's team won
      const winner = (match as { winner?: string }).winner;
      if (winner === "team-a" && isInTeamA) {
        matchesWon += 1;
      } else if (winner === "team-b" && isInTeamB) {
        matchesWon += 1;
      } else if (winner === "halved") {
        // Halved matches count as 0.5 for each side
        matchesWon += 0.5;
      }
    }
  }

  return matchesWon;
};

/**
 * Get points for a given position from the distribution table.
 * Players beyond the last defined position get 0 points.
 * Tied players share the average of the points for their positions.
 */
const getPointsForPosition = (
  position: number,
  tiedCount: number,
  distribution: PointsDistributionEntry[]
): number => {
  // Sum up the points for all positions covered by the tied group
  let totalPoints = 0;
  for (let i = 0; i < tiedCount; i++) {
    const pos = position + i;
    const entry = distribution.find((d) => d.position === pos);
    totalPoints += entry?.points ?? 0;
  }
  // Each tied player gets an equal share
  return totalPoints / tiedCount;
};

/**
 * Calculate round placements for all players in a single round.
 * Returns an array of { playerId, position, tiedCount } sorted by position.
 */
const calculateRoundPlacements = (
  tour: Tour,
  round: Round
): Array<{ playerId: string; position: number; tiedCount: number }> => {
  // Build player scores for this round
  const playerScores: Array<{ playerId: string; score: number }> = [];

  for (const player of tour.players) {
    // Check for regular stroke play scores
    if (round.scores[player.id] && round.scores[player.id].totalScore > 0) {
      const ps = round.scores[player.id];
      // Use net score if handicaps enabled, otherwise gross
      const score = ps.netScore ?? ps.totalScore;
      playerScores.push({ playerId: player.id, score });
    }
    // Check for match play scores
    else if (round.isMatchPlay && hasRyderCupScores(round, player.id)) {
      const score = getPlayerScoreFromRyderCup(round, player.id);
      playerScores.push({ playerId: player.id, score });
    }
  }

  if (playerScores.length === 0) return [];

  // Check if this is a Stableford round
  const isStableford = round.format === "stroke-play" && round.settings.stablefordScoring;

  if (isStableford) {
    // For Stableford, higher is better - calculate Stableford points
    const stablefordScores = playerScores.map((ps) => ({
      playerId: ps.playerId,
      score: calculateStablefordForPlayer(round, ps.playerId),
    }));
    // Sort descending (higher is better)
    stablefordScores.sort((a, b) => b.score - a.score);

    return assignPositions(stablefordScores, false);
  }

  // For stroke play: lower is better
  playerScores.sort((a, b) => a.score - b.score);
  return assignPositions(playerScores, true);
};

/**
 * Assign positions to sorted scores, handling ties
 */
const assignPositions = (
  sortedScores: Array<{ playerId: string; score: number }>,
  lowerIsBetter: boolean
): Array<{ playerId: string; position: number; tiedCount: number }> => {
  const placements: Array<{ playerId: string; position: number; tiedCount: number }> = [];

  let i = 0;
  while (i < sortedScores.length) {
    // Find how many players are tied at this score
    let tiedCount = 1;
    while (
      i + tiedCount < sortedScores.length &&
      sortedScores[i + tiedCount].score === sortedScores[i].score
    ) {
      tiedCount++;
    }

    const position = i + 1;
    for (let j = 0; j < tiedCount; j++) {
      placements.push({
        playerId: sortedScores[i + j].playerId,
        position,
        tiedCount,
      });
    }

    i += tiedCount;
  }

  return placements;
};

/**
 * Calculate tournament points for all players across all completed rounds.
 * Uses the points distribution from the scoring config.
 */
export const calculateTournamentPoints = (
  tour: Tour,
  scoringConfig: ScoringConfig
): Map<string, number> => {
  const pointsMap = new Map<string, number>();

  // Initialize all players with 0 points
  for (const player of tour.players) {
    pointsMap.set(player.id, 0);
  }

  // Process each completed round
  for (const round of tour.rounds) {
    if (!isRoundCompleted(round)) continue;

    // Check if this is a team round
    const isTeamRound =
      round.format === "scramble" ||
      round.format === "best-ball" ||
      round.format === "alternate-shot" ||
      round.format === "best-worst-combined" ||
      round.format === "best-worst-alternating" ||
      round.format === "six-six-six";

    if (isTeamRound && tour.teams && tour.teams.length > 0 && scoringConfig.teamPointsEnabled) {
      // For team rounds, determine team placements and award points to each player on the team
      const teamPlacements = calculateTeamRoundPlacements(tour, round);
      for (const placement of teamPlacements) {
        const pts = getPointsForPosition(
          placement.position,
          placement.tiedCount,
          scoringConfig.pointsDistribution
        );
        // Award points to every player on the team
        const team = tour.teams.find((t) => t.id === placement.teamId);
        if (team) {
          for (const playerId of team.playerIds) {
            pointsMap.set(playerId, (pointsMap.get(playerId) || 0) + pts);
          }
        }
      }
    } else {
      // Individual round placements
      const placements = calculateRoundPlacements(tour, round);
      for (const placement of placements) {
        const pts = getPointsForPosition(
          placement.position,
          placement.tiedCount,
          scoringConfig.pointsDistribution
        );
        pointsMap.set(
          placement.playerId,
          (pointsMap.get(placement.playerId) || 0) + pts
        );
      }
    }
  }

  return pointsMap;
};

/**
 * Calculate team placements for a team round
 */
const calculateTeamRoundPlacements = (
  tour: Tour,
  round: Round
): Array<{ teamId: string; position: number; tiedCount: number }> => {
  if (!tour.teams) return [];

  const teamScores: Array<{ teamId: string; score: number }> = [];

  for (const team of tour.teams) {
    const teamPlayers = tour.players.filter((p) => p.teamId === team.id);

    if (round.format === "scramble") {
      const teamScoreKey = `team_${team.id}`;
      const ts = round.scores[teamScoreKey];
      if (ts && ts.totalScore > 0) {
        teamScores.push({ teamId: team.id, score: ts.totalScore });
      }
    } else if (round.format === "best-ball") {
      let totalBestBall = 0;
      const holesCount = round.holeInfo?.length || round.holes || 18;
      for (let h = 0; h < holesCount; h++) {
        const holeScores = teamPlayers
          .map((p) => round.scores[p.id]?.scores?.[h])
          .filter((s): s is number => typeof s === "number" && s > 0);
        if (holeScores.length > 0) {
          totalBestBall += Math.min(...holeScores);
        }
      }
      if (totalBestBall > 0) {
        teamScores.push({ teamId: team.id, score: totalBestBall });
      }
    } else if (
      round.format === "best-worst-combined" ||
      round.format === "best-worst-alternating" ||
      round.format === "six-six-six"
    ) {
      const totalHoles = round.holeInfo?.length || round.holes || 18;
      const strategy =
        round.format === "best-worst-combined"
          ? bestPlusWorstStrategy
          : round.format === "best-worst-alternating"
            ? alternatingBestWorstStrategy
            : sixSixSixStrategy;
      let total = 0;
      for (let h = 0; h < totalHoles; h++) {
        const holeScores = teamPlayers
          .map((p) => round.scores[p.id]?.scores?.[h])
          .filter((s): s is number => typeof s === "number" && s > 0);
        if (holeScores.length === 0) continue;
        total += strategy({ holeScores, holeIndex: h, totalHoles });
      }
      if (total > 0) {
        teamScores.push({ teamId: team.id, score: total });
      }
    } else {
      // Sum individual scores
      let teamTotal = 0;
      let hasScores = false;
      for (const player of teamPlayers) {
        if (round.scores[player.id]?.totalScore > 0) {
          teamTotal += round.scores[player.id].totalScore;
          hasScores = true;
        }
      }
      if (hasScores) {
        teamScores.push({ teamId: team.id, score: teamTotal });
      }
    }
  }

  // Lower is better for stroke play
  teamScores.sort((a, b) => a.score - b.score);

  const placements: Array<{ teamId: string; position: number; tiedCount: number }> = [];
  let i = 0;
  while (i < teamScores.length) {
    let tiedCount = 1;
    while (
      i + tiedCount < teamScores.length &&
      teamScores[i + tiedCount].score === teamScores[i].score
    ) {
      tiedCount++;
    }
    const position = i + 1;
    for (let j = 0; j < tiedCount; j++) {
      placements.push({ teamId: teamScores[i + j].teamId, position, tiedCount });
    }
    i += tiedCount;
  }

  return placements;
};

/**
 * Determine the winner of a round (for bonus strokes calculation)
 * Returns the player IDs of the winner(s) - could be multiple in case of a tie
 */
export const getRoundWinnerIds = (tour: Tour, round: Round): string[] => {
  if (!isRoundCompleted(round)) return [];
  const placements = calculateRoundPlacements(tour, round);
  return placements.filter((p) => p.position === 1).map((p) => p.playerId);
};
