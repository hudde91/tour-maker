import { useState } from "react";
import { useCreateTeam } from "../hooks/useTeams";
import { Tour } from "../types";

interface CreateTeamModalProps {
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

export const CreateTeamModal = ({
  tour,
  isOpen,
  onClose,
}: CreateTeamModalProps) => {
  const createTeam = useCreateTeam(tour.id);
  const [formData, setFormData] = useState({
    name: "",
    color: PROFESSIONAL_TEAM_COLORS[0].color,
    captainId: "",
  });

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

      // Reset form and close modal
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
    <div className="fixed inset-0 modal-backdrop flex items-end sm:items-center justify-center z-50 animate-fade-in">
      <div className="modal-content w-full sm:w-96 sm:rounded-xl rounded-t-xl p-6 safe-area-bottom animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Create Team</h2>
            <p className="text-slate-600 mt-1">Build your tournament team</p>
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
          {/* Team Name */}
          <div className="form-group">
            <label className="form-label">Team Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input-field"
              placeholder="e.g., The Eagles, Team Alpha"
              autoFocus
              required
            />
          </div>

          {/* Team Color */}
          <div className="form-group">
            <label className="form-label mb-3">Team Color</label>
            <div className="grid grid-cols-5 gap-3">
              {PROFESSIONAL_TEAM_COLORS.map((colorOption) => (
                <button
                  key={colorOption.color}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, color: colorOption.color })
                  }
                  className={`aspect-square rounded-xl border-2 transition-all shadow-sm hover:scale-105 ${
                    formData.color === colorOption.color
                      ? "border-slate-900 ring-2 ring-slate-200 scale-110"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  style={{ backgroundColor: colorOption.color }}
                  title={colorOption.name}
                />
              ))}
            </div>
            <p className="form-help mt-2">
              Choose a distinctive color for your team
            </p>
          </div>

          {/* Captain Selection */}
          {availableCaptains.length > 0 && (
            <div className="form-group">
              <label className="form-label">Team Captain</label>
              <select
                value={formData.captainId}
                onChange={(e) =>
                  setFormData({ ...formData, captainId: e.target.value })
                }
                className="input-field"
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
              disabled={createTeam.isPending || !formData.name.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {createTeam.isPending ? "Creating Team..." : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
