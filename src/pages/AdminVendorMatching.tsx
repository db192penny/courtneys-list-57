import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import VendorNameInput from "@/components/VendorNameInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";



interface ProgressData {
  percent_complete: number;
  total_respondents: number;
  total_reviews: number;
  matched_reviews: number;
  unmatched_reviews: number;
  exact_match_available: number;
  fuzzy_match_available: number;
  needs_creation: number;
}

interface ExactMatch {
  survey_vendor_name: string;
  category: string;
  mention_count: number;
  matched_vendor_id: string;
  matched_vendor_name: string;
  matched_vendor_phone: string;
  matched_vendor_community: string;
  is_same_community: boolean;
  rating_ids: string[];
}

interface FuzzyMatch {
  survey_vendor_name: string;
  survey_vendor_phone: string;
  category: string;
  suggested_vendor_category: string;
  mention_count: number;
  suggested_vendor_id: string;
  suggested_vendor_name: string;
  suggested_vendor_phone: string;
  suggested_vendor_community: string;
  is_same_community: boolean;
  confidence_score: number;
  rating_ids: string[];
}

interface UnmatchedVendor {
  survey_rating_id: string;
  vendor_name: string;
  category: string;
  vendor_phone: string | null;
  mention_count: number;
  all_rating_ids: string[];
  respondent_community: string;
}

export default function AdminVendorMatching() {
  const [availableCommunities, setAvailableCommunities] = useState<string[]>([]);
  const [community, setCommunity] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("exact");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [exactMatches, setExactMatches] = useState<ExactMatch[]>([]);
  const [unmatchedVendors, setUnmatchedVendors] = useState<UnmatchedVendor[]>([]);
  const [showApproveAllDialog, setShowApproveAllDialog] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [currentSearchCategory, setCurrentSearchCategory] = useState<string>("");
  const [currentRatingIds, setCurrentRatingIds] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCrossCommunityCopyDialog, setShowCrossCommunityCopyDialog] = useState(false);
  const [pendingVendorSelection, setPendingVendorSelection] = useState<{
    id: string;
    name: string;
    community: string;
    ratingIds: string[];
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (community) {
      refreshData();
    }
  }, [community]);

  // Fetch available communities from database
  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('name')
        .order('name');
      
      if (data && !error) {
        setAvailableCommunities(data.map(c => c.name));
      } else {
        // Fallback to hardcoded list if query fails
        setAvailableCommunities(['Boca Bridges', 'The Bridges', 'The Oaks', 'Woodfield Country Club']);
      }
    };
    
    fetchCommunities();
  }, []);

  // Set default community once communities are loaded
  useEffect(() => {
    if (availableCommunities.length > 0 && !community) {
      setCommunity(availableCommunities[0]);
    }
  }, [availableCommunities, community]);


  const refreshData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel for instant badge counts
      await Promise.all([
        fetchProgress(),
        fetchExactMatches(),
        fetchUnmatched()
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    const { data, error } = await (supabase.rpc as any)("get_vendor_matching_progress", {
      p_community: community
    });
    if (error) throw error;
    setProgress(data as ProgressData);
  };

  const fetchExactMatches = async () => {
    const { data, error } = await (supabase.rpc as any)("get_exact_vendor_matches", {
      p_community: community
    });
    if (error) throw error;
    setExactMatches((data as ExactMatch[]) || []);
  };

  const fetchUnmatched = async () => {
    console.log('[Unmatched] Fetching vendors for:', community);
    
    // Get true unmatched vendors
    const { data: unmatchedData, error: unmatchedError } = await (supabase.rpc as any)("get_unmatched_vendors", {
      p_community: community
    });
    if (unmatchedError) throw unmatchedError;
    console.log('[Unmatched] Received data:', unmatchedData);
    
    // ALSO get fuzzy matches and merge them into unmatched
    const { data: fuzzyData, error: fuzzyError } = await (supabase.rpc as any)("get_fuzzy_vendor_matches", {
      p_community: community
    });
    if (fuzzyError) console.error('[Fuzzy] Error fetching:', fuzzyError);
    
    // Transform fuzzy matches to look like unmatched vendors
    const fuzzyAsUnmatched: UnmatchedVendor[] = (fuzzyData || []).map((f: any) => ({
      survey_rating_id: f.rating_ids?.[0] || '',
      vendor_name: f.survey_vendor_name || '',
      category: f.survey_category || 'Unknown',
      vendor_phone: f.survey_vendor_phone || null,
      mention_count: f.mention_count || 0,
      all_rating_ids: f.all_rating_ids || [],
      respondent_community: community
    }));
    
    console.log('[Unmatched] Fuzzy transformed:', fuzzyAsUnmatched.length);
    
    // Combine unmatched and fuzzy
    const combined = [...(unmatchedData || []), ...fuzzyAsUnmatched];
    console.log('[Unmatched] Total combined:', combined.length);
    
    // Enrich with respondent community from preview_sessions
    const enrichedData = await Promise.all(
      (combined || []).map(async (vendor: any) => {
        // Get the first rating ID to look up the session
        if (vendor.all_rating_ids && vendor.all_rating_ids.length > 0) {
          const { data: rating } = await supabase
            .from('survey_ratings')
            .select('session_id')
            .eq('id', vendor.all_rating_ids[0])
            .single();
          
          if (rating) {
            const { data: session } = await supabase
              .from('preview_sessions')
              .select('community')
              .eq('id', rating.session_id)
              .single();
            
            return {
              ...vendor,
              respondent_community: session?.community || community
            };
          }
        }
        return { ...vendor, respondent_community: community };
      })
    );
    
    setUnmatchedVendors(enrichedData as UnmatchedVendor[]);
  };

  const handleApproveMatch = async (ratingIds: string[], vendorId: string, vendorName: string) => {
    setProcessingId(vendorId);
    try {
      toast({
        title: "✅ Vendor Noted",
        description: `${vendorName} has been noted for matching`
      });
      
      await refreshData();
    } catch (error) {
      console.error("Error processing vendor:", error);
      toast({
        title: "Error",
        description: "Failed to process vendor. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAll = async () => {
    setLoading(true);
    try {
      toast({
        title: "✅ All Vendors Noted",
        description: `Processed ${exactMatches.length} vendor matches`
      });
      
      await refreshData();
    } catch (error) {
      console.error("Error approving all matches:", error);
      toast({
        title: "Error",
        description: "Failed to approve all matches. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowApproveAllDialog(false);
    }
  };

  const handleSearchVendors = async (category: string, ratingIds: string[]) => {
    setCurrentSearchCategory(category);
    setCurrentRatingIds(ratingIds);
    setShowSearchModal(true);
    
    const { data, error } = await supabase
      .from("vendors")
      .select("id, name, contact_info, community, category")
      .eq("category", category);
    
    if (error) {
      console.error("Error searching vendors:", error);
    }
    
    if (!error && data) {
      setSearchResults(data);
    }
  };

  const handleDismissVendor = async (
    surveyName: string,
    ratingIds: string[]
  ) => {
    setProcessingId(surveyName);
    try {
      console.log('[Dismiss Vendor] Marking as handled:', {
        surveyName,
        ratingIds
      });

      // Update survey_pending_ratings to mark as rated (without linking to vendor)
      const { error: pendingError } = await supabase
        .from('survey_pending_ratings')
        .update({ 
          rated: true, 
          rated_at: new Date().toISOString()
          // vendor_id remains NULL - not linking to any vendor
        })
        .in('id', ratingIds);

      if (pendingError) {
        console.error('[Dismiss Vendor] Error updating pending ratings:', pendingError);
        throw pendingError;
      }

      toast({
        title: "✅ Vendor Dismissed",
        description: `Removed "${surveyName}" from unmatched list`
      });
      
      await refreshData();
    } catch (error) {
      console.error("[Dismiss Vendor] Error:", error);
      toast({
        title: "Error",
        description: "Failed to dismiss vendor. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateVendor = async (
    surveyName: string,
    category: string,
    ratingIds: string[],
    vendorData: {
      name: string;
      phone: string | null;
      community: string;
      google_place_id?: string;
      google_data?: any;
    }
  ) => {
    setProcessingId(surveyName);
    try {
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create vendors");
      }

      // Extract Google data fields if present
      const googleData = vendorData.google_data || {};
      const hasGoogleData = vendorData.google_data && Object.keys(vendorData.google_data).length > 0;

      // Prepare vendor insert data
      const vendorInsertData = {
        name: vendorData.name,
        category: category,
        community: vendorData.community,
        contact_info: vendorData.phone || 'Phone pending',
        google_place_id: vendorData.google_place_id || null,
        google_rating: hasGoogleData ? (googleData.rating || null) : null,
        google_rating_count: hasGoogleData ? (googleData.user_ratings_total || null) : null,
        google_reviews_json: hasGoogleData ? googleData : null,
        google_last_updated: hasGoogleData ? new Date().toISOString() : null,
        created_by: user.id
      };

      // Use upsert to handle potential duplicates (same name + community)
      const { data, error } = await supabase
        .from('vendors')
        .upsert(vendorInsertData, {
          onConflict: 'name,community',
          ignoreDuplicates: false
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      if (data?.id) {
        // Link the survey ratings to the newly created vendor
        console.log('[Create Vendor] Linking ratings to new vendor:', {
          vendorId: data.id,
          ratingIds
        });

        // Call approve_vendor_matches RPC to link survey_ratings
        const { error: approveError } = await supabase.rpc('approve_vendor_matches', {
          p_rating_ids: ratingIds,
          p_vendor_id: data.id
        });

        if (approveError) {
          console.error('[Create Vendor] Error linking ratings:', approveError);
          throw approveError;
        }

        // Update survey_pending_ratings to mark as rated
        const { error: pendingError } = await supabase
          .from('survey_pending_ratings')
          .update({ 
            rated: true, 
            rated_at: new Date().toISOString(),
            vendor_id: data.id
          })
          .in('id', ratingIds);

        if (pendingError) {
          console.error('[Create Vendor] Error updating pending ratings:', pendingError);
          throw pendingError;
        }

        toast({
          title: "✅ Vendor Created",
          description: `Successfully created ${vendorData.name} and linked ${ratingIds.length} rating(s)`
        });
        
        await refreshData();
      }
    } catch (error) {
      console.error("Error creating vendor:", error);
      toast({
        title: "Error",
        description: "Failed to create vendor. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopyVendorToCommunity = async (
    sourceVendorId: string,
    sourceVendorName: string,
    ratingIds: string[]
  ) => {
    setProcessingId(sourceVendorId);
    try {
      console.log('[Copy Vendor] Starting copy:', {
        sourceVendorId,
        sourceVendorName,
        targetCommunity: community,
        ratingIdsCount: ratingIds?.length ?? 0
      });

      // Call the copy_vendor_to_community RPC
      const { data: newVendorId, error: copyError } = await supabase.rpc(
        'copy_vendor_to_community',
        {
          p_source_vendor_id: sourceVendorId,
          p_target_community: community
        }
      );
      
      if (copyError) {
        console.error('[Copy Vendor] RPC error:', copyError);
        throw copyError;
      }

      console.log('[Copy Vendor] New vendor created:', newVendorId);
      
      if (newVendorId) {
        toast({
          title: "✅ Vendor Copied",
          description: `Copied ${sourceVendorName} to ${community}`
        });
        
        await refreshData();
      }
    } catch (error) {
      console.error("[Copy Vendor] Error:", error);
      toast({
        title: "Error Copying Vendor",
        description: error instanceof Error ? error.message : "Failed to copy vendor. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence > 85) return "default";
    if (confidence > 70) return "secondary";
    return "outline";
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Vendor Matching</h1>
        <Select value={community} onValueChange={setCommunity}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableCommunities.map((comm) => (
              <SelectItem key={comm} value={comm}>
                {comm}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Matching Progress - {community}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && !progress ? (
            <Skeleton className="h-32 w-full" />
          ) : progress ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-semibold">{progress.percent_complete}%</span>
                </div>
                <Progress value={progress.percent_complete} />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{progress.total_respondents}</div>
                  <div className="text-sm text-muted-foreground">Respondents</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{progress.total_reviews}</div>
                  <div className="text-sm text-muted-foreground">Reviews</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{progress.matched_reviews}</div>
                  <div className="text-sm text-muted-foreground">Matched</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{progress.unmatched_reviews}</div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-semibold mb-2">Next steps:</div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• {progress.exact_match_available} Exact matches ready</div>
                  <div>• {progress.unmatched_reviews} need manual review</div>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exact">
            Exact Matches
            {exactMatches.length > 0 && (
              <Badge variant="default" className="ml-2">{exactMatches.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unmatched">
            Unmatched
            {unmatchedVendors.length > 0 && (
              <Badge variant="outline" className="ml-2">{unmatchedVendors.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* EXACT MATCHES TAB */}
        <TabsContent value="exact" className="space-y-4">
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : exactMatches.length > 0 ? (
            <>
              {exactMatches.map((match, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{match.survey_vendor_name}</div>
                        <div className="text-sm text-muted-foreground">{match.category}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {match.mention_count} mention(s)
                        </div>
                        <div className="mt-3 border-t pt-3">
                          <div className="font-medium">Match: {match.matched_vendor_name}</div>
                          <div className="text-sm text-muted-foreground">{match.matched_vendor_phone}</div>
                          <Badge 
                            variant={match.matched_vendor_community === community ? "default" : "secondary"}
                            className="mt-2"
                          >
                            {match.matched_vendor_community === community ? "Same Community" : match.matched_vendor_community}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {match.is_same_community ? (
                          <Button
                            onClick={() => handleApproveMatch(match.rating_ids, match.matched_vendor_id, match.matched_vendor_name)}
                            disabled={processingId === match.matched_vendor_id}
                          >
                            Approve Match
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleCopyVendorToCommunity(
                                match.matched_vendor_id,
                                match.matched_vendor_name,
                                match.rating_ids
                              )}
                              disabled={processingId === match.matched_vendor_id}
                            >
                              Copy to {community}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleApproveMatch(match.rating_ids, match.matched_vendor_id, match.matched_vendor_name)}
                              disabled={processingId === match.matched_vendor_id}
                            >
                              ⚠️ Link to {match.matched_vendor_community}
                            </Button>
                          </>
                        )}
                        
                        <Button
                          variant="outline"
                          onClick={() => handleSearchVendors(match.category, match.rating_ids)}
                        >
                          Search Other Vendors
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button 
                onClick={() => setShowApproveAllDialog(true)}
                className="w-full"
                size="lg"
                disabled={loading}
              >
                Approve All {exactMatches.length} Matches
              </Button>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No exact matches found
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* UNMATCHED TAB */}
        <TabsContent value="unmatched" className="space-y-4">
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : unmatchedVendors.length > 0 ? (
              unmatchedVendors.map((vendor, idx) => (
                <UnmatchedVendorCard
                  key={idx}
                  vendor={vendor}
                  community={community}
                  availableCommunities={availableCommunities}
                  onCreateVendor={handleCreateVendor}
                  onSearchVendors={handleSearchVendors}
                  onDismissVendor={handleDismissVendor}
                  processingId={processingId}
                />
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  All vendors have been matched! 🎉
                </CardContent>
              </Card>
            )}
        </TabsContent>
      </Tabs>

      {/* Approve All Dialog */}
      <AlertDialog open={showApproveAllDialog} onOpenChange={setShowApproveAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve All Exact Matches?</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve {exactMatches.length} exact matches and link{" "}
              {exactMatches.reduce((sum, m) => sum + (m.rating_ids?.length || 0), 0)} reviews.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveAll}>Approve All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search Vendors Modal */}
      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search Vendors - {currentSearchCategory}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="space-y-2">
              {searchResults
                .filter((v) =>
                  v.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((vendor) => (
                  <Card
                    key={vendor.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      // Check if vendor is from a different community
                      if (vendor.community !== community) {
                        // Show confirmation dialog for cross-community copy
                        setPendingVendorSelection({
                          id: vendor.id,
                          name: vendor.name,
                          community: vendor.community,
                          ratingIds: currentRatingIds
                        });
                        setShowCrossCommunityCopyDialog(true);
                      } else {
                        // Same community - link directly
                        handleApproveMatch(currentRatingIds, vendor.id, vendor.name);
                        setShowSearchModal(false);
                      }
                    }}
                  >
                    <CardContent className="pt-4">
                      <div className="font-medium">{vendor.name}</div>
                      <div className="text-sm text-muted-foreground">{vendor.contact_info}</div>
                      <Badge variant="secondary" className="mt-1">
                        {vendor.community}
                      </Badge>
                      {vendor.community !== community && (
                        <Badge variant="outline" className="mt-1 ml-2 text-amber-600 border-amber-600">
                          Different Community
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cross-Community Copy Confirmation Dialog */}
      <AlertDialog open={showCrossCommunityCopyDialog} onOpenChange={setShowCrossCommunityCopyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy Vendor to {community}?</AlertDialogTitle>
            <AlertDialogDescription>
              This vendor is in <strong>{pendingVendorSelection?.community}</strong>.
              <br /><br />
              Do you want to copy <strong>{pendingVendorSelection?.name}</strong> to <strong>{community}</strong> and link the review(s) there?
              <br /><br />
              This ensures the survey reviews appear in the correct community ({community}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingVendorSelection(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (pendingVendorSelection) {
                await handleCopyVendorToCommunity(
                  pendingVendorSelection.id,
                  pendingVendorSelection.name,
                  pendingVendorSelection.ratingIds
                );
                setPendingVendorSelection(null);
                setShowSearchModal(false);
                setShowCrossCommunityCopyDialog(false);
              }
            }}>
              Copy to {community}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Separate component for unmatched vendor card to manage its own state
function UnmatchedVendorCard({
  vendor,
  community,
  availableCommunities,
  onCreateVendor,
  onSearchVendors,
  onDismissVendor,
  processingId
}: {
  vendor: UnmatchedVendor;
  community: string;
  availableCommunities: string[];
  onCreateVendor: (
    surveyName: string,
    category: string,
    ratingIds: string[],
    vendorData: { name: string; phone: string | null; community: string; google_place_id?: string; google_data?: any }
  ) => Promise<void>;
  onSearchVendors: (category: string, ratingIds: string[]) => Promise<void>;
  onDismissVendor: (surveyName: string, ratingIds: string[]) => Promise<void>;
  processingId: string | null;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);
  const [vendorName, setVendorName] = useState(vendor.vendor_name);
  const [vendorPhone, setVendorPhone] = useState(vendor.vendor_phone || "");
  const [vendorCommunity, setVendorCommunity] = useState(vendor.respondent_community);
  const [googlePlaceId, setGooglePlaceId] = useState<string | undefined>();
  const [googleData, setGoogleData] = useState<any>(undefined);

  const handleGoogleSelect = (payload: any) => {
    setVendorName(payload.name);
    setVendorPhone(payload.phone || vendorPhone);
    setGooglePlaceId(payload.place_id);
    setGoogleData(payload); // Store full Google Place data
  };

  const handleCreate = () => {
    onCreateVendor(vendor.vendor_name, vendor.category || 'Unknown', vendor.all_rating_ids, {
      name: vendorName,
      phone: vendorPhone || null,
      community: vendorCommunity,
      google_place_id: googlePlaceId,
      google_data: googleData
    });
    setShowCreateForm(false);
  };

  const handleDismiss = () => {
    onDismissVendor(vendor.vendor_name, vendor.all_rating_ids);
    setShowDismissConfirm(false);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <div className="font-semibold text-lg">{vendor.vendor_name}</div>
          <div className="text-sm text-muted-foreground">📂 {vendor.category} | 👥 {vendor.mention_count} mention(s)</div>
          {vendor.vendor_phone ? (
            <div className="text-sm text-muted-foreground mt-1">
              📞 {vendor.vendor_phone}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-1">
              📞 No phone
            </div>
          )}
        </div>

        {!showCreateForm ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowCreateForm(true)}>
              Create New Vendor
            </Button>
            <Button
              variant="outline"
              onClick={() => onSearchVendors(vendor.category, vendor.all_rating_ids)}
            >
              Search Existing
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowDismissConfirm(true)}
              disabled={processingId === vendor.vendor_name}
            >
              Dismiss
            </Button>
          </div>
        ) : (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Vendor Name</Label>
              <VendorNameInput
                placeholder="Search Google Places or enter manually..."
                defaultValue={vendor.vendor_name}
                onSelected={handleGoogleSelect}
                onManualInput={(name) => setVendorName(name)}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone (Optional)</Label>
              <Input
                value={vendorPhone}
                onChange={(e) => setVendorPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Community</Label>
              <Select value={vendorCommunity} onValueChange={setVendorCommunity} disabled={true}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCommunities.map((comm) => (
                    <SelectItem key={comm} value={comm}>
                      {comm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                ✓ Using community from survey respondent
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={!vendorName || processingId === vendor.vendor_name}
              >
                Create & Match
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Dismiss Confirmation Dialog */}
        <AlertDialog open={showDismissConfirm} onOpenChange={setShowDismissConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Dismiss Vendor?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove "{vendor.vendor_name}" from the unmatched list without creating a vendor or linking it to an existing one.
                The survey rating will be marked as handled.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDismiss}>
                Dismiss
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
