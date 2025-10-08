import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIsVendorContributor() {
  return useQuery({
    queryKey: ["is-vendor-contributor"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_vendor_contributor" as any);
      if (error) {
        console.error("Error checking vendor contributor status:", error);
        return false;
      }
      return data === true;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
