import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSurveyRespondents } from "@/hooks/useSurveyAdmin";
import { ReviewsModal } from "./ReviewsModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Eye, Copy, Mail, RotateCcw, Trash2, Loader2, MoreVertical, Send, Link2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { RespondentCard } from "./RespondentCard";

type StatusFilter = "all" | "complete" | "in_progress" | "not_started";
type CommunityFilter = "all" | "The Oaks" | "Woodfield Country Club" | "Boca Bridges";

export function RespondentsTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: respondents, isLoading, refetch } = useSurveyRespondents();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [communityFilter, setCommunityFilter] = useState<CommunityFilter>("all");
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedRespondent, setSelectedRespondent] = useState<any>(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleCopyLink = (token: string, name: string) => {
    const link = `https://courtneys-list.com/bridges/rate-vendors?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied!", description: `Link for ${name}` });
  };

  const handleReset = async (sessionToken: string, respondentName: string) => {
    const confirmed = window.confirm(
      `Reset all ratings for ${respondentName}? They can re-submit their ratings.`
    );
    if (!confirmed) return;

    try {
      console.log('[handleReset] Starting reset for token:', sessionToken);
      
      // Admin check (RLS requires admin for updates)
      const { data: isAdmin } = await supabase.rpc('is_admin');
      if (!isAdmin) {
        console.warn('[handleReset] Not admin - aborting reset');
        toast({ title: 'Permission denied', description: 'Admin required to reset data', variant: 'destructive' });
        return;
      }
      
      // Step 1: Get session_id from preview_sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('preview_sessions' as any)
        .select('id')
        .eq('session_token', sessionToken)
        .maybeSingle();

      console.log('[handleReset] Session lookup result:', { sessionData, sessionError });

      if (sessionError) {
        console.error('[handleReset] Session fetch error:', sessionError);
        throw new Error(`Could not find session: ${sessionError.message}`);
      }
      
      if (!sessionData) {
        console.error('[handleReset] No session found for token:', sessionToken);
        throw new Error('Session not found in database');
      }

      const sessionId = (sessionData as any).id as string;
      console.log('[handleReset] Found session_id:', sessionId);

      // Step 2: Reset all ratings for this session
      const { data: updateData, error: updateError, count } = await supabase
        .from('survey_pending_ratings' as any)
        .update({ rated: false, rated_at: null })
        .eq('session_id', sessionId)
        .select();

      console.log('[handleReset] Update result:', { updateData, updateError, count });

      if (updateError) {
        console.error('[handleReset] Update ratings error:', updateError);
        throw new Error(`Failed to update ratings: ${updateError.message}`);
      }

      toast({
        title: "Data reset",
        description: `${respondentName} can now re-submit ratings (${count || 0} vendors reset)`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['survey-stats'] });
      queryClient.invalidateQueries({ queryKey: ['survey-respondents'] });
    } catch (error: any) {
      console.error('[handleReset] Complete error:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (sessionToken: string, respondentName: string) => {
    const confirmed = window.confirm(
      `Permanently delete ${respondentName} and all their data? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      // Delete from BOTH table systems to ensure complete removal
      
      // Delete from old system (preview_sessions)
      const { error: oldError } = await supabase
        .from('preview_sessions' as any)
        .delete()
        .eq('session_token', sessionToken);
      
      // Delete from new system (survey_responses)
      const { error: newError } = await supabase
        .from('survey_responses' as any)
        .delete()
        .eq('session_token', sessionToken);
      
      // At least one should succeed
      if (oldError && newError) {
        throw oldError || newError;
      }

      toast({
        title: "Deleted",
        description: `${respondentName} removed from system`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['survey-stats'] });
      queryClient.invalidateQueries({ queryKey: ['survey-respondents'] });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async (respondent: any) => {
    try {
      const { error } = await supabase.functions.invoke('send-survey-review-emails', {
        body: { 
          community: respondent.community,
          test_mode: false,
          session_ids: [respondent.id]
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `Survey email sent to ${respondent.name}`
      });
      
      await refetch();
    } catch (error: any) {
      console.error('Send email error:', error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send email",
        variant: "destructive"
      });
    }
  };

  const handleSendAllPending = async () => {
    const confirmed = window.confirm(
      `Send survey emails to all pending respondents${communityFilter !== "all" ? ` in ${communityFilter}` : ""}?`
    );
    if (!confirmed) return;

    try {
      const { data, error } = await supabase.functions.invoke('send-survey-review-emails', {
        body: { 
          community: communityFilter === "all" ? null : communityFilter,
          test_mode: false 
        }
      });

      if (error) throw error;

      toast({
        title: "Emails Sent",
        description: `${data?.sent || 0} emails sent successfully`
      });
      
      await refetch();
    } catch (error: any) {
      console.error('Send all error:', error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send emails",
        variant: "destructive"
      });
    }
  };

  const handleMatchVendors = async (sessionId: string, name: string) => {
    toast({
      title: "Auto-match unavailable",
      description: "Vendor matching temporarily disabled. Contact admin for manual matching.",
    });
  };

  const handleAutoMatchAll = async () => {
    toast({
      title: "Auto-match unavailable",
      description: "Bulk vendor matching temporarily disabled. Use individual row actions when available.",
    });
  };

  const filteredData = respondents
    ?.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (communityFilter !== "all" && r.community !== communityFilter) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal: any = a[sortColumn as keyof typeof a];
      let bVal: any = b[sortColumn as keyof typeof b];
      
      if (sortColumn === "createdAt") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const getStatusBadge = (status: string, completed: number, total: number) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">✅ Complete</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">⏳ {completed} of {total}</Badge>;
      case "not_started":
        return <Badge variant="destructive">❌ Not Started</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Respondents</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleSendAllPending}
                variant="default"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Send All Pending
              </Button>
              <Button
                onClick={handleAutoMatchAll}
                variant="outline"
                size="sm"
              >
                <Link2 className="h-4 w-4 mr-2" />
                Auto-Match All
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={communityFilter} onValueChange={(v) => setCommunityFilter(v as CommunityFilter)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Communities</SelectItem>
                <SelectItem value="The Oaks">The Oaks</SelectItem>
                <SelectItem value="Woodfield Country Club">Woodfield Country Club</SelectItem>
                <SelectItem value="Boca Bridges">Boca Bridges</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <div className="space-y-3">
              {!filteredData || filteredData.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No respondents found
                </div>
              ) : (
                filteredData.map((respondent) => (
                  <RespondentCard
                    key={respondent.id}
                    respondent={respondent}
                    onViewReviews={() => {
                      setSelectedRespondent(respondent);
                      setShowReviewsModal(true);
                    }}
                    onCopyLink={() => handleCopyLink(respondent.sessionToken, respondent.name)}
                    onReset={() => handleReset(respondent.sessionToken, respondent.name)}
                    onDelete={() => handleDelete(respondent.sessionToken, respondent.name)}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
               <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    Name {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("community")}>
                    Community {sortColumn === "community" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("totalVendors")}>
                    Vendors {sortColumn === "totalVendors" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!filteredData || filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No respondents found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((respondent) => (
                    <TableRow key={respondent.id}>
                      <TableCell className="font-medium">{respondent.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {respondent.community}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          <div>{respondent.contactMethod}</div>
                          <div className="text-muted-foreground truncate max-w-[200px]">
                            {respondent.contact}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{respondent.totalVendors}</TableCell>
                      <TableCell>
                        {getStatusBadge(respondent.status, respondent.completedVendors, respondent.totalVendors)}
                      </TableCell>
                      <TableCell>
                        {respondent.emailSentAt ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20">
                            ✓ Sent
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="hidden lg:flex gap-1 justify-end">
                          {respondent.email && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSendEmail(respondent)}
                              title={respondent.emailSentAt ? "Resend email" : "Send email"}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMatchVendors(respondent.id, respondent.name)}
                            title="Match vendors"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRespondent(respondent);
                              setShowReviewsModal(true);
                            }}
                            disabled={respondent.completedVendors === 0}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyLink(respondent.sessionToken, respondent.name)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReset(respondent.sessionToken, respondent.name)}
                            disabled={respondent.completedVendors === 0}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(respondent.sessionToken, respondent.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild className="lg:hidden">
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {respondent.email && (
                              <DropdownMenuItem
                                onClick={() => handleSendEmail(respondent)}
                              >
                                <Mail className="h-4 w-4 mr-2" /> {respondent.emailSentAt ? "Resend Email" : "Send Email"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleMatchVendors(respondent.id, respondent.name)}
                            >
                              <Link2 className="h-4 w-4 mr-2" /> Match Vendors
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRespondent(respondent);
                                setShowReviewsModal(true);
                              }}
                              disabled={respondent.completedVendors === 0}
                            >
                              <Eye className="h-4 w-4 mr-2" /> View Reviews
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCopyLink(respondent.sessionToken, respondent.name)}
                            >
                              <Copy className="h-4 w-4 mr-2" /> Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleReset(respondent.sessionToken, respondent.name)}
                              disabled={respondent.completedVendors === 0}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" /> Reset Data
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(respondent.sessionToken, respondent.name)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {selectedRespondent && (
        <ReviewsModal
          open={showReviewsModal}
          onOpenChange={setShowReviewsModal}
          respondentName={selectedRespondent.name}
          sessionToken={selectedRespondent.sessionToken}
          totalVendors={selectedRespondent.totalVendors}
          completedVendors={selectedRespondent.completedVendors}
        />
      )}

    </>
  );
}
