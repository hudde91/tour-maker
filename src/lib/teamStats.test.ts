import { describe, it, expect } from 'vitest';
import {
  formatToPar,
  getMomentumIndicator,
  getMomentumColorClass,
  calculateTeamStats,
} from './teamStats';
import {
  createMockTour,
  createMockTeam,
  createMockPlayer,
  createMockRound,
} from '../test/fixtures';

describe('formatToPar', () => {
  it('returns "E" for even par', () => {
    expect(formatToPar(0)).toBe('E');
  });

  it('returns "+N" for over par', () => {
    expect(formatToPar(3)).toBe('+3');
    expect(formatToPar(1)).toBe('+1');
  });

  it('returns "-N" for under par', () => {
    expect(formatToPar(-2)).toBe('-2');
    expect(formatToPar(-5)).toBe('-5');
  });
});

describe('getMomentumIndicator', () => {
  it('returns chart up emoji for improving', () => {
    expect(getMomentumIndicator('improving')).toContain('📈');
  });

  it('returns chart down emoji for declining', () => {
    expect(getMomentumIndicator('declining')).toContain('📉');
  });

  it('returns arrow for stable', () => {
    expect(getMomentumIndicator('stable')).toContain('➡️');
  });

  it('returns question mark for no-data', () => {
    expect(getMomentumIndicator('no-data')).toContain('❓');
  });
});

describe('getMomentumColorClass', () => {
  it('returns emerald classes for improving', () => {
    expect(getMomentumColorClass('improving')).toContain('emerald');
  });

  it('returns red classes for declining', () => {
    expect(getMomentumColorClass('declining')).toContain('red');
  });

  it('returns blue classes for stable', () => {
    expect(getMomentumColorClass('stable')).toContain('blue');
  });

  it('returns slate classes for no-data', () => {
    expect(getMomentumColorClass('no-data')).toContain('slate');
  });
});

describe('calculateTeamStats', () => {
  it('returns null for nonexistent team', () => {
    const tour = createMockTour({ teams: [] });
    expect(calculateTeamStats(tour, 'nonexistent')).toBeNull();
  });

  it('returns no-data momentum for team with no players', () => {
    const team = createMockTeam({ playerIds: [] });
    const tour = createMockTour({ teams: [team] });
    const stats = calculateTeamStats(tour, team.id);

    expect(stats).not.toBeNull();
    expect(stats!.momentum).toBe('no-data');
    expect(stats!.roundsPlayed).toBe(0);
    expect(stats!.totalScore).toBe(0);
  });

  it('calculates stats for a team with stroke play scores', () => {
    const player1 = createMockPlayer({ name: 'Player 1' });
    const player2 = createMockPlayer({ name: 'Player 2' });
    const team = createMockTeam({
      playerIds: [player1.id, player2.id],
    });
    player1.teamId = team.id;
    player2.teamId = team.id;

    const round = createMockRound({
      status: 'completed',
      completedAt: '2024-01-01T00:00:00Z',
      holes: 4,
      holeInfo: [
        { number: 1, par: 4 },
        { number: 2, par: 4 },
        { number: 3, par: 4 },
        { number: 4, par: 4 },
      ],
      scores: {
        [player1.id]: {
          playerId: player1.id,
          scores: [4, 4, 4, 4],
          totalScore: 16,
          totalToPar: 0,
        },
        [player2.id]: {
          playerId: player2.id,
          scores: [5, 5, 5, 5],
          totalScore: 20,
          totalToPar: 4,
        },
      },
    });

    const tour = createMockTour({
      format: 'team',
      players: [player1, player2],
      teams: [team],
      rounds: [round],
    });

    const stats = calculateTeamStats(tour, team.id);

    expect(stats).not.toBeNull();
    expect(stats!.playerStats).toHaveLength(2);
    // Both players have scores so totalScore should be sum
    expect(stats!.totalScore).toBe(36); // 16 + 20
  });

  it('calculates best-ball format correctly', () => {
    const player1 = createMockPlayer({ name: 'Player 1' });
    const player2 = createMockPlayer({ name: 'Player 2' });
    const team = createMockTeam({
      playerIds: [player1.id, player2.id],
    });
    player1.teamId = team.id;
    player2.teamId = team.id;

    const round = createMockRound({
      format: 'best-ball',
      status: 'completed',
      completedAt: '2024-01-01T00:00:00Z',
      holes: 4,
      holeInfo: [
        { number: 1, par: 4 },
        { number: 2, par: 4 },
        { number: 3, par: 4 },
        { number: 4, par: 4 },
      ],
      scores: {
        [player1.id]: {
          playerId: player1.id,
          scores: [3, 5, 4, 6],
          totalScore: 18,
          totalToPar: 2,
        },
        [player2.id]: {
          playerId: player2.id,
          scores: [5, 3, 4, 4],
          totalScore: 16,
          totalToPar: 0,
        },
      },
    });

    const tour = createMockTour({
      format: 'team',
      players: [player1, player2],
      teams: [team],
      rounds: [round],
    });

    const stats = calculateTeamStats(tour, team.id);

    expect(stats).not.toBeNull();
    // Best ball: min(3,5)=3, min(5,3)=3, min(4,4)=4, min(6,4)=4 = 14
    expect(stats!.totalScore).toBe(14);
  });
});
