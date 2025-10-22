import { Player } from "../../types";

interface VisualPairingBoardProps {
  pairings: {
    id: string;
    teamAPlayerIds: string[];
    teamBPlayerIds: string[];
  }[];
  allPlayers: Player[];
  teamAName: string;
  teamBName: string;
  teamAColor?: string;
  teamBColor?: string;
  format: "singles" | "foursomes" | "four-ball";
  onRemovePairing?: (pairingId: string) => void;
  compact?: boolean;
}

export const VisualPairingBoard = ({
  pairings,
  allPlayers,
  teamAName,
  teamBName,
  teamAColor = "#1e40af",
  teamBColor = "#dc2626",
  format,
  onRemovePairing,
  compact = false,
}: VisualPairingBoardProps) => {
  const getPlayerName = (playerId: string) => {
    const player = allPlayers.find((p) => p.id === playerId);
    return player?.name || "Unknown Player";
  };

  const getPlayerHandicap = (playerId: string) => {
    const player = allPlayers.find((p) => p.id === playerId);
    return player?.handicap;
  };

  const formatIcon = format === "singles" ? "👤" : format === "foursomes" ? "🔄" : "⭐";
  const formatName = format === "singles" ? "Singles" : format === "foursomes" ? "Foursomes" : "Four-Ball";

  if (pairings.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
        <div className="text-4xl mb-3">{formatIcon}</div>
        <p className="text-slate-600">No pairings yet</p>
        <p className="text-sm text-slate-500 mt-1">
          Add players below to create {formatName.toLowerCase()} pairings
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{formatIcon}</span>
          <h3 className="font-semibold text-slate-900">
            {formatName} Pairings
          </h3>
        </div>
        <div className="text-sm text-slate-600">
          {pairings.length} {pairings.length === 1 ? "match" : "matches"}
        </div>
      </div>

      <div className="space-y-3">
        {pairings.map((pairing, index) => (
          <div
            key={pairing.id}
            className={`relative bg-white border-2 border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all ${
              compact ? "p-3" : "p-4"
            }`}
          >
            {/* Match Number Badge */}
            <div className="absolute top-2 left-2 bg-slate-900 text-white text-xs font-semibold px-2 py-1 rounded">
              Match {index + 1}
            </div>

            {/* Remove Button */}
            {onRemovePairing && (
              <button
                onClick={() => onRemovePairing(pairing.id)}
                className="absolute top-2 right-2 bg-red-100 hover:bg-red-200 text-red-600 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                title="Remove pairing"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            <div
              className={`flex items-center justify-between ${compact ? "mt-6" : "mt-8"}`}
            >
              {/* Team A Side */}
              <div className="flex-1">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-2"
                  style={{ backgroundColor: `${teamAColor}20` }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: teamAColor }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: teamAColor }}
                  >
                    {teamAName}
                  </span>
                </div>

                <div className="space-y-1">
                  {pairing.teamAPlayerIds.map((playerId) => (
                    <div
                      key={playerId}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: teamAColor }}
                      >
                        {getPlayerName(playerId).charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {getPlayerName(playerId)}
                        </div>
                        {getPlayerHandicap(playerId) !== undefined && (
                          <div className="text-xs text-slate-500">
                            HCP: {getPlayerHandicap(playerId)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* VS Divider */}
              <div className="mx-4 flex flex-col items-center">
                <div className="bg-slate-200 text-slate-600 font-bold text-xs px-2 py-1 rounded">
                  VS
                </div>
              </div>

              {/* Team B Side */}
              <div className="flex-1 text-right">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-2"
                  style={{ backgroundColor: `${teamBColor}20` }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: teamBColor }}
                  >
                    {teamBName}
                  </span>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: teamBColor }}
                  />
                </div>

                <div className="space-y-1">
                  {pairing.teamBPlayerIds.map((playerId) => (
                    <div
                      key={playerId}
                      className="flex items-center gap-2 justify-end text-sm"
                    >
                      <div className="text-right">
                        <div className="font-semibold text-slate-900">
                          {getPlayerName(playerId)}
                        </div>
                        {getPlayerHandicap(playerId) !== undefined && (
                          <div className="text-xs text-slate-500">
                            HCP: {getPlayerHandicap(playerId)}
                          </div>
                        )}
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: teamBColor }}
                      >
                        {getPlayerName(playerId).charAt(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
