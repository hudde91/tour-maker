import { memo } from "react";

/**
 * Skeleton loader components for loading states
 * Provides better UX while data is being fetched or calculated
 */

interface SkeletonProps {
  className?: string;
}

const SkeletonBase = ({ className = "" }: SkeletonProps) => (
  <div
    className={`animate-pulse bg-slate-200 rounded ${className}`}
    aria-label="Loading..."
  />
);

export const Skeleton = memo(SkeletonBase);

// Leaderboard entry skeleton
export const LeaderboardEntrySkeleton = memo(() => (
  <div className="p-4 sm:p-5 bg-white border-2 border-slate-200 rounded-xl">
    <div className="flex items-center gap-4">
      {/* Position Badge */}
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />

      {/* Player Info */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0 space-y-2">
        <Skeleton className="h-8 w-16 ml-auto" />
        <Skeleton className="h-3 w-24 ml-auto" />
      </div>
    </div>
  </div>
));

LeaderboardEntrySkeleton.displayName = "LeaderboardEntrySkeleton";

// Player card skeleton
export const PlayerCardSkeleton = memo(() => (
  <div className="card">
    <div className="flex justify-between items-start">
      <div className="flex items-start gap-4 flex-1">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  </div>
));

PlayerCardSkeleton.displayName = "PlayerCardSkeleton";

// Round card skeleton
export const RoundCardSkeleton = memo(() => (
  <div className="bg-white rounded-xl border-2 border-slate-200 p-4 sm:p-5">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3 flex-1">
        <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      <Skeleton className="w-8 h-8 rounded-lg" />
    </div>

    <Skeleton className="h-8 w-48 mb-4 rounded-lg" />

    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="bg-slate-50 rounded-lg p-3">
        <Skeleton className="h-8 w-12 mx-auto mb-2" />
        <Skeleton className="h-3 w-16 mx-auto" />
      </div>
      <div className="bg-slate-50 rounded-lg p-3">
        <Skeleton className="h-8 w-12 mx-auto mb-2" />
        <Skeleton className="h-3 w-16 mx-auto" />
      </div>
      <div className="bg-slate-50 rounded-lg p-3">
        <Skeleton className="h-8 w-12 mx-auto mb-2" />
        <Skeleton className="h-3 w-16 mx-auto" />
      </div>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
));

RoundCardSkeleton.displayName = "RoundCardSkeleton";

// Generic list skeleton
interface SkeletonListProps {
  count?: number;
  itemComponent: React.ComponentType;
}

export const SkeletonList = memo(
  ({ count = 3, itemComponent: ItemComponent }: SkeletonListProps) => (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <ItemComponent key={index} />
      ))}
    </div>
  )
);

SkeletonList.displayName = "SkeletonList";

// Text skeleton with various sizes
export const TextSkeleton = memo(
  ({ className = "", lines = 1 }: { className?: string; lines?: number }) => (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className="h-4 w-full" />
      ))}
    </div>
  )
);

TextSkeleton.displayName = "TextSkeleton";
