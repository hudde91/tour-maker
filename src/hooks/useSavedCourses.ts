import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { SavedCourse, HoleInfo } from "../types";
import {
  getSavedCourses,
  saveSavedCourse,
  deleteSavedCourse,
} from "../lib/firestore";
import { nanoid } from "nanoid";

export const useSavedCourses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["savedCourses"],
    queryFn: (): Promise<SavedCourse[]> => getSavedCourses(),
    enabled: !!user,
  });
};

export const useSaveCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      id?: string;
      name: string;
      holes: number;
      holeInfo: HoleInfo[];
      teeBoxes?: string;
      slopeRating?: string;
      totalYardage?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");
      const now = new Date().toISOString();
      const course: SavedCourse = {
        id: data.id || nanoid(),
        name: data.name,
        holes: data.holes,
        holeInfo: data.holeInfo,
        teeBoxes: data.teeBoxes,
        slopeRating: data.slopeRating,
        totalYardage: data.totalYardage,
        createdAt: data.id ? "" : now,
        updatedAt: now,
      };

      // If updating, preserve the original createdAt
      if (data.id) {
        const existing = queryClient.getQueryData<SavedCourse[]>([
          "savedCourses",
        ]);
        const original = existing?.find((c) => c.id === data.id);
        if (original) {
          course.createdAt = original.createdAt;
        }
      }
      if (!course.createdAt) {
        course.createdAt = now;
      }

      await saveSavedCourse(user.uid, course);
      return course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedCourses"] });
    },
  });
};

export const useDeleteSavedCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error("Must be logged in");
      await deleteSavedCourse(user.uid, courseId);
      return courseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedCourses"] });
    },
  });
};
