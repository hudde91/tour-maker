import { useState, useEffect } from "react";
import { Player } from "../../types";
import { getDeviceId, isPlayerClaimedByCurrentDevice, getClaimedPlayer } from "../../lib/deviceIdentity";
import { useClaimPlayer, useUnclaimPlayer } from "../../hooks/usePlayers";

interface PlayerClaimButtonProps {
  tourId: string;
  player: Player;
  compact?: boolean;
  allPlayers?: Player[];
}

export const PlayerClaimButton = ({
  tourId,
  player,
  compact = false,
  allPlayers,
}: PlayerClaimButtonProps) => {
  const claimPlayer = useClaimPlayer(tourId);
  const unclaimPlayer = useUnclaimPlayer(tourId);
  const [showCode, setShowCode] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);

  const isClaimed = !!player.claimedBy;
  const isClaimedByMe = isPlayerClaimedByCurrentDevice(player);

  // Check if user has claimed any player
  const myClaimedPlayer = allPlayers ? getClaimedPlayer(allPlayers) : null;
  const hasClaimedAnyPlayer = !!myClaimedPlayer;

  // Auto-show code when player is first claimed
  useEffect(() => {
    if (isClaimedByMe && justClaimed) {
      setShowCode(true);
      setJustClaimed(false);
    }
  }, [isClaimedByMe, justClaimed]);

  const handleClaim = async () => {
    try {
      await claimPlayer.mutateAsync({
        playerId: player.id,
        deviceId: getDeviceId(),
      });
      setJustClaimed(true);
    } catch (error) {
      console.error("Failed to claim player:", error);
      const errorMessage = error instanceof Error ? error.message : "They may already be claimed by another device.";
      alert(`Failed to claim player: ${errorMessage}`);
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
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
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
            <button
              onClick={handleUnclaim}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
            >
              Unclaim
            </button>
          )}
        </div>
        {!compact && player.playerCode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Your Player Code: <span className="font-mono text-lg">{player.playerCode}</span>
                </p>
                <p className="text-xs text-blue-700">
                  Use this code to claim yourself on other devices. Click "Enter Player Code" and type this code.
                </p>
              </div>
            </div>
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

  // If user has already claimed a different player, don't show claim button
  if (hasClaimedAnyPlayer) {
    return null;
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
