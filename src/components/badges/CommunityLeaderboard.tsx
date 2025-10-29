import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { useCommunityLeaderboard } from "@/hooks/useCommunityLeaderboard";
import { useUserLeaderboardPosition } from "@/hooks/useUserLeaderboardPosition";
import { formatNameWithLastInitial } from "@/utils/nameFormatting";
import { extractStreetName } from "@/utils/address";
import { cn } from "@/lib/utils";

type CommunityLeaderboardProps = {
  communityName: string;
  currentUserId?: string;
  className?: string;
};

export default function CommunityLeaderboard({
  communityName,
  currentUserId,
  className
}: CommunityLeaderboardProps) {
  const { data: leaderboard, isLoading: leaderboardLoading } = useCommunityLeaderboard(communityName, 10);
  const { data: userPosition } = useUserLeaderboardPosition(communityName, currentUserId);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <Award className="w-4 h-4 text-muted-foreground" />;
  };

  const formatLeaderboardName = (entry: any) => {
    const formattedName = formatNameWithLastInitial(entry.name);
    const street = entry.street_name ? extractStreetName(entry.street_name) : "";
    return street ? `${formattedName} on ${street}` : formattedName;
  };

  const isCurrentUser = (userId?: string) => userId && currentUserId === userId;

  // Check if current user is in top 10
  const userInTop10 = Array.isArray(leaderboard) && leaderboard.some(entry => entry.user_id === currentUserId);

  if (leaderboardLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Community Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || !Array.isArray(leaderboard) || leaderboard.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Community Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Be the first to earn points and claim the top spot!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Community Leaderboard
        </CardTitle>
        {userPosition && !userInTop10 && (
          <p className="text-sm text-muted-foreground mt-2">
            You're ranked #{userPosition.rank_position} of {userPosition.total_users} neighbors
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.isArray(leaderboard) && leaderboard.map((entry, index) => {
            const isCurrent = isCurrentUser(entry.user_id);
            const rank = entry.rank_position || index + 1;
            return (
              <div
                key={entry.user_id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg transition-colors",
                  isCurrent 
                    ? "bg-primary/10 border-2 border-primary" 
                    : "bg-muted/50 hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(rank)}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-primary font-semibold"
                    )}>
                      {formatLeaderboardName(entry)}
                      {isCurrent && " (You)"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{entry.points}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
