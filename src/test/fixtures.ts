import { nanoid } from 'nanoid';
import type { Tour, Round, Player, Team, HoleInfo } from '@/types/core';
import type { PlayerScore } from '@/types/scoring';
import type { PlayFormat } from '@/types/formats';

/**
 * Test fixtures for creating mock data
 */

export const createMockPlayer = (overrides?: Partial<Player>): Player => ({
  id: nanoid(),
  name: 'Test Player',
  handicap: 18,
  ...overrides,
});

export const createMockTeam = (overrides?: Partial<Team>): Team => ({
  id: nanoid(),
  name: 'Test Team',
  captainId: nanoid(),
  playerIds: [],
  color: '#3b82f6',
  ...overrides,
});

export const createMockHoleInfo = (holeNumber: number): HoleInfo => ({
  number: holeNumber,
  par: 4,
  handicap: holeNumber,
  yardage: 400,
});

export const createMockPlayerScore = (
  playerId: string,
  holes: number = 18
): PlayerScore => ({
  playerId,
  scores: Array(holes).fill(null),
  totalScore: 0,
  totalToPar: 0,
});

export const createMockRound = (overrides?: Partial<Round>): Round => {
  const holes = overrides?.holes || 18;
  const holeInfo = Array.from({ length: holes }, (_, i) =>
    createMockHoleInfo(i + 1)
  );

  return {
    id: nanoid(),
    name: 'Round 1',
    courseName: 'Test Course',
    format: 'stroke-play' as PlayFormat,
    holes,
    holeInfo,
    scores: {},
    settings: {
      strokesGiven: false,
    },
    status: 'created',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
};

export const createMockTour = (overrides?: Partial<Tour>): Tour => ({
  id: nanoid(),
  name: 'Test Tour',
  format: 'individual',
  players: [],
  rounds: [],
  isActive: true,
  createdAt: new Date().toISOString(),
  shareableUrl: `tour/${nanoid()}`,
  ...overrides,
});

/**
 * Creates a complete tour setup with players, teams, and rounds
 */
export const createCompleteTourSetup = (config?: {
  playerCount?: number;
  teamCount?: number;
  roundCount?: number;
  format?: Tour['format'];
}) => {
  const { playerCount = 4, teamCount = 2, roundCount = 1, format = 'team' } = config || {};

  const players = Array.from({ length: playerCount }, (_, i) =>
    createMockPlayer({
      name: `Player ${i + 1}`,
      handicap: 10 + i * 2,
    })
  );

  const teams = Array.from({ length: teamCount }, (_, i) => {
    const teamPlayerIds = players
      .slice(i * Math.floor(playerCount / teamCount), (i + 1) * Math.floor(playerCount / teamCount))
      .map((p) => p.id);

    return createMockTeam({
      name: `Team ${i + 1}`,
      playerIds: teamPlayerIds,
    });
  });

  const rounds = Array.from({ length: roundCount }, () =>
    createMockRound({
      format: format === 'team' ? 'best-ball' : 'stroke-play',
    })
  );

  const tour = createMockTour({
    format,
    players,
    teams: format === 'team' ? teams : undefined,
    rounds,
  });

  return { tour, players, teams, rounds };
};

/**
 * Creates a round with scores filled in
 */
export const createRoundWithScores = (
  playerIds: string[],
  holes: number = 18
): Round => {
  const round = createMockRound({ holes });

  playerIds.forEach((playerId, playerIndex) => {
    const scores = Array.from({ length: holes }, (_, holeIndex) => {
      const par = round.holeInfo[holeIndex].par;
      // Vary scores: some pars, some birdies, some bogeys
      const variance = (holeIndex + playerIndex) % 3 - 1; // -1, 0, or 1
      return par + variance;
    });

    const totalScore = scores.reduce((sum, score) => sum + (score || 0), 0);
    const totalPar = round.holeInfo.reduce((sum, hole) => sum + hole.par, 0);

    round.scores[playerId] = {
      playerId,
      scores,
      totalScore,
      totalToPar: totalScore - totalPar,
    };
  });

  return round;
};
