// src/components/CaptainPairingInterface.tsx
import { useState } from "react";
import { Tour, Round } from "../types";
import { useCreateRyderCupSession } from "../hooks/useMatchPlay";

interface CaptainPairingInterfaceProps {
  tour: Tour;
  round: Round;
  isOpen: boolean;
  onClose: () => void;
}

interface Pairing {
  id: string;
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
}

export const CaptainPairingInterface = ({
  tour,
  round,
  isOpen,
  onClose,
}: CaptainPairingInterfaceProps) => {
  const createSession = useCreateRyderCupSession(tour.id, round.id);

  const [sessionType, setSessionType] = useState<
    "foursomes" | "four-ball" | "singles"
  >("foursomes");
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [currentPairing, setCurrentPairing] = useState<Pairing>({
    id: "",
    teamAPlayerIds: [],
    teamBPlayerIds: [],
  });

  if (!tour.teams || tour.teams.length !== 2) {
    return null;
  }

  const teamA = tour.teams[0];
  const teamB = tour.teams[1];
  const teamAPlayers = tour.players.filter((p) => p.teamId === teamA.id);
  const teamBPlayers = tour.players.filter((p) => p.teamId === teamB.id);

  const playersRequired = sessionType === "singles" ? 1 : 2;
  const sessionDisplayName = {
    foursomes: "Foursomes (Alternate Shot)",
    "four-ball": "Four-Ball (Best Ball)",
    singles: "Singles Matches",
  };

  const getAvailablePlayers = (teamId: string) => {
    const teamPlayers = teamId === teamA.id ? teamAPlayers : teamBPlayers;
    const usedPlayerIds = pairings.flatMap((p) =>
      teamId === teamA.id ? p.teamAPlayerIds : p.teamBPlayerIds
    );
    return teamPlayers.filter((player) => !usedPlayerIds.includes(player.id));
  };

  const addPairing = () => {
    if (
      currentPairing.teamAPlayerIds.length === playersRequired &&
      currentPairing.teamBPlayerIds.length === playersRequired
    ) {
      setPairings([
        ...pairings,
        { ...currentPairing, id: Date.now().toString() },
      ]);
      setCurrentPairing({
        id: "",
        teamAPlayerIds: [],
        teamBPlayerIds: [],
      });
    }
  };

  const removePairing = (pairingId: string) => {
    setPairings(pairings.filter((p) => p.id !== pairingId));
  };

  const handlePlayerSelection = (
    teamId: string,
    playerId: string,
    isSelected: boolean
  ) => {
    const isTeamA = teamId === teamA.id;
    const currentIds = isTeamA
      ? currentPairing.teamAPlayerIds
      : currentPairing.teamBPlayerIds;

    let newIds: string[];
    if (isSelected) {
      if (currentIds.length < playersRequired) {
        newIds = [...currentIds, playerId];
      } else {
        return; // Can't add more players
      }
    } else {
      newIds = currentIds.filter((id) => id !== playerId);
    }

    setCurrentPairing({
      ...currentPairing,
      [isTeamA ? "teamAPlayerIds" : "teamBPlayerIds"]: newIds,
    });
  };

  const createMatches = async () => {
    if (pairings.length === 0) return;

    try {
      await createSession.mutateAsync({
        sessionType,
        pairings,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create matches:", error);
    }
  };

  const resetPairings = () => {
    setPairings([]);
    setCurrentPairing({
      id: "",
      teamAPlayerIds: [],
      teamBPlayerIds: [],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full sm:w-[800px] sm:max-w-4xl bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border-t sm:border border-slate-200 animate-slide-up safe-area-bottom max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 sm:py-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Captain's Pairing Setup
            </h2>
            <p className="text-slate-600 mt-1 text-sm">
              Create matches for {round.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-6">
            {/* Session Type Selection */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">
                Match Format
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["foursomes", "four-ball", "singles"] as const).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSessionType(type);
                        resetPairings();
                      }}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        sessionType === type
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {type === "foursomes"
                            ? "🔄"
                            : type === "four-ball"
                            ? "⭐"
                            : "👤"}
                        </span>
                        <span className="font-medium text-slate-900 capitalize">
                          {sessionDisplayName[type]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {type === "singles"
                          ? "1 player per team"
                          : "2 players per team"}
                      </p>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Team Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: teamA.color }}
                  />
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {teamA.name}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {teamAPlayers.length} players available
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: teamB.color }}
                  />
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {teamB.name}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {teamBPlayers.length} players available
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Pairing Builder */}
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-4">
                Create New Pairing
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team A Selection */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: teamA.color }}
                    />
                    {teamA.name} Players
                  </h4>
                  <div className="space-y-2">
                    {getAvailablePlayers(teamA.id).map((player) => (
                      <label
                        key={player.id}
                        className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={currentPairing.teamAPlayerIds.includes(
                            player.id
                          )}
                          onChange={(e) =>
                            handlePlayerSelection(
                              teamA.id,
                              player.id,
                              e.target.checked
                            )
                          }
                          disabled={
                            !currentPairing.teamAPlayerIds.includes(
                              player.id
                            ) &&
                            currentPairing.teamAPlayerIds.length >=
                              playersRequired
                          }
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">
                            {player.name}
                          </div>
                          {player.handicap !== undefined && (
                            <div className="text-xs text-slate-500">
                              HC: {player.handicap}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Selected: {currentPairing.teamAPlayerIds.length} /{" "}
                    {playersRequired}
                  </div>
                </div>

                {/* Team B Selection */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: teamB.color }}
                    />
                    {teamB.name} Players
                  </h4>
                  <div className="space-y-2">
                    {getAvailablePlayers(teamB.id).map((player) => (
                      <label
                        key={player.id}
                        className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={currentPairing.teamBPlayerIds.includes(
                            player.id
                          )}
                          onChange={(e) =>
                            handlePlayerSelection(
                              teamB.id,
                              player.id,
                              e.target.checked
                            )
                          }
                          disabled={
                            !currentPairing.teamBPlayerIds.includes(
                              player.id
                            ) &&
                            currentPairing.teamBPlayerIds.length >=
                              playersRequired
                          }
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">
                            {player.name}
                          </div>
                          {player.handicap !== undefined && (
                            <div className="text-xs text-slate-500">
                              HC: {player.handicap}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Selected: {currentPairing.teamBPlayerIds.length} /{" "}
                    {playersRequired}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={addPairing}
                  disabled={
                    currentPairing.teamAPlayerIds.length !== playersRequired ||
                    currentPairing.teamBPlayerIds.length !== playersRequired
                  }
                  className="btn-primary disabled:opacity-50"
                >
                  Add Pairing
                </button>
              </div>
            </div>

            {/* Created Pairings */}
            {pairings.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-800 mb-4">
                  Created Pairings ({pairings.length})
                </h3>
                <div className="space-y-3">
                  {pairings.map((pairing, index) => (
                    <div
                      key={pairing.id}
                      className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-slate-900">
                            Match {index + 1}:
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-medium"
                              style={{ color: teamA.color }}
                            >
                              {pairing.teamAPlayerIds
                                .map(
                                  (id) =>
                                    tour.players.find((p) => p.id === id)?.name
                                )
                                .join(" & ")}
                            </span>
                            <span className="text-slate-400">vs</span>
                            <span
                              className="text-sm font-medium"
                              style={{ color: teamB.color }}
                            >
                              {pairing.teamBPlayerIds
                                .map(
                                  (id) =>
                                    tour.players.find((p) => p.id === id)?.name
                                )
                                .join(" & ")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removePairing(pairing.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="btn-secondary w-full sm:flex-1 py-3 sm:order-2"
            >
              Cancel
            </button>
            <button
              onClick={createMatches}
              disabled={createSession.isPending || pairings.length === 0}
              className="btn-primary w-full sm:flex-1 py-4 sm:py-3 text-lg sm:text-base disabled:opacity-50 sm:order-1"
            >
              {createSession.isPending
                ? "Creating Matches..."
                : `Create ${pairings.length} ${
                    pairings.length === 1 ? "Match" : "Matches"
                  }`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
