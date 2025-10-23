import { Round, Tour } from "../types";

export type ScoringFormat =
  | "individual"
  | "scramble"
  | "best-ball"
  | "alternate-shot";

export interface FormatConfig {
  type: ScoringFormat;
  displayName: string;
  description: string;
  isTeamBased: boolean;
  allowsHoleByHole: boolean;
  allowsTotalScore: boolean;
  requiresTeams: boolean;
}

export const getFormatConfig = (round: Round): FormatConfig => {
  switch (round.format) {
    case "scramble":
      return {
        type: "scramble",
        displayName: "Team Scramble",
        description: "All players hit, choose best shot, repeat",
        isTeamBased: true,
        allowsHoleByHole: true,
        allowsTotalScore: true,
        requiresTeams: true,
      };

    case "best-ball":
      return {
        type: "best-ball",
        displayName: "Best Ball",
        description:
          "Players score individually, team uses best score per hole",
        isTeamBased: true,
        allowsHoleByHole: true,
        allowsTotalScore: true,
        requiresTeams: true,
      };

    case "alternate-shot":
      return {
        type: "alternate-shot",
        displayName: "Alternate Shot",
        description: "Partners take turns hitting same ball",
        isTeamBased: true,
        allowsHoleByHole: true,
        allowsTotalScore: true,
        requiresTeams: true,
      };

    case "foursomes-match-play":
      return {
        type: "alternate-shot",
        displayName: "Foursomes (Match Play)",
        description: "Partners alternate shots, match play",
        isTeamBased: true,
        allowsHoleByHole: true,
        allowsTotalScore: false,
        requiresTeams: true,
      };

    case "four-ball-match-play":
      return {
        type: "best-ball",
        displayName: "Four-Ball (Match Play)",
        description: "Best score per side counts, match play",
        isTeamBased: true,
        allowsHoleByHole: true,
        allowsTotalScore: false,
        requiresTeams: true,
      };

    case "singles-match-play":
      return {
        type: "individual",
        displayName: "Singles (Match Play)",
        description: "1v1 match play",
        isTeamBased: false,
        allowsHoleByHole: true,
        allowsTotalScore: false,
        requiresTeams: false,
      };

    default:
      return {
        type: "individual",
        displayName: "Individual",
        description: "Individual stroke play",
        isTeamBased: false,
        allowsHoleByHole: true,
        allowsTotalScore: true,
        requiresTeams: false,
      };
  }
};

// Validation functions
export const validateFormatSetup = (tour: Tour, round: Round): string[] => {
  const errors: string[] = [];
  const config = getFormatConfig(round);

  if (config.requiresTeams && (!tour.teams || tour.teams.length === 0)) {
    errors.push(`${config.displayName} format requires teams to be created`);
  }

  if (config.requiresTeams && tour.teams) {
    const playersWithoutTeams = tour.players.filter((p) => !p.teamId);
    if (playersWithoutTeams.length > 0) {
      errors.push(
        `${playersWithoutTeams.length} players are not assigned to teams`
      );
    }
  }

  return errors;
};

// Scoring entity helpers
export const getScoringEntities = (tour: Tour, config: FormatConfig) => {
  if (config.isTeamBased && tour.teams) {
    return {
      entities: tour.teams,
      type: "teams" as const,
      count: tour.teams.length,
    };
  }

  return {
    entities: tour.players,
    type: "players" as const,
    count: tour.players.length,
  };
};

// Progress calculation

// Progress calculation - update to handle best ball
export const calculateProgress = (tour: Tour, round: Round) => {
  const config = getFormatConfig(round);
  const { entities, count, type } = getScoringEntities(tour, config);

  let entitiesWithScores = 0;

  if (config.type === "scramble") {
    // Count teams with scores for scramble
    entitiesWithScores =
      tour.teams?.filter((team) => {
        const teamScore = round.scores[`team_${team.id}`];
        return teamScore && teamScore.scores.some((score) => score !== null && score > 0);
      }).length || 0;
  } else if (config.type === "best-ball") {
    // For best ball, count teams that have at least one player with scores
    entitiesWithScores =
      tour.teams?.filter((team) => {
        const teamPlayers = tour.players.filter((p) => p.teamId === team.id);
        return teamPlayers.some((player) => {
          const playerScore = round.scores[player.id];
          return playerScore && playerScore.scores.some((score) => score !== null && score > 0);
        });
      }).length || 0;
  } else {
    // Count individual players with scores
    entitiesWithScores = Object.keys(round.scores).filter((playerId) =>
      round.scores[playerId].scores.some((score) => score !== null && score > 0)
    ).length;
  }

  return {
    completed: entitiesWithScores,
    total: count,
    percentage: count > 0 ? Math.round((entitiesWithScores / count) * 100) : 0,
    type,
  };
};
