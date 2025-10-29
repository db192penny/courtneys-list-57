import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LeaderboardEntry = {
  user_id?: string;
  name: string;
  street_name?: string;
  points: number;
  rank_position?: number;
};

export function useCommunityLeaderboard(communityName: string, limit: number = 10) {
  return useQuery({
    queryKey: ["community-leaderboard", communityName, limit],
    queryFn: async () => {
      console.log("[useCommunityLeaderboard] fetching leaderboard for", communityName);
      
      const { data, error } = await supabase.rpc("get_community_leaderboard", {
        _community_name: communityName,
        _limit: limit
      });

      if (error) {
        console.warn("[useCommunityLeaderboard] error:", error);
        return [];
      }

      return (data || []) as LeaderboardEntry[];
    },
    enabled: !!communityName,
  });
}
