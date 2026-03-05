import { useState } from "react";
import { TeeBox, GolfCourseDetail } from "../../lib/golfCourseApi";

interface TeeBoxPickerModalProps {
  course: GolfCourseDetail;
  onSelect: (teeBox: TeeBox) => void;
  onCancel: () => void;
}

export const TeeBoxPickerModal = ({
  course,
  onSelect,
  onCancel,
}: TeeBoxPickerModalProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (course.teeBoxes.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <div
          className="w-full max-w-md rounded-xl border border-white/15 p-6"
          style={{ background: "rgba(15, 23, 42, 0.97)" }}
        >
          <h3 className="text-lg font-semibold text-white mb-3">
            No Tee Box Data
          </h3>
          <p className="text-sm text-white/60 mb-4">
            No tee box information is available for {course.name}. The course
            name will be used but you'll need to set up holes manually.
          </p>
          <button onClick={onCancel} className="btn-primary w-full">
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div
        className="w-full max-w-md rounded-xl border border-white/15 overflow-hidden"
        style={{ background: "rgba(15, 23, 42, 0.97)" }}
      >
        <div className="p-5 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">{course.name}</h3>
          {course.city && (
            <p className="text-sm text-white/50 mt-1">
              {course.city}
              {course.country ? `, ${course.country}` : ""}
            </p>
          )}
          <p className="text-sm text-white/40 mt-2">
            Select a tee box to auto-fill hole data
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto p-3 space-y-2">
          {course.teeBoxes.map((tee, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                selectedIndex === i
                  ? "border-emerald-500 bg-emerald-500/15"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="font-medium text-white">{tee.name}</div>
              <div className="text-sm text-white/50 mt-1 flex gap-4">
                <span>Par {tee.parTotal}</span>
                <span>{tee.totalYards} yards</span>
                <span>{tee.holes.length} holes</span>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSelect(course.teeBoxes[selectedIndex])}
            className="flex-1 btn-primary"
          >
            Use {course.teeBoxes[selectedIndex].name}
          </button>
        </div>
      </div>
    </div>
  );
};
