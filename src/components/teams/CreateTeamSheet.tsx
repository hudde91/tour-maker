import { useState, useEffect } from "react";
import { useCreateTeam } from "../../hooks/useTeams";
import { useKeyboardAwareScroll } from "../../hooks/useKeyboardAwareScroll";
import { Tour } from "../../types";

interface CreateTeamSheetProps {
  tour: Tour;
  isOpen: boolean;
  onClose: () => void;
}

const PROFESSIONAL_TEAM_COLORS = [
  { color: "#dc2626", name: "Championship Red" },
  { color: "#2563eb", name: "Royal Blue" },
  { color: "#059669", name: "Tournament Green" },
  { color: "#d97706", name: "Premium Gold" },
  { color: "#7c3aed", name: "Purple" },
  { color: "#ea580c", name: "Orange" },
  { color: "#0891b2", name: "Cyan" },
  { color: "#84cc16", name: "Lime" },
  { color: "#db2777", name: "Pink" },
  { color: "#475569", name: "Slate" },
];

export const CreateTeamSheet = ({
  tour,
  isOpen,
  onClose,
}: CreateTeamSheetProps) => {
  const createTeam = useCreateTeam(tour.id);
  const [formData, setFormData] = useState({
    name: "",
    color: PROFESSIONAL_TEAM_COLORS[0].color,
    captainId: "",
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

  // Get unassigned players and players not captains
  const availableCaptains = tour.players.filter((player) => {
    const isAlreadyCaptain = tour.teams?.some(
      (team) => team.captainId === player.id
    );
    return !isAlreadyCaptain;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    try {
      await createTeam.mutateAsync({
        name: formData.name,
        color: formData.color,
        captainId: formData.captainId || undefined,
      });

      // Reset form and close sheet
      setFormData({
        name: "",
        color: PROFESSIONAL_TEAM_COLORS[0].color,
        captainId: "",
      });
      onClose();
    } catch (error) {
      console.error("Failed to create team:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full sm:w-96 sm:max-w-md bg-white/5 rounded-t-2xl sm:rounded-xl shadow-2xl border-t sm:border border-white/10 animate-slide-up safe-area-bottom max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col overscroll-contain">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Create Team
            </h2>
            <p className="text-white/50 mt-1 text-sm">
              Build your tournament team
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/30 hover:text-white/50 hover:bg-white/10 rounded-full transition-colors"
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div ref={formContainerRef} className="px-6 py-6 space-y-6">
            <div className="form-group">
              <label className="form-label">Team Name *</label>
              <input
                type="text"
                name="teamName"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input-field text-lg"
                placeholder="e.g., The Eagles, Team Alpha"
                autoFocus
                required
                data-testid="team-name-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label mb-3 sm:mb-4">Team Color</label>
              <div className="grid grid-cols-5 gap-3 sm:gap-4">
                {PROFESSIONAL_TEAM_COLORS.map((colorOption) => (
                  <button
                    key={colorOption.color}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, color: colorOption.color })
                    }
                    className={`aspect-square rounded-xl border-3 transition-all hover:scale-105 ${
                      formData.color === colorOption.color
                        ? "border-white ring-4 ring-white/30 scale-110 shadow-lg"
                        : "border-white/10 hover:border-white/15 shadow-sm"
                    }`}
                    style={{ backgroundColor: colorOption.color }}
                    title={colorOption.name}
                  />
                ))}
              </div>
              <p className="form-help mt-2 sm:mt-3">
                Choose a distinctive color for your team
              </p>
            </div>

            {availableCaptains.length > 0 && (
              <div className="form-group">
                <label className="form-label">Team Captain</label>
                <select
                  value={formData.captainId}
                  onChange={(e) =>
                    setFormData({ ...formData, captainId: e.target.value })
                  }
                  className="input-field text-lg"
                >
                  <option value="">Select a captain</option>
                  {availableCaptains.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}{" "}
                      {player.handicap !== undefined && `(${player.handicap})`}
                    </option>
                  ))}
                </select>
                <p className="form-help">
                  The captain will lead team strategy and decisions
                </p>
              </div>
            )}

            <div className="h-32 sm:h-0" />
          </div>

          <div className="border-t border-white/10 p-6">
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={createTeam.isPending || !formData.name.trim()}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50"
              >
                {createTeam.isPending ? "Creating Team..." : "Create Team"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary w-full py-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
