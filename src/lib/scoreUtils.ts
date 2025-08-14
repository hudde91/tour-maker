export interface ScoreInfo {
  bg: string;
  text: string;
  name: string;
  badgeColor: string;
}

export const getScoreInfo = (score: number, par: number): ScoreInfo => {
  if (score === 0 || !score) {
    return {
      bg: "bg-slate-100 border-slate-200",
      text: "text-slate-400",
      name: "No Score",
      badgeColor: "bg-slate-100 text-slate-500",
    };
  }

  if (score === 1) {
    return {
      bg: "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300 shadow-lg",
      text: "text-purple-900",
      name: "Hole-in-One! 🏌️‍♂️",
      badgeColor: "bg-purple-500 text-white",
    };
  }

  const scoreToPar = score - par;

  if (scoreToPar <= -3)
    return {
      bg: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-md",
      text: "text-purple-900",
      name: "Double Eagle",
      badgeColor: "bg-purple-500 text-white",
    };

  if (scoreToPar === -2)
    return {
      bg: "bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-300 shadow-md",
      text: "text-amber-900",
      name: "Eagle",
      badgeColor: "bg-amber-500 text-white",
    };

  if (scoreToPar === -1)
    return {
      bg: "bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-md",
      text: "text-red-900",
      name: "Birdie",
      badgeColor: "bg-red-500 text-white",
    };

  if (scoreToPar === 0)
    return {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-md",
      text: "text-blue-900",
      name: "Par",
      badgeColor: "bg-blue-500 text-white",
    };

  if (scoreToPar === 1)
    return {
      bg: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 shadow-md",
      text: "text-orange-900",
      name: "Bogey",
      badgeColor: "bg-orange-500 text-white",
    };

  if (scoreToPar === 2)
    return {
      bg: "bg-gradient-to-br from-red-100 to-red-200 border-red-400 shadow-md",
      text: "text-red-900",
      name: "Double Bogey",
      badgeColor: "bg-red-600 text-white",
    };

  return {
    bg: "bg-gradient-to-br from-red-200 to-red-300 border-red-500 shadow-md",
    text: "text-red-900",
    name: `+${scoreToPar}`,
    badgeColor: "bg-red-700 text-white",
  };
};
