import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Send } from "lucide-react";

const COMMUNITIES = [
  "The Oaks",
  "Woodfield Country Club",
  "Boca Bridges"
];

export function SurveyEmailSender() {
  const [community, setCommunity] = useState<string>("");
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ sent: number; failed: number } | null>(null);
  const { toast } = useToast();

  const fetchPendingCount = async (comm: string) => {
    try {
      const { data, error } = await supabase.rpc('survey_email_tracking' as any, { 
        community: comm 
      });
      
      if (error) throw error;
      if (data && Array.isArray(data) && data.length > 0) {
        setPendingCount(data[0].emails_pending || 0);
      }
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  const handleCommunityChange = (value: string) => {
    setCommunity(value);
    setResults(null);
    fetchPendingCount(value);
  };

  const sendEmails = async (testMode: boolean) => {
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
      const { data, error } = await supabase.functions.invoke('send-survey-review-emails', {
        body: { community, test_mode: testMode }
      });

      if (error) throw error;

      setResults({
        sent: data?.sent || 0,
        failed: data?.failed || 0
      });

      toast({
        title: "Emails Sent",
        description: `${data?.sent || 0} emails sent successfully`
      });

      // Refresh pending count
      await fetchPendingCount(community);
    } catch (error: any) {
      console.error('Error sending emails:', error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send emails",
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
          <Mail className="h-5 w-5" />
          Send Review Form Emails
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
          {community && (
            <div className="text-sm text-muted-foreground">
              {pendingCount} pending emails
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => sendEmails(true)}
            disabled={!community || loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Send Test Email (3 max)
          </Button>
          <Button
            onClick={() => sendEmails(false)}
            disabled={!community || loading || pendingCount === 0}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send All Pending
          </Button>
        </div>

        {results && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm space-y-1">
              <div className="font-medium text-green-600">✓ {results.sent} sent successfully</div>
              {results.failed > 0 && (
                <div className="font-medium text-destructive">✗ {results.failed} failed</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
