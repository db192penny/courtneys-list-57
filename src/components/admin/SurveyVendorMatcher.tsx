import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const COMMUNITIES = [
  "The Oaks",
  "Woodfield Country Club",
  "Boca Bridges"
];

interface MatchResults {
  exact_matches: number;
  fuzzy_matches: number;
  created_new: number;
}

interface UnmatchedVendor {
  vendor_name: string;
  category: string;
  count: number;
}

export function SurveyVendorMatcher() {
  const [community, setCommunity] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchResults | null>(null);
  const [unmatched, setUnmatched] = useState<UnmatchedVendor[]>([]);
  const { toast } = useToast();

  const handleCommunityChange = (value: string) => {
    setCommunity(value);
    setResults(null);
    setUnmatched([]);
    fetchUnmatched(value);
  };

  const fetchUnmatched = async (comm: string) => {
    try {
      const { data, error } = await supabase.rpc('survey_get_unmatched_vendors' as any, { 
        community: comm 
      });
      
      if (error) throw error;
      setUnmatched((data as UnmatchedVendor[]) || []);
    } catch (error) {
      console.error('Error fetching unmatched vendors:', error);
    }
  };

  const autoMatchVendors = async () => {
    if (!community) {
      toast({
        title: "Select Community",
        description: "Please select a community first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.rpc('survey_auto_match_vendors' as any, { 
        community: community 
      });

      if (error) throw error;

      if (data && Array.isArray(data) && data.length > 0) {
        setResults({
          exact_matches: data[0].exact_matches || 0,
          fuzzy_matches: data[0].fuzzy_matches || 0,
          created_new: data[0].created_new || 0
        });

        toast({
          title: "Vendors Matched",
          description: `Matched ${data[0].exact_matches + data[0].fuzzy_matches} vendors`
        });

        // Refresh unmatched list
        await fetchUnmatched(community);
      }
    } catch (error: any) {
      console.error('Error matching vendors:', error);
      toast({
        title: "Match Failed",
        description: error.message || "Failed to match vendors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Vendor Matching
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
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
          <Button
            onClick={autoMatchVendors}
            disabled={!community || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            Auto-Match Vendors
          </Button>
        </div>

        {results && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="text-sm font-medium">Match Results:</div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Exact Matches</div>
                <div className="text-2xl font-bold text-green-600">{results.exact_matches}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Fuzzy Matches</div>
                <div className="text-2xl font-bold text-blue-600">{results.fuzzy_matches}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Created New</div>
                <div className="text-2xl font-bold text-amber-600">{results.created_new}</div>
              </div>
            </div>
          </div>
        )}

        {unmatched.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">{unmatched.length} Unmatched Vendors Need Review:</div>
              <ul className="space-y-1 text-sm">
                {unmatched.slice(0, 5).map((vendor, idx) => (
                  <li key={idx}>
                    {vendor.vendor_name} ({vendor.category}) - {vendor.count} responses
                  </li>
                ))}
                {unmatched.length > 5 && (
                  <li className="text-muted-foreground">...and {unmatched.length - 5} more</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
