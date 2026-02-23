import { useState, useEffect } from "react";
import { useSaveUserProfile } from "../../hooks/useUserProfile";
import { useKeyboardAwareScroll } from "../../hooks/useKeyboardAwareScroll";

interface PlayerProfileSetupProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const PlayerProfileSetup = ({
  userId,
  userName,
  isOpen,
  onClose,
  onComplete,
}: PlayerProfileSetupProps) => {
  const saveProfile = useSaveUserProfile();
  const [formData, setFormData] = useState({
    playerName: userName || "",
    handicap: "",
  });

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

  // Update player name when userName prop changes
  useEffect(() => {
    if (userName && !formData.playerName) {
      setFormData((prev) => ({ ...prev, playerName: userName }));
    }
  }, [userName, formData.playerName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.playerName.trim()) return;

    try {
      const normalized = (formData.handicap ?? "")
        .toString()
        .replace(",", ".")
        .trim();

      await saveProfile.mutateAsync({
        userId,
        playerName: formData.playerName,
        handicap: normalized ? parseFloat(normalized) : undefined,
      });

      onComplete?.();
      onClose();
    } catch (error) {
      console.error("Failed to save player profile:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative w-full sm:w-96 sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl border-t sm:border border-white/10 animate-slide-up safe-area-bottom max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col overscroll-contain" style={{ background: "rgba(15, 23, 42, 0.95)" }}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
        </div>

        <div className="flex justify-between items-center px-6 py-4 sm:py-6 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Complete Your Player Profile
            </h2>
            <p className="text-white/50 mt-1 text-sm">
              Set up your player information to create tournaments
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div
            ref={formContainerRef}
            className="px-6 py-4 sm:py-6 space-y-4 sm:space-y-6"
          >
            <div className="bg-blue-500/15 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-400 mt-0.5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-blue-400">
                    First Time Setup
                  </h3>
                  <p className="text-sm text-blue-300 mt-1">
                    When you create a tournament, you'll automatically be added as a
                    player. Let's set up your player profile first.
                  </p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Player Name *</label>
              <input
                type="text"
                value={formData.playerName}
                onChange={(e) =>
                  setFormData({ ...formData, playerName: e.target.value })
                }
                className="input-field sm:text-base text-lg"
                placeholder="Enter your name"
                autoFocus
                required
              />
              <p className="form-help">
                This name will appear on leaderboards and scorecards
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Golf Handicap</label>
              <input
                type="number"
                value={formData.handicap}
                onChange={(e) =>
                  setFormData({ ...formData, handicap: e.target.value })
                }
                className="input-field text-lg"
                placeholder="Enter handicap (0-54)"
                min="0"
                max="54"
                step="0.1"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
              />
              <p className="form-help">Official USGA handicap index (optional)</p>
            </div>

            <div className="h-32 sm:h-0" />
          </div>

          <div className="border-t border-white/10 p-4 sm:p-6 sm:bg-white/5">
            <button
              type="submit"
              disabled={saveProfile.isPending || !formData.playerName.trim()}
              className="btn-primary w-full py-4 sm:py-3 text-lg sm:text-base disabled:opacity-50"
            >
              {saveProfile.isPending ? "Saving Profile..." : "Complete Setup"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
