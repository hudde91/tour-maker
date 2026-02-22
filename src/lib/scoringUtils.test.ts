import { describe, it, expect } from 'vitest';
import { isFinitePos, safeMin, formatHoleScore } from './scoringUtils';

describe('isFinitePos', () => {
  it('returns true for positive finite numbers', () => {
    expect(isFinitePos(1)).toBe(true);
    expect(isFinitePos(100)).toBe(true);
    expect(isFinitePos(0.5)).toBe(true);
  });

  it('returns false for zero', () => {
    expect(isFinitePos(0)).toBe(false);
  });

  it('returns false for negative numbers', () => {
    expect(isFinitePos(-1)).toBe(false);
    expect(isFinitePos(-100)).toBe(false);
  });

  it('returns false for non-numbers', () => {
    expect(isFinitePos('5')).toBe(false);
    expect(isFinitePos(null)).toBe(false);
    expect(isFinitePos(undefined)).toBe(false);
    expect(isFinitePos(NaN)).toBe(false);
  });

  it('returns false for Infinity', () => {
    expect(isFinitePos(Infinity)).toBe(false);
    expect(isFinitePos(-Infinity)).toBe(false);
  });
});

describe('safeMin', () => {
  it('returns the minimum valid score', () => {
    expect(safeMin([3, 4, 5])).toBe(3);
  });

  it('filters out null and undefined', () => {
    expect(safeMin([null, 4, undefined, 3])).toBe(3);
  });

  it('returns null for empty array', () => {
    expect(safeMin([])).toBeNull();
  });

  it('returns null for array of all nulls', () => {
    expect(safeMin([null, null, undefined])).toBeNull();
  });

  it('returns the only valid score', () => {
    expect(safeMin([null, 5, null])).toBe(5);
  });

  it('filters out zero (not a valid positive score)', () => {
    expect(safeMin([0, 4, 5])).toBe(4);
  });

  it('filters out negative numbers', () => {
    expect(safeMin([-1, 3, 5])).toBe(3);
  });
});

describe('formatHoleScore', () => {
  it('formats a valid number as string', () => {
    expect(formatHoleScore(4)).toBe('4');
    expect(formatHoleScore(3)).toBe('3');
    expect(formatHoleScore(72)).toBe('72');
  });

  it('returns dash for undefined', () => {
    expect(formatHoleScore(undefined)).toBe('—');
  });

  it('returns dash for NaN', () => {
    expect(formatHoleScore(NaN)).toBe('—');
  });

  it('returns dash for Infinity', () => {
    expect(formatHoleScore(Infinity)).toBe('—');
  });

  it('formats zero as string', () => {
    expect(formatHoleScore(0)).toBe('0');
  });
});
