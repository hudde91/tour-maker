import { describe, it, expect } from 'vitest';
import {
  getFormatConfig,
  validateFormatSetup,
  getScoringEntities,
  calculateProgress,
} from './roundFormatManager';
import { createMockTour, createMockRound, createMockPlayer, createMockTeam } from '@/test/fixtures';

describe('Round Format Manager', () => {
  describe('getFormatConfig', () => {
    it('should return correct config for stroke-play', () => {
      const round = createMockRound({ format: 'stroke-play' });
      const config = getFormatConfig(round);

      expect(config.type).toBe('individual');
      expect(config.displayName).toBe('Individual');
      expect(config.isTeamBased).toBe(false);
      expect(config.requiresTeams).toBe(false);
      expect(config.allowsHoleByHole).toBe(true);
      expect(config.allowsTotalScore).toBe(true);
    });

    it('should return correct config for scramble', () => {
      const round = createMockRound({ format: 'scramble' });
      const config = getFormatConfig(round);

      expect(config.type).toBe('scramble');
      expect(config.displayName).toBe('Team Scramble');
      expect(config.isTeamBased).toBe(true);
      expect(config.requiresTeams).toBe(true);
      expect(config.allowsHoleByHole).toBe(true);
      expect(config.allowsTotalScore).toBe(true);
    });

    it('should return correct config for best-ball', () => {
      const round = createMockRound({ format: 'best-ball' });
      const config = getFormatConfig(round);

      expect(config.type).toBe('best-ball');
      expect(config.displayName).toBe('Best Ball');
      expect(config.isTeamBased).toBe(true);
      expect(config.requiresTeams).toBe(true);
      expect(config.description).toContain('best score per hole');
    });

    it('should return correct config for alternate-shot', () => {
      const round = createMockRound({ format: 'alternate-shot' });
      const config = getFormatConfig(round);

      expect(config.type).toBe('alternate-shot');
      expect(config.displayName).toBe('Alternate Shot');
      expect(config.isTeamBased).toBe(true);
      expect(config.requiresTeams).toBe(true);
    });

    it('should return correct config for foursomes-match-play', () => {
      const round = createMockRound({ format: 'foursomes-match-play' });
      const config = getFormatConfig(round);

      expect(config.type).toBe('alternate-shot');
      expect(config.displayName).toBe('Foursomes (Match Play)');
      expect(config.isTeamBased).toBe(true);
      expect(config.requiresTeams).toBe(true);
      expect(config.allowsTotalScore).toBe(false); // Match play doesn't allow total score
    });

    it('should return correct config for four-ball-match-play', () => {
      const round = createMockRound({ format: 'four-ball-match-play' });
      const config = getFormatConfig(round);

      expect(config.type).toBe('best-ball');
      expect(config.displayName).toBe('Four-Ball (Match Play)');
      expect(config.isTeamBased).toBe(true);
      expect(config.requiresTeams).toBe(true);
      expect(config.allowsTotalScore).toBe(false);
    });

    it('should return correct config for singles-match-play', () => {
      const round = createMockRound({ format: 'singles-match-play' });
      const config = getFormatConfig(round);

      expect(config.type).toBe('individual');
      expect(config.displayName).toBe('Singles (Match Play)');
      expect(config.isTeamBased).toBe(false);
      expect(config.requiresTeams).toBe(false);
      expect(config.allowsTotalScore).toBe(false);
    });

    it('should return individual config for match-play format', () => {
      const round = createMockRound({ format: 'match-play' });
      const config = getFormatConfig(round);

      expect(config.type).toBe('individual');
      expect(config.isTeamBased).toBe(false);
    });
  });

  describe('validateFormatSetup', () => {
    it('should return no errors for valid individual format', () => {
      const player1 = createMockPlayer();
      const player2 = createMockPlayer();
      const round = createMockRound({ format: 'stroke-play' });
      const tour = createMockTour({
        format: 'individual',
        players: [player1, player2],
        rounds: [round],
      });

      const errors = validateFormatSetup(tour, round);

      expect(errors).toHaveLength(0);
    });

    it('should return error when team format has no teams', () => {
      const round = createMockRound({ format: 'best-ball' });
      const tour = createMockTour({
        format: 'individual',
        rounds: [round],
      });

      const errors = validateFormatSetup(tour, round);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('requires teams to be created');
    });

    it('should return error when players are not assigned to teams', () => {
      const player1 = createMockPlayer({ teamId: undefined });
      const player2 = createMockPlayer({ teamId: undefined });
      const team1 = createMockTeam({ id: 'team1' });

      const round = createMockRound({ format: 'scramble' });
      const tour = createMockTour({
        format: 'team',
        players: [player1, player2],
        teams: [team1],
        rounds: [round],
      });

      const errors = validateFormatSetup(tour, round);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('2 players are not assigned to teams');
    });

    it('should return no errors when all players are assigned to teams', () => {
      const player1 = createMockPlayer({ teamId: 'team1' });
      const player2 = createMockPlayer({ teamId: 'team1' });
      const team1 = createMockTeam({ id: 'team1' });

      const round = createMockRound({ format: 'best-ball' });
      const tour = createMockTour({
        format: 'team',
        players: [player1, player2],
        teams: [team1],
        rounds: [round],
      });

      const errors = validateFormatSetup(tour, round);

      expect(errors).toHaveLength(0);
    });

    it('should return multiple errors when multiple issues exist', () => {
      const player1 = createMockPlayer({ teamId: undefined });
      const round = createMockRound({ format: 'scramble' });
      const tour = createMockTour({
        format: 'individual',
        players: [player1],
        rounds: [round],
      });

      const errors = validateFormatSetup(tour, round);

      // Should have error about no teams
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('requires teams'))).toBe(true);
    });
  });

  describe('getScoringEntities', () => {
    it('should return players for individual format', () => {
      const player1 = createMockPlayer();
      const player2 = createMockPlayer();
      const tour = createMockTour({
        format: 'individual',
        players: [player1, player2],
      });
      const config = getFormatConfig(createMockRound({ format: 'stroke-play' }));

      const result = getScoringEntities(tour, config);

      expect(result.type).toBe('players');
      expect(result.count).toBe(2);
      expect(result.entities).toEqual([player1, player2]);
    });

    it('should return teams for team-based format', () => {
      const team1 = createMockTeam();
      const team2 = createMockTeam();
      const tour = createMockTour({
        format: 'team',
        teams: [team1, team2],
      });
      const config = getFormatConfig(createMockRound({ format: 'best-ball' }));

      const result = getScoringEntities(tour, config);

      expect(result.type).toBe('teams');
      expect(result.count).toBe(2);
      expect(result.entities).toEqual([team1, team2]);
    });

    it('should return players when tour has no teams', () => {
      const player1 = createMockPlayer();
      const tour = createMockTour({
        format: 'individual',
        players: [player1],
      });
      const config = getFormatConfig(createMockRound({ format: 'best-ball' }));

      const result = getScoringEntities(tour, config);

      expect(result.type).toBe('players');
      expect(result.count).toBe(1);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress for individual format', () => {
      const player1 = createMockPlayer();
      const player2 = createMockPlayer();

      const round = createMockRound({
        format: 'stroke-play',
        holes: 9,
        scores: {
          [player1.id]: {
            playerId: player1.id,
            scores: [4, 5, null, null, null, null, null, null, null],
            totalScore: 9,
            totalToPar: 0,
          },
          [player2.id]: {
            playerId: player2.id,
            scores: Array(9).fill(null),
            totalScore: 0,
            totalToPar: 0,
          },
        },
      });

      const tour = createMockTour({
        format: 'individual',
        players: [player1, player2],
        rounds: [round],
      });

      const progress = calculateProgress(tour, round);

      expect(progress.type).toBe('players');
      expect(progress.total).toBe(2);
      expect(progress.completed).toBe(1); // Only player1 has scores
      expect(progress.percentage).toBe(50);
    });

    it('should calculate progress for scramble format', () => {
      const team1 = createMockTeam({ id: 'team1' });
      const team2 = createMockTeam({ id: 'team2' });

      const round = createMockRound({
        format: 'scramble',
        holes: 9,
        scores: {
          'team_team1': {
            playerId: 'team_team1',
            scores: [4, 5, 3, null, null, null, null, null, null],
            totalScore: 12,
            totalToPar: 0,
            isTeamScore: true,
          },
          'team_team2': {
            playerId: 'team_team2',
            scores: Array(9).fill(null),
            totalScore: 0,
            totalToPar: 0,
            isTeamScore: true,
          },
        },
      });

      const tour = createMockTour({
        format: 'team',
        teams: [team1, team2],
        rounds: [round],
      });

      const progress = calculateProgress(tour, round);

      expect(progress.type).toBe('teams');
      expect(progress.total).toBe(2);
      expect(progress.completed).toBe(1); // Only team1 has scores
      expect(progress.percentage).toBe(50);
    });

    it('should calculate progress for best-ball format', () => {
      const player1 = createMockPlayer({ teamId: 'team1' });
      const player2 = createMockPlayer({ teamId: 'team1' });
      const player3 = createMockPlayer({ teamId: 'team2' });
      const team1 = createMockTeam({ id: 'team1' });
      const team2 = createMockTeam({ id: 'team2' });

      const round = createMockRound({
        format: 'best-ball',
        holes: 9,
        scores: {
          [player1.id]: {
            playerId: player1.id,
            scores: [4, 5, null, null, null, null, null, null, null],
            totalScore: 9,
            totalToPar: 0,
          },
          [player2.id]: {
            playerId: player2.id,
            scores: Array(9).fill(null),
            totalScore: 0,
            totalToPar: 0,
          },
          [player3.id]: {
            playerId: player3.id,
            scores: Array(9).fill(null),
            totalScore: 0,
            totalToPar: 0,
          },
        },
      });

      const tour = createMockTour({
        format: 'team',
        players: [player1, player2, player3],
        teams: [team1, team2],
        rounds: [round],
      });

      const progress = calculateProgress(tour, round);

      expect(progress.type).toBe('teams');
      expect(progress.total).toBe(2);
      expect(progress.completed).toBe(1); // Only team1 has at least one player with scores
      expect(progress.percentage).toBe(50);
    });

    it('should return 0% when no entities exist', () => {
      const round = createMockRound({ format: 'stroke-play' });
      const tour = createMockTour({ rounds: [round] });

      const progress = calculateProgress(tour, round);

      expect(progress.total).toBe(0);
      expect(progress.completed).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('should return 100% when all entities have scores', () => {
      const player1 = createMockPlayer();
      const player2 = createMockPlayer();

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
        format: 'individual',
        players: [player1, player2],
        rounds: [round],
      });

      const progress = calculateProgress(tour, round);

      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(2);
      expect(progress.percentage).toBe(100);
    });
  });
});
