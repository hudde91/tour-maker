import { useState } from "react";
import { Player } from "../../types";
import { getDeviceId, isPlayerClaimedByCurrentDevice } from "../../lib/deviceIdentity";
import { useClaimPlayer, useUnclaimPlayer } from "../../hooks/usePlayers";

interface PlayerClaimButtonProps {
  tourId: string;
  player: Player;
  compact?: boolean;
}

export const PlayerClaimButton = ({
  tourId,
  player,
  compact = false,
}: PlayerClaimButtonProps) => {
  const claimPlayer = useClaimPlayer(tourId);
  const unclaimPlayer = useUnclaimPlayer(tourId);
  const [showCode, setShowCode] = useState(false);

  const isClaimed = !!player.claimedBy;
  const isClaimedByMe = isPlayerClaimedByCurrentDevice(player);

  const handleClaim = async () => {
    try {
      await claimPlayer.mutateAsync({
        playerId: player.id,
        deviceId: getDeviceId(),
      });
    } catch (error) {
      console.error("Failed to claim player:", error);
      alert("Failed to claim player. They may already be claimed by another device.");
    }
  };

  const handleUnclaim = async () => {
    if (confirm("Are you sure you want to unclaim this player?")) {
      try {
        await unclaimPlayer.mutateAsync(player.id);
      } catch (error) {
        console.error("Failed to unclaim player:", error);
        alert("Failed to unclaim player.");
      }
    }
  };

  if (isClaimedByMe) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>This is you</span>
        </div>
        {!compact && (
          <>
            <button
              onClick={() => setShowCode(!showCode)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {showCode ? "Hide Code" : "Show Code"}
            </button>
            <button
              onClick={handleUnclaim}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
            >
              Unclaim
            </button>
          </>
        )}
        {showCode && player.playerCode && (
          <div className="px-3 py-1.5 bg-slate-100 text-slate-900 rounded-lg text-sm font-mono font-bold">
            Code: {player.playerCode}
          </div>
        )}
      </div>
    );
  }

  if (isClaimed) {
    return (
      <div className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-sm">
        Claimed by another user
      </div>
    );
  }

  return (
    <button
      onClick={handleClaim}
      disabled={claimPlayer.isPending}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
    >
      {claimPlayer.isPending ? "Claiming..." : "Claim This Player"}
    </button>
  );
};
