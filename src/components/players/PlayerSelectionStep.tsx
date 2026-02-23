import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useFriends, useAddFriend } from "../../hooks/useFriends";
import { useUserSearch } from "../../hooks/useUserSearch";
import { Player, Friend } from "../../types";
import { Search, UserPlus, Users, Star } from "lucide-react";

type AddMode = "registered" | "guest";

interface PlayerSelectionStepProps {
  selectedPlayers: Player[];
  onAddPlayer: (player: Player) => void;
  onRemovePlayer: (playerId: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting: boolean;
  isValid: boolean;
}

export const PlayerSelectionStep = ({
  selectedPlayers,
  onAddPlayer,
  onRemovePlayer,
  onSubmit,
  submitLabel,
  isSubmitting,
  isValid,
}: PlayerSelectionStepProps) => {
  const { user } = useAuth();
  const { data: friends = [] } = useFriends(user?.uid || null);
  const addFriendMutation = useAddFriend();

  const [mode, setMode] = useState<AddMode>("registered");
  const [searchTerm, setSearchTerm] = useState("");
  const [addAsFriend, setAddAsFriend] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestHandicap, setGuestHandicap] = useState("");

  const { data: searchResults = [], isLoading: isSearching } = useUserSearch(
    searchTerm,
    user?.uid
  );

  // Filter out players already selected
  const existingUserIds = new Set(
    selectedPlayers.filter((p) => p.userId).map((p) => p.userId)
  );
  const existingNames = new Set(
    selectedPlayers.map((p) => p.name.toLowerCase())
  );

  const filteredSearchResults = searchResults.filter(
    (r) => !existingUserIds.has(r.userId)
  );

  const filteredFriends = friends.filter(
    (f) => !existingUserIds.has(f.userId)
  );

  const handleAddRegisteredUser = async (userResult: {
    userId: string;
    playerName: string;
    handicap?: number;
  }) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: userResult.playerName,
      handicap: userResult.handicap,
      userId: userResult.userId,
    };
    onAddPlayer(newPlayer);

    // If "add as friend" is checked, save to friends list
    if (addAsFriend && user) {
      const alreadyFriend = friends.some(
        (f) => f.userId === userResult.userId
      );
      if (!alreadyFriend) {
        const friend: Friend = {
          userId: userResult.userId,
          playerName: userResult.playerName,
          handicap: userResult.handicap,
          addedAt: new Date().toISOString(),
        };
        try {
          await addFriendMutation.mutateAsync({
            userId: user.uid,
            friend,
          });
        } catch (error) {
          console.error("Failed to add friend:", error);
        }
      }
    }

    setSearchTerm("");
  };

  const handleAddFriend = (friend: Friend) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: friend.playerName,
      handicap: friend.handicap,
      userId: friend.userId,
    };
    onAddPlayer(newPlayer);
  };

  const handleAddGuest = () => {
    if (!guestName.trim() || !guestHandicap.trim()) return;

    const normalized = guestHandicap.replace(",", ".").trim();
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: guestName.trim(),
      handicap: normalized ? parseFloat(normalized) : undefined,
    };

    if (!existingNames.has(newPlayer.name.toLowerCase())) {
      onAddPlayer(newPlayer);
    }
    setGuestName("");
    setGuestHandicap("");
  };

  return (
    <div className="space-y-6">
      {/* Selected Players */}
      {selectedPlayers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/70">
            Selected Players ({selectedPlayers.length})
          </h3>
          <div className="space-y-2">
            {selectedPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold text-sm">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-white">
                      {player.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {player.handicap !== undefined && (
                        <span className="text-xs text-white/40">
                          HC {player.handicap}
                        </span>
                      )}
                      {player.userId ? (
                        <span className="text-xs text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                          Registered
                        </span>
                      ) : (
                        <span className="text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                          Guest
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemovePlayer(player.id)}
                  className="text-red-400 hover:text-red-800 p-1"
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
            ))}
          </div>
        </div>
      )}

      {/* Tab buttons */}
      <div className="flex border border-white/10 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setMode("registered")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
            mode === "registered"
              ? "text-emerald-400 bg-emerald-500/15"
              : "text-white/40 bg-white/5 hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4" />
          Registered User
        </button>
        <button
          type="button"
          onClick={() => setMode("guest")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
            mode === "guest"
              ? "text-emerald-400 bg-emerald-500/15"
              : "text-white/40 bg-white/5 hover:bg-white/5"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Guest
        </button>
      </div>

      {/* Registered User mode */}
      {mode === "registered" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 text-base"
              placeholder="Search by player name..."
            />
          </div>

          {/* Add as Friend checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addAsFriend}
              onChange={(e) => setAddAsFriend(e.target.checked)}
              className="w-4 h-4 rounded border-white/15 text-emerald-400 focus:ring-emerald-500"
            />
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-white/70">
              Add as Friend for easy access later
            </span>
          </label>

          {/* Search Results */}
          {searchTerm.trim().length >= 2 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Search Results
              </h3>
              {isSearching ? (
                <div className="text-center py-4 text-white/40 text-sm">
                  Searching...
                </div>
              ) : filteredSearchResults.length === 0 ? (
                <div className="text-center py-4 text-white/40 text-sm">
                  No users found matching "{searchTerm}"
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSearchResults.map((result) => {
                    const isFriend = friends.some(
                      (f) => f.userId === result.userId
                    );
                    return (
                      <button
                        key={result.userId}
                        type="button"
                        onClick={() => handleAddRegisteredUser(result)}
                        className="flex items-center justify-between w-full p-3 border border-white/10 rounded-lg hover:border-emerald-400/40 hover:bg-emerald-500/10 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-semibold text-sm">
                            {result.playerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-white text-sm">
                                {result.playerName}
                              </span>
                              {isFriend && (
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            {result.handicap !== undefined && (
                              <span className="text-xs text-white/40">
                                HC {result.handicap}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-emerald-400 text-sm font-medium">
                          Add
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Friends List */}
          {filteredFriends.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Friends
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {filteredFriends.map((friend) => (
                  <button
                    key={friend.userId}
                    type="button"
                    onClick={() => handleAddFriend(friend)}
                    className="flex items-center gap-2 p-3 border-2 border-white/10 rounded-lg hover:border-emerald-400/40 hover:bg-emerald-500/10 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-semibold text-sm">
                      {friend.playerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-white block truncate">
                        {friend.playerName}
                      </span>
                      {friend.handicap !== undefined && (
                        <span className="text-xs text-white/40">
                          HC {friend.handicap}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {searchTerm.trim().length < 2 && filteredFriends.length === 0 && (
            <div className="text-center py-6">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-white/40 text-sm">
                Search for registered users by name, or switch to Guest to add
                a player without an account.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Guest mode */}
      {mode === "guest" && (
        <div className="space-y-4">
          <div className="border border-white/10 rounded-lg p-3">
            <p className="text-sm text-white/50">
              Add a player without an account. You must provide their name and
              handicap.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Player Name *</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddGuest();
                }
              }}
              className="input-field text-base"
              placeholder="Enter full name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Golf Handicap *</label>
            <input
              type="number"
              value={guestHandicap}
              onChange={(e) => setGuestHandicap(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddGuest();
                }
              }}
              className="input-field text-base"
              placeholder="Enter handicap (0-54)"
              min="0"
              max="54"
              step="0.1"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
            />
            <p className="form-help">Required for guest players</p>
          </div>

          <button
            type="button"
            onClick={handleAddGuest}
            disabled={!guestName.trim() || !guestHandicap.trim()}
            className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Guest to List
          </button>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4 pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="submit-tournament-button"
        >
          {isSubmitting ? "Creating..." : submitLabel}
        </button>
      </div>
    </div>
  );
};
