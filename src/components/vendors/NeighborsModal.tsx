import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RatingStars } from "@/components/ui/rating-stars";
import { Badge } from "@/components/ui/badge";
import { Users, Star } from "lucide-react";
import { formatNameWithLastInitial } from "@/utils/nameFormatting";
import { extractStreetName, capitalizeStreetName } from "@/utils/address";
import { useUserData } from "@/hooks/useUserData";
import { createReviewCompositeKey } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  comments: string | null;
  created_at: string;
  author_label: string;
}

interface NeighborsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  vendorName: string;
  homesServiced: number;
  communityName?: string;
}

export function NeighborsModal({
  open,
  onOpenChange,
  vendorId,
  vendorName,
  homesServiced,
  communityName = "Boca Bridges"
}: NeighborsModalProps) {
  const { data: userData } = useUserData();
  
  // Get user's actual home community from their HOA mapping
  const { data: userHomeCommunity } = useQuery({
    queryKey: ["user-home-community"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase.rpc("get_my_hoa");
      return data?.[0]?.hoa_name || null;
    },
  });
  
  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ["neighbors-reviews", vendorId],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();

      const [{ data: verifiedReviews }, { data: pendingReviews }] = await Promise.all([
        supabase.rpc("list_vendor_reviews", { 
          _vendor_id: vendorId 
        }),
        supabase.rpc("list_pending_survey_reviews" as any, {
          p_vendor_id: vendorId,
          p_viewer_user_id: session?.session?.user?.id || null
        })
      ]);

      // Deduplicate by composite key to prevent showing the same review twice
      const reviewMap = new Map<string, any>();
      [...(verifiedReviews || []), ...(pendingReviews || [])].forEach((review: any) => {
        const compositeKey = createReviewCompositeKey(review);
        if (!reviewMap.has(compositeKey)) {
          reviewMap.set(compositeKey, review);
        }
      });
      
      const allReviews = Array.from(reviewMap.values())
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return allReviews as Review[];
    },
    enabled: !!vendorId && open,
  });

  const formatAuthorDisplay = (authorLabel: string): { name: string; street: string } => {
    // Try pipe format first
    if (authorLabel.includes('|')) {
      const parts = String(authorLabel).split('|');
      const [nameOrNeighbor, street] = parts.map(p => p.trim());
      const cleanStreet = street ? extractStreetName(street) : "";
      const formattedStreet = cleanStreet ? capitalizeStreetName(cleanStreet) : "";
      
      if (nameOrNeighbor === 'Neighbor' || nameOrNeighbor === '') {
        return { name: 'Neighbor', street: formattedStreet };
      }
      
      const formattedName = formatNameWithLastInitial(nameOrNeighbor);
      return { name: formattedName, street: formattedStreet };
    }
    
    // Try "on" format (e.g., "Amy W. on Rosella Rd")
    if (authorLabel.includes(' on ')) {
      const parts = authorLabel.split(' on ');
      const nameOrNeighbor = parts[0].trim();
      const street = parts[1]?.trim() || '';
      const cleanStreet = street ? extractStreetName(street) : "";
      const formattedStreet = cleanStreet ? capitalizeStreetName(cleanStreet) : "";
      
      if (nameOrNeighbor === 'Neighbor' || nameOrNeighbor === '') {
        return { name: 'Neighbor', street: formattedStreet };
      }
      
      const formattedName = formatNameWithLastInitial(nameOrNeighbor);
      return { name: formattedName, street: formattedStreet };
    }
    
    // Fallback: no street found
    return { name: authorLabel, street: "" };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Neighbors Using {vendorName}</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">
            {homesServiced} neighbor{homesServiced !== 1 ? 's' : ''} in {communityName}
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {isLoading && (
            <div className="text-sm text-muted-foreground text-center py-8">
              Loading neighbor reviews...
            </div>
          )}

          {error && (
            <div className="text-sm text-muted-foreground text-center py-8">
              Unable to load reviews
            </div>
          )}

          {!isLoading && !error && reviews && reviews.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              No reviews yet from neighbors
            </div>
          )}

          {!isLoading && !error && reviews && reviews.length > 0 && (
            <>
              {/* Summary Stats */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-800 flex items-center justify-center gap-1">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                    </div>
                    <div className="text-xs text-blue-600">Average Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-800 flex items-center justify-center gap-1">
                      <Users className="h-5 w-5 text-blue-600" />
                      {reviews.length}
                    </div>
                    <div className="text-xs text-blue-600">Total Reviews</div>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                {reviews.map((review) => {
                  const { name, street } = formatAuthorDisplay(review.author_label);
                  
                  console.log('🔍 Privacy Check:', {
                    userCommunity: userData?.communityName,
                    vendorCommunity: communityName,
                    isDifferent: userData?.communityName && userData.communityName !== communityName,
                    authorLabel: review.author_label,
                    name: name
                  });
                  
                  return (
                    <div 
                      key={review.id}
                      className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {(() => {
                                // Check if viewing different community
                                if (userHomeCommunity && communityName && userHomeCommunity !== communityName) {
                                  // Cross-community: Show "Neighbor" + street if available
                                  return street ? `Neighbor on ${street}` : 'Neighbor';
                                }
                                // Same community: show the actual name
                                return name;
                              })()}
                              {/* Only add street if not already included in name */}
                              {userHomeCommunity === communityName && street && !name.includes(' on ') && ` on ${street}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <RatingStars rating={review.rating} />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400 font-bold">
                          <Star className="h-4 w-4 fill-current" />
                          <span>{review.rating}</span>
                        </div>
                      </div>

                      {/* Comments */}
                      {review.comments && review.comments.trim() && (
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          "{review.comments}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
