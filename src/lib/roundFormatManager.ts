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

// Format detection and configuration
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
      if (round.settings.teamScoring === "scramble") {
        return {
          type: "scramble",
          displayName: "Team Scramble",
          description: "All players hit, choose best shot, repeat",
          isTeamBased: true,
          allowsHoleByHole: true,
          allowsTotalScore: true,
          requiresTeams: true,
        };
      }
      return {
        type: "best-ball",
        displayName: "Best Ball",
        description: "Count best individual score per hole",
        isTeamBased: true,
        allowsHoleByHole: true,
        allowsTotalScore: false,
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
export const calculateProgress = (tour: Tour, round: Round) => {
  const config = getFormatConfig(round);
  const { entities, count, type } = getScoringEntities(tour, config);

  let entitiesWithScores = 0;

  if (config.isTeamBased && tour.teams) {
    // Count teams with scores
    entitiesWithScores = tour.teams.filter((team) => {
      const teamScore = round.scores[`team_${team.id}`];
      return teamScore && teamScore.scores.some((score) => score > 0);
    }).length;
  } else {
    // Count players with scores
    entitiesWithScores = Object.keys(round.scores).filter((playerId) =>
      round.scores[playerId].scores.some((score) => score > 0)
    ).length;
  }

  return {
    completed: entitiesWithScores,
    total: count,
    percentage: count > 0 ? Math.round((entitiesWithScores / count) * 100) : 0,
    type,
  };
};
