import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Monitor, Smartphone, Globe, Calendar } from 'lucide-react';

interface TrafficSummaryProps {
  data: {
    total_sessions: number;
    unique_users: number;
    new_users: number;
    returning_users: number;
    top_referrers: Array<{ referrer: string; count: number }>;
    utm_sources: Array<{ source: string; medium: string; campaign: string; count: number }>;
    device_breakdown: Array<{ device: string; count: number; percentage: number }>;
    browser_breakdown: Array<{ browser: string; count: number; percentage: number }>;
    community_breakdown: Array<{ community: string; count: number; percentage: number }>;
    daily_sessions: Array<{ date: string; sessions: number; unique_users: number }>;
  };
}

export function TrafficSummary({ data }: TrafficSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_sessions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.unique_users.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Visitors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.new_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((data.new_users / data.total_sessions) * 100)}% of sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returning Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.returning_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((data.returning_users / data.total_sessions) * 100)}% of sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Top Referral Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.top_referrers?.map((referrer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="font-medium">{referrer.referrer}</span>
                </div>
                <span className="text-muted-foreground">{referrer.count} sessions</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* UTM Campaign Tracking */}
      {data.utm_sources && data.utm_sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>UTM Campaign Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.utm_sources.map((utm, index) => (
                <div key={index} className="flex flex-col gap-1 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Campaign: {utm.campaign}</span>
                    <Badge>{utm.count} sessions</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Source: {utm.source} | Medium: {utm.medium}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device & Browser Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Device Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.device_breakdown?.map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {device.device === 'Mobile' ? (
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{device.device}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{device.count}</div>
                    <div className="text-sm text-muted-foreground">{device.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Browser Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.browser_breakdown?.map((browser, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{browser.browser}</span>
                  <div className="text-right">
                    <div className="font-medium">{browser.count}</div>
                    <div className="text-sm text-muted-foreground">{browser.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Community Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.community_breakdown?.map((community, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{community.community}</span>
                <div className="text-right">
                  <div className="font-medium">{community.count} sessions</div>
                  <div className="text-sm text-muted-foreground">{community.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Trend (Simple List) */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Sessions (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.daily_sessions?.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-2 border-b">
                <span className="text-sm font-medium">
                  {new Date(day.date).toLocaleDateString()}
                </span>
                <div className="text-sm text-muted-foreground">
                  {day.sessions} sessions • {day.unique_users} unique
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
