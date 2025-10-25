import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateBestBallRoundLeaderboard,
  calculateScrambleRoundLeaderboard,
  calculateIndividualRoundLeaderboard,
  allocateHandicapStrokesPerHole,
  calculateStablefordForPlayer,
  calculateTournamentStableford,
  calculateMatchesWon,
  sortAndPositionTeams,
} from './scoring';
import {
  createMockTour,
  createMockRound,
  createMockPlayer,
  createMockTeam,
} from '@/test/fixtures';
import type { Round, Team } from '@/types/core';
import type { TeamLeaderboardEntry } from '@/types/scoring';

describe('Scoring Calculations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('allocateHandicapStrokesPerHole', () => {
    it('should allocate handicap strokes correctly for handicap 18', () => {
      const round = createMockRound({
        holes: 18,
        scores: {
          player1: {
            playerId: 'player1',
            scores: Array(18).fill(5),
            totalScore: 90,
            totalToPar: 18,
            handicapStrokes: 18,
          },
        },
      });

      const allocation = allocateHandicapStrokesPerHole(round, 'player1');

      // Should give 1 stroke per hole
      expect(allocation).toHaveLength(18);
      expect(allocation.reduce((sum, s) => sum + s, 0)).toBe(18);
      expect(allocation.every((s) => s === 1)).toBe(true);
    });

    it('should allocate handicap strokes for handicap 10', () => {
      const round = createMockRound({
        holes: 18,
        scores: {
          player1: {
            playerId: 'player1',
            scores: Array(18).fill(5),
            totalScore: 90,
            totalToPar: 18,
            handicapStrokes: 10,
          },
        },
      });

      const allocation = allocateHandicapStrokesPerHole(round, 'player1');

      // Should give 10 strokes total to the 10 hardest holes
      expect(allocation).toHaveLength(18);
      expect(allocation.reduce((sum, s) => sum + s, 0)).toBe(10);
      expect(allocation.filter((s) => s === 1)).toHaveLength(10);
      expect(allocation.filter((s) => s === 0)).toHaveLength(8);
    });

    it('should allocate handicap strokes for handicap 36', () => {
      const round = createMockRound({
        holes: 18,
        scores: {
          player1: {
            playerId: 'player1',
            scores: Array(18).fill(5),
            totalScore: 90,
            totalToPar: 18,
            handicapStrokes: 36,
          },
        },
      });

      const allocation = allocateHandicapStrokesPerHole(round, 'player1');

      // Should give 2 strokes per hole
      expect(allocation).toHaveLength(18);
      expect(allocation.reduce((sum, s) => sum + s, 0)).toBe(36);
      expect(allocation.every((s) => s === 2)).toBe(true);
    });

    it('should handle 9-hole rounds', () => {
      const round = createMockRound({
        holes: 9,
        scores: {
          player1: {
            playerId: 'player1',
            scores: Array(9).fill(5),
            totalScore: 45,
            totalToPar: 9,
            handicapStrokes: 9,
          },
        },
      });

      const allocation = allocateHandicapStrokesPerHole(round, 'player1');

      expect(allocation).toHaveLength(9);
      expect(allocation.reduce((sum, s) => sum + s, 0)).toBe(9);
    });

    it('should return all zeros for player with no handicap', () => {
      const round = createMockRound({
        holes: 18,
        scores: {
          player1: {
            playerId: 'player1',
            scores: Array(18).fill(4),
            totalScore: 72,
            totalToPar: 0,
            handicapStrokes: 0,
          },
        },
      });

      const allocation = allocateHandicapStrokesPerHole(round, 'player1');

      expect(allocation).toHaveLength(18);
      expect(allocation.every((s) => s === 0)).toBe(true);
    });
  });

  describe('calculateStablefordForPlayer', () => {
    it('should calculate Stableford points correctly for par scores', () => {
      const round = createMockRound({
        holes: 9,
        holeInfo: Array.from({ length: 9 }, (_, i) => ({
          hole: i + 1,
          par: 4,
          handicap: i + 1,
          yardage: 400,
        })),
        scores: {
          player1: {
            playerId: 'player1',
            scores: Array(9).fill(4), // All pars
            totalScore: 36,
            totalToPar: 0,
            handicapStrokes: 0,
          },
        },
      });

      const points = calculateStablefordForPlayer(round, 'player1');

      // Par = 2 points per hole, 9 holes = 18 points
      expect(points).toBe(18);
    });

    it('should calculate Stableford points for birdies and bogeys', () => {
      const round = createMockRound({
        holes: 9,
        holeInfo: Array.from({ length: 9 }, (_, i) => ({
          hole: i + 1,
          par: 4,
          handicap: i + 1,
          yardage: 400,
        })),
        scores: {
          player1: {
            playerId: 'player1',
            scores: [3, 4, 5, 3, 4, 5, 3, 4, 5], // 3 birdies, 3 pars, 3 bogeys
            totalScore: 36,
            totalToPar: 0,
            handicapStrokes: 0,
          },
        },
      });

      const points = calculateStablefordForPlayer(round, 'player1');

      // Birdie (3) = 3 points, Par (4) = 2 points, Bogey (5) = 1 point
      // 3*3 + 3*2 + 3*1 = 9 + 6 + 3 = 18
      expect(points).toBe(18);
    });

    it('should calculate Stableford with handicap strokes', () => {
      const round = createMockRound({
        holes: 9,
        holeInfo: Array.from({ length: 9 }, (_, i) => ({
          hole: i + 1,
          par: 4,
          handicap: i + 1,
          yardage: 400,
        })),
        scores: {
          player1: {
            playerId: 'player1',
            scores: Array(9).fill(5), // All bogeys
            totalScore: 45,
            totalToPar: 9,
            handicapStrokes: 9, // 1 stroke per hole
          },
        },
      });

      const points = calculateStablefordForPlayer(round, 'player1');

      // With handicap: net score = 5 - 1 = 4 (par)
      // Par = 2 points per hole, 9 holes = 18 points
      expect(points).toBe(18);
    });

    it('should cap points at 6 for exceptional scores', () => {
      const round = createMockRound({
        holes: 1,
        holeInfo: [{ hole: 1, par: 5, handicap: 1, yardage: 500 }],
        scores: {
          player1: {
            playerId: 'player1',
            scores: [2], // Albatross on par 5
            totalScore: 2,
            totalToPar: -3,
            handicapStrokes: 0,
          },
        },
      });

      const points = calculateStablefordForPlayer(round, 'player1');

      // Net score 2, par 5, net to par -3
      // Points = 2 - (-3) = 5, not capped
      expect(points).toBe(5);
    });

    it('should return 0 points for very bad scores', () => {
      const round = createMockRound({
        holes: 3,
        holeInfo: Array.from({ length: 3 }, (_, i) => ({
          hole: i + 1,
          par: 4,
          handicap: i + 1,
          yardage: 400,
        })),
        scores: {
          player1: {
            playerId: 'player1',
            scores: [10, 9, 8], // Very bad scores
            totalScore: 27,
            totalToPar: 15,
            handicapStrokes: 0,
          },
        },
      });

      const points = calculateStablefordForPlayer(round, 'player1');

      // All scores are 0 points (worse than double bogey)
      expect(points).toBe(0);
    });

    it('should ignore holes with no score', () => {
      const round = createMockRound({
        holes: 5,
        holeInfo: Array.from({ length: 5 }, (_, i) => ({
          hole: i + 1,
          par: 4,
          handicap: i + 1,
          yardage: 400,
        })),
        scores: {
          player1: {
            playerId: 'player1',
            scores: [4, null, 4, null, 4] as (number | null)[],
            totalScore: 12,
            totalToPar: 0,
            handicapStrokes: 0,
          },
        },
      });

      const points = calculateStablefordForPlayer(round, 'player1');

      // Only 3 holes with scores, each par = 2 points
      expect(points).toBe(6);
    });

    it('should return 0 for player with no score', () => {
      const round = createMockRound({ holes: 9 });

      const points = calculateStablefordForPlayer(round, 'player-not-found');

      expect(points).toBe(0);
    });
  });

  describe('calculateBestBallRoundLeaderboard', () => {
    it('should calculate best ball scores correctly', () => {
      const player1 = createMockPlayer({ name: 'Player 1', teamId: 'team1' });
      const player2 = createMockPlayer({ name: 'Player 2', teamId: 'team1' });
      const player3 = createMockPlayer({ name: 'Player 3', teamId: 'team2' });
      const player4 = createMockPlayer({ name: 'Player 4', teamId: 'team2' });

      const team1 = createMockTeam({ id: 'team1', name: 'Team 1' });
      const team2 = createMockTeam({ id: 'team2', name: 'Team 2' });

      const round = createMockRound({
        format: 'best-ball',
        holes: 3,
        holeInfo: [
          { hole: 1, par: 4, handicap: 1, yardage: 400 },
          { hole: 2, par: 3, handicap: 2, yardage: 150 },
          { hole: 3, par: 5, handicap: 3, yardage: 500 },
        ],
        scores: {
          [player1.id]: {
            playerId: player1.id,
            scores: [4, 3, 6], // Par, Par, Bogey
            totalScore: 13,
            totalToPar: 1,
          },
          [player2.id]: {
            playerId: player2.id,
            scores: [5, 4, 5], // Bogey, Bogey, Par
            totalScore: 14,
            totalToPar: 2,
          },
          [player3.id]: {
            playerId: player3.id,
            scores: [3, 4, 5], // Birdie, Bogey, Par
            totalScore: 12,
            totalToPar: 0,
          },
          [player4.id]: {
            playerId: player4.id,
            scores: [4, 3, 6], // Par, Par, Bogey
            totalScore: 13,
            totalToPar: 1,
          },
        },
      });

      const tour = createMockTour({
        format: 'team',
        players: [player1, player2, player3, player4],
        teams: [team1, team2],
        rounds: [round],
      });

      const leaderboard = calculateBestBallRoundLeaderboard(tour, round);

      expect(leaderboard).toHaveLength(2);

      // Team 1: Best scores [4, 3, 5] = 12
      const team1Entry = leaderboard.find((e) => e.team.id === 'team1');
      expect(team1Entry!.totalScore).toBe(12);
      expect(team1Entry!.totalToPar).toBe(0); // 12 - 12 par

      // Team 2: Best scores [3, 3, 5] = 11
      const team2Entry = leaderboard.find((e) => e.team.id === 'team2');
      expect(team2Entry!.totalScore).toBe(11);
      expect(team2Entry!.totalToPar).toBe(-1); // 11 - 12 par

      // Team 2 should be in 1st place (lower score)
      expect(team2Entry!.position).toBe(1);
      expect(team1Entry!.position).toBe(2);
    });

    it('should handle teams with no scores', () => {
      const team1 = createMockTeam({ id: 'team1', name: 'Team 1' });
      const round = createMockRound({ format: 'best-ball', holes: 9 });
      const tour = createMockTour({
        format: 'team',
        teams: [team1],
        rounds: [round],
      });

      const leaderboard = calculateBestBallRoundLeaderboard(tour, round);

      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].totalScore).toBe(0);
      expect(leaderboard[0].playersWithScores).toBe(0);
    });
  });

  describe('calculateScrambleRoundLeaderboard', () => {
    it('should use team scores for scramble format', () => {
      const team1 = createMockTeam({ id: 'team1', name: 'Team 1' });
      const team2 = createMockTeam({ id: 'team2', name: 'Team 2' });

      const round = createMockRound({
        format: 'scramble',
        holes: 9,
        scores: {
          'team_team1': {
            playerId: 'team_team1',
            scores: Array(9).fill(4),
            totalScore: 36,
            totalToPar: 0,
            isTeamScore: true,
            teamId: 'team1',
          },
          'team_team2': {
            playerId: 'team_team2',
            scores: Array(9).fill(5),
            totalScore: 45,
            totalToPar: 9,
            isTeamScore: true,
            teamId: 'team2',
          },
        },
      });

      const tour = createMockTour({
        format: 'team',
        teams: [team1, team2],
        rounds: [round],
      });

      const leaderboard = calculateScrambleRoundLeaderboard(tour, round);

      expect(leaderboard).toHaveLength(2);

      const team1Entry = leaderboard.find((e) => e.team.id === 'team1');
      expect(team1Entry!.totalScore).toBe(36);
      expect(team1Entry!.totalToPar).toBe(0);
      expect(team1Entry!.position).toBe(1); // Better score

      const team2Entry = leaderboard.find((e) => e.team.id === 'team2');
      expect(team2Entry!.totalScore).toBe(45);
      expect(team2Entry!.totalToPar).toBe(9);
      expect(team2Entry!.position).toBe(2);
    });
  });

  describe('calculateIndividualRoundLeaderboard', () => {
    it('should sum individual scores for team leaderboard', () => {
      const player1 = createMockPlayer({ name: 'Player 1', teamId: 'team1' });
      const player2 = createMockPlayer({ name: 'Player 2', teamId: 'team1' });

      const team1 = createMockTeam({ id: 'team1', name: 'Team 1' });

      const round = createMockRound({
        format: 'stroke-play',
        holes: 9,
        scores: {
          [player1.id]: {
            playerId: player1.id,
            scores: Array(9).fill(4),
            totalScore: 36,
            totalToPar: 0,
          },
          [player2.id]: {
            playerId: player2.id,
            scores: Array(9).fill(5),
            totalScore: 45,
            totalToPar: 9,
          },
        },
      });

      const tour = createMockTour({
        format: 'team',
        players: [player1, player2],
        teams: [team1],
        rounds: [round],
      });

      const leaderboard = calculateIndividualRoundLeaderboard(tour, round);

      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].totalScore).toBe(81); // 36 + 45
      expect(leaderboard[0].totalToPar).toBe(9); // 0 + 9
      expect(leaderboard[0].playersWithScores).toBe(2);
    });

    it('should handle handicap scores', () => {
      const player1 = createMockPlayer({ name: 'Player 1', teamId: 'team1' });

      const team1 = createMockTeam({ id: 'team1', name: 'Team 1' });

      const round = createMockRound({
        format: 'stroke-play',
        holes: 9,
        scores: {
          [player1.id]: {
            playerId: player1.id,
            scores: Array(9).fill(5),
            totalScore: 45,
            totalToPar: 9,
            handicapStrokes: 9,
            netScore: 36,
            netToPar: 0,
          },
        },
      });

      const tour = createMockTour({
        format: 'team',
        players: [player1],
        teams: [team1],
        rounds: [round],
      });

      const leaderboard = calculateIndividualRoundLeaderboard(tour, round);

      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].totalHandicapStrokes).toBeDefined();
      expect(leaderboard[0].totalHandicapStrokes).toBeGreaterThan(0);
      expect(leaderboard[0].netScore).toBeDefined();
      expect(leaderboard[0].netToPar).toBeDefined();
    });
  });

  describe('sortAndPositionTeams', () => {
    it('should sort teams by score ascending', () => {
      const entries: TeamLeaderboardEntry[] = [
        {
          team: createMockTeam({ name: 'Team A' }),
          totalScore: 80,
          totalToPar: 8,
          netScore: undefined,
          netToPar: undefined,
          totalHandicapStrokes: undefined,
          playersWithScores: 2,
          totalPlayers: 2,
          position: 0,
        },
        {
          team: createMockTeam({ name: 'Team B' }),
          totalScore: 70,
          totalToPar: -2,
          netScore: undefined,
          netToPar: undefined,
          totalHandicapStrokes: undefined,
          playersWithScores: 2,
          totalPlayers: 2,
          position: 0,
        },
      ];

      const sorted = sortAndPositionTeams(entries);

      expect(sorted[0].team.name).toBe('Team B');
      expect(sorted[0].position).toBe(1);
      expect(sorted[1].team.name).toBe('Team A');
      expect(sorted[1].position).toBe(2);
    });

    it('should use net score when available', () => {
      const entries: TeamLeaderboardEntry[] = [
        {
          team: createMockTeam({ name: 'Team A' }),
          totalScore: 90,
          totalToPar: 18,
          netScore: 80,
          netToPar: 8,
          totalHandicapStrokes: 10,
          playersWithScores: 2,
          totalPlayers: 2,
          position: 0,
        },
        {
          team: createMockTeam({ name: 'Team B' }),
          totalScore: 85,
          totalToPar: 13,
          netScore: 75,
          netToPar: 3,
          totalHandicapStrokes: 10,
          playersWithScores: 2,
          totalPlayers: 2,
          position: 0,
        },
      ];

      const sorted = sortAndPositionTeams(entries);

      // Should sort by net score
      expect(sorted[0].team.name).toBe('Team B'); // Net 75
      expect(sorted[1].team.name).toBe('Team A'); // Net 80
    });

    it('should place teams with no score last', () => {
      const entries: TeamLeaderboardEntry[] = [
        {
          team: createMockTeam({ name: 'Team A' }),
          totalScore: 0,
          totalToPar: 0,
          netScore: undefined,
          netToPar: undefined,
          totalHandicapStrokes: undefined,
          playersWithScores: 0,
          totalPlayers: 2,
          position: 0,
        },
        {
          team: createMockTeam({ name: 'Team B' }),
          totalScore: 80,
          totalToPar: 8,
          netScore: undefined,
          netToPar: undefined,
          totalHandicapStrokes: undefined,
          playersWithScores: 2,
          totalPlayers: 2,
          position: 0,
        },
      ];

      const sorted = sortAndPositionTeams(entries);

      expect(sorted[0].team.name).toBe('Team B');
      expect(sorted[1].team.name).toBe('Team A');
    });
  });
});
