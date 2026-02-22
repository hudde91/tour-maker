import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "../lib/firestore";

export const useUserSearch = (searchTerm: string, excludeUserId?: string) => {
  const trimmed = searchTerm.trim();

  return useQuery({
    queryKey: ["userSearch", trimmed, excludeUserId],
    queryFn: () => searchUsers(trimmed, excludeUserId),
    enabled: trimmed.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};
