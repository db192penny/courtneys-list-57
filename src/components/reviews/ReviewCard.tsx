import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Star } from "lucide-react";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comments?: string;
    created_at: string;
    user_name?: string;
    user_street?: string;
    reviewer_community?: string;
    vendor_community: string;
    anonymous?: boolean;
    is_verified?: boolean;
    show_name_public?: boolean;
  };
  currentUser?: {
    community?: string;
    signup_source?: string;
  } | null;
  currentCommunity: string;
}

const getReviewerDisplay = (review: any, currentUser: any, currentCommunity: string) => {
  const {
    user_name,
    user_street,
    reviewer_community,
    vendor_community,
    anonymous,
    is_verified,
    show_name_public
  } = review;
  
  // Not verified - always show generic
  if (!is_verified) {
    return `${vendor_community} Resident`;
  }
  
  // Logged out - show community name
  if (!currentUser) {
    return `${vendor_community} Resident${user_street ? ' on ' + user_street : ''}`;
  }
  
  // Different community - show community name
  const userCommunity = currentUser.community || currentUser.signup_source?.split(':')[1];
  if (userCommunity !== vendor_community) {
    return `${vendor_community} Resident${user_street ? ' on ' + user_street : ''}`;
  }
  
  // Same community + anonymous
  if (anonymous) {
    return `Neighbor${user_street ? ' on ' + user_street : ''}`;
  }
  
  // Same community + show name
  if (show_name_public && user_name) {
    const names = user_name.split(' ');
    const firstName = names[0];
    const lastInitial = names[names.length - 1]?.[0] || '';
    return `${firstName} ${lastInitial}.${user_street ? ' on ' + user_street : ''}`;
  }
  
  // Same community but hiding name
  return `Neighbor${user_street ? ' on ' + user_street : ''}`;
};

export function ReviewCard({ review, currentUser, currentCommunity }: ReviewCardProps) {
  const reviewerDisplay = getReviewerDisplay(review, currentUser, currentCommunity);
  
  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating
                  ? "fill-primary text-primary"
                  : "fill-muted text-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
        </span>
      </div>
      
      <div className="text-sm font-medium text-foreground">
        {reviewerDisplay}
      </div>
      
      {review.comments && (
        <p className="text-sm text-muted-foreground">{review.comments}</p>
      )}
    </Card>
  );
}
