import { describe, it, expect, beforeEach } from 'vitest';
import { nanoid } from 'nanoid';
import {
  getTours,
  getTour,
  saveTour,
  deleteTour,
} from './tours';
import {
  saveRound,
  startRound,
  completeRound,
  getTotalPar,
} from './rounds';
import {
  addPlayerToTour,
  updatePlayerScore,
  removePlayerFromTour,
} from './players';
import {
  addTeamToTour,
  assignPlayerToTeam,
} from './teams';
import {
  calculateBestBallRoundLeaderboard,
  calculateIndividualRoundLeaderboard,
  calculateStablefordForPlayer,
} from './scoring';
import type { Tour, Round, Player, Team } from '@/types/core';

/**
 * Integration tests for complete user workflows
 * These tests simulate real user scenarios from tour creation to completion
 */

describe('Integration Tests - Complete Workflows', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Individual Tour Creation and Scoring', () => {
    it('should create a complete individual tour and track scores', () => {
      // Step 1: Create a new tour
      const tour: Tour = {
        id: nanoid(),
        name: 'Summer Championship',
        format: 'individual',
        players: [],
        rounds: [],
        status: 'created',
      };
      saveTour(tour);

      expect(getTours()).toHaveLength(1);

      // Step 2: Add players to the tour
      const player1: Player = {
        id: nanoid(),
        name: 'John Doe',
        handicap: 12,
      };
      const player2: Player = {
        id: nanoid(),
        name: 'Jane Smith',
        handicap: 8,
      };

      addPlayerToTour(tour.id, player1);
      addPlayerToTour(tour.id, player2);

      const updatedTour = getTour(tour.id)!;
      expect(updatedTour.players).toHaveLength(2);

      // Step 3: Create a round
      const round: Round = {
        id: nanoid(),
        format: 'stroke-play',
        holes: 18,
        holeInfo: Array.from({ length: 18 }, (_, i) => ({
          hole: i + 1,
          par: [3, 4, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5][i] || 4,
          handicap: i + 1,
          yardage: 400,
        })),
        scores: {},
        settings: {
          useHandicaps: true,
          strokesGiven: true,
          scoringType: 'stroke-play',
        },
        status: 'created',
      };

      saveRound(tour.id, round);

      // Step 4: Start the round
      startRound(tour.id, round.id);

      const tourWithRound = getTour(tour.id)!;
      const startedRound = tourWithRound.rounds[0];
      expect(startedRound.status).toBe('in-progress');
      expect(startedRound.scores[player1.id]).toBeDefined();
      expect(startedRound.scores[player2.id]).toBeDefined();

      // Step 5: Update player scores hole by hole
      const player1Scores = [4, 5, 4, 6, 4, 5, 3, 4, 6, 4, 3, 5, 5, 4, 4, 3, 5, 6]; // Total: 80
      const player2Scores = [3, 4, 4, 5, 3, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5]; // Total: 71

      updatePlayerScore(tour.id, round.id, player1.id, player1Scores);
      updatePlayerScore(tour.id, round.id, player2.id, player2Scores);

      const tourWithScores = getTour(tour.id)!;
      const roundWithScores = tourWithScores.rounds[0];

      expect(roundWithScores.scores[player1.id].totalScore).toBe(80);
      expect(roundWithScores.scores[player2.id].totalScore).toBe(71);

      // Verify handicap calculations
      expect(roundWithScores.scores[player1.id].handicapStrokes).toBe(12);
      expect(roundWithScores.scores[player2.id].handicapStrokes).toBe(8);

      expect(roundWithScores.scores[player1.id].netScore).toBe(68); // 80 - 12
      expect(roundWithScores.scores[player2.id].netScore).toBe(63); // 71 - 8

      // Step 6: Complete the round
      completeRound(tour.id, round.id);

      const finalTour = getTour(tour.id)!;
      expect(finalTour.rounds[0].status).toBe('completed');
    });

    it('should handle conceded holes correctly in stroke play', () => {
      const tour: Tour = {
        id: nanoid(),
        name: 'Test Tour',
        format: 'individual',
        players: [],
        rounds: [],
        status: 'created',
      };
      saveTour(tour);

      const player: Player = {
        id: nanoid(),
        name: 'Test Player',
        handicap: 0,
      };
      addPlayerToTour(tour.id, player);

      const round: Round = {
        id: nanoid(),
        format: 'stroke-play',
        holes: 9,
        holeInfo: Array.from({ length: 9 }, (_, i) => ({
          hole: i + 1,
          par: 4,
          handicap: i + 1,
          yardage: 400,
        })),
        scores: {},
        settings: {
          scoringType: 'stroke-play',
        },
        status: 'created',
      };

      saveRound(tour.id, round);
      startRound(tour.id, round.id);

      // Player scores 4 on first 3 holes, then concedes rest
      const scores = [4, 4, 4, null, null, null, null, null, null] as (number | null)[];
      updatePlayerScore(tour.id, round.id, player.id, scores);

      const updatedTour = getTour(tour.id)!;
      const updatedRound = updatedTour.rounds[0];

      // Conceded holes count as 2x par in stroke play
      // 4 + 4 + 4 + 8 + 8 + 8 + 8 + 8 + 8 = 60
      expect(updatedRound.scores[player.id].totalScore).toBe(60);
    });
  });

  describe('Team Tour Creation and Scoring', () => {
    it('should create a team tour with best ball scoring', () => {
      // Step 1: Create team tour
      const tour: Tour = {
        id: nanoid(),
        name: 'Team Championship',
        format: 'team',
        players: [],
        teams: [],
        rounds: [],
        status: 'created',
      };
      saveTour(tour);

      // Step 2: Add players
      const players: Player[] = [
        { id: nanoid(), name: 'Player A1', handicap: 10 },
        { id: nanoid(), name: 'Player A2', handicap: 15 },
        { id: nanoid(), name: 'Player B1', handicap: 8 },
        { id: nanoid(), name: 'Player B2', handicap: 12 },
      ];

      players.forEach((p) => addPlayerToTour(tour.id, p));

      // Step 3: Create teams
      const team1: Team = {
        id: nanoid(),
        name: 'Team Alpha',
        playerIds: [],
      };
      const team2: Team = {
        id: nanoid(),
        name: 'Team Beta',
        playerIds: [],
      };

      addTeamToTour(tour.id, team1);
      addTeamToTour(tour.id, team2);

      // Step 4: Assign players to teams
      assignPlayerToTeam(tour.id, players[0].id, team1.id);
      assignPlayerToTeam(tour.id, players[1].id, team1.id);
      assignPlayerToTeam(tour.id, players[2].id, team2.id);
      assignPlayerToTeam(tour.id, players[3].id, team2.id);

      const tourWithTeams = getTour(tour.id)!;
      expect(tourWithTeams.teams![0].playerIds).toHaveLength(2);
      expect(tourWithTeams.teams![1].playerIds).toHaveLength(2);

      // Step 5: Create and start a best ball round
      const round: Round = {
        id: nanoid(),
        format: 'best-ball',
        holes: 9,
        holeInfo: Array.from({ length: 9 }, (_, i) => ({
          hole: i + 1,
          par: 4,
          handicap: i + 1,
          yardage: 400,
        })),
        scores: {},
        settings: {
          scoringType: 'best-ball',
        },
        status: 'created',
      };

      saveRound(tour.id, round);
      startRound(tour.id, round.id);

      // Step 6: Update scores for all players
      // Team Alpha scores
      updatePlayerScore(tour.id, round.id, players[0].id, [4, 5, 4, 6, 4, 5, 3, 4, 5]);
      updatePlayerScore(tour.id, round.id, players[1].id, [5, 4, 5, 5, 5, 4, 4, 5, 4]);

      // Team Beta scores
      updatePlayerScore(tour.id, round.id, players[2].id, [3, 4, 4, 5, 4, 4, 3, 4, 5]);
      updatePlayerScore(tour.id, round.id, players[3].id, [4, 5, 3, 6, 3, 5, 4, 3, 6]);

      // Step 7: Calculate leaderboard
      const finalTour = getTour(tour.id)!;
      const finalRound = finalTour.rounds[0];
      const leaderboard = calculateBestBallRoundLeaderboard(finalTour, finalRound);

      expect(leaderboard).toHaveLength(2);

      // Team Alpha: Best scores [4, 4, 4, 5, 4, 4, 3, 4, 4] = 36
      const teamAlpha = leaderboard.find((e) => e.team.name === 'Team Alpha')!;
      expect(teamAlpha.totalScore).toBe(36);

      // Team Beta: Best scores [3, 4, 3, 5, 3, 4, 3, 3, 5] = 33
      const teamBeta = leaderboard.find((e) => e.team.name === 'Team Beta')!;
      expect(teamBeta.totalScore).toBe(33);
      expect(teamBeta.position).toBe(1); // Better score
    });

    it('should handle individual scoring within team format', () => {
      const tour: Tour = {
        id: nanoid(),
        name: 'Team Tour',
        format: 'team',
        players: [],
        teams: [],
        rounds: [],
        status: 'created',
      };
      saveTour(tour);

      // Add players and teams
      const player1: Player = { id: nanoid(), name: 'Player 1', handicap: 0 };
      const player2: Player = { id: nanoid(), name: 'Player 2', handicap: 0 };
      const team1: Team = { id: nanoid(), name: 'Team 1', playerIds: [] };

      addPlayerToTour(tour.id, player1);
      addPlayerToTour(tour.id, player2);
      addTeamToTour(tour.id, team1);
      assignPlayerToTeam(tour.id, player1.id, team1.id);
      assignPlayerToTeam(tour.id, player2.id, team1.id);

      // Create stroke play round
      const round: Round = {
        id: nanoid(),
        format: 'stroke-play',
        holes: 9,
        holeInfo: Array.from({ length: 9 }, (_, i) => ({
          hole: i + 1,
          par: 4,
          handicap: i + 1,
          yardage: 400,
        })),
        scores: {},
        settings: {
          scoringType: 'stroke-play',
        },
        status: 'created',
      };

      saveRound(tour.id, round);
      startRound(tour.id, round.id);

      // Update scores
      updatePlayerScore(tour.id, round.id, player1.id, [4, 4, 4, 4, 4, 4, 4, 4, 4]); // 36
      updatePlayerScore(tour.id, round.id, player2.id, [5, 5, 5, 5, 5, 5, 5, 5, 5]); // 45

      // Calculate team leaderboard (sum of individual scores)
      const finalTour = getTour(tour.id)!;
      const finalRound = finalTour.rounds[0];
      const leaderboard = calculateIndividualRoundLeaderboard(finalTour, finalRound);

      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].totalScore).toBe(81); // 36 + 45
      expect(leaderboard[0].playersWithScores).toBe(2);
    });
  });

  describe('Stableford Scoring Flow', () => {
    it('should calculate Stableford points correctly throughout a round', () => {
      const tour: Tour = {
        id: nanoid(),
        name: 'Stableford Tour',
        format: 'individual',
        players: [],
        rounds: [],
        status: 'created',
      };
      saveTour(tour);

      const player: Player = {
        id: nanoid(),
        name: 'Stableford Player',
        handicap: 18,
      };
      addPlayerToTour(tour.id, player);

      const round: Round = {
        id: nanoid(),
        format: 'stroke-play',
        holes: 9,
        holeInfo: Array.from({ length: 9 }, (_, i) => ({
          hole: i + 1,
          par: 4,
          handicap: i + 1,
          yardage: 400,
        })),
        scores: {},
        settings: {
          scoringType: 'stableford',
          strokesGiven: true,
        },
        status: 'created',
      };

      saveRound(tour.id, round);
      startRound(tour.id, round.id);

      // Player with handicap 18 gets 1 stroke per hole
      // All gross scores of 5 become net 4 (par) = 2 points each
      const scores = Array(9).fill(5);
      updatePlayerScore(tour.id, round.id, player.id, scores);

      const finalTour = getTour(tour.id)!;
      const finalRound = finalTour.rounds[0];

      const stablefordPoints = calculateStablefordForPlayer(finalRound, player.id);

      // 9 holes x 2 points (net par) = 18 points
      expect(stablefordPoints).toBe(18);
    });
  });

  describe('Multi-Round Tournament', () => {
    it('should handle multiple rounds in a tournament', () => {
      const tour: Tour = {
        id: nanoid(),
        name: 'Two-Round Tournament',
        format: 'individual',
        players: [],
        rounds: [],
        status: 'created',
      };
      saveTour(tour);

      const player: Player = {
        id: nanoid(),
        name: 'Tournament Player',
        handicap: 0,
      };
      addPlayerToTour(tour.id, player);

      // Create and complete Round 1
      const round1: Round = {
        id: nanoid(),
        format: 'stroke-play',
        holes: 9,
        holeInfo: Array.from({ length: 9 }, (_, i) => ({
          hole: i + 1,
          par: 4,
          handicap: i + 1,
          yardage: 400,
        })),
        scores: {},
        settings: {
          scoringType: 'stroke-play',
        },
        status: 'created',
      };

      saveRound(tour.id, round1);
      startRound(tour.id, round1.id);
      updatePlayerScore(tour.id, round1.id, player.id, Array(9).fill(4)); // 36
      completeRound(tour.id, round1.id);

      // Create and complete Round 2
      const round2: Round = {
        id: nanoid(),
        format: 'stroke-play',
        holes: 9,
        holeInfo: Array.from({ length: 9 }, (_, i) => ({
          hole: i + 1,
          par: 4,
          handicap: i + 1,
          yardage: 400,
        })),
        scores: {},
        settings: {
          scoringType: 'stroke-play',
        },
        status: 'created',
      };

      saveRound(tour.id, round2);
      startRound(tour.id, round2.id);
      updatePlayerScore(tour.id, round2.id, player.id, Array(9).fill(5)); // 45
      completeRound(tour.id, round2.id);

      const finalTour = getTour(tour.id)!;

      expect(finalTour.rounds).toHaveLength(2);
      expect(finalTour.rounds[0].status).toBe('completed');
      expect(finalTour.rounds[1].status).toBe('completed');
      expect(finalTour.rounds[0].scores[player.id].totalScore).toBe(36);
      expect(finalTour.rounds[1].scores[player.id].totalScore).toBe(45);
    });
  });

  describe('Player Management During Tour', () => {
    it('should handle player removal and cleanup', () => {
      const tour: Tour = {
        id: nanoid(),
        name: 'Test Tour',
        format: 'team',
        players: [],
        teams: [],
        rounds: [],
        status: 'created',
      };
      saveTour(tour);

      const player1: Player = { id: nanoid(), name: 'Player 1', handicap: 0 };
      const player2: Player = { id: nanoid(), name: 'Player 2', handicap: 0 };
      const team1: Team = { id: nanoid(), name: 'Team 1', playerIds: [] };

      addPlayerToTour(tour.id, player1);
      addPlayerToTour(tour.id, player2);
      addTeamToTour(tour.id, team1);
      assignPlayerToTeam(tour.id, player1.id, team1.id);
      assignPlayerToTeam(tour.id, player2.id, team1.id);

      // Remove player1
      removePlayerFromTour(tour.id, player1.id);

      const updatedTour = getTour(tour.id)!;

      expect(updatedTour.players).toHaveLength(1);
      expect(updatedTour.players[0].id).toBe(player2.id);
      expect(updatedTour.teams![0].playerIds).toEqual([player2.id]);
    });
  });

  describe('Tour Deletion', () => {
    it('should delete a tour and all its data', () => {
      const tour: Tour = {
        id: nanoid(),
        name: 'Tour to Delete',
        format: 'individual',
        players: [],
        rounds: [],
        status: 'created',
      };
      saveTour(tour);

      expect(getTours()).toHaveLength(1);

      deleteTour(tour.id);

      expect(getTours()).toHaveLength(0);
      expect(getTour(tour.id)).toBeNull();
    });
  });
});
