interface BroadcastHeaderProps {
  tournamentName: string;
  subtitle: string;
  isLive?: boolean;
  roundInfo?: string;
}

export const BroadcastHeader = ({
  tournamentName,
  subtitle,
  isLive = false,
  roundInfo,
}: BroadcastHeaderProps) => {
  return (
    <div className="broadcast-header rounded-t-xl overflow-hidden">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400" />

      <div className="px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Tournament icon */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-emerald-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {tournamentName}
              </h2>
              <p className="text-xs sm:text-sm text-white/60">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {roundInfo && (
              <span className="hidden sm:inline-block text-xs text-white/50 bg-white/10 px-2 py-1 rounded font-medium">
                {roundInfo}
              </span>
            )}
            {isLive && <span className="broadcast-live">Live</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
