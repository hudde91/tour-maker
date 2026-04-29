export type { PlayFormat } from "@tour-maker/shared";
import type { PlayFormat } from "@tour-maker/shared";
import type { RyderCupSession } from "@tour-maker/shared";

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
  "best-worst-combined": {
    name: "Best Ball vs. Worst Ball (Combined)",
    description:
      "Each team's hole score is its best ball + worst ball — both extremes count.",
    teamCompatible: true,
    icon: "⚖️",
  },
  "best-worst-alternating": {
    name: "Best Ball vs. Worst Ball (Alternating)",
    description:
      "Best ball counts on odd holes, worst ball on even holes — strategy shifts every hole.",
    teamCompatible: true,
    icon: "🔁",
  },
  "six-six-six": {
    name: "6-6-6",
    description:
      "Three formats in one round: best ball for 6 holes, worst ball for 6, combined for 6.",
    teamCompatible: true,
    icon: "🎲",
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
  "irish-drunk-golf": {
    name: "Irish Drunk Golf",
    description:
      "Stroke play with a twist — every score earns you sips of beer. Lowest score (and clearest head) wins.",
    teamCompatible: false,
    icon: "🍺",
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
        return "day1-foursomes";
      case "four-ball-match-play":
        return "day1-four-ball";
      case "singles-match-play":
        return "day3-singles";
      default:
        return null;
    }
  },
};
