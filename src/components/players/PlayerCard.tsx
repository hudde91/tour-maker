import { useState, memo } from "react";
import { Player, Tour } from "../../types";
import { useRemovePlayer, useUpdatePlayer } from "../../hooks/usePlayers";
import { ConfirmDialog } from "../ui/ConfirmDialog";

interface PlayerCardProps {
  player: Player;
  tour: Tour;
  showTeamInfo?: boolean;
}

// Memoize PlayerCard to prevent unnecessary re-renders when other players in the list change
const PlayerCardComponent = ({
  player,
  tour,
  showTeamInfo = true,
}: PlayerCardProps) => {
  const removePlayer = useRemovePlayer(tour.id);
  const updatePlayer = useUpdatePlayer(tour.id);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editData, setEditData] = useState({
    name: player.name,
    handicap: player.handicap?.toString() || "",
  });

  const team = tour.teams?.find((t) => t.id === player.teamId);
  const isCaptain = team?.captainId === player.id;

  const handleEdit = async () => {
    if (isEditing) {
      // Save changes
      try {
        const normalized = (editData.handicap ?? "")
          .toString()
          .replace(",", ".")
          .trim();
        await updatePlayer.mutateAsync({
          ...player,
          name: editData.name.trim(),
          handicap: normalized ? parseFloat(normalized) : undefined,
        });
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update player:", error);
      }
    } else {
      // Start editing
      setIsEditing(true);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await removePlayer.mutateAsync(player.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Failed to remove player:", error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const cancelEdit = () => {
    setEditData({
      name: player.name,
      handicap: player.handicap?.toString() || "",
    });
    setIsEditing(false);
  };

  return (
    <>
      <div className="card hover:shadow-elevated transition-all duration-200">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Player Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="input-field text-lg font-semibold"
                    placeholder="Player name"
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-white/50">
                      Handicap:
                    </label>
                    <input
                      type="number"
                      value={editData.handicap}
                      onChange={(e) =>
                        setEditData({ ...editData, handicap: e.target.value })
                      }
                      className="input-field w-20 text-center"
                      placeholder="0.0"
                      min="0"
                      max="54"
                      step="0.1"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white truncate">
                      {player.name}
                    </h3>
                    {isCaptain && (
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold border border-amber-200">
                        Captain
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    {player.handicap !== undefined && (
                      <div className="flex items-center gap-2 text-white/50">
                        <svg
                          className="w-4 h-4 text-white/30"
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
                        <span className="font-medium">
                          Handicap: {player.handicap?.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {showTeamInfo && team && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-medium text-white/70">
                          {team.name}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            {isEditing ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="p-2 text-white/30 hover:text-white/50 hover:bg-white/10 rounded-lg transition-colors"
                  title="Cancel"
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
                <button
                  onClick={handleEdit}
                  disabled={updatePlayer.isPending || !editData.name.trim()}
                  className="p-2 text-emerald-400 hover:text-emerald-400 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Save"
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="p-2 text-white/30 hover:text-white/50 hover:bg-white/10 rounded-lg transition-colors"
                  title="Edit player"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={removePlayer.isPending}
                  className="p-2 text-red-400 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove player"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Remove Player"
        message={`Remove ${player.name} from the tournament? This action cannot be undone.`}
        confirmLabel="Remove Player"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDestructive={true}
      />
    </>
  );
};

// Export memoized component with custom comparison function
export const PlayerCard = memo(PlayerCardComponent, (prevProps, nextProps) => {
  // Only re-render if player data, tour teams, or showTeamInfo changes
  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.player.name === nextProps.player.name &&
    prevProps.player.handicap === nextProps.player.handicap &&
    prevProps.player.teamId === nextProps.player.teamId &&
    prevProps.showTeamInfo === nextProps.showTeamInfo &&
    // Check if team data has changed (for captain status and team info)
    JSON.stringify(prevProps.tour.teams) === JSON.stringify(nextProps.tour.teams)
  );
});
