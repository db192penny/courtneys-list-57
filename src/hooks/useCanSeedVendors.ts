import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCanSeedVendors() {
  return useQuery({
    queryKey: ["can-seed-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("can_seed_vendors" as any);
      if (error) {
        console.error("Error checking seed vendor permission:", error);
        return false;
      }
      return data === true;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
