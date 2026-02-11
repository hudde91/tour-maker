import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Tour, TourFormat, Player } from "../types";

export const useTours = () => {
  return useQuery({
    queryKey: ["tours"],
    queryFn: async () => {
      const data = await api.get<{ tours: Tour[] }>("/tours");
      return data.tours;
    },
  });
};

export const useTour = (id: string) => {
  return useQuery({
    queryKey: ["tour", id],
    queryFn: () => api.get<Tour>(`/tours/${id}`),
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
      const tour = await api.post<Tour>("/tours", {
        name: data.name,
        description: data.description,
        format: data.format,
      });

      // Add players if provided
      if (data.players?.length) {
        for (const player of data.players) {
          await api.post(`/tours/${tour.id}/players`, {
            name: player.name,
            handicap: player.handicap,
          });
        }
      }

      // Refetch the full tour to get the assembled shape
      return api.get<Tour>(`/tours/${tour.id}`);
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
      await api.delete(`/tours/${tourId}`);
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
      return api.put<Tour>(`/tours/${data.tourId}`, {
        name: data.name,
        description: data.description,
      });
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
      // Fetch current state to toggle
      const tour = await api.get<Tour>(`/tours/${tourId}`);
      return api.patch<Tour>(`/tours/${tourId}/archive`, {
        archived: !tour.archived,
      });
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
      return api.patch<Tour>(`/tours/${data.tourId}/format`, {
        format: data.format,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      queryClient.invalidateQueries({ queryKey: ["tour", variables.tourId] });
    },
  });
};
