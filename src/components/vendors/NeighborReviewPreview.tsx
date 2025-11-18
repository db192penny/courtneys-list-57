import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RatingStars } from "@/components/ui/rating-stars";
import { ReviewSourceIcon } from "./ReviewSourceIcon";
import { MobileReviewsModal } from "./MobileReviewsModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatNameWithLastInitial } from "@/utils/nameFormatting";
import { extractStreetName, capitalizeStreetName } from "@/utils/address";
import { cn, createReviewCompositeKey } from "@/lib/utils";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserData } from "@/hooks/useUserData";

interface NeighborReviewPreviewProps {
  vendorId: string;
  vendor?: {
    hoa_rating?: number;
    hoa_rating_count?: number;
  };
  onOpenModal?: () => void;
  onRate?: () => void;
  onSignUp?: () => void;
  className?: string;
  communityName?: string;
  isAuthenticated?: boolean;
  communityPhotoUrl?: string | null;
}

interface Review {
  id: string;
  rating: number;
  comments: string | null;
  created_at: string;
  author_label: string;
  is_pending: boolean;
}

export function NeighborReviewPreview({
  vendorId,
  vendor,
  onOpenModal,
  onRate,
  onSignUp,
  className,
  communityName,
  isAuthenticated = false,
  communityPhotoUrl,
}: NeighborReviewPreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { data: userData } = useUserData();
  const {
    data: reviews,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["vendor-reviews", vendorId],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();

      // Fetch verified user reviews and pending survey reviews in parallel
      const functionName = isAuthenticated ? "list_vendor_reviews" : "list_vendor_reviews_preview";
      const [{ data: verifiedReviews, error: verifiedError }, { data: pendingReviews, error: pendingError }] =
        await Promise.all([
          supabase.rpc(functionName as any, { _vendor_id: vendorId }),
          supabase.rpc("list_pending_survey_reviews" as any, {
            p_vendor_id: vendorId,
            p_viewer_user_id: session.session?.user?.id || null,
          }),
        ]);

      if (verifiedError) {
        console.error("Error fetching verified reviews:", verifiedError);
      }

      if (pendingError) {
        console.error("Error fetching pending survey reviews:", pendingError);
      }

      console.log(
        `[NeighborReviewPreview] Found ${(pendingReviews || []).length} pending survey reviews for vendor ${vendorId}`,
      );
      console.log("[PendingReviews] Full data:", pendingReviews);
      console.log("[PendingReviews] First review:", pendingReviews?.[0]);
      console.log("[PendingReviews] Rating:", pendingReviews?.[0]?.rating);
      console.log("[PendingReviews] Author label:", pendingReviews?.[0]?.author_label);
      console.log("[PendingReviews] Comments:", pendingReviews?.[0]?.comments);

      // Format and tag verified reviews
      const taggedVerifiedReviews = (verifiedReviews || []).map((vr) => ({
        ...vr,
        is_pending: false,
      }));

      // Format and tag survey reviews as pending (from list_pending_survey_reviews RPC)
      // Use author_label directly from the RPC - it's already formatted correctly!
      const formattedSurveyReviews = (pendingReviews || []).map((sr: any) => ({
        id: sr.id,
        rating: sr.rating,
        comments: sr.comments,
        created_at: sr.created_at,
        author_label: sr.author_label, // Use the pre-formatted label from the database
        is_pending: true,
      }));

      // Combine verified and survey reviews
      const allReviews = [...taggedVerifiedReviews, ...formattedSurveyReviews];

      // Deduplicate by composite key (rating + comments + timestamp)
      const uniqueReviewsMap = new Map<string, Review>();
      allReviews.forEach((review) => {
        const compositeKey = createReviewCompositeKey(review);
        if (!uniqueReviewsMap.has(compositeKey)) {
          uniqueReviewsMap.set(compositeKey, review);
        }
      });

      return Array.from(uniqueReviewsMap.values()) as Review[];
    },
    enabled: !!vendorId,
  });

  // Smart review selection: prioritize verified over pending, then substantial content, then date
  const selectBestReview = (reviews: Review[]): Review | null => {
    if (!reviews || reviews.length === 0) return null;

    // Sort by: verified first, then substantial comments, then date
    const sorted = [...reviews].sort((a, b) => {
      // 1. Prioritize verified reviews over pending
      if (!a.is_pending && b.is_pending) return -1;
      if (a.is_pending && !b.is_pending) return 1;

      // 2. Then prioritize reviews with substantial comments
      const aHasComment = a.comments && a.comments.trim().length > 10;
      const bHasComment = b.comments && b.comments.trim().length > 10;

      if (aHasComment && !bHasComment) return -1;
      if (!aHasComment && bHasComment) return 1;

      // 3. Finally sort by most recent
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return sorted[0];
  };

  const applyPrivacyRules = (authorLabel: string): string => {
    if (!authorLabel) return 'Neighbor';
    
    // Check if this is a pending review (contains " in " and "(Pending)")
    const isPending = authorLabel.includes(' in ') && authorLabel.includes('(Pending)');
    
    // Extract location part (either "on Street" or "in Community (Pending)")
    let locationPart = '';
    if (isPending) {
      // Pending format: "Name in The Oaks (Pending)" or "Neighbor in The Oaks (Pending)"
      const inMatch = authorLabel.match(/in (.+)/);
      locationPart = inMatch ? ` in ${inMatch[1]}` : '';
    } else {
      // Verified format: "Name on Street" or "Neighbor on Street"
      const onMatch = authorLabel.match(/on ([^(]+)/);
      locationPart = onMatch ? ` on ${onMatch[1].trim()}` : '';
    }
    
    // Logged out users: Always show "Neighbor" + location
    if (!isAuthenticated) {
      return locationPart ? `Neighbor${locationPart}` : 'Neighbor';
    }
    
    // Logged in but different community: Show "Neighbor" + location
    if (userData?.communityName && communityName && userData.communityName !== communityName) {
      return locationPart ? `Neighbor${locationPart}` : 'Neighbor';
    }
    
    // Same community: Use what the database returned
    // (Database already checks show_name preference)
    return authorLabel;
  };

  const truncateComment = (comment: string) => {
    const limit = isMobile ? 140 : 250;
    if (!comment || comment.length <= limit) return { text: comment, wasTruncated: false };

    // Find a good breaking point near the limit (prefer word boundaries)
    let breakPoint = limit;
    for (let i = limit; i > limit - 20 && i < comment.length; i++) {
      if (comment[i] === " ") {
        breakPoint = i;
        break;
      }
    }

    return {
      text: comment.substring(0, breakPoint),
      wasTruncated: true,
      remainingLength: comment.length - breakPoint,
    };
  };

  const handleInteraction = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();

    // Track read all reviews click in Mixpanel
    if (typeof window !== "undefined" && window.mixpanel) {
      try {
        window.mixpanel.track("Clicked Read All Reviews", {
          vendor_id: vendorId,
          review_count: totalReviews,
          is_authenticated: isAuthenticated,
          community: communityName,
        });
        console.log("📊 Tracked read all reviews click for vendor:", vendorId);
      } catch (error) {
        console.error("Mixpanel tracking error:", error);
      }
    }

    if (onOpenModal) {
      onOpenModal();
    } else {
      setIsModalOpen(true);
    }
  };

  if (isLoading) {
    return <div className={cn("text-xs text-muted-foreground", className)}>Loading reviews...</div>;
  }

  if (error) {
    return <div className={cn("text-xs text-muted-foreground", className)}>Unable to load reviews</div>;
  }

  const selectedReview = selectBestReview(reviews || []);
  const totalReviews: number = reviews?.length || 0;

  // Calculate if we should show the CTA box
  const shouldShowCTA = (() => {
    const reviewCount = totalReviews as number;
    if (reviewCount > 1) return true; // Multiple reviews
    if (reviewCount === 1 && selectedReview) {
      const hasComments = selectedReview.comments && selectedReview.comments.trim();
      if (!hasComments) return false; // Rating-only
      const { wasTruncated } = truncateComment(selectedReview.comments);
      return wasTruncated; // Show only if truncated
    }
    return false;
  })();

  if (totalReviews === 0) {
    return (
      <div
        className={cn(
          "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-blue-300 transition-all duration-200 active:scale-[0.98]",
          className,
        )}
        onClick={() => {
          if (isAuthenticated && onRate) {
            onRate();
          } else if (!isAuthenticated && onSignUp) {
            onSignUp();
          }
        }}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (isAuthenticated && onRate) {
              onRate();
            } else if (!isAuthenticated && onSignUp) {
              onSignUp();
            }
          }
        }}
      >
        {/* Header with Rating Summary */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <ReviewSourceIcon source="bb" size="lg" communityPhotoUrl={communityPhotoUrl} />
            <div>
              <div className="text-sm font-bold text-blue-800">{communityName || "Community"} Reviews</div>
              <div className="text-xs text-blue-600">From your neighbors</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <RatingStars rating={vendor?.hoa_rating || 0} />
              <span className="text-base font-bold text-blue-800">{vendor?.hoa_rating?.toFixed(1) || "0.0"}</span>
            </div>
            <div className="text-sm text-blue-600 font-medium">
              {totalReviews} {(totalReviews as number) !== 1 ? "reviews" : "review"}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white/60 rounded-lg p-3 border border-blue-100 hover:bg-white/80 transition-colors">
          <div className="flex items-center gap-2 text-blue-800">
            <span className="text-lg">⭐</span>
            <span className="text-sm font-semibold">Be the first neighbor to review this vendor!</span>
          </div>
        </div>
      </div>
    );
  }

  const TriggerContent = () => (
    <div
      className={cn(
        "bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-blue-300 active:scale-[0.98]",
        className,
      )}
      onClick={handleInteraction}
      onKeyPress={handleInteraction}
      role="button"
      tabIndex={0}
    >
      {/* Header with Rating Summary */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <ReviewSourceIcon source="bb" size="lg" communityPhotoUrl={communityPhotoUrl} />
          <div>
            <div className="text-sm font-bold text-blue-800">{communityName || "Community"} Reviews</div>
            <div className="text-xs text-blue-600">From your neighbors</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <RatingStars rating={selectedReview?.rating || vendor?.hoa_rating || 0} />
            <span className="text-base font-bold text-blue-800">
              {selectedReview?.rating?.toFixed(1) || vendor?.hoa_rating?.toFixed(1) || "0.0"}
            </span>
          </div>
          <div className="text-sm text-blue-600 font-medium">
            {totalReviews} {(totalReviews as number) !== 1 ? "reviews" : "review"}
          </div>
        </div>
      </div>

      {/* Comment Preview with Right-aligned Attribution or Rating-only Display */}
      {selectedReview.comments && selectedReview.comments.trim() ? (
        <div className="bg-white/60 rounded-lg p-3 mb-3 border border-blue-100">
          <p className="text-base text-blue-800 font-medium leading-snug mb-2 italic">
            "{truncateComment(selectedReview.comments).text}
            {truncateComment(selectedReview.comments).wasTruncated && "..."}"
          </p>
          {/* Right-aligned attribution */}
          <div className="flex justify-end">
            <p className="text-sm font-semibold text-blue-700">— {applyPrivacyRules(selectedReview.author_label)}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white/60 rounded-lg p-3 mb-3 border border-blue-100 text-center">
          <div className="flex items-center justify-center gap-1 text-blue-800 mb-2">
            <RatingStars rating={selectedReview.rating} />
            <span className="font-bold text-lg">{selectedReview.rating}/5</span>
          </div>
          <div className="text-sm text-blue-600">by {applyPrivacyRules(selectedReview.author_label)}</div>
        </div>
      )}

      {/* Footer with CTA - Compact Inline */}
      {shouldShowCTA && (
        <div className="mt-3 bg-white/40 border border-blue-300 rounded-lg px-3 py-2 hover:bg-white/60 hover:border-blue-400 transition-all duration-200">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-lg">👀</span>
            <span className="font-semibold text-blue-900">
              {totalReviews === 1 ? "Read this review" : `Read all ${totalReviews} reviews`}
            </span>
            <span className="text-base font-bold text-blue-700">→</span>
          </div>
        </div>
      )}
    </div>
  );

  if (onOpenModal) {
    // When used inside VendorMobileCard, just render the trigger content
    return <TriggerContent />;
  }

  // Standalone usage with its own modal
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <TriggerContent />
      </DialogTrigger>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>{communityName || "Boca Bridges"}</DialogTitle>
        </DialogHeader>
        <MobileReviewsModal
          open={true}
          onOpenChange={() => {}}
          vendor={{ id: vendorId }}
          onRate={() => {}}
          communityName={communityName}
        />
      </DialogContent>
    </Dialog>
  );
}
