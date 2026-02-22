export interface ScoreInfo {
  bg: string;
  text: string;
  name: string;
  badgeColor: string;
}

export const getScoreInfo = (score: number, par: number, isMatchPlay?: boolean): ScoreInfo => {
  if (score === 0 || !score) {
    return {
      bg: "bg-slate-500/15 border-slate-500/30",
      text: "text-slate-400",
      name: "No Score",
      badgeColor: "bg-slate-500/20 text-slate-400",
    };
  }

  if (score === 1) {
    return {
      bg: "bg-gradient-to-br from-purple-500/25 to-pink-500/25 border-purple-400/40 shadow-lg",
      text: "text-purple-300",
      name: "Hole-in-One! 🏌️‍♂️",
      badgeColor: "bg-purple-500 text-white",
    };
  }

  const scoreToPar = score - par;

  if (scoreToPar <= -3)
    return {
      bg: "bg-gradient-to-br from-purple-500/20 to-purple-500/30 border-purple-400/40 shadow-md",
      text: "text-purple-300",
      name: "Double Eagle",
      badgeColor: "bg-purple-500 text-white",
    };

  if (scoreToPar === -2)
    return {
      bg: "bg-gradient-to-br from-yellow-500/20 to-amber-500/25 border-amber-400/40 shadow-md",
      text: "text-amber-300",
      name: "Eagle",
      badgeColor: "bg-amber-500 text-white",
    };

  if (scoreToPar === -1)
    return {
      bg: "bg-gradient-to-br from-red-500/20 to-red-500/25 border-red-400/40 shadow-md",
      text: "text-red-300",
      name: "Birdie",
      badgeColor: "bg-red-500 text-white",
    };

  if (scoreToPar === 0)
    return {
      bg: "bg-gradient-to-br from-blue-500/20 to-blue-500/25 border-blue-400/40 shadow-md",
      text: "text-blue-300",
      name: "Par",
      badgeColor: "bg-blue-500 text-white",
    };

  if (scoreToPar === 1)
    return {
      bg: "bg-gradient-to-br from-orange-500/20 to-orange-500/25 border-orange-400/40 shadow-md",
      text: "text-orange-300",
      name: "Bogey",
      badgeColor: "bg-orange-500 text-white",
    };

  if (scoreToPar === 2)
    return {
      bg: "bg-gradient-to-br from-red-500/25 to-red-500/35 border-red-400/50 shadow-md",
      text: "text-red-300",
      name: "Double Bogey",
      badgeColor: "bg-red-600 text-white",
    };

  return {
    bg: "bg-gradient-to-br from-red-500/30 to-red-600/35 border-red-400/60 shadow-md",
    text: "text-red-300",
    name: `+${scoreToPar}`,
    badgeColor: "bg-red-700 text-white",
  };
};
