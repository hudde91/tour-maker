import {
  Team,
  Tour,
  Round,
  Player,
  HoleInfo,
  LeaderboardEntry,
  TeamLeaderboardEntry,
} from "../types";

const STORAGE_KEYS = {
  TOURS: "golf-tours",
  ACTIVE_TOUR: "active-tour-id",
} as const;

const calculateHandicapStrokes = (
  player: Player,
  round: Round,
  isHoleByHole: boolean = true
): number => {
  if (!round.settings.strokesGiven || !player.handicap) return 0;

  if (isHoleByHole) {
    // Calculate hole-by-hole strokes (like in ScoreEntryCard.tsx)
    let totalStrokes = 0;
    round.holeInfo.forEach((hole) => {
      if (
        hole.handicap &&
        player.handicap !== undefined &&
        hole.handicap <= player.handicap
      ) {
        totalStrokes++;
      }
    });
    return totalStrokes;
  } else {
    // For total score entry, use full handicap (like in TotalScoreCard.tsx)
    return player.handicap;
  }
};

export const storage = {
  recalculateAllScoresWithHandicaps: (tourId: string): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    tour.rounds.forEach((round) => {
      Object.entries(round.scores).forEach(([playerId, playerScore]) => {
        const player = tour.players.find((p) => p.id === playerId);
        if (player && playerScore.scores) {
          // Recalculate this player's score
          storage.updatePlayerScore(
            tourId,
            round.id,
            playerId,
            playerScore.scores
          );
        }
      });
    });
  },
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

  // Active tour
  setActiveTour: (id: string): void => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TOUR, id);
  },

  getActiveTour: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TOUR);
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

    // Calculate handicap strokes properly - hole by hole
    let handicapStrokes = 0;
    if (round.settings.strokesGiven && player.handicap) {
      round.holeInfo.forEach((hole) => {
        if (
          hole.handicap &&
          player.handicap !== undefined &&
          hole.handicap <= player.handicap
        ) {
          handicapStrokes++;
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
        handicap: i,
      });
    }

    return holes;
  },
  // Start round
  startRound: (tourId: string, roundId: string): void => {
    const tour = storage.getTour(tourId);
    if (!tour) return;

    const round = tour.rounds.find((r) => r.id === roundId);
    if (round && round.status === "created") {
      round.status = "in-progress";
      round.startedAt = new Date().toISOString();

      // Initialize empty scores for all players
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

  // Calculate leaderboard
  calculateLeaderboard: (tour: Tour, roundId?: string): LeaderboardEntry[] => {
    const entries: LeaderboardEntry[] = [];

    tour.players.forEach((player) => {
      let totalScore = 0;
      let totalToPar = 0;
      let totalHandicapStrokes = 0;
      let totalNetScore = 0;
      let totalNetToPar = 0;
      let roundsPlayed = 0;
      let hasHandicapApplied = false;

      if (roundId) {
        // Single round leaderboard
        const round = tour.rounds.find((r) => r.id === roundId);
        if (round && round.scores[player.id]) {
          const playerScore = round.scores[player.id];
          totalScore = playerScore.totalScore;
          totalToPar = playerScore.totalToPar;
          totalHandicapStrokes = playerScore.handicapStrokes || 0;
          totalNetScore = playerScore.netScore || 0;
          totalNetToPar = playerScore.netToPar || 0;
          hasHandicapApplied = !!playerScore.handicapStrokes;
          roundsPlayed = playerScore.scores.some((s) => s > 0) ? 1 : 0;
        }
      } else {
        // Tournament leaderboard (all rounds)
        tour.rounds.forEach((round) => {
          if (round.scores[player.id]) {
            const playerScore = round.scores[player.id];
            totalScore += playerScore.totalScore;
            totalToPar += playerScore.totalToPar;
            totalHandicapStrokes += playerScore.handicapStrokes || 0;
            totalNetScore += playerScore.netScore || playerScore.totalScore;
            totalNetToPar += playerScore.netToPar || playerScore.totalToPar;
            if (playerScore.handicapStrokes) hasHandicapApplied = true;
            if (playerScore.scores.some((s) => s > 0)) roundsPlayed++;
          }
        });
      }

      entries.push({
        player,
        totalScore,
        totalToPar,
        netScore: hasHandicapApplied ? totalNetScore : undefined,
        netToPar: hasHandicapApplied ? totalNetToPar : undefined,
        handicapStrokes: hasHandicapApplied ? totalHandicapStrokes : undefined,
        roundsPlayed,
        position: 0, // Will be set after sorting
      });
    });

    // Sort by net score if handicaps are applied, otherwise by gross score
    entries.sort((a, b) => {
      if (a.totalScore === 0 && b.totalScore === 0) return 0;
      if (a.totalScore === 0) return 1;
      if (b.totalScore === 0) return -1;

      // Use net score for sorting if handicaps are applied
      const aScore = a.netScore || a.totalScore;
      const bScore = b.netScore || b.totalScore;
      return aScore - bScore;
    });

    // Set positions
    entries.forEach((entry, index) => {
      entry.position = index + 1;
    });

    return entries;
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
        // Calculate hole-by-hole strokes as fallback
        round.holeInfo.forEach((hole) => {
          if (
            hole.handicap &&
            player.handicap !== undefined &&
            hole.handicap <= player.handicap
          ) {
            handicapStrokes++;
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

  // Calculate team leaderboard
  calculateTeamLeaderboard: (
    tour: Tour,
    roundId?: string
  ): TeamLeaderboardEntry[] => {
    if (!tour.teams || tour.teams.length === 0) return [];

    const teamEntries: TeamLeaderboardEntry[] = [];

    tour.teams.forEach((team) => {
      const teamPlayers = tour.players.filter(
        (player) => player.teamId === team.id
      );
      let teamTotalScore = 0;
      let teamTotalToPar = 0;
      let teamNetScore = 0;
      let teamNetToPar = 0;
      let teamHandicapStrokes = 0;
      let playersWithScores = 0;
      let hasHandicapApplied = false;

      teamPlayers.forEach((player) => {
        if (roundId) {
          // Single round team leaderboard
          const round = tour.rounds.find((r) => r.id === roundId);
          if (round && round.scores[player.id]) {
            const playerScore = round.scores[player.id];
            if (playerScore.totalScore > 0) {
              teamTotalScore += playerScore.totalScore;
              teamTotalToPar += playerScore.totalToPar;
              teamNetScore += playerScore.netScore || playerScore.totalScore;
              teamNetToPar += playerScore.netToPar || playerScore.totalToPar;
              teamHandicapStrokes += playerScore.handicapStrokes || 0;
              if (playerScore.handicapStrokes) hasHandicapApplied = true;
              playersWithScores++;
            }
          }
        } else {
          // Tournament team leaderboard (all rounds)
          tour.rounds.forEach((round) => {
            if (round.scores[player.id]) {
              const playerScore = round.scores[player.id];
              if (playerScore.totalScore > 0) {
                teamTotalScore += playerScore.totalScore;
                teamTotalToPar += playerScore.totalToPar;
                teamNetScore += playerScore.netScore || playerScore.totalScore;
                teamNetToPar += playerScore.netToPar || playerScore.totalToPar;
                teamHandicapStrokes += playerScore.handicapStrokes || 0;
                if (playerScore.handicapStrokes) hasHandicapApplied = true;
              }
            }
          });
          const hasAnyScores = tour.rounds.some(
            (round) =>
              round.scores[player.id] && round.scores[player.id].totalScore > 0
          );
          if (hasAnyScores) playersWithScores++;
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
        position: 0, // Will be set after sorting
      });
    });

    // Sort by net score if handicaps are applied, otherwise by gross score
    teamEntries.sort((a, b) => {
      if (a.totalScore === 0 && b.totalScore === 0) return 0;
      if (a.totalScore === 0) return 1;
      if (b.totalScore === 0) return -1;

      //: Use net score for sorting if handicaps are applied
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
};
