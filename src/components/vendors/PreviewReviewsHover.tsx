import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { RatingStars } from "@/components/ui/rating-stars";
import { formatDistanceToNow } from "date-fns";

export default function PreviewReviewsHover({
  vendorId, 
  children 
}: { 
  vendorId: string; 
  children: ReactNode;
}) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["preview-vendor-reviews", vendorId],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      
      console.log('[VendorReviews] Fetching reviews for vendor:', vendorId);
      
      // Fetch both verified and pending reviews using RPC functions
      const [verifiedResult, pendingResult] = await Promise.all([
        supabase.rpc('list_vendor_reviews_preview', {
          _vendor_id: vendorId
        }),
        supabase.rpc('list_pending_survey_reviews' as any, {
          p_vendor_id: vendorId,
          p_viewer_user_id: session?.session?.user?.id || null
        })
      ]);

      console.log('[VendorReviews] Verified:', verifiedResult.data?.length || 0);
      console.log('[VendorReviews] Pending:', pendingResult.data?.length || 0);

      // Format verified reviews
      const formattedVerifiedReviews = (verifiedResult.data || []).map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comments: review.comments,
        created_at: review.created_at,
        author_label: review.author_label,
        type: 'verified'
      }));

      // Format pending survey reviews
      const formattedPendingReviews = (pendingResult.data || []).map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comments: review.comments,
        created_at: review.created_at,
        author_label: review.author_label,
        type: 'pending'
      }));

      // Combine both types of reviews and sort by creation date
      const allReviews = [...formattedVerifiedReviews, ...formattedPendingReviews];
      const sortedReviews = allReviews.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      console.log('[VendorReviews] Combined:', sortedReviews.length);
      
      return sortedReviews;
    },
    enabled: !!vendorId,
  });

  const getAuthorLabel = (review: any) => {
    // Use the author_label directly from the RPC function
    return review.author_label || "Neighbor";
  };

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Community Reviews</h4>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading reviews...</p>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="border-b border-border pb-2 last:border-b-0">
                  <div className="flex items-center gap-2 mb-1">
                    <RatingStars rating={review.rating} size="sm" />
                    <span className="text-xs font-medium">{getAuthorLabel(review)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {review.comments && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {review.comments}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No reviews yet. Be the first to rate this vendor!</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}