import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { getCommunityDisplayName } from "@/utils/communityNames";
import SEO from "@/components/SEO";
import { useIsMobile } from "@/hooks/use-mobile";

interface CategorySuggestion {
  id: string;
  user_id: string;
  user_email: string;
  community: string;
  suggested_category: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

const AdminCategorySuggestions = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const isMobile = useIsMobile();

  const [selectedStatus, setSelectedStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [communityFilter, setCommunityFilter] = useState<string>("all");
  const [noteModalOpen, setNoteModalOpen] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  // Fetch suggestions
  const { data: allSuggestions = [], isLoading } = useQuery({
    queryKey: ["category-suggestions", communityFilter],
    queryFn: async () => {
      let query = supabase
        .from("category_suggestions" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (communityFilter !== "all") {
        query = query.eq("community", communityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as any as CategorySuggestion[];
    },
    enabled: !!isAdmin,
  });

  // Filter suggestions by selected status
  const suggestions = allSuggestions.filter((s) => s.status === selectedStatus);

  // Count by status for tabs
  const pendingCount = allSuggestions.filter((s) => s.status === "pending").length;
  const approvedCount = allSuggestions.filter((s) => s.status === "approved").length;
  const rejectedCount = allSuggestions.filter((s) => s.status === "rejected").length;

  // Get unique communities
  const { data: communities = [] } = useQuery({
    queryKey: ["suggestion-communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_suggestions" as any)
        .select("community");

      if (error) throw error;
      const unique = Array.from(new Set((data as any)?.map((s: any) => s.community) || []));
      return unique as string[];
    },
    enabled: !!isAdmin,
  });

  // Update suggestion status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "approved" | "rejected";
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("category_suggestions" as any)
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["pending-category-suggestions"] });
      toast({
        title: "Status updated",
        description: "Category suggestion has been updated successfully.",
      });
      setNoteModalOpen(null);
      setNoteText("");
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update suggestion status.",
        variant: "destructive",
      });
    },
  });

  // Add/update notes
  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("category_suggestions" as any)
        .update({ admin_notes: notes })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-suggestions"] });
      toast({
        title: "Note saved",
        description: "Admin note has been saved successfully.",
      });
      setNoteModalOpen(null);
      setNoteText("");
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save admin note.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: "rejected" });
  };

  const handleSaveNote = (id: string) => {
    updateNotesMutation.mutate({ id, notes: noteText });
  };

  if (adminLoading || isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-10 max-w-6xl">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container py-10 max-w-6xl">
          <p className="text-sm text-muted-foreground">
            Access denied. You must be a site admin to access this page.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Courtney's List | Category Suggestions"
        description="Admin interface to review category suggestions"
        canonical={typeof window !== "undefined" ? window.location.href : undefined}
      />

      <section className="container py-6 md:py-10 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Category Suggestions</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage category suggestions from users
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="w-full sm:w-48">
            <Label htmlFor="community-filter">Filter by Community</Label>
            <Select value={communityFilter} onValueChange={setCommunityFilter}>
              <SelectTrigger id="community-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Communities</SelectItem>
                {communities.map((community) => (
                  <SelectItem key={community} value={community}>
                    {getCommunityDisplayName(community)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as any)}>
          <TabsList className={isMobile ? "w-full grid grid-cols-3" : ""}>
            <TabsTrigger value="pending" className={isMobile ? "text-sm" : ""}>
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="approved" className={isMobile ? "text-sm" : ""}>
              Approved ({approvedCount})
            </TabsTrigger>
            <TabsTrigger value="rejected" className={isMobile ? "text-sm" : ""}>
              Rejected ({rejectedCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedStatus} className="mt-6">
            {suggestions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No {selectedStatus} suggestions found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <CardTitle className="text-xl">
                          {suggestion.suggested_category}
                        </CardTitle>
                        <Badge variant="secondary">
                          {getCommunityDisplayName(suggestion.community)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Suggestion Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Suggested by:</span>{" "}
                          <span className="font-medium">{suggestion.user_email}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Submitted:</span>{" "}
                          <span className="font-medium">
                            {new Date(suggestion.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Admin Notes */}
                      {suggestion.admin_notes && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">Admin Notes:</p>
                          <p className="text-sm text-muted-foreground">
                            {suggestion.admin_notes}
                          </p>
                        </div>
                      )}

                      {/* Reviewed Info */}
                      {suggestion.reviewed_at && (
                        <div className="text-sm text-muted-foreground">
                          Reviewed on {new Date(suggestion.reviewed_at).toLocaleDateString()}
                        </div>
                      )}

                      {/* Actions */}
                      {selectedStatus === "pending" ? (
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <Button
                            variant="outline"
                            size={isMobile ? "default" : "sm"}
                            className={isMobile ? "w-full" : ""}
                            onClick={() => {
                              setNoteModalOpen(suggestion.id);
                              setNoteText(suggestion.admin_notes || "");
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {suggestion.admin_notes ? "Edit Note" : "Add Note"}
                          </Button>
                          <div className="flex-1" />
                          <Button
                            variant="outline"
                            size={isMobile ? "default" : "sm"}
                            className={isMobile ? "w-full" : ""}
                            onClick={() => handleReject(suggestion.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            size={isMobile ? "default" : "sm"}
                            className={isMobile ? "w-full" : ""}
                            onClick={() => handleApprove(suggestion.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size={isMobile ? "default" : "sm"}
                          className={isMobile ? "w-full" : ""}
                          onClick={() => {
                            setNoteModalOpen(suggestion.id);
                            setNoteText(suggestion.admin_notes || "");
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {suggestion.admin_notes ? "View/Edit Note" : "Add Note"}
                        </Button>
                      )}

                      {/* Note Modal */}
                      {noteModalOpen === suggestion.id && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                          <Card className="w-full max-w-lg">
                            <CardHeader>
                              <CardTitle>Admin Note</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <Label htmlFor="note-text">Note</Label>
                                <Textarea
                                  id="note-text"
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  placeholder="Add internal notes about this suggestion..."
                                  rows={4}
                                  className="mt-2"
                                />
                              </div>
                              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setNoteModalOpen(null);
                                    setNoteText("");
                                  }}
                                  className={isMobile ? "w-full" : ""}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleSaveNote(suggestion.id)}
                                  disabled={updateNotesMutation.isPending}
                                  className={isMobile ? "w-full" : ""}
                                >
                                  {updateNotesMutation.isPending ? "Saving..." : "Save Note"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Results count */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {suggestions.length} {selectedStatus} suggestion
          {suggestions.length !== 1 ? "s" : ""}
        </div>
      </section>
    </main>
  );
};

export default AdminCategorySuggestions;
