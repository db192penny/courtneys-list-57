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
import { Search, Eye, Copy, Mail, RefreshCw, Trash2, Loader2, MoreVertical } from "lucide-react";

type StatusFilter = "all" | "complete" | "in_progress" | "not_started";

export function RespondentsTable() {
  const { toast } = useToast();
  const { data: respondents, isLoading, refetch } = useSurveyRespondents();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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
      // Step 1: Get survey_response_id
      const { data: session, error: sessionError } = await supabase
        .from('survey_responses' as any)
        .select('id')
        .eq('session_token', sessionToken)
        .single();

      if (sessionError || !session) {
        throw new Error('Could not find survey response');
      }

      // Step 2: Delete ratings using the ID
      const { error: deleteError } = await supabase
        .from('survey_vendor_ratings' as any)
        .delete()
        .eq('survey_response_id', session.id);

      if (deleteError) throw deleteError;

      // Step 3: Reset vendors using the ID  
      const { error: updateError } = await supabase
        .from('survey_pending_vendors' as any)
        .update({ rated: false, rated_at: null })
        .eq('survey_response_id', session.id);

      if (updateError) throw updateError;

      toast({
        title: "Data reset",
        description: `${respondentName} can now re-submit ratings`,
      });
      
      refetch();
    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: "Error",
        description: "Failed to reset data. Please try again.",
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
      // Delete by session_token (cascade handles related records)
      const { error } = await supabase
        .from('survey_responses' as any)
        .delete()
        .eq('session_token', sessionToken);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: `${respondentName} removed from system`,
      });
      
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredData = respondents
    ?.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
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
          <CardTitle>Respondents</CardTitle>
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
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    Name {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("totalVendors")}>
                    Vendors {sortColumn === "totalVendors" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!filteredData || filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No respondents found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((respondent) => (
                    <TableRow key={respondent.id}>
                      <TableCell className="font-medium">{respondent.name}</TableCell>
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
                      <TableCell className="text-right">
                        <div className="hidden lg:flex gap-1 justify-end">
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
                            <RefreshCw className="h-4 w-4" />
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
                              <RefreshCw className="h-4 w-4 mr-2" /> Reset Data
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
