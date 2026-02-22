import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFriends, addFriend, removeFriend } from "../lib/firestore";
import type { Friend } from "../types";

export const useFriends = (userId: string | null) => {
  return useQuery({
    queryKey: ["friends", userId],
    queryFn: async (): Promise<Friend[]> => {
      if (!userId) return [];
      return getFriends(userId);
    },
    enabled: !!userId,
  });
};

export const useAddFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; friend: Friend }) => {
      await addFriend(data.userId, data.friend);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["friends", data.userId] });
    },
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; friendUserId: string }) => {
      await removeFriend(data.userId, data.friendUserId);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["friends", data.userId] });
    },
  });
};
