import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserData } from "@/hooks/useUserData";
import { ReviewSourceIcon } from "./ReviewSourceIcon";
import { RatingStars } from "@/components/ui/rating-stars";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewCard } from "@/components/reviews/ReviewCard";

interface Review {
  id: string;
  rating: number;
  comments: string;
  created_at: string;
  author_label: string;
  is_pending?: boolean;
}

export function MobileReviewsModal({ open, onOpenChange, vendor, onRate }) {
  const { data: profile } = useUserProfile();
  const { data: userData } = useUserData();
  const navigate = useNavigate();
  const isVerified = !!profile?.isVerified;
  const vendorCommunity = vendor?.community || 'Boca Bridges';
  
  const { data, isLoading, error } = useQuery<Review[]>({
    queryKey: ["mobile-reviews", vendor?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_vendor_reviews", { 
        _vendor_id: vendor?.id 
      });
      if (error) throw error;
      
      return (data || []) as Review[];
    },
    enabled: isVerified && !!vendor?.id,
  });

  const { data: googleReviews } = useQuery({
    queryKey: ["google-reviews", vendor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("google_reviews_json")
        .eq("id", vendor?.id)
        .single();
      
      if (error) throw error;
      return (data?.google_reviews_json as any[]) || [];
    },
    enabled: !!vendor?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-md p-4 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="w-16 h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-muted-foreground p-4">Unable to load reviews.</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground p-4">No reviews yet.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="neighbor" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="neighbor">Neighbor Reviews</TabsTrigger>
          <TabsTrigger value="google">Google Reviews</TabsTrigger>
        </TabsList>
        
        <TabsContent value="neighbor" className="mt-0">
          <div className="flex-1 max-h-96 overflow-y-auto space-y-4 p-4">
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
                    is_verified: true,
                  }}
                  currentUser={userData?.isAuthenticated ? {
                    community: userData?.communityName,
                    signup_source: undefined
                  } : null}
                  currentCommunity={vendorCommunity}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="google" className="mt-0">
          <div className="flex-1 max-h-96 overflow-y-auto space-y-4 p-4">
            {!googleReviews || googleReviews.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No Google reviews available
              </div>
            ) : (
              googleReviews.slice(0, 5).map((review: any, idx: number) => (
                <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">G</span>
                      <div className="text-sm font-medium text-blue-700">
                        {review.author_name}
                      </div>
                    </div>
                    {review.relative_time_description && (
                      <div className="text-xs text-blue-600">
                        {review.relative_time_description}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <RatingStars rating={review.rating} size="sm" showValue />
                  </div>
                  
                  {review.text && (
                    <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {review.text}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}