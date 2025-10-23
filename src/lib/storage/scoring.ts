import { Tour, Round, TeamLeaderboardEntry } from "../../types";
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
