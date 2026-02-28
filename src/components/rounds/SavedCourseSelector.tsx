import { SavedCourse } from "@/types";
import { useSavedCourses, useDeleteSavedCourse } from "@/hooks/useSavedCourses";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface SavedCourseSelectorProps {
  onSelect: (course: SavedCourse) => void;
  onEdit: (course: SavedCourse) => void;
}

export const SavedCourseSelector = ({
  onSelect,
  onEdit,
}: SavedCourseSelectorProps) => {
  const { data: savedCourses, isLoading } = useSavedCourses();
  const deleteCourse = useDeleteSavedCourse();
  const [courseToDelete, setCourseToDelete] = useState<SavedCourse | null>(null);

  if (isLoading) {
    return (
      <div className="text-white/40 text-sm py-2">Loading saved courses...</div>
    );
  }

  if (!savedCourses || savedCourses.length === 0) {
    return null;
  }

  const handleDelete = async () => {
    if (!courseToDelete) return;
    try {
      await deleteCourse.mutateAsync(courseToDelete.id);
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
    setCourseToDelete(null);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <span className="text-sm font-medium text-white/70">
            Saved Courses
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {savedCourses.map((course) => (
            <div
              key={course.id}
              className="group relative border-2 border-white/10 rounded-lg p-3 hover:border-emerald-500/50 transition-all cursor-pointer"
              onClick={() => onSelect(course)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    {course.name}
                  </div>
                  <div className="text-sm text-white/50">
                    {course.holes} holes
                    {course.slopeRating && ` · Slope ${course.slopeRating}`}
                  </div>
                </div>
                <div
                  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onEdit(course)}
                    className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    title="Edit course"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseToDelete(course)}
                    className="p-1.5 rounded-md hover:bg-red-500/15 text-white/50 hover:text-red-400 transition-colors"
                    title="Delete course"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!courseToDelete}
        title="Delete Saved Course"
        message={`Are you sure you want to delete "${courseToDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setCourseToDelete(null)}
        isDestructive
      />
    </>
  );
};
