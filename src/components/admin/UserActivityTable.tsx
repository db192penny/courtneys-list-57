import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Monitor, Smartphone, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { ActivityCard } from './ActivityCard';

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

interface UserActivityTableProps {
  activities: UserActivity[];
}

export function UserActivityTable({ activities }: UserActivityTableProps) {
  const isMobile = useIsMobile();
  
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

  const renderClickCount = (count: number) => {
    if (count === 0) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center gap-1 text-muted-foreground cursor-help">
              <span className="text-sm">0</span>
              <AlertCircle className="h-3 w-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>No interaction events tracked yet</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return <div className="font-semibold text-primary">{count}</div>;
  };

  const renderCategoryCount = (count: number) => {
    if (count === 0) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center gap-1 text-muted-foreground cursor-help">
              <span className="text-sm">0</span>
              <AlertCircle className="h-3 w-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>No categories viewed yet</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return <div className="font-semibold text-secondary-foreground">{count}</div>;
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Community</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-center">Clicks</TableHead>
            <TableHead className="text-center">Categories</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => {
            const { date, time } = formatDateTime(activity.session_start);
            return (
              <TableRow key={activity.id}>
                <TableCell>
                  <div className="text-sm whitespace-nowrap">
                    <div className="font-medium">{date}</div>
                    <div className="text-muted-foreground">{time}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium whitespace-nowrap">
                    {activity.user_name || 'Anonymous'}
                  </div>
                </TableCell>
                <TableCell>
                  {activity.community ? (
                    <Badge variant="outline" className="whitespace-nowrap">
                      {activity.community}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={activity.is_returning_user ? "default" : "secondary"}
                    className={activity.is_returning_user ? "bg-primary/10 text-primary whitespace-nowrap" : "whitespace-nowrap"}
                  >
                    {activity.is_returning_user ? 'Returning' : 'New'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {renderClickCount(activity.total_clicks)}
                </TableCell>
                <TableCell className="text-center">
                  {renderCategoryCount(activity.categories_viewed)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    {activity.device_type === 'Mobile' ? (
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="text-sm">
                      <div>{activity.device_type}</div>
                      <div className="text-xs text-muted-foreground">{activity.browser}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDuration(activity.duration_seconds)}
                </TableCell>
                <TableCell>
                  <div className="text-sm space-y-1">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Reviews:</span>
                      <span className="font-medium">{activity.session_review_count} ({activity.review_count} total)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Costs:</span>
                      <span className="font-medium">{activity.session_cost_count} ({activity.cost_count} total)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Vendors:</span>
                      <span className="font-medium">{activity.session_vendor_count} ({activity.vendor_count} total)</span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {activities.length > 0 && activities.every(a => a.total_clicks === 0) && (
        <div className="p-4 bg-muted/50 border-t flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Interaction tracking is now active!</p>
            <p className="text-muted-foreground">
              New sessions will show click counts and category views. Existing sessions show zeros because tracking wasn't enabled when they visited.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}