import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserLeaderboardPosition = {
  points: number;
  rank_position: number;
  total_users: number;
};

export function useUserLeaderboardPosition(communityName: string, userId: string | undefined) {
  return useQuery<UserLeaderboardPosition | null>({
    queryKey: ["user-leaderboard-position", communityName, userId],
    queryFn: async () => {
      if (!userId) return null;
      
      console.log("[useUserLeaderboardPosition] fetching position for user", userId);
      
      const { data, error } = await supabase.rpc("get_user_leaderboard_position", {
        _community_name: communityName,
        _user_id: userId
      });

      if (error) {
        console.warn("[useUserLeaderboardPosition] error:", error);
        return null;
      }

      return data?.[0] || null;
    },
    enabled: !!communityName && !!userId,
  });
}
