import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Tour, TourFormat, Player } from "../types";
import {
  getTours,
  getTour,
  createTour,
  updateTourDetails,
  updateTourFormat,
  toggleTourArchive,
  deleteTour,
  addPlayer,
  subscribeTour,
} from "../lib/firestore";
import { nanoid } from "nanoid";

export const useTours = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tours", user?.uid],
    queryFn: async (): Promise<Tour[]> => {
      if (!user) return [];
      return getTours(user.uid);
    },
    enabled: !!user,
  });
};

export const useTour = (id: string) => {
  const queryClient = useQueryClient();

  // Set up real-time listener that pushes updates into React Query cache
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeTour(id, (tour) => {
      queryClient.setQueryData(["tour", id], tour);
    });
    return unsubscribe;
  }, [id, queryClient]);

  return useQuery({
    queryKey: ["tour", id],
    queryFn: () => getTour(id),
    enabled: !!id,
    staleTime: Infinity, // Real-time listener handles updates
  });
};

export const useCreateTour = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      format: TourFormat;
      players?: Player[];
    }) => {
      if (!user) throw new Error("Must be logged in");
      const id = nanoid();
      await createTour(
        user.uid,
        { name: data.name, description: data.description, format: data.format },
        id
      );

      // Add players if provided
      if (data.players?.length) {
        for (const player of data.players) {
          await addPlayer(id, player);
        }
      }

      const tour = await getTour(id);
      if (!tour) throw new Error("Failed to create tour");
      return tour;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};

export const useDeleteTour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tourId: string) => {
      await deleteTour(tourId);
      return tourId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};

export const useUpdateTourDetails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      tourId: string;
      name: string;
      description?: string;
    }) => {
      await updateTourDetails(data.tourId, {
        name: data.name,
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};

export const useToggleTourArchive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tourId: string) => {
      const tour = await getTour(tourId);
      if (!tour) throw new Error("Tour not found");
      await toggleTourArchive(tourId, !tour.archived);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};

export const useUpdateTourFormat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { tourId: string; format: TourFormat }) => {
      await updateTourFormat(data.tourId, data.format);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};
