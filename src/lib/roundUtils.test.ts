import { describe, it, expect } from 'vitest';
import {
  isRoundCompleted,
  isStablefordScoring,
  hasHandicapsEnabled,
  isMatchPlayRound,
  getMostRecentRound,
  getCompletedRounds,
} from './roundUtils';
import { createMockRound } from '../test/fixtures';

describe('isRoundCompleted', () => {
  it('returns true for status "completed"', () => {
    const round = createMockRound({ status: 'completed' });
    expect(isRoundCompleted(round)).toBe(true);
  });

  it('returns true when completedAt is set', () => {
    const round = createMockRound({
      status: 'in-progress',
      completedAt: '2024-01-01T00:00:00Z',
    });
    expect(isRoundCompleted(round)).toBe(true);
  });

  it('returns false for status "created"', () => {
    const round = createMockRound({ status: 'created' });
    expect(isRoundCompleted(round)).toBe(false);
  });

  it('returns false for status "in-progress"', () => {
    const round = createMockRound({ status: 'in-progress' });
    expect(isRoundCompleted(round)).toBe(false);
  });
});

describe('isStablefordScoring', () => {
  it('returns true for stroke-play with stableford enabled', () => {
    const round = createMockRound({
      format: 'stroke-play',
      settings: { strokesGiven: false, stablefordScoring: true },
    });
    expect(isStablefordScoring(round)).toBe(true);
  });

  it('returns false for stroke-play without stableford', () => {
    const round = createMockRound({
      format: 'stroke-play',
      settings: { strokesGiven: false },
    });
    expect(isStablefordScoring(round)).toBe(false);
  });

  it('returns false for non-stroke-play formats even with stableford', () => {
    const round = createMockRound({
      format: 'best-ball',
      settings: { strokesGiven: false, stablefordScoring: true },
    });
    expect(isStablefordScoring(round)).toBe(false);
  });
});

describe('hasHandicapsEnabled', () => {
  it('returns true when strokesGiven is true', () => {
    const round = createMockRound({
      settings: { strokesGiven: true },
    });
    expect(hasHandicapsEnabled(round)).toBe(true);
  });

  it('returns false when strokesGiven is false', () => {
    const round = createMockRound({
      settings: { strokesGiven: false },
    });
    expect(hasHandicapsEnabled(round)).toBe(false);
  });
});

describe('isMatchPlayRound', () => {
  it('returns true for match play round', () => {
    const round = createMockRound({ isMatchPlay: true });
    expect(isMatchPlayRound(round)).toBe(true);
  });

  it('returns false for non-match play round', () => {
    const round = createMockRound({ isMatchPlay: false });
    expect(isMatchPlayRound(round)).toBe(false);
  });

  it('returns false when isMatchPlay is undefined', () => {
    const round = createMockRound();
    expect(isMatchPlayRound(round)).toBe(false);
  });
});

describe('getMostRecentRound', () => {
  it('returns in-progress round over completed rounds', () => {
    const active = createMockRound({ status: 'in-progress' });
    const completed = createMockRound({
      status: 'completed',
      completedAt: '2024-01-01T00:00:00Z',
    });
    expect(getMostRecentRound([completed, active])).toEqual(active);
  });

  it('returns most recently completed round when no active round', () => {
    const older = createMockRound({
      status: 'completed',
      completedAt: '2024-01-01T00:00:00Z',
    });
    const newer = createMockRound({
      status: 'completed',
      completedAt: '2024-06-01T00:00:00Z',
    });
    expect(getMostRecentRound([older, newer])).toEqual(newer);
  });

  it('returns undefined for empty array', () => {
    expect(getMostRecentRound([])).toBeUndefined();
  });

  it('returns undefined when all rounds are created status', () => {
    const round = createMockRound({ status: 'created' });
    expect(getMostRecentRound([round])).toBeUndefined();
  });
});

describe('getCompletedRounds', () => {
  it('filters to only completed rounds', () => {
    const completed = createMockRound({ status: 'completed' });
    const inProgress = createMockRound({ status: 'in-progress' });
    const created = createMockRound({ status: 'created' });
    const result = getCompletedRounds([completed, inProgress, created]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(completed);
  });

  it('returns empty array when no completed rounds', () => {
    const round = createMockRound({ status: 'created' });
    expect(getCompletedRounds([round])).toHaveLength(0);
  });

  it('includes rounds with completedAt even if status differs', () => {
    const round = createMockRound({
      status: 'in-progress',
      completedAt: '2024-01-01T00:00:00Z',
    });
    expect(getCompletedRounds([round])).toHaveLength(1);
  });
});
