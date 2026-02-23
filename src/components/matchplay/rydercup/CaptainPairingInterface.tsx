import { useCreateRyderCupSession } from "../../../hooks/useMatchPlay";
import { Tour, Round } from "../../../types";
import { useState, useMemo } from "react";
import { VisualPairingBoard } from "../../rydercup/VisualPairingBoard";

interface CaptainPairingInterfaceProps {
  tour: Tour;
  round: Round;
  onPaired?: () => void;
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
  onPaired,
  onClose,
}: CaptainPairingInterfaceProps) => {
  const createSession = useCreateRyderCupSession(tour.id, round.id);

  const sessionType: "foursomes" | "four-ball" | "singles" =
    round.format === "four-ball-match-play"
      ? "four-ball"
      : round.format === "singles-match-play"
      ? "singles"
      : "foursomes";

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

  const allPlayersPaired = useMemo(() => {
    const pairedTeamAIds = pairings.flatMap((p) => p.teamAPlayerIds);
    const pairedTeamBIds = pairings.flatMap((p) => p.teamBPlayerIds);
    return (
      pairedTeamAIds.length === teamAPlayers.length &&
      pairedTeamBIds.length === teamBPlayers.length
    );
  }, [pairings, teamAPlayers.length, teamBPlayers.length]);

  const addPairing = () => {
    if (
      currentPairing.teamAPlayerIds.length === playersRequired &&
      currentPairing.teamBPlayerIds.length === playersRequired
    ) {
      setPairings([
        ...pairings,
        { ...currentPairing, id: crypto.randomUUID() },
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
    if (pairings.length === 0 || !allPlayersPaired) return;

    try {
      await createSession.mutateAsync({
        sessionType,
        pairings,
      });
      onClose();
      onPaired?.();
    } catch (error) {
      console.error("Failed to create matches:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-elevated">
        <h3 className="font-semibold text-white/90 mb-3">Match Format</h3>
        <div className="p-4 rounded-lg border-2 border-emerald-500 bg-emerald-500/15">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">
              {sessionType === "foursomes"
                ? "🔄"
                : sessionType === "four-ball"
                ? "⭐"
                : "👤"}
            </span>
            <span className="font-medium text-white capitalize">
              {sessionDisplayName[sessionType]}
            </span>
          </div>
          <p className="text-xs text-white/50">
            {sessionType === "singles"
              ? "1 player per team"
              : "2 players per team"}
          </p>
        </div>
      </div>

      {/* Create New Pairing */}
      <div className="card-elevated">
        <h3 className="font-semibold text-white/90 mb-4">
          Create New Pairing
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: teamA.color }}
              />
              <div>
                <h4 className="font-semibold text-white">{teamA.name}</h4>
                <p className="text-xs text-white/50">
                  {getAvailablePlayers(teamA.id).length} players available
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: teamB.color }}
              />
              <div>
                <h4 className="font-semibold text-white">{teamB.name}</h4>
                <p className="text-xs text-white/50">
                  {getAvailablePlayers(teamB.id).length} players available
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-white/70 mb-3 flex items-center gap-2">
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
                  className="flex items-center gap-3 p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={currentPairing.teamAPlayerIds.includes(player.id)}
                    onChange={(e) =>
                      handlePlayerSelection(
                        teamA.id,
                        player.id,
                        e.target.checked
                      )
                    }
                    disabled={
                      !currentPairing.teamAPlayerIds.includes(player.id) &&
                      currentPairing.teamAPlayerIds.length >= playersRequired
                    }
                    className="w-4 h-4 text-emerald-400 rounded focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white">
                      {player.name}
                    </div>
                    {player.handicap !== undefined && (
                      <div className="text-xs text-white/40">
                        HC: {player.handicap}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <div className="text-xs text-white/40 mt-2">
              Selected: {currentPairing.teamAPlayerIds.length} /{" "}
              {playersRequired}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-white/70 mb-3 flex items-center gap-2">
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
                  className="flex items-center gap-3 p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={currentPairing.teamBPlayerIds.includes(player.id)}
                    onChange={(e) =>
                      handlePlayerSelection(
                        teamB.id,
                        player.id,
                        e.target.checked
                      )
                    }
                    disabled={
                      !currentPairing.teamBPlayerIds.includes(player.id) &&
                      currentPairing.teamBPlayerIds.length >= playersRequired
                    }
                    className="w-4 h-4 text-emerald-400 rounded focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white">
                      {player.name}
                    </div>
                    {player.handicap !== undefined && (
                      <div className="text-xs text-white/40">
                        HC: {player.handicap}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <div className="text-xs text-white/40 mt-2">
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

      {/* Created Pairings - Visual Board */}
      <div className="card-elevated">
        <VisualPairingBoard
          pairings={pairings}
          allPlayers={tour.players}
          teamAName={teamA.name}
          teamBName={teamB.name}
          teamAColor={teamA.color}
          teamBColor={teamB.color}
          format={sessionType}
          onRemovePairing={removePairing}
        />
      </div>

      {/* Status and warnings */}
      {pairings.length > 0 && !allPlayersPaired && (
        <div className="card-elevated bg-amber-500/15 border-amber-500/30">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 12.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <h4 className="font-semibold text-amber-400 mb-1">
                Not All Players Paired
              </h4>
              <p className="text-amber-300 text-sm">
                You need to pair all players before creating matches.{" "}
                {teamA.name}: {getAvailablePlayers(teamA.id).length} remaining,{" "}
                {teamB.name}: {getAvailablePlayers(teamB.id).length} remaining.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="card-elevated">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="btn-secondary w-full sm:flex-1 py-3"
          >
            Cancel
          </button>
          <button
            onClick={createMatches}
            disabled={
              createSession.isPending ||
              !allPlayersPaired ||
              pairings.length === 0
            }
            className="btn-primary w-full sm:flex-1 py-4 sm:py-3 text-lg sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createSession.isPending
              ? "Creating Matches..."
              : !allPlayersPaired
              ? "Pair All Players First"
              : `Create ${pairings.length} ${
                  pairings.length === 1 ? "Match" : "Matches"
                }`}
          </button>
        </div>
      </div>
    </div>
  );
};
