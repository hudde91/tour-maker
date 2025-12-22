import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { storage } from "../lib/storage";
import { Tour, TourFormat, Player } from "../types";

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
      players?: Player[];
    }) => {
      const tour: Tour = {
        id: nanoid(),
        name: data.name,
        description: data.description,
        format: data.format,
        createdAt: new Date().toISOString(),
        shareableUrl: `${window.location.origin}/tour/${nanoid()}`,
        players: data.players || [],
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

export const useUpdateTourDetails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      tourId: string;
      name: string;
      description?: string;
    }) => {
      const tour = storage.updateTourDetails(
        data.tourId,
        data.name,
        data.description
      );
      return tour;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      queryClient.invalidateQueries({ queryKey: ["tour", variables.tourId] });
    },
  });
};

export const useToggleTourArchive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tourId: string) => {
      const tour = storage.toggleTourArchive(tourId);
      return tour;
    },
    onSuccess: (_, tourId) => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useUpdateTourFormat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { tourId: string; format: TourFormat }) => {
      const tour = storage.updateTourFormat(data.tourId, data.format);
      return tour;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      queryClient.invalidateQueries({ queryKey: ["tour", variables.tourId] });
    },
  });
};
