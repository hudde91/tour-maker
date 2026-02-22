import { describe, it, expect } from 'vitest';
import {
  calculateDetailedPlayerStats,
  calculateHoleWinners,
  calculateAggregatePlayerStats,
  formatStreak,
} from './playerStatsUtils';
import { createMockRound, createMockHoleInfo } from '../test/fixtures';

const makeRoundWithScores = (
  playerId: string,
  scores: (number | null)[],
  pars?: number[]
) => {
  const holes = scores.length;
  const holeInfo = Array.from({ length: holes }, (_, i) =>
    createMockHoleInfo(i + 1)
  );
  if (pars) {
    pars.forEach((par, i) => {
      holeInfo[i].par = par;
    });
  }
  const totalPar = holeInfo.reduce((s, h) => s + h.par, 0);
  const totalScore = scores
    .filter((s): s is number => s !== null && s > 0)
    .reduce((a, b) => a + b, 0);

  return createMockRound({
    holes,
    holeInfo,
    scores: {
      [playerId]: {
        playerId,
        scores,
        totalScore,
        totalToPar: totalScore - totalPar,
      },
    },
  });
};

describe('calculateDetailedPlayerStats', () => {
  it('returns null for player with no scores', () => {
    const round = createMockRound();
    expect(calculateDetailedPlayerStats(round, 'nonexistent')).toBeNull();
  });

  it('counts birdies correctly', () => {
    const pars = [4, 4, 4, 4];
    const scores = [3, 3, 4, 5]; // 2 birdies, 1 par, 1 bogey
    const round = makeRoundWithScores('p1', scores, pars);
    const stats = calculateDetailedPlayerStats(round, 'p1');

    expect(stats).not.toBeNull();
    expect(stats!.birdieCount).toBe(2);
    expect(stats!.parCount).toBe(1);
    expect(stats!.bogeyCount).toBe(1);
  });

  it('counts eagles correctly', () => {
    const pars = [4, 5, 4, 4];
    const scores = [2, 3, 4, 4]; // eagle, eagle, par, par
    const round = makeRoundWithScores('p1', scores, pars);
    const stats = calculateDetailedPlayerStats(round, 'p1');

    expect(stats!.eagleOrBetter).toBe(2);
  });

  it('counts double bogey or worse', () => {
    const pars = [4, 4, 4, 4];
    const scores = [6, 7, 4, 4]; // double bogey, triple bogey, par, par
    const round = makeRoundWithScores('p1', scores, pars);
    const stats = calculateDetailedPlayerStats(round, 'p1');

    expect(stats!.doubleBogeyOrWorse).toBe(2);
  });

  it('identifies best and worst holes', () => {
    const pars = [4, 4, 4, 4];
    const scores = [3, 6, 4, 2]; // -1, +2, 0, -2
    const round = makeRoundWithScores('p1', scores, pars);
    const stats = calculateDetailedPlayerStats(round, 'p1');

    expect(stats!.bestHole).toEqual({ holeNumber: 4, score: 2, toPar: -2 });
    expect(stats!.worstHole).toEqual({ holeNumber: 2, score: 6, toPar: 2 });
  });

  it('calculates front 9 and back 9 summaries', () => {
    const pars = Array(18).fill(4);
    const scores = [
      // Front 9: 3 birdies, 6 pars
      3, 3, 3, 4, 4, 4, 4, 4, 4,
      // Back 9: 1 birdie, 4 pars, 4 bogeys
      3, 4, 4, 4, 4, 5, 5, 5, 5,
    ];
    const round = makeRoundWithScores('p1', scores, pars);
    const stats = calculateDetailedPlayerStats(round, 'p1');

    expect(stats!.front9.birdies).toBe(3);
    expect(stats!.front9.pars).toBe(6);
    expect(stats!.front9.holesPlayed).toBe(9);
    expect(stats!.front9.toPar).toBe(-3);

    expect(stats!.back9.birdies).toBe(1);
    expect(stats!.back9.bogeys).toBe(4);
    expect(stats!.back9.holesPlayed).toBe(9);
  });

  it('handles null scores in the array', () => {
    const pars = [4, 4, 4, 4];
    const scores: (number | null)[] = [3, null, 4, null];
    const round = makeRoundWithScores('p1', scores, pars);
    const stats = calculateDetailedPlayerStats(round, 'p1');

    expect(stats!.birdieCount).toBe(1);
    expect(stats!.parCount).toBe(1);
    expect(stats!.front9.holesPlayed).toBe(2);
  });

  it('tracks birdie streak', () => {
    const pars = [4, 4, 4, 4];
    const scores = [3, 3, 3, 4]; // 3 birdies then par
    const round = makeRoundWithScores('p1', scores, pars);
    const stats = calculateDetailedPlayerStats(round, 'p1');

    // Last hole is par, so current streak should be par with length 1
    expect(stats!.currentStreak.type).toBe('par');
    expect(stats!.currentStreak.length).toBe(1);
  });
});

describe('calculateHoleWinners', () => {
  it('identifies winner for each hole', () => {
    const round = createMockRound({ holes: 3, holeInfo: [
      { number: 1, par: 4 },
      { number: 2, par: 4 },
      { number: 3, par: 4 },
    ]});

    round.scores = {
      p1: { playerId: 'p1', scores: [3, 5, 4], totalScore: 12, totalToPar: 0 },
      p2: { playerId: 'p2', scores: [4, 4, 4], totalScore: 12, totalToPar: 0 },
    };

    const winners = calculateHoleWinners(round);

    expect(winners).toHaveLength(3);
    expect(winners[0].winnerIds).toEqual(['p1']); // p1 won hole 1
    expect(winners[0].isTied).toBe(false);
    expect(winners[1].winnerIds).toEqual(['p2']); // p2 won hole 2
    expect(winners[2].isTied).toBe(true); // hole 3 tied
  });

  it('handles ties correctly', () => {
    const round = createMockRound({ holes: 2, holeInfo: [
      { number: 1, par: 4 },
      { number: 2, par: 4 },
    ]});

    round.scores = {
      p1: { playerId: 'p1', scores: [4, 4], totalScore: 8, totalToPar: 0 },
      p2: { playerId: 'p2', scores: [4, 4], totalScore: 8, totalToPar: 0 },
    };

    const winners = calculateHoleWinners(round);

    expect(winners[0].isTied).toBe(true);
    expect(winners[0].winnerIds).toContain('p1');
    expect(winners[0].winnerIds).toContain('p2');
  });

  it('filters to specific player IDs', () => {
    const round = createMockRound({ holes: 2, holeInfo: [
      { number: 1, par: 4 },
      { number: 2, par: 4 },
    ]});

    round.scores = {
      p1: { playerId: 'p1', scores: [3, 5], totalScore: 8, totalToPar: 0 },
      p2: { playerId: 'p2', scores: [4, 4], totalScore: 8, totalToPar: 0 },
      p3: { playerId: 'p3', scores: [2, 6], totalScore: 8, totalToPar: 0 },
    };

    const winners = calculateHoleWinners(round, ['p1', 'p2']);

    expect(winners[0].winnerIds).toEqual(['p1']); // p3 excluded
  });

  it('returns empty array for round with no scores', () => {
    const round = createMockRound({ holes: 2 });
    const winners = calculateHoleWinners(round);
    expect(winners).toHaveLength(0);
  });
});

describe('calculateAggregatePlayerStats', () => {
  it('aggregates stats across multiple rounds', () => {
    const round1 = makeRoundWithScores('p1', [3, 4, 5, 4], [4, 4, 4, 4]);
    const round2 = makeRoundWithScores('p1', [3, 3, 4, 4], [4, 4, 4, 4]);

    round1.status = 'completed';
    round2.status = 'completed';

    const stats = calculateAggregatePlayerStats([round1, round2], 'p1');

    expect(stats.totalBirdies).toBe(3); // 1 from round1 + 2 from round2
    expect(stats.totalPars).toBe(4); // 2 from round1 + 2 from round2
    expect(stats.totalBogeys).toBe(1); // 1 from round1
  });

  it('skips match play rounds', () => {
    const round = makeRoundWithScores('p1', [3, 4, 5, 4], [4, 4, 4, 4]);
    round.isMatchPlay = true;

    const stats = calculateAggregatePlayerStats([round], 'p1');

    expect(stats.totalBirdies).toBe(0);
    expect(stats.averageScorePerRound).toBe(0);
  });

  it('finds best round', () => {
    const round1 = makeRoundWithScores('p1', [4, 4, 4, 4], [4, 4, 4, 4]); // 16
    const round2 = makeRoundWithScores('p1', [3, 3, 3, 3], [4, 4, 4, 4]); // 12

    const stats = calculateAggregatePlayerStats([round1, round2], 'p1');

    expect(stats.bestRoundScore).toBe(12);
    expect(stats.bestRound).toBe(round2);
  });

  it('returns zeros for player with no rounds', () => {
    const stats = calculateAggregatePlayerStats([], 'p1');

    expect(stats.totalBirdies).toBe(0);
    expect(stats.averageScorePerRound).toBe(0);
    expect(stats.bestRoundScore).toBe(0);
  });
});

describe('formatStreak', () => {
  it('formats birdie streak', () => {
    expect(formatStreak({ type: 'birdie', length: 3 })).toBe(
      'Birdie streak: 3 holes'
    );
  });

  it('formats par streak (singular)', () => {
    expect(formatStreak({ type: 'par', length: 1 })).toBe(
      'Par streak: 1 hole'
    );
  });

  it('formats bogey streak', () => {
    expect(formatStreak({ type: 'bogey', length: 2 })).toBe(
      'Bogey streak: 2 holes'
    );
  });

  it('formats under-par streak', () => {
    expect(formatStreak({ type: 'under-par', length: 4 })).toBe(
      'Under Par streak: 4 holes'
    );
  });

  it('formats over-par streak', () => {
    expect(formatStreak({ type: 'over-par', length: 5 })).toBe(
      'Over Par streak: 5 holes'
    );
  });

  it('returns "No active streak" for none type', () => {
    expect(formatStreak({ type: 'none', length: 0 })).toBe(
      'No active streak'
    );
  });
});
