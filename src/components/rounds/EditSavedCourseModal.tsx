import { useState, useEffect } from "react";
import { SavedCourse } from "@/types";
import { useSaveCourse } from "@/hooks/useSavedCourses";
import { storage } from "@/lib/storage";

interface EditSavedCourseModalProps {
  course: SavedCourse;
  isOpen: boolean;
  onClose: () => void;
}

export const EditSavedCourseModal = ({
  course,
  isOpen,
  onClose,
}: EditSavedCourseModalProps) => {
  const saveCourse = useSaveCourse();

  const [formData, setFormData] = useState({
    name: course.name,
    holes: course.holes,
    holeInfo: course.holeInfo,
    teeBoxes: course.teeBoxes || "",
    slopeRating: course.slopeRating || "",
    totalYardage: course.totalYardage || "",
  });

  useEffect(() => {
    setFormData({
      name: course.name,
      holes: course.holes,
      holeInfo: course.holeInfo,
      teeBoxes: course.teeBoxes || "",
      slopeRating: course.slopeRating || "",
      totalYardage: course.totalYardage || "",
    });
  }, [course]);

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

  const handleHoleCountChange = (holes: number) => {
    const newHoleInfo = storage.generateDefaultHoles(holes);
    // Preserve existing hole data where possible
    const merged = newHoleInfo.map((defaultHole) => {
      const existing = formData.holeInfo.find(
        (h) => h.number === defaultHole.number
      );
      return existing || defaultHole;
    });
    setFormData({ ...formData, holes, holeInfo: merged });
  };

  const handleParChange = (holeNumber: number, par: number) => {
    const updated = formData.holeInfo.map((h) =>
      h.number === holeNumber ? { ...h, par } : h
    );
    setFormData({ ...formData, holeInfo: updated });
  };

  const handleYardageChange = (holeNumber: number, yardage: number) => {
    const updated = formData.holeInfo.map((h) =>
      h.number === holeNumber ? { ...h, yardage } : h
    );
    setFormData({ ...formData, holeInfo: updated });
  };

  const handleHandicapChange = (holeNumber: number, handicap: number) => {
    const updated = formData.holeInfo.map((h) =>
      h.number === holeNumber ? { ...h, handicap } : h
    );
    setFormData({ ...formData, holeInfo: updated });
  };

  const totalPar = formData.holeInfo.reduce((sum, h) => sum + h.par, 0);
  const totalYardageCalc = formData.holeInfo.reduce(
    (sum, h) => sum + (h.yardage || 0),
    0
  );

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    try {
      await saveCourse.mutateAsync({
        id: course.id,
        name: formData.name,
        holes: formData.holes,
        holeInfo: formData.holeInfo,
        teeBoxes: formData.teeBoxes || undefined,
        slopeRating: formData.slopeRating || undefined,
        totalYardage: formData.totalYardage || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save course:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div
        className="rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overscroll-contain pb-24 sm:pb-0 border border-white/10"
        style={{ background: "rgba(15, 23, 42, 0.95)" }}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Edit Saved Course</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Course Name */}
          <div>
            <label className="text-sm font-semibold text-white/50 block mb-2">
              Course Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-white/15 rounded-lg bg-white/5 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Pine Valley Golf Club"
            />
          </div>

          {/* Holes & Slope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-white/50 block mb-2">
                Number of Holes
              </label>
              <div className="flex gap-3">
                {[9, 18].map((holeCount) => (
                  <button
                    key={holeCount}
                    type="button"
                    onClick={() => handleHoleCountChange(holeCount)}
                    className={`flex-1 p-3 border-2 rounded-lg font-medium transition-all ${
                      formData.holes === holeCount
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                        : "border-white/15 hover:border-slate-400"
                    }`}
                  >
                    {holeCount} Holes
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-white/50 block mb-2">
                Slope Rating
              </label>
              <input
                type="number"
                value={formData.slopeRating}
                onChange={(e) =>
                  setFormData({ ...formData, slopeRating: e.target.value })
                }
                className="w-full px-4 py-2 border border-white/15 rounded-lg bg-white/5 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="113"
                min="55"
                max="155"
              />
            </div>
          </div>

          {/* Tee Boxes */}
          <div>
            <label className="text-sm font-semibold text-white/50 block mb-2">
              Tee Boxes
            </label>
            <input
              type="text"
              value={formData.teeBoxes}
              onChange={(e) =>
                setFormData({ ...formData, teeBoxes: e.target.value })
              }
              className="w-full px-4 py-2 border border-white/15 rounded-lg bg-white/5 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Championship Tees"
            />
          </div>

          {/* Course Layout Table */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-white/50">
                Course Layout
              </label>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-white/50">Total Par: {totalPar}</span>
                <span className="text-white/50">
                  Total Yardage: {totalYardageCalc}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-3 font-medium text-white/70">
                      Hole
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-white/70">
                      Par
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-white/70">
                      Yardage
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-white/70">
                      HCP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.holeInfo.map((hole) => (
                    <tr key={hole.number} className="border-b border-slate-100">
                      <td className="py-2 px-3 font-medium">{hole.number}</td>
                      <td className="py-2 px-3">
                        <select
                          value={hole.par}
                          onChange={(e) =>
                            handleParChange(
                              hole.number,
                              parseInt(e.target.value)
                            )
                          }
                          className="w-16 px-2 py-1 border border-white/15 rounded bg-white/5 text-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                        >
                          <option value={3} className="bg-slate-800">3</option>
                          <option value={4} className="bg-slate-800">4</option>
                          <option value={5} className="bg-slate-800">5</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={hole.yardage || ""}
                          onChange={(e) =>
                            handleYardageChange(
                              hole.number,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-20 px-2 py-1 border border-white/15 rounded bg-white/5 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                          placeholder="350"
                          min="50"
                          max="700"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={hole.handicap || ""}
                          onChange={(e) =>
                            handleHandicapChange(
                              hole.number,
                              parseInt(e.target.value) || hole.number
                            )
                          }
                          className="w-16 px-2 py-1 border border-white/15 rounded bg-white/5 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                          min="1"
                          max="18"
                          placeholder={hole.number.toString()}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={handleSave}
            disabled={!formData.name.trim() || saveCourse.isPending}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveCourse.isPending ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
