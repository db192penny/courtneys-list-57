import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp } from "lucide-react";

const COMMUNITIES = [
  "ALL",
  "The Oaks",
  "Woodfield Country Club",
  "Boca Bridges"
];

interface EmailStats {
  total_respondents: number;
  emails_sent: number;
  emails_pending: number;
  forms_completed: number;
  completion_rate: number;
}

export function SurveyEmailStatus() {
  const [community, setCommunity] = useState<string>("");
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async (comm: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('survey_email_tracking' as any, { 
        community: comm 
      });
      
      if (error) throw error;
      if (data && Array.isArray(data) && data.length > 0) {
        setStats(data[0]);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error('Error fetching email stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityChange = (value: string) => {
    setCommunity(value);
    fetchStats(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Email Delivery Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Community</label>
          <Select value={community} onValueChange={handleCommunityChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select community" />
            </SelectTrigger>
            <SelectContent>
              {COMMUNITIES.map((comm) => (
                <SelectItem key={comm} value={comm}>
                  {comm}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && stats && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Respondents</TableCell>
                <TableCell className="text-right">{stats.total_respondents}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Emails Sent</TableCell>
                <TableCell className="text-right">{stats.emails_sent}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Emails Pending</TableCell>
                <TableCell className="text-right">{stats.emails_pending}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Forms Completed</TableCell>
                <TableCell className="text-right">{stats.forms_completed}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Completion Rate</TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {stats.completion_rate.toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}

        {!loading && community && !stats && (
          <div className="text-center py-8 text-muted-foreground">
            No data available for this community
          </div>
        )}
      </CardContent>
    </Card>
  );
}
