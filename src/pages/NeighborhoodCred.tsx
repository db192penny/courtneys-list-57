import { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBadgeLevels, getUserCurrentBadge, getUserNextBadge } from "@/hooks/useBadgeLevels";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useUserData } from "@/hooks/useUserData";
import { formatBadgeName } from "@/utils/badgeNameFormatter";
import UserBadge from "@/components/badges/UserBadge";
import AdminBadge from "@/components/badges/AdminBadge";
import BadgeProgress from "@/components/badges/BadgeProgress";
import PointHistoryTable from "@/components/badges/PointHistoryTable";
import CommunityLeaderboard from "@/components/badges/CommunityLeaderboard";
import { Trophy, Award } from "lucide-react";

const NeighborhoodCred = () => {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<number>(0);
  const [userId, setUserId] = useState<string | undefined>();
  
  const { data: badgeLevels = [] } = useBadgeLevels();
  const { data: isAdmin = false } = useIsAdmin();
  const { data: userData } = useUserData();
  
  const currentBadge = getUserCurrentBadge(points, badgeLevels);
  const nextBadge = getUserNextBadge(points, badgeLevels);
  const communityName = userData?.communityName;

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }

      setUserId(auth.user.id);

      // Get user points
      const { data: userData } = await supabase
        .from("users")
        .select("points")
        .eq("id", auth.user.id)
        .single();

      if (!cancel) {
        setPoints(userData?.points ?? 0);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEO
        title="Points — Courtney's List"
        description="Track your community contributions, badges, and leaderboard position."
        canonical={canonical}
      />
      <section className="container max-w-4xl py-10">
        <h1 className="text-2xl font-semibold mb-8">Points</h1>

        {/* Points & Badge Hero Card */}
        <Card className="mb-6 border-2 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Award className="h-6 w-6 text-primary" />
              Your Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              {currentBadge && (
                <UserBadge
                  name={formatBadgeName(currentBadge.name, communityName)}
                  color={currentBadge.color}
                  icon={currentBadge.icon}
                  size="lg"
                />
              )}
              {isAdmin && <AdminBadge size="lg" />}
            </div>
            
            <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <Trophy className="h-6 w-6 text-primary" />
              <div>
                <span className="font-bold text-2xl text-primary">{points}</span>
                <span className="text-foreground/70 ml-2">Activity Points</span>
              </div>
            </div>
            
            <BadgeProgress
              currentPoints={points}
              currentBadge={currentBadge}
              nextBadge={nextBadge}
            />
          </CardContent>
        </Card>

        {/* Community Leaderboard */}
        {communityName && (
          <CommunityLeaderboard
            communityName={communityName}
            currentUserId={userId}
            className="mb-6"
          />
        )}
        
        {/* Point History Section */}
        <div className="mt-6">
          <PointHistoryTable />
        </div>
      </section>
    </main>
  );
};

export default NeighborhoodCred;
