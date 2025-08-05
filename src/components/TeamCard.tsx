import { useState } from "react";
import { Team, Tour, Player } from "../types";
import {
  useUpdateTeam,
  useDeleteTeam,
  useAssignPlayerToTeam,
  useSetTeamCaptain,
} from "../hooks/useTeams";

interface TeamCardProps {
  team: Team;
  tour: Tour;
}

export const TeamCard = ({ team, tour }: TeamCardProps) => {
  const updateTeam = useUpdateTeam(tour.id);
  const deleteTeam = useDeleteTeam(tour.id);
  const assignPlayer = useAssignPlayerToTeam(tour.id);
  const setCaptain = useSetTeamCaptain(tour.id);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(team.name);
  const [showPlayerAssignment, setShowPlayerAssignment] = useState(false);

  const teamPlayers = tour.players.filter(
    (player) => player.teamId === team.id
  );
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

  const handleDeleteTeam = async () => {
    if (
      window.confirm(
        `Delete team "${team.name}"? All players will be unassigned.`
      )
    ) {
      try {
        await deleteTeam.mutateAsync(team.id);
      } catch (error) {
        console.error("Failed to delete team:", error);
      }
    }
  };

  const handleAssignPlayer = async (playerId: string) => {
    try {
      await assignPlayer.mutateAsync({ playerId, teamId: team.id });
    } catch (error) {
      console.error("Failed to assign player:", error);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    try {
      await assignPlayer.mutateAsync({ playerId, teamId: null });
    } catch (error) {
      console.error("Failed to remove player:", error);
    }
  };

  const handleSetCaptain = async (playerId: string) => {
    try {
      await setCaptain.mutateAsync({ teamId: team.id, captainId: playerId });
    } catch (error) {
      console.error("Failed to set captain:", error);
    }
  };

  return (
    <div className="card-elevated">
      {/* Team Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Team Logo/Color */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ backgroundColor: team.color }}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input-field text-xl font-bold"
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
                <h3 className="text-2xl font-bold text-slate-900 truncate mb-1">
                  {team.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span className="font-medium">
                      {teamPlayers.length} Players
                    </span>
                  </div>

                  {captain && (
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-amber-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3l14 9-14 9V3z"
                        />
                      </svg>
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit team"
          >
            <svg
              className="w-5 h-5"
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
            onClick={handleDeleteTeam}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete team"
          >
            <svg
              className="w-5 h-5"
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
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-caption bg-slate-100 px-2 py-1 rounded">
            {teamPlayers.length} / {tour.players.length}
          </span>
        </div>

        {teamPlayers.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
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

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {player.name}
                  </span>
                  {team.captainId === player.id && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold border border-amber-200">
                      Captain
                    </span>
                  )}
                </div>
                {player.handicap !== undefined && (
                  <span className="text-sm text-slate-500">
                    Handicap: {player.handicap}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {team.captainId !== player.id && (
                <button
                  onClick={() => handleSetCaptain(player.id)}
                  className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-full font-medium transition-colors border border-amber-200"
                  title="Make captain"
                >
                  Make Captain
                </button>
              )}
              <button
                onClick={() => handleRemovePlayer(player.id)}
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
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Player to Team
              </div>
            </button>

            {/* Player Assignment Dropdown */}
            {showPlayerAssignment && (
              <div className="mt-3 space-y-2 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                <div className="text-sm font-medium text-slate-700 mb-2">
                  Available Players:
                </div>
                {unassignedPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      handleAssignPlayer(player.id);
                      setShowPlayerAssignment(false);
                    }}
                    className="w-full text-left p-3 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 hover:border-emerald-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">
                          {player.name}
                        </div>
                        {player.handicap !== undefined && (
                          <div className="text-sm text-slate-500">
                            Handicap: {player.handicap}
                          </div>
                        )}
                      </div>
                      <svg
                        className="w-4 h-4 text-emerald-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
