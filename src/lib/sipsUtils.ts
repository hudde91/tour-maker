import type { PlayerScore, Round } from "../types";

/**
 * Irish Drunk Golf scoring rules. Score-to-par determines a drinking penalty.
 * Hole-in-one and eagles let the player hand sips out instead of drinking;
 * everyone else takes the hit. We treat "finish beer" as 12 sips for the
 * running tally so you get a meaningful total even on a bad day.
 */
export interface SipsResult {
  /** Sips the player owes themselves. */
  sips: number;
  /** Short label, e.g. "Par", "Bogey", "Hole in One!". */
  label: string;
  /** Single emoji to lead the badge with. */
  emoji: string;
  /** Sips the player gives out to opponents (only on eagle / HIO). */
  sipsToGive: number;
  /** True for triple+ bogey — UI should show "Finish beer". */
  finishBeer: boolean;
  /** Tailwind background + text classes for the badge. */
  bg: string;
  text: string;
}

/** "Finish beer" is treated as ~12 sips for total accounting. */
export const FINISH_BEER_SIPS = 12;

/** Compute the drinking penalty for a single hole's score. */
export function computeSips(score: number, par: number): SipsResult {
  if (score === 1) {
    return {
      sips: 0,
      sipsToGive: 5,
      label: "Hole in One!",
      emoji: "🏆",
      finishBeer: false,
      bg: "bg-amber-500/15",
      text: "text-amber-300",
    };
  }
  const diff = score - par;
  if (diff <= -2) {
    return {
      sips: 0,
      sipsToGive: 2,
      label: "Eagle",
      emoji: "🦅",
      finishBeer: false,
      bg: "bg-amber-500/15",
      text: "text-amber-300",
    };
  }
  if (diff === -1) {
    return {
      sips: 0,
      sipsToGive: 0,
      label: "Birdie",
      emoji: "🐦",
      finishBeer: false,
      bg: "bg-emerald-500/15",
      text: "text-emerald-300",
    };
  }
  if (diff === 0) {
    return {
      sips: 1,
      sipsToGive: 0,
      label: "Par",
      emoji: "🍻",
      finishBeer: false,
      bg: "bg-blue-500/15",
      text: "text-blue-300",
    };
  }
  if (diff === 1) {
    return {
      sips: 2,
      sipsToGive: 0,
      label: "Bogey",
      emoji: "🍺",
      finishBeer: false,
      bg: "bg-amber-500/15",
      text: "text-amber-300",
    };
  }
  if (diff === 2) {
    return {
      sips: 4,
      sipsToGive: 0,
      label: "Double",
      emoji: "🍺",
      finishBeer: false,
      bg: "bg-orange-500/15",
      text: "text-orange-300",
    };
  }
  return {
    sips: FINISH_BEER_SIPS,
    sipsToGive: 0,
    label: "Finish your beer!",
    emoji: "💀",
    finishBeer: true,
    bg: "bg-red-500/15",
    text: "text-red-300",
  };
}

/** Sum sips owed by a player across every scored hole in a round. */
export function computeRoundSips(
  playerScore: PlayerScore | undefined,
  round: Pick<Round, "holeInfo">
): { sips: number; finishedBeers: number } {
  if (!playerScore) return { sips: 0, finishedBeers: 0 };
  let sips = 0;
  let finishedBeers = 0;
  playerScore.scores.forEach((score, i) => {
    if (score == null || score <= 0) return;
    const par = round.holeInfo[i]?.par ?? 4;
    const result = computeSips(score, par);
    sips += result.sips;
    if (result.finishBeer) finishedBeers += 1;
  });
  return { sips, finishedBeers };
}

/** Convenience for UI: returns "X sips" or "X sips · N 🍺" with finished-beer count. */
export function formatSipsTotal(sips: number, finishedBeers: number): string {
  const sipsLabel = `${sips} sip${sips === 1 ? "" : "s"}`;
  if (finishedBeers === 0) return sipsLabel;
  return `${sipsLabel} · ${finishedBeers} full 🍺`;
}
