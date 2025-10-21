import { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useBadgeLevels, getUserCurrentBadge, getUserNextBadge } from "@/hooks/useBadgeLevels";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useUserData } from "@/hooks/useUserData";
import { formatBadgeName } from "@/utils/badgeNameFormatter";
import UserBadge from "@/components/badges/UserBadge";
import AdminBadge from "@/components/badges/AdminBadge";
import BadgeProgress from "@/components/badges/BadgeProgress";
import PointHistoryTable from "@/components/badges/PointHistoryTable";
import ActivityGuide from "@/components/badges/ActivityGuide";
import BadgeLevelChart from "@/components/badges/BadgeLevelChart";
import { Gift, Trophy, Coffee, CheckCircle, Award } from "lucide-react";

const NeighborhoodCred = () => {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<number>(0);
  
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

  // Progress to 20-point Starbucks reward
  const starbucksProgress = Math.min(points / 20, 1);
  const pointsToStarbucks = Math.max(20 - points, 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEO
        title="Community Rewards — Courtney's List"
        description="Track your community contributions and unlock exclusive rewards."
        canonical={canonical}
      />
      <section className="container max-w-4xl py-10">
        <h1 className="text-2xl font-semibold mb-8">Community Rewards</h1>

        {/* Reward Progress Card */}
        <Card className="mb-6 relative overflow-hidden border-2 shadow-lg">
          <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            LIMITED TIME
          </div>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5 text-primary" />
              Launch Reward
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Starbucks Reward */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Coffee className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">$10 Starbucks Gift Card</h3>
                    <p className="text-sm text-foreground/70">Earn 20 points to unlock this limited-time reward</p>
                  </div>
                </div>
                {points >= 20 ? (
                  <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold px-3 py-1.5 rounded-full text-sm whitespace-nowrap">
                    <CheckCircle className="h-4 w-4" />
                    Earned!
                  </div>
                ) : null}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground/80">{points} / 20 points</span>
                  {points < 20 && (
                    <span className="text-muted-foreground">{pointsToStarbucks} to go</span>
                  )}
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${starbucksProgress * 100}%` }}
                  />
                </div>
              </div>
              
              {points < 20 && (
                <div className="text-sm text-foreground/70 bg-muted/50 p-3 rounded-lg">
                  <span className="font-medium">Quick ways to earn:</span> Invite a neighbor (10 pts) or leave reviews (5 pts each)
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Status Card */}
        <Card className="mb-6 border-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-primary" />
              Your Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <span className="font-semibold text-lg">{points}</span>
                <span className="text-muted-foreground ml-1">Activity Points</span>
              </div>
            </div>
            
            <BadgeProgress
              currentPoints={points}
              currentBadge={currentBadge}
              nextBadge={nextBadge}
            />
          </CardContent>
        </Card>

        {/* Activity Insights Section */}
        <div className="mt-8 space-y-6">
          <ActivityGuide />
          <BadgeLevelChart currentPoints={points} />
        </div>
        
        {/* Point History Section */}
        <div className="mt-8">
          <PointHistoryTable />
        </div>
      </section>
    </main>
  );
};

export default NeighborhoodCred;