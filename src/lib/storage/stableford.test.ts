import { describe, it, expect } from 'vitest';
import {
  allocateHandicapStrokesPerHole,
  calculateStablefordForPlayer,
} from './scoring';
import { createMockRound } from '../../test/fixtures';

describe('allocateHandicapStrokesPerHole', () => {
  it('distributes strokes evenly across holes', () => {
    const round = createMockRound({
      holes: 4,
      holeInfo: [
        { number: 1, par: 4, handicap: 1 },
        { number: 2, par: 4, handicap: 2 },
        { number: 3, par: 4, handicap: 3 },
        { number: 4, par: 4, handicap: 4 },
      ],
      scores: {
        p1: {
          playerId: 'p1',
          scores: [4, 4, 4, 4],
          totalScore: 16,
          totalToPar: 0,
          handicapStrokes: 4,
        },
      },
    });

    const alloc = allocateHandicapStrokesPerHole(round, 'p1');

    expect(alloc).toHaveLength(4);
    // 4 strokes across 4 holes = 1 each
    expect(alloc.reduce((s, v) => s + v, 0)).toBe(4);
    expect(alloc).toEqual([1, 1, 1, 1]);
  });

  it('gives extra strokes to hardest holes first', () => {
    const round = createMockRound({
      holes: 4,
      holeInfo: [
        { number: 1, par: 4, handicap: 1 }, // hardest
        { number: 2, par: 4, handicap: 2 },
        { number: 3, par: 4, handicap: 3 },
        { number: 4, par: 4, handicap: 4 }, // easiest
      ],
      scores: {
        p1: {
          playerId: 'p1',
          scores: [4, 4, 4, 4],
          totalScore: 16,
          totalToPar: 0,
          handicapStrokes: 2,
        },
      },
    });

    const alloc = allocateHandicapStrokesPerHole(round, 'p1');

    expect(alloc.reduce((s, v) => s + v, 0)).toBe(2);
    // Hardest holes (lowest handicap index) get strokes first
    expect(alloc[0]).toBe(1); // handicap 1 - gets a stroke
    expect(alloc[1]).toBe(1); // handicap 2 - gets a stroke
    expect(alloc[2]).toBe(0); // handicap 3
    expect(alloc[3]).toBe(0); // handicap 4
  });

  it('returns zeros when player has no handicap strokes', () => {
    const round = createMockRound({
      holes: 4,
      holeInfo: [
        { number: 1, par: 4, handicap: 1 },
        { number: 2, par: 4, handicap: 2 },
        { number: 3, par: 4, handicap: 3 },
        { number: 4, par: 4, handicap: 4 },
      ],
      scores: {
        p1: {
          playerId: 'p1',
          scores: [4, 4, 4, 4],
          totalScore: 16,
          totalToPar: 0,
        },
      },
    });

    const alloc = allocateHandicapStrokesPerHole(round, 'p1');

    expect(alloc).toEqual([0, 0, 0, 0]);
  });

  it('handles more strokes than holes (multiple rounds)', () => {
    const round = createMockRound({
      holes: 4,
      holeInfo: [
        { number: 1, par: 4, handicap: 1 },
        { number: 2, par: 4, handicap: 2 },
        { number: 3, par: 4, handicap: 3 },
        { number: 4, par: 4, handicap: 4 },
      ],
      scores: {
        p1: {
          playerId: 'p1',
          scores: [4, 4, 4, 4],
          totalScore: 16,
          totalToPar: 0,
          handicapStrokes: 6,
        },
      },
    });

    const alloc = allocateHandicapStrokesPerHole(round, 'p1');

    // 6 / 4 = 1 base + 2 remainder to hardest holes
    expect(alloc.reduce((s, v) => s + v, 0)).toBe(6);
    expect(alloc[0]).toBe(2); // handicap 1 - base + extra
    expect(alloc[1]).toBe(2); // handicap 2 - base + extra
    expect(alloc[2]).toBe(1); // handicap 3 - base only
    expect(alloc[3]).toBe(1); // handicap 4 - base only
  });
});

describe('calculateStablefordForPlayer', () => {
  const makeStablefordRound = (
    playerId: string,
    scores: number[],
    pars: number[],
    handicapStrokes = 0
  ) => {
    const holes = scores.length;
    return createMockRound({
      holes,
      holeInfo: pars.map((par, i) => ({
        number: i + 1,
        par,
        handicap: i + 1,
      })),
      scores: {
        [playerId]: {
          playerId,
          scores,
          totalScore: scores.reduce((a, b) => a + b, 0),
          totalToPar:
            scores.reduce((a, b) => a + b, 0) -
            pars.reduce((a, b) => a + b, 0),
          handicapStrokes: handicapStrokes > 0 ? handicapStrokes : undefined,
        },
      },
    });
  };

  it('awards 2 points for par (net)', () => {
    const round = makeStablefordRound('p1', [4], [4]);
    expect(calculateStablefordForPlayer(round, 'p1')).toBe(2);
  });

  it('awards 3 points for birdie (net)', () => {
    const round = makeStablefordRound('p1', [3], [4]);
    expect(calculateStablefordForPlayer(round, 'p1')).toBe(3);
  });

  it('awards 4 points for eagle (net)', () => {
    const round = makeStablefordRound('p1', [2], [4]);
    expect(calculateStablefordForPlayer(round, 'p1')).toBe(4);
  });

  it('awards 1 point for bogey (net)', () => {
    const round = makeStablefordRound('p1', [5], [4]);
    expect(calculateStablefordForPlayer(round, 'p1')).toBe(1);
  });

  it('awards 0 points for double bogey or worse', () => {
    const round = makeStablefordRound('p1', [6], [4]);
    expect(calculateStablefordForPlayer(round, 'p1')).toBe(0);
  });

  it('sums points across multiple holes', () => {
    // Par, Birdie, Bogey, Double Bogey
    const round = makeStablefordRound('p1', [4, 3, 5, 6], [4, 4, 4, 4]);
    // 2 + 3 + 1 + 0 = 6
    expect(calculateStablefordForPlayer(round, 'p1')).toBe(6);
  });

  it('returns 0 for player with no scores', () => {
    const round = createMockRound();
    expect(calculateStablefordForPlayer(round, 'nonexistent')).toBe(0);
  });

  it('respects manual stableford override', () => {
    const round = createMockRound({
      holes: 2,
      holeInfo: [
        { number: 1, par: 4, handicap: 1 },
        { number: 2, par: 4, handicap: 2 },
      ],
      scores: {
        p1: {
          playerId: 'p1',
          scores: [4, 4],
          totalScore: 8,
          totalToPar: 0,
          stablefordManual: 42,
        },
      },
    });

    expect(calculateStablefordForPlayer(round, 'p1')).toBe(42);
  });

  it('caps points at 6 per hole', () => {
    // With handicap, net score could be very low
    const round = makeStablefordRound('p1', [1], [4], 4);
    // net = 1 - 4 = -3, pts = 2 - (-3 - 4) = 2 - (-7) = 9, capped to 6
    // Actually: alloc gives all 4 strokes to hole 1 (only 1 hole)
    // net = 1 - 4 = -3, netToPar = -3 - 4 = -7, pts = 2 - (-7) = 9, capped at 6
    expect(calculateStablefordForPlayer(round, 'p1')).toBe(6);
  });
});
