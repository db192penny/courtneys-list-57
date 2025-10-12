import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Monitor, Smartphone, Clock, MousePointerClick, Layers } from "lucide-react";

interface UserActivity {
  id: string;
  user_id: string | null;
  user_name?: string;
  device_type: string;
  browser: string;
  session_start: string;
  duration_seconds: number | null;
  is_returning_user: boolean;
  session_review_count: number;
  session_cost_count: number;
  session_vendor_count: number;
  review_count: number;
  cost_count: number;
  vendor_count: number;
  community: string | null;
  total_clicks: number;
  categories_viewed: number;
}

interface ActivityCardProps {
  activity: UserActivity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatDateTime(activity.session_start);

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {activity.user_name || 'Anonymous'}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge 
                  variant={activity.is_returning_user ? "default" : "secondary"}
                  className={activity.is_returning_user ? "bg-primary/10 text-primary" : ""}
                >
                  {activity.is_returning_user ? 'Returning' : 'New'}
                </Badge>
                {activity.community && (
                  <Badge variant="outline" className="text-xs">
                    {activity.community}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right shrink-0 text-sm">
              <div className="font-medium">{date}</div>
              <div className="text-muted-foreground">{time}</div>
            </div>
          </div>

          {/* Device & Duration */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {activity.device_type === 'Mobile' ? (
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Monitor className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <div className="font-medium">{activity.device_type}</div>
                <div className="text-xs text-muted-foreground">{activity.browser}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(activity.duration_seconds)}</span>
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5">
              <MousePointerClick className="h-4 w-4 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Clicks</div>
                <div className="font-bold text-primary">{activity.total_clicks}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/10">
              <Layers className="h-4 w-4 text-secondary-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Categories</div>
                <div className="font-bold text-secondary-foreground">{activity.categories_viewed}</div>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Reviews</div>
              <div className="font-semibold text-sm">
                {activity.session_review_count}
                <span className="text-xs text-muted-foreground ml-1">
                  ({activity.review_count})
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Costs</div>
              <div className="font-semibold text-sm">
                {activity.session_cost_count}
                <span className="text-xs text-muted-foreground ml-1">
                  ({activity.cost_count})
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Vendors</div>
              <div className="font-semibold text-sm">
                {activity.session_vendor_count}
                <span className="text-xs text-muted-foreground ml-1">
                  ({activity.vendor_count})
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
