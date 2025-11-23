import { nanoid } from 'nanoid';
import { Tour, Player, Round, Team, TourFormat } from '../types';
import { generatePlayerCode } from './deviceIdentity';
import { storage } from './storage';

const FIRST_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
  'Thomas', 'Charles', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth',
  'Susan', 'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret',
  'Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'
];

const COURSE_NAMES = [
  'Pebble Beach Golf Links',
  'Augusta National Golf Club',
  'St Andrews Old Course',
  'Pinehurst No. 2',
  'Oakmont Country Club',
  'Cypress Point Club',
  'Shinnecock Hills Golf Club',
  'Merion Golf Club',
  'Winged Foot Golf Club',
  'Pacific Dunes'
];

const TEAM_NAMES = [
  'Eagles', 'Birdies', 'Aces', 'Drivers', 'Putters', 'Iron Men',
  'Par Seekers', 'Fairway Legends', 'Green Giants', 'Bogey Hunters'
];

const TEAM_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
];

/**
 * Generates a random player name
 */
function generatePlayerName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

/**
 * Generates a random handicap (0-36)
 */
function generateHandicap(): number {
  return Math.floor(Math.random() * 37);
}

/**
 * Generates a random score for a hole based on par
 */
function generateScore(par: number, handicap: number): number {
  // Better players (lower handicap) tend to score closer to par
  const skillFactor = handicap / 36;
  const variance = 1 + Math.floor(skillFactor * 3);

  // Most scores will be within +/- variance of par
  const score = par + Math.floor(Math.random() * (variance * 2 + 1)) - variance;

  // Ensure minimum score is 2 (eagle on par 4+)
  return Math.max(2, score);
}

/**
 * Generates standard 18-hole course info
 */
function generateHoleInfo(): Round['holeInfo'] {
  const holes = [];
  const parSequence = [4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4]; // Typical course

  for (let i = 0; i < 18; i++) {
    holes.push({
      number: i + 1,
      par: parSequence[i],
      yardage: parSequence[i] === 3 ? 160 + Math.floor(Math.random() * 80) :
               parSequence[i] === 4 ? 350 + Math.floor(Math.random() * 100) :
               500 + Math.floor(Math.random() * 100),
      handicap: i + 1,
      closestToPin: parSequence[i] === 3 && Math.random() > 0.5, // Some par 3s
      longestDrive: parSequence[i] === 4 && i < 9 && Math.random() > 0.7, // Some par 4s
    });
  }

  return holes;
}

/**
 * Generates mock players
 */
function generatePlayers(count: number): Player[] {
  const players: Player[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name = generatePlayerName();

    // Ensure unique names
    while (usedNames.has(name)) {
      name = generatePlayerName();
    }
    usedNames.add(name);

    players.push({
      id: nanoid(),
      name,
      handicap: generateHandicap(),
      playerCode: generatePlayerCode(),
    });
  }

  return players;
}

/**
 * Generates teams and assigns players
 */
function generateTeams(players: Player[], teamCount: number): Team[] {
  const teams: Team[] = [];
  const playersPerTeam = Math.floor(players.length / teamCount);

  for (let i = 0; i < teamCount; i++) {
    const teamPlayers = players.slice(i * playersPerTeam, (i + 1) * playersPerTeam);

    teams.push({
      id: nanoid(),
      name: TEAM_NAMES[i % TEAM_NAMES.length],
      captainId: teamPlayers[0]?.id || '',
      playerIds: teamPlayers.map(p => p.id),
      color: TEAM_COLORS[i % TEAM_COLORS.length],
    });

    // Assign team ID to players
    teamPlayers.forEach(player => {
      player.teamId = teams[i].id;
    });
  }

  return teams;
}

/**
 * Generates scores for a round
 */
function generateRoundScores(
  players: Player[],
  holeInfo: Round['holeInfo'],
  isComplete: boolean
): Round['scores'] {
  const scores: Round['scores'] = {};

  players.forEach(player => {
    const playerScores: (number | null)[] = [];
    const holesPlayed = isComplete ? 18 : Math.floor(Math.random() * 9) + 9; // 9-18 holes for ongoing

    for (let i = 0; i < 18; i++) {
      if (i < holesPlayed) {
        playerScores.push(generateScore(holeInfo[i].par, player.handicap || 18));
      } else {
        playerScores.push(null);
      }
    }

    const totalScore = playerScores.reduce((sum, s) => sum + (s || 0), 0);
    const totalPar = holeInfo.reduce((sum, h) => sum + h.par, 0);

    scores[player.id] = {
      playerId: player.id,
      scores: playerScores,
      totalScore,
      totalToPar: totalScore - totalPar,
    };
  });

  return scores;
}

/**
 * Generates competition winners for a round
 */
function generateCompetitionWinners(
  players: Player[],
  holeInfo: Round['holeInfo']
): Round['competitionWinners'] {
  const closestToPin: Record<number, Array<{ playerId: string; distance?: number }>> = {};
  const longestDrive: Record<number, Array<{ playerId: string; distance?: number }>> = {};

  holeInfo.forEach(hole => {
    if (hole.closestToPin) {
      const winner = players[Math.floor(Math.random() * players.length)];
      closestToPin[hole.number] = [{
        playerId: winner.id,
        distance: Math.floor(Math.random() * 20) + 1, // 1-20 feet
      }];
    }

    if (hole.longestDrive) {
      const winner = players[Math.floor(Math.random() * players.length)];
      longestDrive[hole.number] = [{
        playerId: winner.id,
        distance: Math.floor(Math.random() * 50) + 250, // 250-300 yards
      }];
    }
  });

  return { closestToPin, longestDrive };
}

export interface MockTournamentOptions {
  playerCount: number;
  format: TourFormat;
  roundCount: number;
  completedRounds: number;
}

/**
 * Generates a complete mock tournament
 */
export function generateMockTournament(options: MockTournamentOptions): Tour {
  const { playerCount, format, roundCount, completedRounds } = options;

  const players = generatePlayers(playerCount);
  let teams: Team[] | undefined;

  // Generate teams for team formats
  if (format === 'team' || format === 'ryder-cup') {
    const teamCount = format === 'ryder-cup' ? 2 : Math.ceil(playerCount / 4);
    teams = generateTeams(players, teamCount);
  }

  // Generate rounds
  const rounds: Round[] = [];
  for (let i = 0; i < roundCount; i++) {
    const isComplete = i < completedRounds;
    const holeInfo = generateHoleInfo();
    const courseName = COURSE_NAMES[i % COURSE_NAMES.length];

    // Determine format based on tournament type
    let roundFormat: Round['format'];
    if (format === 'team') {
      roundFormat = 'best-ball';
    } else if (format === 'ryder-cup') {
      // Ryder Cup rounds will be match play, but for now use stroke-play
      // TODO: Generate proper match play rounds for Ryder Cup
      roundFormat = 'stroke-play';
    } else {
      roundFormat = 'stroke-play';
    }

    // Select 1-4 random players for this round
    const playersInRound = Math.min(Math.floor(Math.random() * 4) + 1, players.length);
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const selectedPlayers = shuffled.slice(0, playersInRound);

    const round: Round = {
      id: nanoid(),
      name: `Round ${i + 1}`,
      courseName,
      format: roundFormat,
      holes: 18,
      holeInfo,
      totalPar: holeInfo.reduce((sum, h) => sum + h.par, 0),
      playerIds: selectedPlayers.map(p => p.id), // Only 1-4 players per round
      settings: {
        strokesGiven: true,
        stablefordScoring: false,
      },
      createdAt: new Date(Date.now() - (roundCount - i) * 86400000).toISOString(),
      status: isComplete ? 'completed' : (i === completedRounds ? 'in-progress' : 'created'),
      scores: generateRoundScores(selectedPlayers, holeInfo, isComplete), // Only selected players
      competitionWinners: generateCompetitionWinners(selectedPlayers, holeInfo), // Only selected players
    };

    if (isComplete) {
      round.completedAt = new Date(Date.now() - (roundCount - i - 1) * 86400000).toISOString();
    }

    rounds.push(round);
  }

  const tour: Tour = {
    id: nanoid(),
    name: `${format.charAt(0).toUpperCase() + format.slice(1)} Tournament`,
    description: 'Mock tournament generated for testing',
    format,
    createdAt: new Date(Date.now() - roundCount * 86400000).toISOString(),
    shareableUrl: nanoid(10),
    players,
    teams,
    rounds,
    isActive: true,
  };

  return tour;
}

/**
 * Creates and saves a mock tournament
 */
export function createMockTournament(options: MockTournamentOptions): Tour {
  const tour = generateMockTournament(options);
  storage.saveTour(tour);
  return tour;
}
