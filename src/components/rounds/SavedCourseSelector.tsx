import { SavedCourse } from "@/types";
import { useSavedCourses, useDeleteSavedCourse } from "@/hooks/useSavedCourses";
import {
  useGolfCourseSearch,
  isGolfCourseApiConfigured,
  GolfCourseSearchResult,
} from "@/hooks/useGolfCourseSearch";
import { useState, useRef, useEffect } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface SavedCourseSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (course: SavedCourse) => void;
  onEdit: (course: SavedCourse) => void;
  onSelectApiCourse?: (course: GolfCourseSearchResult) => void;
}

export const SavedCourseSelector = ({
  value,
  onChange,
  onSelect,
  onEdit,
  onSelectApiCourse,
}: SavedCourseSelectorProps) => {
  const { data: savedCourses } = useSavedCourses();
  const deleteCourse = useDeleteSavedCourse();
  const { data: apiCourses, isFetching: isSearching } =
    useGolfCourseSearch(value);
  const [isOpen, setIsOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<SavedCourse | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const apiEnabled = isGolfCourseApiConfigured();
  const hasSavedCourses = savedCourses && savedCourses.length > 0;

  const filteredCourses = hasSavedCourses
    ? savedCourses.filter((c) =>
        c.name.toLowerCase().includes(value.toLowerCase())
      )
    : [];

  // Filter out API results that match saved course names to avoid duplicates
  const savedNames = new Set(
    (savedCourses || []).map((c) => c.name.toLowerCase())
  );
  const filteredApiCourses = (apiCourses || []).filter(
    (c) => !savedNames.has(c.name.toLowerCase())
  );

  const hasResults =
    filteredCourses.length > 0 || filteredApiCourses.length > 0;
  const shouldShowDropdown =
    isOpen && (hasResults || isSearching || (value.length >= 2 && apiEnabled));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (course: SavedCourse) => {
    onSelect(course);
    setIsOpen(false);
  };

  const handleSelectApi = (course: GolfCourseSearchResult) => {
    if (onSelectApiCourse) {
      onSelectApiCourse(course);
    } else {
      onChange(course.name);
    }
    setIsOpen(false);
  };

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
      <div ref={containerRef} className="relative">
        <label className="form-label">Course Name *</label>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (hasSavedCourses || (value.length >= 2 && apiEnabled)) {
                setIsOpen(true);
              }
            }}
            className="input-field w-full"
            placeholder={
              apiEnabled
                ? "Search courses (e.g. Bro Hof)"
                : "Pine Valley Golf Club"
            }
            required
          />
          {isSearching && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          )}
          {(hasSavedCourses || apiEnabled) && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown */}
        {shouldShowDropdown && (
          <div
            className="absolute z-40 mt-1 w-full rounded-lg border border-white/15 shadow-xl overflow-hidden"
            style={{
              background: "rgba(15, 23, 42, 0.97)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="max-h-72 overflow-y-auto">
              {/* Saved Courses Section */}
              {filteredCourses.length > 0 && (
                <>
                  <div className="px-3 py-2 border-b border-white/10">
                    <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                      Saved Courses
                    </span>
                  </div>
                  {filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="group flex items-center justify-between px-3 py-2.5 hover:bg-white/10 cursor-pointer transition-colors"
                      onClick={() => handleSelect(course)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">
                          {course.name}
                        </div>
                        <div className="text-xs text-white/50">
                          {course.holes} holes
                          {course.slopeRating &&
                            ` · Slope ${course.slopeRating}`}
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onEdit(course);
                          }}
                          className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                          title="Edit course"
                        >
                          <svg
                            className="w-3.5 h-3.5"
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
                          onClick={() => {
                            setIsOpen(false);
                            setCourseToDelete(course);
                          }}
                          className="p-1.5 rounded-md hover:bg-red-500/15 text-white/40 hover:text-red-400 transition-colors"
                          title="Delete course"
                        >
                          <svg
                            className="w-3.5 h-3.5"
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
                  ))}
                </>
              )}

              {/* API Search Results Section */}
              {filteredApiCourses.length > 0 && (
                <>
                  <div className="px-3 py-2 border-b border-white/10">
                    <span className="text-xs font-medium text-emerald-400/60 uppercase tracking-wider">
                      Search Results
                    </span>
                  </div>
                  {filteredApiCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center px-3 py-2.5 hover:bg-white/10 cursor-pointer transition-colors"
                      onClick={() => handleSelectApi(course)}
                    >
                      <div className="flex-shrink-0 mr-2.5">
                        <svg
                          className="w-4 h-4 text-emerald-400/50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">
                          {course.name}
                        </div>
                        <div className="text-xs text-white/50">
                          {[course.clubName, course.city, course.country]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Loading state */}
              {isSearching && filteredApiCourses.length === 0 && (
                <div className="px-3 py-4 text-sm text-white/40 text-center">
                  Searching courses...
                </div>
              )}

              {/* No results */}
              {!isSearching &&
                filteredCourses.length === 0 &&
                filteredApiCourses.length === 0 &&
                value.length >= 2 && (
                  <div className="px-3 py-3 text-sm text-white/40">
                    No courses match "{value}"
                  </div>
                )}

              {/* Hint when typing */}
              {value.length > 0 &&
                value.length < 2 &&
                filteredCourses.length === 0 &&
                apiEnabled && (
                  <div className="px-3 py-3 text-sm text-white/40">
                    Type at least 2 characters to search
                  </div>
                )}
            </div>
          </div>
        )}
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
