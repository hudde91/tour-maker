import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { storage } from "../lib/storage";
import { Tour, TourFormat } from "../types";

export const useTours = () => {
  return useQuery({
    queryKey: ["tours"],
    queryFn: storage.getTours,
  });
};

export const useTour = (id: string) => {
  return useQuery({
    queryKey: ["tour", id],
    queryFn: () => storage.getTour(id),
    enabled: !!id,
  });
};

export const useCreateTour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      format: TourFormat;
    }) => {
      const tour: Tour = {
        id: nanoid(),
        name: data.name,
        description: data.description,
        format: data.format,
        createdAt: new Date().toISOString(),
        shareableUrl: `${window.location.origin}/tour/${nanoid()}`,
        players: [],
        rounds: [],
        isActive: true,
        ...(data.format !== "individual" && { teams: [] }),
      };

      storage.saveTour(tour);
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
      storage.deleteTour(tourId);
      return tourId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};
