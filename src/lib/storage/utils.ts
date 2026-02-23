import { HoleInfo } from "../../types";

/**
 * Storage utility functions
 * Helper functions for storage operations
 */

/**
 * Generate default hole information for a round
 */
export const generateDefaultHoles = (numHoles: number): HoleInfo[] => {
  const holes: HoleInfo[] = [];
  const standardPars = [4, 4, 3, 4, 5, 4, 3, 4, 4, 4, 4, 3, 5, 4, 3, 4, 4, 5]; // Standard 18-hole layout

  // Proper handicap ratings based on hole difficulty (1 = hardest, 18 = easiest)
  // These represent typical difficulty ordering for a golf course
  const standardHandicaps = [
    10, 8, 16, 2, 14, 4, 18, 12, 6, 11, 5, 17, 1, 9, 15, 3, 13, 7,
  ];

  for (let i = 1; i <= numHoles; i++) {
    holes.push({
      number: i,
      par:
        numHoles === 9
          ? i % 6 === 0
            ? 3
            : i % 5 === 0
            ? 5
            : 4
          : standardPars[i - 1] || 4,
      handicap:
        numHoles === 9
          ? ((i - 1) % 9) + 1 // For 9 holes: 1-9 in order
          : standardHandicaps[i - 1] || i, // Use proper difficulty-based handicaps for 18 holes
    });
  }

  return holes;
};
