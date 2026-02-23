import { PlayFormat } from "@/types";

interface FormatExplainerProps {
  format: PlayFormat;
  variant?: "inline" | "card";
}

interface FormatInfo {
  name: string;
  icon: string;
  description: string;
  example: string;
  bestFor: string;
}

export const FormatExplainer = ({
  format,
  variant = "inline",
}: FormatExplainerProps) => {
  const formatInfo: Record<PlayFormat, FormatInfo> = {
    "stroke-play": {
      name: "Stroke Play",
      icon: "⛳",
      description:
        "Traditional golf scoring where every stroke counts. The player with the lowest total score wins.",
      example: "Player A shoots 72, Player B shoots 75. Player A wins.",
      bestFor: "Individual competitions and tournaments",
    },
    "match-play": {
      name: "Match Play",
      icon: "⚔️",
      description:
        "Head-to-head competition where you win individual holes. The player who wins more holes wins the match.",
      example:
        "Player A wins holes 1-3, Player B wins holes 4-5. After 5 holes, A is 1-up.",
      bestFor: "Ryder Cup, competitive match-ups",
    },
    scramble: {
      name: "Scramble",
      icon: "🤝",
      description:
        "All team members hit, then play from the best shot location. Team-friendly and faster pace.",
      example:
        "4 players tee off, pick best drive, all hit from there. Repeat until holed.",
      bestFor: "Casual team events, charity tournaments",
    },
    "best-ball": {
      name: "Best Ball",
      icon: "🎯",
      description:
        "Each player plays their own ball. The team's score is the lowest score among members on each hole.",
      example: "On hole 1: A shoots 4, B shoots 5, C shoots 6. Team scores 4.",
      bestFor: "Competitive team play, club championships",
    },
    "foursomes-match-play": {
      name: "Foursome (Alternate Shot)",
      icon: "🔄",
      description:
        "Partners share one ball and alternate shots. One player drives odd holes, the other even holes.",
      example:
        "Player A tees off, B hits second shot, A hits third, etc. until holed.",
      bestFor: "Strategic team play, Ryder Cup format",
    },
    "four-ball-match-play": {
      name: "Four-Ball",
      icon: "⛳⛳",
      description:
        "Both partners play their own ball. The lower score between partners counts on each hole.",
      example:
        "Partner A shoots 4, Partner B shoots 5. Team scores 4 for that hole.",
      bestFor: "Competitive team match play",
    },
    skins: {
      name: "Skins",
      icon: "💰",
      description:
        "Each hole is worth a prize (skin). Player with the lowest score on a hole wins that skin. Ties carry over.",
      example: "Hole 1 ties - no winner. Hole 2: A wins (gets 2 skins worth).",
      bestFor: "Fun competitive rounds with betting",
    },
    "alternate-shot": {
      name: "Alternate Shot",
      icon: "🔄",
      description:
        "Partners share one ball and alternate shots. One player drives odd holes, the other even holes.",
      example:
        "Player A tees off, B hits second shot, A hits third, etc. until holed.",
      bestFor: "Strategic team play, Ryder Cup format",
    },
    "singles-match-play": {
      name: "Singles Match Play",
      icon: "👤",
      description:
        "One-on-one match play format. The player with the lowest score on each hole wins that hole.",
      example:
        "Player A wins hole 1, Player B wins hole 2. After 2 holes, A is 1-up.",
      bestFor: "Head-to-head competitions, Ryder Cup singles matches",
    },
  };

  const info = formatInfo[format];

  if (variant === "inline") {
    return (
      <div className="bg-blue-500/15 border border-blue-500/30 rounded-lg p-3 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-xl flex-shrink-0">{info.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-blue-400 font-medium mb-1">
              {info.name}: {info.description}
            </p>
            <p className="text-blue-300 text-xs italic">
              Example: {info.example}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
          <span className="text-2xl">{info.icon}</span>
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">{info.name}</h3>
          <p className="text-xs text-emerald-400 font-medium">{info.bestFor}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-white/70 text-sm leading-relaxed">
            {info.description}
          </p>
        </div>

        <div className="rounded-lg p-3">
          <p className="text-xs text-white/40 font-medium mb-1">
            How it works:
          </p>
          <p className="text-sm text-white/70 italic">{info.example}</p>
        </div>
      </div>
    </div>
  );
};
