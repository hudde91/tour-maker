import { describe, it, expect } from 'vitest';
import { getScoreInfo } from './scoreUtils';

describe('getScoreInfo', () => {
  it('returns "No Score" for score of 0', () => {
    const info = getScoreInfo(0, 4);
    expect(info.name).toBe('No Score');
  });

  it('returns "No Score" for falsy score', () => {
    const info = getScoreInfo(undefined as unknown as number, 4);
    expect(info.name).toBe('No Score');
  });

  it('returns "Hole-in-One!" for score of 1', () => {
    const info = getScoreInfo(1, 3);
    expect(info.name).toContain('Hole-in-One');
  });

  it('returns "Double Eagle" for 3 or more under par', () => {
    const info = getScoreInfo(2, 5);
    expect(info.name).toBe('Double Eagle');
  });

  it('returns "Eagle" for 2 under par', () => {
    const info = getScoreInfo(2, 4);
    expect(info.name).toBe('Eagle');
  });

  it('returns "Birdie" for 1 under par', () => {
    const info = getScoreInfo(3, 4);
    expect(info.name).toBe('Birdie');
  });

  it('returns "Par" for even par', () => {
    const info = getScoreInfo(4, 4);
    expect(info.name).toBe('Par');
  });

  it('returns "Bogey" for 1 over par', () => {
    const info = getScoreInfo(5, 4);
    expect(info.name).toBe('Bogey');
  });

  it('returns "Double Bogey" for 2 over par', () => {
    const info = getScoreInfo(6, 4);
    expect(info.name).toBe('Double Bogey');
  });

  it('returns "+N" for 3+ over par', () => {
    const info = getScoreInfo(7, 4);
    expect(info.name).toBe('+3');
  });

  it('returns "+N" for 4 over par', () => {
    const info = getScoreInfo(8, 4);
    expect(info.name).toBe('+4');
  });

  it('returns correct info for par 3 birdie', () => {
    const info = getScoreInfo(2, 3);
    expect(info.name).toBe('Birdie');
  });

  it('returns correct info for par 5 eagle', () => {
    const info = getScoreInfo(3, 5);
    expect(info.name).toBe('Eagle');
  });

  it('includes appropriate CSS classes for each score type', () => {
    const par = getScoreInfo(4, 4);
    expect(par.bg).toContain('blue');
    expect(par.badgeColor).toContain('blue');

    const birdie = getScoreInfo(3, 4);
    expect(birdie.bg).toContain('red');

    const bogey = getScoreInfo(5, 4);
    expect(bogey.bg).toContain('orange');

    const eagle = getScoreInfo(2, 4);
    expect(eagle.bg).toContain('amber');
  });

  it('hole-in-one on par 3 returns Hole-in-One, not Eagle', () => {
    const info = getScoreInfo(1, 3);
    expect(info.name).toContain('Hole-in-One');
  });
});
