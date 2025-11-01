import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import SEO from '@/components/SEO';
import { useNavigate } from 'react-router-dom';
import { TrafficSummary } from '@/components/admin/TrafficSummary';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AdminAnalytics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [trafficData, setTrafficData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchTrafficSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_traffic_summary' as any, {
        _days: parseInt(timeRange)
      });

      if (error) throw error;

      console.log('Traffic summary data:', data);
      setTrafficData(data[0]); // RPC returns array with single row
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch traffic summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficSummary();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading traffic summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Traffic Summary - Courtney's List"
        description="Traffic and referral analytics dashboard"
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
              <h1 className="text-3xl font-bold">Traffic Summary</h1>
              <p className="text-muted-foreground">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Excludes admin traffic (your sessions and Lindsay's are filtered out)
              </p>
            </div>
            
            <div className="flex gap-3 items-center">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={fetchTrafficSummary} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {trafficData && <TrafficSummary data={trafficData} />}
      </div>
    </div>
  );
}
