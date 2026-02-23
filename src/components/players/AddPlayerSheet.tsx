import { useState, useEffect } from "react";
import { useAddPlayer } from "../../hooks/usePlayers";
import { useFriends, useAddFriend } from "../../hooks/useFriends";
import { useUserSearch } from "../../hooks/useUserSearch";
import { useAuth } from "../../contexts/AuthContext";
import { useKeyboardAwareScroll } from "../../hooks/useKeyboardAwareScroll";
import { Tour, Friend } from "../../types";
import { Search, UserPlus, Users, Star } from "lucide-react";

type AddMode = "registered" | "guest";

interface AddPlayerSheetProps {
  tour: Tour;
  isOpen: boolean;
  onClose: () => void;
}

export const AddPlayerSheet = ({
  tour,
  isOpen,
  onClose,
}: AddPlayerSheetProps) => {
  const { user } = useAuth();
  const addPlayer = useAddPlayer(tour.id);
  const { data: friends = [] } = useFriends(user?.uid || null);
  const addFriendMutation = useAddFriend();

  const [mode, setMode] = useState<AddMode>("registered");
  const [searchTerm, setSearchTerm] = useState("");
  const [addAsFriend, setAddAsFriend] = useState(false);
  const [guestData, setGuestData] = useState({
    name: "",
    handicap: "",
    teamId: "",
  });

  const { data: searchResults = [], isLoading: isSearching } = useUserSearch(
    searchTerm,
    user?.uid
  );

  const formContainerRef = useKeyboardAwareScroll(isOpen);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setMode("registered");
      setSearchTerm("");
      setAddAsFriend(false);
      setGuestData({ name: "", handicap: "", teamId: "" });
    }
  }, [isOpen]);

  // Filter out players already in the tournament
  const existingUserIds = new Set(
    tour.players.filter((p) => p.userId).map((p) => p.userId)
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
    try {
      await addPlayer.mutateAsync({
        name: userResult.playerName,
        handicap: userResult.handicap,
        userId: userResult.userId,
        teamId: undefined,
      });

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
          await addFriendMutation.mutateAsync({
            userId: user.uid,
            friend,
          });
        }
      }

      setSearchTerm("");
      setAddAsFriend(false);
      onClose();
    } catch (error) {
      console.error("Failed to add player:", error);
    }
  };

  const handleAddFriend = async (friend: Friend) => {
    try {
      await addPlayer.mutateAsync({
        name: friend.playerName,
        handicap: friend.handicap,
        userId: friend.userId,
        teamId: undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to add friend as player:", error);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestData.name.trim() || !guestData.handicap.trim()) return;

    try {
      const normalized = guestData.handicap
        .toString()
        .replace(",", ".")
        .trim();
      await addPlayer.mutateAsync({
        name: guestData.name,
        handicap: normalized ? parseFloat(normalized) : undefined,
        teamId: guestData.teamId || undefined,
      });

      setGuestData({ name: "", handicap: "", teamId: "" });
      onClose();
    } catch (error) {
      console.error("Failed to add guest player:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: "rgba(0, 0, 0, 0.8)" }}
        onClick={onClose}
      />

      <div
        className="relative w-full sm:w-[28rem] sm:max-w-lg rounded-t-2xl sm:rounded-2xl animate-slide-up safe-area-bottom max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col overscroll-contain"
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full" style={{ background: "rgba(255, 255, 255, 0.2)" }}></div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 sm:py-5" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Add Player
            </h2>
            <p className="text-white/50 mt-1 text-sm">
              Add a registered user or a guest
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white/70 rounded-full transition-colors"
            style={{ background: "rgba(255, 255, 255, 0.05)" }}
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

        {/* Tab Buttons */}
        <div className="flex" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <button
            type="button"
            onClick={() => setMode("registered")}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors"
            style={{
              color: mode === "registered" ? "rgb(52, 211, 153)" : "rgba(255, 255, 255, 0.4)",
              borderBottom: mode === "registered" ? "2px solid rgb(16, 185, 129)" : "2px solid transparent",
              background: mode === "registered" ? "rgba(16, 185, 129, 0.05)" : "transparent",
            }}
          >
            <Users className="w-4 h-4" />
            Registered User
          </button>
          <button
            type="button"
            onClick={() => setMode("guest")}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors"
            style={{
              color: mode === "guest" ? "rgb(52, 211, 153)" : "rgba(255, 255, 255, 0.4)",
              borderBottom: mode === "guest" ? "2px solid rgb(16, 185, 129)" : "2px solid transparent",
              background: mode === "guest" ? "rgba(16, 185, 129, 0.05)" : "transparent",
            }}
          >
            <UserPlus className="w-4 h-4" />
            Guest
          </button>
        </div>

        {/* Content */}
        <div ref={formContainerRef} className="flex-1 overflow-y-auto">
          {mode === "registered" && (
            <div className="px-6 py-4 space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 text-base"
                  placeholder="Search by player name..."
                  autoFocus
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
                            disabled={addPlayer.isPending}
                            className="flex items-center justify-between w-full p-3 border border-white/10 rounded-lg hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all text-left disabled:opacity-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-semibold">
                                {result.playerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white">
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
                  <div className="space-y-2">
                    {filteredFriends.map((friend) => (
                      <button
                        key={friend.userId}
                        type="button"
                        onClick={() => handleAddFriend(friend)}
                        disabled={addPlayer.isPending}
                        className="flex items-center justify-between w-full p-3 border border-white/10 rounded-lg hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all text-left disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-semibold">
                            {friend.playerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-white">
                              {friend.playerName}
                            </span>
                            {friend.handicap !== undefined && (
                              <div className="text-xs text-white/40">
                                HC {friend.handicap}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-emerald-400 text-sm font-medium">
                          Add
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state when no search and no friends */}
              {searchTerm.trim().length < 2 && filteredFriends.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">
                    Search for registered users by name, or switch to Guest to
                    add a player without an account.
                  </p>
                </div>
              )}

              <div className="h-24 sm:h-0" />
            </div>
          )}

          {mode === "guest" && (
            <form onSubmit={handleGuestSubmit}>
              <div className="px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                <div className="rounded-lg p-3" style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <p className="text-sm text-white/50">
                    Add a player without an account. You must provide their name
                    and handicap.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Player Name *</label>
                  <input
                    type="text"
                    name="playerName"
                    data-testid="player-name-input"
                    value={guestData.name}
                    onChange={(e) =>
                      setGuestData({ ...guestData, name: e.target.value })
                    }
                    className="input-field sm:text-base text-lg"
                    placeholder="Enter full name"
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Golf Handicap *</label>
                  <input
                    type="number"
                    name="playerHandicap"
                    data-testid="player-handicap-input"
                    value={guestData.handicap}
                    onChange={(e) =>
                      setGuestData({ ...guestData, handicap: e.target.value })
                    }
                    className="input-field text-lg"
                    placeholder="Enter handicap (0-54)"
                    min="0"
                    max="54"
                    step="0.1"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    required
                  />
                  <p className="form-help">
                    Required for guest players
                  </p>
                </div>

                {(tour.format === "team" || tour.format === "ryder-cup") &&
                  tour.teams &&
                  tour.teams.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">Team Assignment</label>
                      <select
                        value={guestData.teamId}
                        onChange={(e) =>
                          setGuestData({
                            ...guestData,
                            teamId: e.target.value,
                          })
                        }
                        className="input-field text-lg"
                      >
                        <option value="">Assign later</option>
                        {tour.teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      <p className="form-help">
                        Players can be assigned to teams later if needed
                      </p>
                    </div>
                  )}

                <div className="h-32 sm:h-0" />
              </div>

              <div className="p-4 sm:p-6" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255, 255, 255, 0.03)" }}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={
                      addPlayer.isPending ||
                      !guestData.name.trim() ||
                      !guestData.handicap.trim()
                    }
                    className="btn-primary w-full sm:flex-1 py-4 sm:py-3 text-lg sm:text-base disabled:opacity-50 sm:order-2"
                    data-testid="submit-player-button"
                  >
                    {addPlayer.isPending ? "Adding Player..." : "Add Guest"}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary w-full sm:flex-1 py-3 sm:order-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
