/**
 * Simple in-memory cache for expensive calculations
 * Helps avoid redundant computation for leaderboards and scoring
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class CalculationCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxAge: number; // milliseconds

  constructor(maxAge: number = 5 * 60 * 1000) {
    // Default 5 minutes
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  /**
   * Get a cached value if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Get or compute a value
   */
  getOrCompute<T>(key: string, computeFn: () => T): T {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const computed = computeFn();
    this.set(key, computed);
    return computed;
  }

  /**
   * Invalidate specific cache entries by key pattern
   */
  invalidate(pattern?: string | RegExp): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (typeof pattern === "string") {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      } else {
        if (pattern.test(key)) {
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxAge: this.maxAge,
    };
  }
}

// Export singleton instance
export const calculationCache = new CalculationCache();

/**
 * Helper to create cache keys for different calculation types
 */
export const cacheKeys = {
  stableford: (tourId: string, playerId: string) =>
    `stableford:${tourId}:${playerId}`,

  matchesWon: (tourId: string, playerId: string) =>
    `matches:${tourId}:${playerId}`,

  teamLeaderboard: (tourId: string) => `team-leaderboard:${tourId}`,

  playerLeaderboard: (tourId: string, filters: string) =>
    `player-leaderboard:${tourId}:${filters}`,

  totalPar: (roundId: string) => `total-par:${roundId}`,
};

/**
 * Invalidate cache when tour data changes
 */
export const invalidateTourCache = (tourId: string) => {
  calculationCache.invalidate(tourId);
};
