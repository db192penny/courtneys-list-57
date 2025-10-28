import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserData } from "@/hooks/useUserData";
import { ReviewCard } from "@/components/reviews/ReviewCard";

interface Review {
  id: string;
  rating: number;
  comments: string;
  created_at: string;
  author_label: string;
  is_pending?: boolean;
}

interface ReviewsHoverProps {
  vendorId: string;
  children: ReactNode;
  vendorCommunity?: string;
}

export default function ReviewsHover({ vendorId, children, vendorCommunity = "Boca Bridges" }: ReviewsHoverProps) {
  const { data: profile } = useUserProfile();
  const { data: userData } = useUserData();
  const isVerified = !!profile?.isVerified;
  
  const { data, isLoading, error } = useQuery<Review[]>({
    queryKey: ["reviews-hover", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_vendor_reviews", { 
        _vendor_id: vendorId 
      });
      if (error) throw error;
      
      return (data || []) as Review[];
    },
    enabled: !!vendorId,
  });

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="cursor-help">{children}</span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading reviews…</div>
        )}
        {error && (
          <div className="text-sm text-muted-foreground">Unable to load reviews.</div>
        )}
        {data && data.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No reviews yet.
            {!isVerified && (
              <p className="mt-2 text-xs">Sign up to be the first to review!</p>
            )}
          </div>
        )}
        {data && data.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-3">
            {data.map((r) => {
              // Parse author_label to extract data
              const [user_name, user_street] = r.author_label.split('|').map(s => s.trim());
              
              return (
                <ReviewCard
                  key={r.id}
                  review={{
                    ...r,
                    user_name,
                    user_street,
                    vendor_community: vendorCommunity,
                    is_verified: true, // Reviews from list_vendor_reviews are verified
                  }}
                  currentUser={userData?.isAuthenticated ? {
                    community: userData?.communityName,
                    signup_source: undefined
                  } : null}
                  currentCommunity={vendorCommunity}
                />
              );
            })}
            {!isVerified && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md text-center">
                <p className="text-xs text-blue-700">
                  Want to add your review? Sign up to contribute!
                </p>
              </div>
            )}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
