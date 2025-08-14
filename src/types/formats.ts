import { RyderCupSession } from "./matchplay";

export type PlayFormat =
  | "stroke-play"
  | "match-play"
  | "scramble"
  | "best-ball"
  | "alternate-shot"
  | "skins"
  | "foursomes-match-play"
  | "four-ball-match-play"
  | "singles-match-play";

export const GOLF_FORMATS: Record<
  PlayFormat,
  {
    name: string;
    description: string;
    teamCompatible: boolean;
    icon: string;
    matchPlay?: boolean;
    ryderCup?: boolean;
    playersPerTeam?: number;
  }
> = {
  "stroke-play": {
    name: "Stroke Play",
    description: "Traditional golf - lowest total score wins",
    teamCompatible: true,
    icon: "🏌️‍♂️",
  },
  "match-play": {
    name: "Match Play",
    description: "Head-to-head competition, win holes to win match",
    teamCompatible: true,
    icon: "⚔️",
    matchPlay: true,
  },
  scramble: {
    name: "Scramble",
    description: "Team plays from the best shot each time",
    teamCompatible: true,
    icon: "🤝",
  },
  "best-ball": {
    name: "Best Ball",
    description: "Count the best individual score on each hole",
    teamCompatible: true,
    icon: "⭐",
  },
  "alternate-shot": {
    name: "Alternate Shot",
    description: "Partners take turns hitting the same ball",
    teamCompatible: true,
    icon: "🔄",
  },
  skins: {
    name: "Skins",
    description: "Win money/points for winning individual holes",
    teamCompatible: false,
    icon: "💰",
  },
  "foursomes-match-play": {
    name: "Foursomes",
    description:
      "Alternate shot match play - partners take turns, match play scoring",
    teamCompatible: true,
    icon: "🔄",
    matchPlay: true,
    ryderCup: true,
    playersPerTeam: 2,
  },
  "four-ball-match-play": {
    name: "Four-Ball",
    description:
      "Best ball match play - individual scores, best ball vs best ball",
    teamCompatible: true,
    icon: "⭐",
    matchPlay: true,
    ryderCup: true,
    playersPerTeam: 2,
  },
  "singles-match-play": {
    name: "Singles",
    description: "Individual match play - head to head competition",
    teamCompatible: false,
    icon: "👤",
    matchPlay: true,
    ryderCup: true,
    playersPerTeam: 1,
  },
};

export const formatUtils = {
  isMatchPlay: (format: PlayFormat): boolean => {
    return GOLF_FORMATS[format].matchPlay === true;
  },

  isRyderCupFormat: (format: PlayFormat): boolean => {
    return GOLF_FORMATS[format].ryderCup === true;
  },

  getPlayersPerTeam: (format: PlayFormat): number => {
    return GOLF_FORMATS[format].playersPerTeam || 1;
  },

  requiresTeams: (format: PlayFormat): boolean => {
    const playersPerTeam = formatUtils.getPlayersPerTeam(format);
    return playersPerTeam > 1 || format.includes("team");
  },

  getSessionFromFormat: (format: PlayFormat): RyderCupSession | null => {
    switch (format) {
      case "foursomes-match-play":
        return "day1-foursomes"; // default, can be overridden
      case "four-ball-match-play":
        return "day1-four-ball"; // default, can be overridden
      case "singles-match-play":
        return "day3-singles";
      default:
        return null;
    }
  },
};
