import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  searchGolfCourses,
  getGolfCourseDetail,
  isGolfCourseApiConfigured,
  GolfCourseSearchResult,
  GolfCourseDetail,
} from "../lib/golfCourseApi";

export function useGolfCourseSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ["golfCourseSearch", debouncedQuery],
    queryFn: () => searchGolfCourses(debouncedQuery),
    enabled: isGolfCourseApiConfigured() && debouncedQuery.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false,
  });
}

export function useGolfCourseDetail(courseId: string | null) {
  return useQuery({
    queryKey: ["golfCourseDetail", courseId],
    queryFn: () => getGolfCourseDetail(courseId!),
    enabled: !!courseId && isGolfCourseApiConfigured(),
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    retry: false,
  });
}

export { isGolfCourseApiConfigured };
export type { GolfCourseSearchResult, GolfCourseDetail };
