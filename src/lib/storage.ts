import { nanoid } from "nanoid";
import {
  MatchPlayRound,
  MatchPlayHole,
  MatchResult,
  HoleResult,
  MatchStatusInfo,
  Tour,
  Round,
  Player,
  Team,
  TeamLeaderboardEntry,
  HoleInfo,
} from "../types";

const STORAGE_KEYS = {
  TOURS: "golf-tours",
  ACTIVE_TOUR: "active-tour-id",
} as const;

export const matchPlayUtils = {
  // Calculate match status (1-up, 2-down, All Square, etc.)
  calculateMatchStatus: (
    holes: MatchPlayHole[],
    totalHoles: number
  ): MatchStatusInfo => {
    let teamAWins = 0;
    let teamBWins = 0;
    let holesPlayed = 0;

    // Count wins for each team
    holes.forEach((hole) => {
      if (hole.teamAScore > 0 && hole.teamBScore > 0) {
        holesPlayed++;
        if (hole.result === "team-a") teamAWins++;
        else if (hole.result === "team-b") teamBWins++;
        // ties don't count toward wins
      }
    });

    const holesRemaining = totalHoles - holesPlayed;
    const lead = Math.abs(teamAWins - teamBWins);
    const leadingTeam =
      teamAWins > teamBWins
        ? "team-a"
        : teamBWins > teamAWins
        ? "team-b"
        : "tied";

    // Determine if match can still be won
    const maxPossibleCatchUp = holesRemaining;
    const canTrailingTeamWin = lead <= maxPossibleCatchUp;

    // Check if match is completed (someone won or tie impossible)
    const isCompleted = !canTrailingTeamWin || holesRemaining === 0;

    // Generate status string
    let status: string;
    let result: MatchResult | undefined;

    if (isCompleted) {
      if (teamAWins > teamBWins) {
        result = "team-a";
        const margin = lead > 1 ? ` ${lead}&${holesRemaining}` : "";
        status = `Team A Wins${margin}`;
      } else if (teamBWins > teamAWins) {
        result = "team-b";
        const margin = lead > 1 ? ` ${lead}&${holesRemaining}` : "";
        status = `Team B Wins${margin}`;
      } else {
        result = "tie";
        status = "Match Tied";
      }
    } else {
      // Match ongoing
      if (leadingTeam === "tied") {
        status = "All Square";
      } else if (lead === holesRemaining) {
        status = "Dormie"; // leading by exactly holes remaining
      } else {
        const teamLabel = leadingTeam === "team-a" ? "Team A" : "Team B";
        status = `${teamLabel} ${lead}-up`;
      }
    }

    return {
      holesRemaining,
      leadingTeam,
      lead,
      status,
      canWin: canTrailingTeamWin,
      isCompleted,
      result,
    };
  },

  // Determine hole result based on scores
  calculateHoleResult: (teamAScore: number, teamBScore: number): HoleResult => {
    if (teamAScore === 0 || teamBScore === 0) return "tie"; // no score yet
    if (teamAScore < teamBScore) return "team-a";
    if (teamBScore < teamAScore) return "team-b";
    return "tie";
  },

  // Calculate points awarded (1 for win, 0.5 for tie, 0 for loss)
  calculateMatchPoints: (result: MatchResult) => {
    switch (result) {
      case "team-a":
        return { teamA: 1, teamB: 0 };
      case "team-b":
        return { teamA: 0, teamB: 1 };
      case "tie":
        return { teamA: 0.5, teamB: 0.5 };
      default:
        return { teamA: 0, teamB: 0 };
    }
  },
};

// Helper function to calculate strokes for a specific hole using proper golf handicap system
const calculateStrokesForHole = (
  playerHandicap: number,
  holeHandicap: number
): number => {
  if (!playerHandicap || !holeHandicap) return 0;

  // Calculate base strokes (how many full rounds of 18 holes)
  const baseStrokes = Math.floor(playerHandicap / 18);

  // Calculate remaining handicap strokes to distribute
  const remainingStrokes = playerHandicap % 18;

  // Player gets base strokes on every hole, plus 1 extra stroke
  // if this hole's handicap <= remaining strokes
  return baseStrokes + (holeHandicap <= remainingStrokes ? 1 : 0);
};

const calculateHandicapStrokes = (
  player: Player,
  round: Round,
  isHoleByHole: boolean = true
): number => {
  if (!round.settings.strokesGiven || !player.handicap) return 0;

  if (isHoleByHole) {
    // Calculate hole-by-hole strokes using proper golf handicap system
    let totalStrokes = 0;
    round.holeInfo.forEach((hole) => {
      if (hole.handicap && player.handicap !== undefined) {
        totalStrokes += calculateStrokesForHole(player.handicap, hole.handicap);
      }
    });
    return totalStrokes;
  } else {
    // For total score entry, use full handicap
    return player.handicap;
  }
};

export const storage = {
  // Export the helper function for use in components
  calculateStrokesForHole,

  // Tours
  getTours: (): Tour[] => {
    const tours = localStorage.getItem(STORAGE_KEYS.TOURS);
    return tours ? JSON.parse(tours) : [];
  },

  getTour: (id: string): Tour | null => {
    const tours = storage.getTours();
    return tours.find((tour) => tour.id === id) || null;
  },

  saveTour: (tour: Tour): void => {
    const tours = storage.getTours();
    const existingIndex = tours.findIndex((t) => t.id === tour.id);

    if (existingIndex >= 0) {
      tours[existingIndex] = tour;
    } else {
      tours.push(tour);
    }

    localStorage.setItem(STORAGE_KEYS.TOURS, JSON.stringify(tours));
  },

  deleteTour: (id: string): void => {
    const tours = storage.getTours().filter((tour) => tour.id !== id);
    localStorage.setItem(STORAGE_KEYS.TOURS, JSON.stringify(tours));
  },

  // Rounds
  saveRound: (tourId: string, round: Round): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    const existingRoundIndex = tour.rounds.findIndex((r) => r.id === round.id);
    if (existingRoundIndex >= 0) {
      tour.rounds[existingRoundIndex] = round;
    } else {
      tour.rounds.push(round);
    }

    // Keep totals in sync on any hole change
    if (round.ryderCup) {
      const totals = round.ryderCup.matches.reduce(
        (acc, m) => {
          acc.teamA += m.points?.teamA || 0;
          acc.teamB += m.points?.teamB || 0;
          return acc;
        },
        { teamA: 0, teamB: 0 }
      );
      round.ryderCup.teamAPoints = totals.teamA;
      round.ryderCup.teamBPoints = totals.teamB;
    }
    storage.saveTour(tour);
  },

  getTotalPar: (round: Round): number => {
    return (
      round.totalPar || round.holeInfo.reduce((sum, hole) => sum + hole.par, 0)
    );
  },

  // Players
  addPlayerToTour: (tourId: string, player: Player): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    tour.players.push(player);
    storage.saveTour(tour);
  },

  updatePlayerScore: (
    tourId: string,
    roundId: string,
    playerId: string,
    scores: number[]
  ): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    const round = tour.rounds.find((r) => r.id === roundId);
    const player = tour.players.find((p) => p.id === playerId);
    if (!round || !player) return;

    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const totalPar = storage.getTotalPar(round);
    const totalToPar = totalScore - totalPar;

    // Calculate handicap strokes properly - hole by hole using golf handicap system
    let handicapStrokes = 0;
    if (round.settings.strokesGiven && player.handicap) {
      round.holeInfo.forEach((hole) => {
        if (hole.handicap && player.handicap !== undefined) {
          handicapStrokes += calculateStrokesForHole(
            player.handicap,
            hole.handicap
          );
        }
      });
    }

    // Calculate net scores
    const netScore =
      handicapStrokes > 0 ? totalScore - handicapStrokes : undefined;
    const netToPar = netScore ? netScore - totalPar : undefined;

    round.scores[playerId] = {
      playerId,
      scores,
      totalScore,
      totalToPar,
      handicapStrokes: handicapStrokes > 0 ? handicapStrokes : undefined,
      netScore,
      netToPar,
    };

    storage.saveTour(tour);
  },

  // Remove player from tour
  removePlayerFromTour: (tourId: string, playerId: string): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    tour.players = tour.players.filter((p) => p.id !== playerId);

    // Also remove from any teams
    if (tour.teams) {
      tour.teams.forEach((team) => {
        team.playerIds = team.playerIds.filter((pid) => pid !== playerId);
      });
    }

    storage.saveTour(tour);
  },

  // Update player in tour
  updatePlayerInTour: (tourId: string, updatedPlayer: Player): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    const playerIndex = tour.players.findIndex(
      (p) => p.id === updatedPlayer.id
    );
    if (playerIndex >= 0) {
      tour.players[playerIndex] = updatedPlayer;
    }

    storage.saveTour(tour);
  },

  // Teams
  addTeamToTour: (tourId: string, team: Team): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    if (!tour.teams) tour.teams = [];
    tour.teams.push(team);
    storage.saveTour(tour);
  },

  updateTeamInTour: (tourId: string, updatedTeam: Team): void => {
    const tour = storage.getTour(tourId);
    if (!tour || !tour.teams) return;

    const teamIndex = tour.teams.findIndex((t) => t.id === updatedTeam.id);
    if (teamIndex >= 0) {
      tour.teams[teamIndex] = updatedTeam;
    }
    storage.saveTour(tour);
  },

  removeTeamFromTour: (tourId: string, teamId: string): void => {
    const tour = storage.getTour(tourId);
    if (!tour || !tour.teams) return;

    // Remove team
    tour.teams = tour.teams.filter((t) => t.id !== teamId);

    // Remove team assignment from all players
    tour.players.forEach((player) => {
      if (player.teamId === teamId) {
        player.teamId = undefined;
      }
    });

    storage.saveTour(tour);
  },

  assignPlayerToTeam: (
    tourId: string,
    playerId: string,
    teamId: string
  ): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    // Update player's team assignment
    const player = tour.players.find((p) => p.id === playerId);
    if (player) {
      // Remove from old team first
      if (player.teamId && tour.teams) {
        const oldTeam = tour.teams.find((t) => t.id === player.teamId);
        if (oldTeam) {
          oldTeam.playerIds = oldTeam.playerIds.filter(
            (pid) => pid !== playerId
          );
        }
      }

      // Assign to new team
      player.teamId = teamId;
      if (tour.teams) {
        const newTeam = tour.teams.find((t) => t.id === teamId);
        if (newTeam && !newTeam.playerIds.includes(playerId)) {
          newTeam.playerIds.push(playerId);
        }
      }
    }

    storage.saveTour(tour);
  },

  removePlayerFromTeam: (tourId: string, playerId: string): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    const player = tour.players.find((p) => p.id === playerId);
    if (player && player.teamId && tour.teams) {
      const team = tour.teams.find((t) => t.id === player.teamId);
      if (team) {
        team.playerIds = team.playerIds.filter((pid) => pid !== playerId);
        // If this was the captain, clear captain
        if (team.captainId === playerId) {
          team.captainId = "";
        }
      }
      player.teamId = undefined;
    }

    storage.saveTour(tour);
  },

  setTeamCaptain: (tourId: string, teamId: string, captainId: string): void => {
    const tour = storage.getTour(tourId);
    if (!tour || !tour.teams) return;

    const team = tour.teams.find((t) => t.id === teamId);
    if (team) {
      team.captainId = captainId;
      // Make sure captain is on the team
      if (!team.playerIds.includes(captainId)) {
        team.playerIds.push(captainId);
        // Update player's team assignment
        const player = tour.players.find((p) => p.id === captainId);
        if (player) {
          player.teamId = teamId;
        }
      }
    }

    storage.saveTour(tour);
  },

  // Delete round
  deleteRound: (tourId: string, roundId: string): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    tour.rounds = tour.rounds.filter((r) => r.id !== roundId);
    storage.saveTour(tour);
  },

  // Generate default hole info
  generateDefaultHoles: (numHoles: number): HoleInfo[] => {
    const holes: HoleInfo[] = [];
    const standardPars = [4, 4, 3, 4, 5, 4, 3, 4, 4, 4, 4, 3, 5, 4, 3, 4, 4, 5]; // Standard 18-hole layout

    // Proper handicap ratings based on hole difficulty (1 = hardest, 18 = easiest)
    // These represent typical difficulty ordering for a golf course
    const standardHandicaps = [
      10, 8, 16, 2, 14, 4, 18, 12, 6, 11, 5, 17, 1, 9, 15, 3, 13, 7,
    ];

    for (let i = 1; i <= numHoles; i++) {
      holes.push({
        number: i,
        par:
          numHoles === 9
            ? i % 6 === 0
              ? 3
              : i % 5 === 0
              ? 5
              : 4
            : standardPars[i - 1] || 4,
        yardage: undefined,
        handicap:
          numHoles === 9
            ? ((i - 1) % 9) + 1 // For 9 holes: 1-9 in order
            : standardHandicaps[i - 1] || i, // Use proper difficulty-based handicaps for 18 holes
      });
    }

    return holes;
  },

  // Check if round uses team scoring (scramble format)
  isTeamScoringFormat: (round: Round): boolean => {
    return (
      round.format === "scramble" ||
      (round.format === "best-ball" &&
        round.settings.teamScoring === "scramble")
    );
  },

  // Get team score for a round
  getTeamScore: (tour: Tour, roundId: string, teamId: string) => {
    const round = tour.rounds.find((r) => r.id === roundId);
    if (!round) return null;

    const teamScoreKey = `team_${teamId}`;
    return round.scores[teamScoreKey] || null;
  },

  // Team scoring for scramble format
  updateTeamScore: (
    tourId: string,
    roundId: string,
    teamId: string,
    scores: number[]
  ): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    const round = tour.rounds.find((r) => r.id === roundId);
    if (!round) return;

    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const totalPar = storage.getTotalPar(round);
    const totalToPar = totalScore - totalPar;

    // For scramble, we store the team score under a special key
    const teamScoreKey = `team_${teamId}`;

    round.scores[teamScoreKey] = {
      playerId: teamScoreKey,
      scores,
      totalScore,
      totalToPar,
      isTeamScore: true,
      teamId,
    };

    storage.saveTour(tour);
  },

  // Update team total score directly (for scramble completed rounds)
  updateTeamTotalScore: (
    tourId: string,
    roundId: string,
    teamId: string,
    totalScore: number
  ): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    const round = tour.rounds.find((r) => r.id === roundId);
    if (!round) return;

    const totalPar = storage.getTotalPar(round);
    const totalToPar = totalScore - totalPar;

    // Create distributed score array for team
    const averageScore = totalScore / round.holes;
    const scores = new Array(round.holes).fill(Math.round(averageScore));

    // Adjust the scores to match the exact total
    let currentTotal = scores.reduce((sum, score) => sum + score, 0);
    let difference = totalScore - currentTotal;

    let holeIndex = 0;
    while (difference !== 0 && holeIndex < round.holes) {
      if (difference > 0) {
        scores[holeIndex]++;
        difference--;
      } else if (difference < 0 && scores[holeIndex] > 1) {
        scores[holeIndex]--;
        difference++;
      }
      holeIndex = (holeIndex + 1) % round.holes;
    }

    const teamScoreKey = `team_${teamId}`;
    round.scores[teamScoreKey] = {
      playerId: teamScoreKey,
      scores,
      totalScore,
      totalToPar,
      isTeamScore: true,
      teamId,
    };

    storage.saveTour(tour);
  },

  // Start round
  startRound: (tourId: string, roundId: string): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    const round = tour.rounds.find((r) => r.id === roundId);
    if (round && round.status === "created") {
      round.status = "in-progress";
      round.startedAt = new Date().toISOString();

      // Check if this is a team scoring format (scramble)
      const isTeamScoring = storage.isTeamScoringFormat(round);

      if (isTeamScoring && tour.teams) {
        // Initialize empty scores for all teams
        tour.teams.forEach((team) => {
          const teamScoreKey = `team_${team.id}`;
          if (!round.scores[teamScoreKey]) {
            round.scores[teamScoreKey] = {
              playerId: teamScoreKey,
              scores: new Array(round.holes).fill(0),
              totalScore: 0,
              totalToPar: 0,
              isTeamScore: true,
              teamId: team.id,
            };
          }
        });
      } else {
        // Initialize empty scores for all players (individual format)
        tour.players.forEach((player) => {
          if (!round.scores[player.id]) {
            round.scores[player.id] = {
              playerId: player.id,
              scores: new Array(round.holes).fill(0),
              totalScore: 0,
              totalToPar: 0,
            };
          }
        });
      }
    }

    storage.saveTour(tour);
  },

  // Complete round
  completeRound: (tourId: string, roundId: string): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    const round = tour.rounds.find((r) => r.id === roundId);
    if (round && round.status === "in-progress") {
      round.status = "completed";
      round.completedAt = new Date().toISOString();
    }

    storage.saveTour(tour);
  },

  // Update player total score directly (for completed rounds)
  updatePlayerTotalScore: (
    tourId: string,
    roundId: string,
    playerId: string,
    totalScore: number
  ): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    const round = tour.rounds.find((r) => r.id === roundId);
    const player = tour.players.find((p) => p.id === playerId);
    if (!round || !player) return;

    const totalPar = storage.getTotalPar(round);
    const totalToPar = totalScore - totalPar;

    // Calculate handicap strokes
    const handicapStrokes = calculateHandicapStrokes(player, round);
    const netScore =
      handicapStrokes > 0 ? totalScore - handicapStrokes : undefined;
    const netToPar = netScore ? netScore - totalPar : undefined;

    // Create a distributed score array
    const averageScore = totalScore / round.holes;
    const scores = new Array(round.holes).fill(Math.round(averageScore));

    // Adjust the scores to match the exact total
    let currentTotal = scores.reduce((sum, score) => sum + score, 0);
    let difference = totalScore - currentTotal;

    let holeIndex = 0;
    while (difference !== 0 && holeIndex < round.holes) {
      if (difference > 0) {
        scores[holeIndex]++;
        difference--;
      } else if (difference < 0 && scores[holeIndex] > 1) {
        scores[holeIndex]--;
        difference++;
      }
      holeIndex = (holeIndex + 1) % round.holes;
    }

    round.scores[playerId] = {
      playerId,
      scores,
      totalScore,
      totalToPar,
      handicapStrokes,
      netScore,
      netToPar,
    };

    storage.saveTour(tour);
  },

  updatePlayerTotalScoreWithHandicap: (
    tourId: string,
    roundId: string,
    playerId: string,
    totalScore: number,
    manualHandicapStrokes?: number
  ): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    const round = tour.rounds.find((r) => r.id === roundId);
    const player = tour.players.find((p) => p.id === playerId);
    if (!round || !player) return;

    const totalPar = storage.getTotalPar(round);
    const totalToPar = totalScore - totalPar;

    // Use manual handicap strokes if provided, otherwise calculate
    let handicapStrokes = 0;
    if (round.settings.strokesGiven) {
      if (manualHandicapStrokes !== undefined) {
        handicapStrokes = manualHandicapStrokes;
      } else if (player.handicap) {
        // Calculate hole-by-hole strokes as fallback using proper golf handicap system
        round.holeInfo.forEach((hole) => {
          if (hole.handicap && player.handicap !== undefined) {
            handicapStrokes += calculateStrokesForHole(
              player.handicap,
              hole.handicap
            );
          }
        });
      }
    }

    // Calculate net scores
    const netScore =
      handicapStrokes > 0 ? totalScore - handicapStrokes : undefined;
    const netToPar = netScore ? netScore - totalPar : undefined;

    // Create distributed score array
    const averageScore = totalScore / round.holes;
    const scores = new Array(round.holes).fill(Math.round(averageScore));

    // Adjust the scores to match the exact total
    let currentTotal = scores.reduce((sum, score) => sum + score, 0);
    let difference = totalScore - currentTotal;

    let holeIndex = 0;
    while (difference !== 0 && holeIndex < round.holes) {
      if (difference > 0) {
        scores[holeIndex]++;
        difference--;
      } else if (difference < 0 && scores[holeIndex] > 1) {
        scores[holeIndex]--;
        difference++;
      }
      holeIndex = (holeIndex + 1) % round.holes;
    }

    round.scores[playerId] = {
      playerId,
      scores,
      totalScore,
      totalToPar,
      handicapStrokes: handicapStrokes > 0 ? handicapStrokes : undefined,
      netScore,
      netToPar,
    };

    storage.saveTour(tour);
  },

  calculateBestBallRoundLeaderboard: (
    tour: Tour,
    round: Round
  ): TeamLeaderboardEntry[] => {
    const teamEntries: TeamLeaderboardEntry[] = [];

    tour.teams!.forEach((team) => {
      const teamPlayers = tour.players.filter((p) => p.teamId === team.id);
      let teamTotalScore = 0;
      let playersWithScores = 0;

      // Calculate best ball team score for this round
      for (let hole = 0; hole < round.holes; hole++) {
        const holeScores = teamPlayers
          .map((player) => round.scores[player.id]?.scores[hole] || 0)
          .filter((score) => score > 0);

        if (holeScores.length > 0) {
          const bestScore = Math.min(...holeScores);
          teamTotalScore += bestScore;
        }
      }

      // Count players with any scores in this round
      playersWithScores = teamPlayers.filter((player) => {
        const playerScore = round.scores[player.id];
        return playerScore && playerScore.scores.some((score) => score > 0);
      }).length;

      const totalPar = storage.getTotalPar(round);
      const teamTotalToPar = teamTotalScore - totalPar;

      teamEntries.push({
        team,
        totalScore: teamTotalScore,
        totalToPar: teamTotalToPar,
        netScore: undefined, // Best ball typically doesn't use net scoring at team level
        netToPar: undefined,
        totalHandicapStrokes: undefined,
        playersWithScores,
        totalPlayers: teamPlayers.length,
        position: 0,
      });
    });

    // Sort and set positions
    return storage.sortAndPositionTeams(teamEntries);
  },

  // Scramble single round team leaderboard (extract existing scramble logic)
  calculateScrambleRoundLeaderboard: (
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

    // Sort and set positions
    return storage.sortAndPositionTeams(teamEntries);
  },

  // Individual-based team leaderboard (sum of individual player scores)
  calculateIndividualRoundLeaderboard: (
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

    // Sort and set positions
    return storage.sortAndPositionTeams(teamEntries);
  },

  // Tournament-wide team leaderboard combining all rounds
  calculateTournamentTeamLeaderboard: (tour: Tour): TeamLeaderboardEntry[] => {
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
      tour.rounds.forEach((round) => {
        let roundTeamScore = 0;
        let roundTeamToPar = 0;
        let roundNetScore = 0;
        let roundNetToPar = 0;
        let roundHandicapStrokes = 0;
        let roundHasHandicap = false;

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
            roundTeamToPar = roundTeamScore - storage.getTotalPar(round);
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
                roundNetScore += playerScore.netScore || playerScore.totalScore;
                roundNetToPar += playerScore.netToPar || playerScore.totalToPar;
                roundHandicapStrokes += playerScore.handicapStrokes || 0;
                if (playerScore.handicapStrokes) roundHasHandicap = true;
              }
            });
            break;
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
        tour.rounds.some(
          (round) =>
            round.scores[player.id] && round.scores[player.id].totalScore > 0
        )
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

    // Sort and set positions
    return storage.sortAndPositionTeams(teamEntries);
  },

  // Helper function to sort teams and set positions
  sortAndPositionTeams: (
    teamEntries: TeamLeaderboardEntry[]
  ): TeamLeaderboardEntry[] => {
    // Sort by net score if handicaps are applied, otherwise by gross score
    teamEntries.sort((a, b) => {
      if (a.totalScore === 0 && b.totalScore === 0) return 0;
      if (a.totalScore === 0) return 1;
      if (b.totalScore === 0) return -1;

      const aScore = a.netScore || a.totalScore;
      const bScore = b.netScore || b.totalScore;
      return aScore - bScore;
    });

    // Set positions
    teamEntries.forEach((entry, index) => {
      entry.position = index + 1;
    });

    return teamEntries;
  },

  // Calculate team leaderboard
  calculateTeamLeaderboard: (
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
          return storage.calculateBestBallRoundLeaderboard(tour, round);
        case "scramble":
          return storage.calculateScrambleRoundLeaderboard(tour, round);
        default:
          return storage.calculateIndividualRoundLeaderboard(tour, round);
      }
    }

    // Tournament-wide leaderboard - combine all rounds with format awareness
    return storage.calculateTournamentTeamLeaderboard(tour);
  },

  // Create a new match play round
  createMatchPlayRound: (
    tourId: string,
    roundId: string,
    matchData: {
      format: "singles" | "foursomes" | "four-ball";
      teamA: { id: string; playerIds: string[] };
      teamB: { id: string; playerIds: string[] };
    }
  ): MatchPlayRound => {
    const tour = storage.getTour(tourId);
    const round = tour?.rounds.find((r) => r.id === roundId);
    if (!tour || !round) throw new Error("Tour or round not found");

    const matchId = nanoid();
    const match: MatchPlayRound = {
      id: matchId,
      roundId,
      format: matchData.format,
      teamA: matchData.teamA,
      teamB: matchData.teamB,
      holes: [],
      status: "in-progress",
      result: "ongoing",
      points: { teamA: 0, teamB: 0 },
    };

    // Initialize Ryder Cup data if not exists
    if (!round.ryderCup) {
      round.ryderCup = {
        teamAPoints: 0,
        teamBPoints: 0,
        targetPoints: 14.5,
        matches: [],
        sessions: {
          day1Foursomes: [],
          day1FourBall: [],
          day2Foursomes: [],
          day2FourBall: [],
          day3Singles: [],
        },
      };
    }

    round.ryderCup.matches.push(match);
    storage.saveTour(tour);
    return match;
  },

  // Update match play hole score
  updateMatchPlayHole: (
    tourId: string,
    roundId: string,
    matchId: string,
    holeNumber: number,
    teamAScore: number,
    teamBScore: number
  ): void => {
    const tour = storage.getTour(tourId);
    const round = tour?.rounds.find((r) => r.id === roundId);
    const match = round?.ryderCup?.matches.find((m) => m.id === matchId);

    if (!tour || !round || !match) return;

    // Find or create hole
    let hole = match.holes.find((h) => h.holeNumber === holeNumber);
    if (!hole) {
      hole = {
        holeNumber,
        teamAScore: 0,
        teamBScore: 0,
        result: "tie",
        matchStatus: "",
      };
      match.holes.push(hole);
    }

    // Update hole scores
    hole.teamAScore = teamAScore;
    hole.teamBScore = teamBScore;
    hole.result = matchPlayUtils.calculateHoleResult(teamAScore, teamBScore);

    // Recalculate match status
    const statusInfo = matchPlayUtils.calculateMatchStatus(
      match.holes,
      round.holes
    );
    hole.matchStatus = statusInfo.status;

    // Update match if completed
    if (statusInfo.isCompleted && statusInfo.result) {
      match.status = "completed";
      match.result = statusInfo.result;
      match.points = matchPlayUtils.calculateMatchPoints(statusInfo.result);
      match.completedAt = new Date().toISOString();

      // Update tournament points
      if (round.ryderCup) {
        // Recompute totals from all matches to avoid double counting
        const totals = round.ryderCup.matches.reduce(
          (acc, m) => {
            acc.teamA += m.points?.teamA || 0;
            acc.teamB += m.points?.teamB || 0;
            return acc;
          },
          { teamA: 0, teamB: 0 }
        );
        round.ryderCup.teamAPoints = totals.teamA;
        round.ryderCup.teamBPoints = totals.teamB;
      }
    }

    storage.saveTour(tour);
  },

  // Get match play leaderboard (team points)
  getMatchPlayLeaderboard: (tourId: string, roundId?: string) => {
    const tour = storage.getTour(tourId);
    if (!tour) return { teamA: 0, teamB: 0, matches: [] };

    let totalTeamAPoints = 0;
    let totalTeamBPoints = 0;
    let allMatches: MatchPlayRound[] = [];

    if (roundId) {
      // Single round
      const round = tour.rounds.find((r) => r.id === roundId);
      if (round?.ryderCup) {
        allMatches = round.ryderCup.matches;
        const totals = allMatches.reduce(
          (acc, m) => {
            acc.teamA += m.points?.teamA || 0;
            acc.teamB += m.points?.teamB || 0;
            return acc;
          },
          { teamA: 0, teamB: 0 }
        );
        totalTeamAPoints = totals.teamA;
        totalTeamBPoints = totals.teamB;
      }
    } else {
      // All rounds
      tour.rounds.forEach((round) => {
        if (round.ryderCup) {
          totalTeamAPoints += round.ryderCup.teamAPoints;
          totalTeamBPoints += round.ryderCup.teamBPoints;
          allMatches.push(...round.ryderCup.matches);
        }
      });
    }

    return {
      teamA: totalTeamAPoints,
      teamB: totalTeamBPoints,
      matches: allMatches,
      target: allMatches.length > 0 ? allMatches.length / 2 + 0.5 : 0.5,
      winner:
        totalTeamAPoints >= allMatches.length / 2 + 0.5
          ? "team-a"
          : totalTeamBPoints >= allMatches.length / 2 + 0.5
          ? "team-b"
          : undefined,
    };
  },

  addRyderCupSession: (
    tourId: string,
    roundId: string,
    sessionType:
      | "day1-foursomes"
      | "day1-four-ball"
      | "day2-foursomes"
      | "day2-four-ball"
      | "day3-singles",
    matchIds: string[]
  ) => {
    const tour = storage.getTour(tourId);
    if (!tour) return;
    const round = tour.rounds.find((r) => r.id === roundId);
    if (!round || !round.ryderCup) return;

    const s = round.ryderCup.sessions;
    const pushAll = (arr: string[]) => arr.push(...matchIds);

    switch (sessionType) {
      case "day1-foursomes":
        pushAll(s.day1Foursomes);
        break;
      case "day1-four-ball":
        pushAll(s.day1FourBall);
        break;
      case "day2-foursomes":
        pushAll(s.day2Foursomes);
        break;
      case "day2-four-ball":
        pushAll(s.day2FourBall);
        break;
      case "day3-singles":
        pushAll(s.day3Singles);
        break;
    }

    storage.saveTour(tour);
  },
};
