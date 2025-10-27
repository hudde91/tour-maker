import { useState } from "react";
import { Link } from "react-router-dom";
import { Team, Tour } from "../../types";
import {
  useUpdateTeam,
  useDeleteTeam,
  useAssignPlayerToTeam,
  useSetTeamCaptain,
  useReorderTeamPlayers,
} from "../../hooks/useTeams";
import { ConfirmDialog } from "../ui/ConfirmDialog";

interface TeamCardProps {
  team: Team;
  tour: Tour;
}

export const TeamCard = ({ team, tour }: TeamCardProps) => {
  const updateTeam = useUpdateTeam(tour.id);
  const deleteTeam = useDeleteTeam(tour.id);
  const assignPlayer = useAssignPlayerToTeam(tour.id);
  const setTeamCaptain = useSetTeamCaptain(tour.id);
  const reorderPlayers = useReorderTeamPlayers(tour.id);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(team.name);
  const [showPlayerAssignment, setShowPlayerAssignment] = useState(false);
  const [showCaptainSelect, setShowCaptainSelect] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "team" | "player";
    playerId?: string;
    playerName?: string;
  }>({
    isOpen: false,
    type: "team",
  });

  // Sort team players by their order in team.playerIds
  const teamPlayers = team.playerIds
    .map((playerId) => tour.players.find((p) => p.id === playerId))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);
  const captain = teamPlayers.find((player) => player.id === team.captainId);
  const unassignedPlayers = tour.players.filter((player) => !player.teamId);

  const handleSaveName = async () => {
    if (editName.trim() && editName !== team.name) {
      try {
        await updateTeam.mutateAsync({
          ...team,
          name: editName.trim(),
        });
      } catch (error) {
        console.error("Failed to update team:", error);
      }
    }
    setIsEditing(false);
  };

  const handleDeleteTeam = () => {
    setDeleteConfirm({
      isOpen: true,
      type: "team",
    });
  };

  const handleRemovePlayerClick = (playerId: string, playerName: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: "player",
      playerId,
      playerName,
    });
  };

  const confirmDelete = async () => {
    try {
      if (deleteConfirm.type === "team") {
        await deleteTeam.mutateAsync(team.id);
      } else if (deleteConfirm.type === "player" && deleteConfirm.playerId) {
        await assignPlayer.mutateAsync({
          playerId: deleteConfirm.playerId,
          teamId: null,
        });
      }
      setDeleteConfirm({ isOpen: false, type: "team" });
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, type: "team" });
  };

  const handleAssignPlayer = async (playerId: string) => {
    try {
      await assignPlayer.mutateAsync({ playerId, teamId: team.id });
      setShowPlayerAssignment(false);
    } catch (error) {
      console.error("Failed to assign player:", error);
    }
  };

  const handleChangeCaptain = async (newCaptainId: string) => {
    try {
      await setTeamCaptain.mutateAsync({
        teamId: team.id,
        captainId: newCaptainId,
      });
      setShowCaptainSelect(false);
    } catch (error) {
      console.error("Failed to change captain:", error);
    }
  };

  const handleMovePlayerUp = async (playerId: string) => {
    const currentIndex = team.playerIds.indexOf(playerId);
    if (currentIndex > 0) {
      const newPlayerIds = [...team.playerIds];
      [newPlayerIds[currentIndex - 1], newPlayerIds[currentIndex]] = [
        newPlayerIds[currentIndex],
        newPlayerIds[currentIndex - 1],
      ];
      try {
        await reorderPlayers.mutateAsync({
          teamId: team.id,
          playerIds: newPlayerIds,
        });
      } catch (error) {
        console.error("Failed to reorder players:", error);
      }
    }
  };

  const handleMovePlayerDown = async (playerId: string) => {
    const currentIndex = team.playerIds.indexOf(playerId);
    if (currentIndex < team.playerIds.length - 1) {
      const newPlayerIds = [...team.playerIds];
      [newPlayerIds[currentIndex], newPlayerIds[currentIndex + 1]] = [
        newPlayerIds[currentIndex + 1],
        newPlayerIds[currentIndex],
      ];
      try {
        await reorderPlayers.mutateAsync({
          teamId: team.id,
          playerIds: newPlayerIds,
        });
      } catch (error) {
        console.error("Failed to reorder players:", error);
      }
    }
  };

  return (
    <>
      <div className="card-elevated -mx-4">
        {/* Team Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 card-spacing">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Team Logo/Color */}
            <div
              className="w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{ backgroundColor: team.color }}
            >
              <span className="text-2xl md:text-3xl">👥</span>
            </div>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field text-xl font-bold w-full"
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      setEditName(team.name);
                      setIsEditing(false);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 truncate mb-1">
                    {team.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <span className="text-base">👥</span>
                      <span className="font-medium">
                        {teamPlayers.length} Players
                      </span>
                    </div>

                    {captain && (
                      <div className="flex items-center gap-1">
                        <span className="text-base">👑</span>
                        <span className="font-medium">
                          Captain: {captain.name}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to={`/tour/${tour.id}/team/${team.id}`}
              className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Team dashboard"
            >
              <span className="text-base">📊</span>
            </Link>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Edit team"
            >
              <span className="text-base">✏️</span>
            </button>
            <button
              onClick={handleDeleteTeam}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete team"
            >
              <span className="text-base">🗑️</span>
            </button>
          </div>
        </div>

        {/* Captain Management Section */}
        {teamPlayers.length > 0 && (
          <div className="card-spacing border-t border-slate-200">
            <button
              onClick={() => setShowCaptainSelect(!showCaptainSelect)}
              className="w-full flex items-center justify-between p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">👑</span>
                <span className="font-medium text-slate-900">
                  {captain ? `Captain: ${captain.name}` : "Select Captain"}
                </span>
              </div>
              <span className="text-slate-400">
                {showCaptainSelect ? "▲" : "▼"}
              </span>
            </button>

            {showCaptainSelect && (
              <div className="mt-3 space-y-2 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                {teamPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleChangeCaptain(player.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors border ${
                      team.captainId === player.id
                        ? "bg-amber-50 border-amber-300"
                        : "hover:bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-base">👤</span>
                        <span className="font-medium text-slate-900">
                          {player.name}
                        </span>
                      </div>
                      {team.captainId === player.id && (
                        <span className="text-amber-500 text-base">👑</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {teamPlayers.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center">
                  <span className="text-sm">👤</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 truncate">
                      {player.name}
                    </span>
                    {team.captainId === player.id && (
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold border border-amber-200">
                        👑 Captain
                      </span>
                    )}
                  </div>
                  {player.handicap !== undefined && (
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <span className="text-xs">⛳</span>
                      Handicap: {player.handicap}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleRemovePlayerClick(player.id, player.name)
                  }
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-full font-medium transition-colors border border-red-200"
                  title="Remove from team"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Add Player Section */}
          {unassignedPlayers.length > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowPlayerAssignment(!showPlayerAssignment)}
                className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all font-medium"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-base">➕</span>
                  Add Player to Team
                </div>
              </button>

              {/* Player Assignment Dropdown */}
              {showPlayerAssignment && (
                <div className="mt-3 space-y-2 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                  <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <span className="text-base">👥</span>
                    Available Players:
                  </div>
                  {unassignedPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleAssignPlayer(player.id)}
                      className="w-full text-left p-3 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 hover:border-emerald-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-base">👤</span>
                          <div>
                            <div className="font-medium text-slate-900">
                              {player.name}
                            </div>
                            {player.handicap !== undefined && (
                              <div className="text-sm text-slate-500 flex items-center gap-1">
                                <span className="text-xs">⛳</span>
                                Handicap: {player.handicap}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-emerald-500 text-base">➕</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.type === "team" ? "Delete Team" : "Remove Player"}
        message={
          deleteConfirm.type === "team"
            ? `Delete team "${team.name}"? All players will be unassigned.`
            : `Remove ${deleteConfirm.playerName} from team "${team.name}"?`
        }
        confirmLabel={
          deleteConfirm.type === "team" ? "Delete Team" : "Remove Player"
        }
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDestructive={true}
      />
    </>
  );
};
