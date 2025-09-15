import { useState } from "react";
import { useAddPlayer } from "../../hooks/usePlayers";
import { Tour } from "../../types";

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
  const addPlayer = useAddPlayer(tour.id);
  const [formData, setFormData] = useState({
    name: "",
    handicap: "",
    teamId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    try {
      const normalized = (formData.handicap ?? "")
        .toString()
        .replace(",", ".")
        .trim();
      await addPlayer.mutateAsync({
        name: formData.name,
        handicap: normalized ? parseFloat(normalized) : undefined,
        teamId: formData.teamId || undefined,
      });

      // Reset form and close sheet
      setFormData({ name: "", handicap: "", teamId: "" });
      onClose();
    } catch (error) {
      console.error("Failed to add player:", error);
    }
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
      <div className="relative w-full sm:w-96 sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border-t sm:border border-slate-200 animate-slide-up safe-area-bottom max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 sm:py-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Add Player
            </h2>
            <p className="text-slate-600 mt-1 text-sm">
              Register a new tournament participant
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Player Name */}
            <div className="form-group">
              <label className="form-label">Player Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input-field sm:text-base text-lg"
                placeholder="Enter full name"
                autoFocus
                required
              />
            </div>

            {/* Handicap */}
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
              <p className="form-help">
                Official USGA handicap index (optional)
              </p>
            </div>

            {/* Team Selection (for team formats) */}
            {(tour.format === "team" || tour.format === "ryder-cup") &&
              tour.teams &&
              tour.teams.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Team Assignment</label>
                  <select
                    value={formData.teamId}
                    onChange={(e) =>
                      setFormData({ ...formData, teamId: e.target.value })
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
          </div>

          {/* Fixed Footer */}
          <div className="border-t border-slate-200 p-4 sm:p-6 bg-slate-50 sm:bg-white">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={addPlayer.isPending || !formData.name.trim()}
                className="btn-primary w-full sm:flex-1 py-4 sm:py-3 text-lg sm:text-base disabled:opacity-50 sm:order-2"
              >
                {addPlayer.isPending ? "Adding Player..." : "Add Player"}
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
      </div>
    </div>
  );
};
