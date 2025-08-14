import { useState } from "react";
import { useAddPlayer } from "../../hooks/usePlayers";
import { Tour } from "../../types";

interface AddPlayerModalProps {
  tour: Tour;
  isOpen: boolean;
  onClose: () => void;
}

export const AddPlayerModal = ({
  tour,
  isOpen,
  onClose,
}: AddPlayerModalProps) => {
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
      await addPlayer.mutateAsync({
        name: formData.name,
        handicap: formData.handicap ? parseInt(formData.handicap) : undefined,
        teamId: formData.teamId || undefined,
      });

      // Reset form and close modal
      setFormData({ name: "", handicap: "", teamId: "" });
      onClose();
    } catch (error) {
      console.error("Failed to add player:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-end sm:items-center justify-center z-50 animate-fade-in">
      <div className="modal-content w-full sm:w-96 sm:rounded-xl rounded-t-xl p-6 safe-area-bottom animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Add Player</h2>
            <p className="text-slate-600 mt-1">
              Register a new tournament participant
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player Name */}
          <div className="form-group">
            <label className="form-label">Player Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input-field"
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
              className="input-field"
              placeholder="Enter handicap (0-54)"
              min="0"
              max="54"
            />
            <p className="form-help">Official USGA handicap index (optional)</p>
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
                  className="input-field"
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

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addPlayer.isPending || !formData.name.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {addPlayer.isPending ? "Adding Player..." : "Add Player"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
