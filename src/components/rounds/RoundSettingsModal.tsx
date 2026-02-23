import { useState, useEffect } from "react";
import { Round } from "@/types";
import { useUpdateRoundCourseDetails, useUpdateRoundStartTime } from "@/hooks/useRounds";
import { useToast } from "@/components/ui/Toast";

interface RoundSettingsModalProps {
  tourId: string;
  round: Round;
  isOpen: boolean;
  onClose: () => void;
}

export const RoundSettingsModal = ({
  tourId,
  round,
  isOpen,
  onClose,
}: RoundSettingsModalProps) => {
  const updateCourseDetails = useUpdateRoundCourseDetails(tourId);
  const updateStartTime = useUpdateRoundStartTime(tourId);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: round.name,
    courseName: round.courseName,
    teeBoxes: round.teeBoxes || "",
    slopeRating: round.slopeRating || "",
    totalYardage: round.totalYardage || "",
    startTime: round.startTime || "",
  });

  useEffect(() => {
    if (round) {
      setFormData({
        name: round.name,
        courseName: round.courseName,
        teeBoxes: round.teeBoxes || "",
        slopeRating: round.slopeRating || "",
        totalYardage: round.totalYardage || "",
        startTime: round.startTime || "",
      });
    }
  }, [round]);

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

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      // Update course details
      await updateCourseDetails.mutateAsync({
        roundId: round.id,
        updates: {
          name: formData.name,
          courseName: formData.courseName,
          teeBoxes: formData.teeBoxes || undefined,
          slopeRating: formData.slopeRating || undefined,
          totalYardage: formData.totalYardage || undefined,
        },
      });

      // Update start time if provided
      if (formData.startTime) {
        await updateStartTime.mutateAsync({
          roundId: round.id,
          startTime: formData.startTime,
        });
      }

      showToast("Round settings updated successfully", "success");
      onClose();
    } catch (error) {
      console.error("Failed to update round settings:", error);
      showToast("Failed to update round settings", "error");
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white/5 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overscroll-contain pb-24 sm:pb-0">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Round Settings</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Round Name */}
          <div>
            <label className="text-sm font-semibold text-white/50 block mb-2">
              Round Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-4 py-2 border border-white/15 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Round 1, Final Round"
            />
          </div>

          {/* Course Name */}
          <div>
            <label className="text-sm font-semibold text-white/50 block mb-2">
              Course Name
            </label>
            <input
              type="text"
              value={formData.courseName}
              onChange={(e) => handleChange("courseName", e.target.value)}
              className="w-full px-4 py-2 border border-white/15 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Pebble Beach Golf Links"
            />
          </div>

          {/* Course Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-white/50 block mb-2">
                Tee Boxes
              </label>
              <input
                type="text"
                value={formData.teeBoxes}
                onChange={(e) => handleChange("teeBoxes", e.target.value)}
                className="w-full px-4 py-2 border border-white/15 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., Championship"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-white/50 block mb-2">
                Slope Rating
              </label>
              <input
                type="text"
                value={formData.slopeRating}
                onChange={(e) => handleChange("slopeRating", e.target.value)}
                className="w-full px-4 py-2 border border-white/15 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., 142"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-white/50 block mb-2">
                Total Yardage
              </label>
              <input
                type="text"
                value={formData.totalYardage}
                onChange={(e) => handleChange("totalYardage", e.target.value)}
                className="w-full px-4 py-2 border border-white/15 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., 7040"
              />
            </div>
          </div>

          {/* Start Time */}
          <div>
            <label className="text-sm font-semibold text-white/50 block mb-2">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => handleChange("startTime", e.target.value)}
              className="w-full px-4 py-2 border border-white/15 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {round.status === "in-progress" && (
            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-400">
                <strong>Note:</strong> This round is currently in progress.
                Changes to course details will not affect existing scores.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={handleSave}
            disabled={updateCourseDetails.isPending || updateStartTime.isPending}
            className="btn-primary flex-1"
          >
            {updateCourseDetails.isPending || updateStartTime.isPending
              ? "Saving..."
              : "Save Changes"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
