import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import SEO from '@/components/SEO';
import { UserActivityTable } from '@/components/admin/UserActivityTable';
import { useNavigate } from 'react-router-dom';

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

// Helper function to deduplicate sessions by user and time window
function deduplicateUserSessions(sessions: UserActivity[]): UserActivity[] {
  const userSessionMap = new Map<string, UserActivity[]>();
  
  // Group sessions by user_id
  sessions.forEach(session => {
    if (!session.user_id) return; // Skip null user_ids
    
    const userId = session.user_id;
    if (!userSessionMap.has(userId)) {
      userSessionMap.set(userId, []);
    }
    userSessionMap.get(userId)!.push(session);
  });
  
  const deduplicatedSessions: UserActivity[] = [];
  
  // For each user, deduplicate sessions within 5-minute windows
  userSessionMap.forEach((userSessions, userId) => {
    // Sort by session_start time
    userSessions.sort((a, b) => new Date(a.session_start).getTime() - new Date(b.session_start).getTime());
    
    const uniqueSessions: UserActivity[] = [];
    
    userSessions.forEach(session => {
      const sessionTime = new Date(session.session_start).getTime();
      
      // Check if this session is within 5 minutes of an existing session
      const isDuplicate = uniqueSessions.some(existing => {
        const existingTime = new Date(existing.session_start).getTime();
        const timeDiff = Math.abs(sessionTime - existingTime);
        return timeDiff < 5 * 60 * 1000; // 5 minutes in milliseconds
      });
      
      if (!isDuplicate) {
        uniqueSessions.push(session);
      } else {
        console.log(`Filtered duplicate session for user ${session.user_name || 'Unknown'} at ${session.session_start}`);
      }
    });
    
    deduplicatedSessions.push(...uniqueSessions);
  });
  
  // Sort final results by session_start descending
  return deduplicatedSessions.sort((a, b) => new Date(b.session_start).getTime() - new Date(a.session_start).getTime());
}


export function AdminAnalytics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<UserActivity[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [communityFilter, setCommunityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  // Get unique communities for filter
  const communities = Array.from(new Set(userActivities.map(a => a.community).filter(Boolean)));

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...userActivities];

    // Apply user type filter
    if (userTypeFilter === 'new') {
      filtered = filtered.filter(a => !a.is_returning_user);
    } else if (userTypeFilter === 'returning') {
      filtered = filtered.filter(a => a.is_returning_user);
    }

    // Apply community filter
    if (communityFilter !== 'all') {
      filtered = filtered.filter(a => a.community === communityFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.session_start).getTime() - new Date(a.session_start).getTime();
        case 'clicks':
          return b.total_clicks - a.total_clicks;
        case 'categories':
          return b.categories_viewed - a.categories_viewed;
        case 'community':
          return (a.community || '').localeCompare(b.community || '');
        default:
          return 0;
      }
    });

    setFilteredActivities(filtered);
  }, [userActivities, userTypeFilter, communityFilter, sortBy]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch user activity data with session info and activity counts
      // David Birnbaum's user ID and emails to exclude
      const adminUserId = '50c337c8-2c85-4aae-84da-26ee79f4c43b';
      const adminEmails = ['db@fivefourventures.com', 'davebirnbaum@gmail.com'];
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      console.log(`Fetching user sessions from ${twoDaysAgo.toISOString()}, excluding admin emails: ${adminEmails.join(', ')}`);

      const { data: sessionData, error: sessionError } = await supabase
        .from('user_sessions')
        .select(`
          id,
          user_id,
          device_type,
          browser,
          session_start,
          session_end,
          duration_seconds,
          is_returning_user,
          community
        `)
        .not('user_id', 'is', null)
        .neq('user_id', adminUserId)
        .gte('session_start', twoDaysAgo.toISOString())
        .order('session_start', { ascending: false });

      if (sessionError) throw sessionError;

      console.log(`Raw session data: ${sessionData?.length || 0} sessions found`);

      // Filter out any remaining admin sessions by email (backup filter)
      const filteredSessions = (sessionData || []).filter(session => session.user_id !== adminUserId);
      console.log(`After filtering admin sessions: ${filteredSessions.length} sessions remaining`);

      // Fetch user details and activity counts for each session
      const activitiesWithDetails = await Promise.all(
        filteredSessions.map(async (session) => {
          let userData = null;
          let activityCounts = { review_count: 0, cost_count: 0, vendor_count: 0 };
          let sessionActivityCounts = { session_review_count: 0, session_cost_count: 0, session_vendor_count: 0 };
          let analyticsData = { total_clicks: 0, categories_viewed: 0 };

          if (session.user_id) {
            try {
              // Get user name and email for additional filtering
              const { data: user } = await supabase
                .from('users')
                .select('name, email')
                .eq('id', session.user_id)
                .single();
              
              // Skip admin user sessions if they somehow got through
              if (user?.email && adminEmails.includes(user.email)) {
                console.log(`Skipping admin user session: ${user.email}`);
                return null;
              }
              
              userData = user;

              // Get session time boundaries
              const sessionStart = new Date(session.session_start);
              const sessionEnd = session.session_end ? new Date(session.session_end) : new Date();

              // Get analytics data (clicks and categories) for this session
              const { data: analyticsEvents } = await supabase
                .from('user_analytics')
                .select('id, category')
                .eq('session_id', session.id);

              analyticsData = {
                total_clicks: analyticsEvents?.length || 0,
                categories_viewed: new Set(analyticsEvents?.map(e => e.category).filter(Boolean)).size
              };

              // Get activity counts for this user (lifetime totals and session-specific)
              const [
                reviewsResult, 
                costsResult, 
                vendorsResult,
                sessionReviewsResult,
                sessionCostsResult,
                sessionVendorsResult
              ] = await Promise.all([
                // Lifetime totals
                supabase
                  .from('reviews')
                  .select('id', { count: 'exact', head: true })
                  .eq('user_id', session.user_id),
                supabase
                  .from('costs')
                  .select('id', { count: 'exact', head: true })
                  .eq('created_by', session.user_id),
                supabase
                  .from('vendors')
                  .select('id', { count: 'exact', head: true })
                  .eq('created_by', session.user_id),
                // Session-specific counts
                supabase
                  .from('reviews')
                  .select('id', { count: 'exact', head: true })
                  .eq('user_id', session.user_id)
                  .gte('created_at', sessionStart.toISOString())
                  .lte('created_at', sessionEnd.toISOString()),
                supabase
                  .from('costs')
                  .select('id', { count: 'exact', head: true })
                  .eq('created_by', session.user_id)
                  .gte('created_at', sessionStart.toISOString())
                  .lte('created_at', sessionEnd.toISOString()),
                supabase
                  .from('vendors')
                  .select('id', { count: 'exact', head: true })
                  .eq('created_by', session.user_id)
                  .gte('created_at', sessionStart.toISOString())
                  .lte('created_at', sessionEnd.toISOString())
              ]);

              activityCounts = {
                review_count: reviewsResult.count || 0,
                cost_count: costsResult.count || 0,
                vendor_count: vendorsResult.count || 0
              };

              sessionActivityCounts = {
                session_review_count: sessionReviewsResult.count || 0,
                session_cost_count: sessionCostsResult.count || 0,
                session_vendor_count: sessionVendorsResult.count || 0
              };
            } catch (error) {
              console.warn('Failed to fetch user details:', error);
            }
          }

          return {
            id: session.id,
            user_id: session.user_id,
            user_name: userData?.name,
            device_type: session.device_type,
            browser: session.browser,
            session_start: session.session_start,
            duration_seconds: session.duration_seconds,
            is_returning_user: session.is_returning_user || false,
            session_review_count: sessionActivityCounts.session_review_count,
            session_cost_count: sessionActivityCounts.session_cost_count,
            session_vendor_count: sessionActivityCounts.session_vendor_count,
            review_count: activityCounts.review_count,
            cost_count: activityCounts.cost_count,
            vendor_count: activityCounts.vendor_count,
            community: session.community,
            total_clicks: analyticsData.total_clicks,
            categories_viewed: analyticsData.categories_viewed
          };
        })
      );

      // Filter out null results (admin users that were skipped)
      const validActivities = activitiesWithDetails.filter(activity => activity !== null) as UserActivity[];
      console.log(`Valid user activities: ${validActivities.length}`);

      // Deduplicate sessions by user and time window
      const deduplicatedActivities = deduplicateUserSessions(validActivities);
      console.log(`After deduplication: ${deduplicatedActivities.length} unique sessions`);

      setUserActivities(deduplicatedActivities);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Admin Analytics - Courtney's List"
        description="Analytics dashboard for tracking user behavior and engagement"
      />
      
      <div className="container mx-auto px-4 py-6 md:py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            </div>
            
            <Button onClick={fetchAnalytics} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="new">New Users</SelectItem>
                <SelectItem value="returning">Returning Users</SelectItem>
              </SelectContent>
            </Select>

            <Select value={communityFilter} onValueChange={setCommunityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Community" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Communities</SelectItem>
                {communities.map(community => (
                  <SelectItem key={community} value={community!}>
                    {community}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Newest)</SelectItem>
                <SelectItem value="clicks">Most Clicks</SelectItem>
                <SelectItem value="categories">Most Categories</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* User Activity Table */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            Unique User Sessions ({filteredActivities.length} of {userActivities.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Deduplicated non-admin user sessions with clicks, categories, and activity totals
          </p>
        </div>
        <UserActivityTable activities={filteredActivities} />
      </div>
    </div>
  );
}