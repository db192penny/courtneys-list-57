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
  rating_ids: string[];
}

interface FuzzyMatch {
  survey_vendor_name: string;
  category: string;
  mention_count: number;
  suggested_vendor_id: string;
  suggested_vendor_name: string;
  suggested_vendor_phone: string;
  suggested_vendor_community: string;
  confidence_score: number;
  rating_ids: string[];
}

interface UnmatchedVendor {
  survey_rating_id: string;
  vendor_name: string;
  vendor_category: string;
  vendor_phone: string | null;
  mention_count: number;
  all_rating_ids: string[];
}

export default function AdminVendorMatching() {
  const [availableCommunities, setAvailableCommunities] = useState<string[]>([]);
  const [community, setCommunity] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("exact");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [exactMatches, setExactMatches] = useState<ExactMatch[]>([]);
  const [fuzzyMatches, setFuzzyMatches] = useState<FuzzyMatch[]>([]);
  const [unmatchedVendors, setUnmatchedVendors] = useState<UnmatchedVendor[]>([]);
  const [showApproveAllDialog, setShowApproveAllDialog] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [currentSearchCategory, setCurrentSearchCategory] = useState<string>("");
  const [currentRatingIds, setCurrentRatingIds] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
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

  // Fetch data when tab changes
  useEffect(() => {
    const fetchTabData = async () => {
      setLoading(true);
      try {
        if (activeTab === "exact") await fetchExactMatches();
        else if (activeTab === "fuzzy") await fetchFuzzyMatches();
        else if (activeTab === "unmatched") await fetchUnmatched();
      } catch (error) {
        console.error(`Error fetching ${activeTab} data:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchTabData();
  }, [activeTab]);

  const refreshData = async () => {
    setLoading(true);
    try {
      await fetchProgress();
      if (activeTab === "exact") await fetchExactMatches();
      else if (activeTab === "fuzzy") await fetchFuzzyMatches();
      else if (activeTab === "unmatched") await fetchUnmatched();
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

  const fetchFuzzyMatches = async () => {
    const { data, error } = await (supabase.rpc as any)("get_fuzzy_vendor_matches", {
      p_community: community
    });
    if (error) throw error;
    setFuzzyMatches((data as FuzzyMatch[]) || []);
  };

  const fetchUnmatched = async () => {
    console.log('[Unmatched] Fetching vendors for:', community);
    const { data, error } = await (supabase.rpc as any)("get_unmatched_vendors", {
      p_community: community
    });
    if (error) throw error;
    console.log('[Unmatched] Received data:', data);
    setUnmatchedVendors((data as UnmatchedVendor[]) || []);
  };

  const handleApproveMatch = async (ratingIds: string[], vendorId: string, vendorName: string) => {
    setProcessingId(vendorId);
    try {
      const { error } = await (supabase.rpc as any)("approve_vendor_matches", {
        p_rating_ids: ratingIds,
        p_vendor_id: vendorId
      });
      if (error) throw error;
      
      toast({
        title: "✅ Match Approved",
        description: `Matched ${ratingIds.length} review(s) to ${vendorName}`
      });
      
      await refreshData();
    } catch (error) {
      console.error("Error approving match:", error);
      toast({
        title: "Error",
        description: "Failed to approve match. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAll = async () => {
    setLoading(true);
    try {
      let successCount = 0;
      for (const match of exactMatches) {
        const { error } = await (supabase.rpc as any)("approve_vendor_matches", {
          p_rating_ids: match.rating_ids,
          p_vendor_id: match.matched_vendor_id
        });
        if (!error) successCount += (match.rating_ids?.length || 0);
      }
      
      toast({
        title: "✅ All Matches Approved",
        description: `Successfully matched ${successCount} reviews`
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
      .select("id, name, phone, community, category")
      .eq("category", category);
    
    if (!error && data) {
      setSearchResults(data);
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
    }
  ) => {
    setProcessingId(surveyName);
    try {
      const { data, error } = await (supabase.rpc as any)("create_vendor_from_survey", {
        p_survey_vendor_name: surveyName,
        p_category: category,
        p_vendor_name: vendorData.name,
        p_phone: vendorData.phone,
        p_community: vendorData.community,
        p_google_place_id: vendorData.google_place_id || null
      });
      
      if (error) throw error;
      
      if (data) {
        const { error: matchError } = await (supabase.rpc as any)("approve_vendor_matches", {
          p_rating_ids: ratingIds,
          p_vendor_id: data
        });
        
        if (matchError) throw matchError;
        
        toast({
          title: "✅ Vendor Created & Matched",
          description: `Created ${vendorData.name} and matched ${ratingIds.length} review(s)`
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
                  <div>• {progress.exact_match_available} Exact matches</div>
                  <div>• {progress.fuzzy_match_available} Fuzzy matches</div>
                  <div>• {progress.needs_creation} Need creation</div>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="exact">
            Exact Matches
            {exactMatches.length > 0 && (
              <Badge variant="default" className="ml-2">{exactMatches.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="fuzzy">
            Fuzzy Matches
            {fuzzyMatches.length > 0 && (
              <Badge variant="secondary" className="ml-2">{fuzzyMatches.length}</Badge>
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
                      <Button
                        onClick={() => handleApproveMatch(match.rating_ids, match.matched_vendor_id, match.matched_vendor_name)}
                        disabled={processingId === match.matched_vendor_id}
                      >
                        Approve
                      </Button>
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

        {/* FUZZY MATCHES TAB */}
        <TabsContent value="fuzzy" className="space-y-4">
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : fuzzyMatches.length > 0 ? (
            fuzzyMatches.map((match, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{match.survey_vendor_name}</div>
                      <div className="text-sm text-muted-foreground">{match.category}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {match.mention_count} mention(s)
                      </div>
                      <div className="mt-3 border-t pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">Suggested: {match.suggested_vendor_name}</span>
                          <Badge variant={getConfidenceBadgeVariant(match.confidence_score)}>
                            {Math.round(match.confidence_score * 100)}% confidence
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{match.suggested_vendor_phone}</div>
                        <Badge variant="secondary" className="mt-2">
                          {match.suggested_vendor_community}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleApproveMatch(match.rating_ids, match.suggested_vendor_id, match.suggested_vendor_name)}
                      disabled={processingId === match.suggested_vendor_id}
                    >
                      Approve Match
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSearchVendors(match.category, match.rating_ids)}
                    >
                      Search Other Vendors
                    </Button>
                    <Button variant="ghost">Skip</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No fuzzy matches found
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* UNMATCHED TAB */}
        <TabsContent value="unmatched" className="space-y-4">
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (() => {
            // Filter out vendors that already have fuzzy matches
            const fuzzyVendorNames = new Set(fuzzyMatches.map(m => m.survey_vendor_name));
            const trueUnmatched = unmatchedVendors.filter(v => !fuzzyVendorNames.has(v.vendor_name));
            
            return trueUnmatched.length > 0 ? (
              trueUnmatched.map((vendor, idx) => (
                <UnmatchedVendorCard
                  key={idx}
                  vendor={vendor}
                  community={community}
                  availableCommunities={availableCommunities}
                  onCreateVendor={handleCreateVendor}
                  onSearchVendors={handleSearchVendors}
                  processingId={processingId}
                />
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No unmatched vendors
                </CardContent>
              </Card>
            );
          })()}
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
                      handleApproveMatch(currentRatingIds, vendor.id, vendor.name);
                      setShowSearchModal(false);
                    }}
                  >
                    <CardContent className="pt-4">
                      <div className="font-medium">{vendor.name}</div>
                      <div className="text-sm text-muted-foreground">{vendor.phone}</div>
                      <Badge variant="secondary" className="mt-1">
                        {vendor.community}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
  processingId
}: {
  vendor: UnmatchedVendor;
  community: string;
  availableCommunities: string[];
  onCreateVendor: (
    surveyName: string,
    category: string,
    ratingIds: string[],
    vendorData: { name: string; phone: string | null; community: string; google_place_id?: string }
  ) => Promise<void>;
  onSearchVendors: (category: string, ratingIds: string[]) => Promise<void>;
  processingId: string | null;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [vendorName, setVendorName] = useState(vendor.vendor_name);
  const [vendorPhone, setVendorPhone] = useState(vendor.vendor_phone || "");
  const [vendorCommunity, setVendorCommunity] = useState(community);
  const [googlePlaceId, setGooglePlaceId] = useState<string | undefined>();

  const handleGoogleSelect = (payload: any) => {
    setVendorName(payload.name);
    setVendorPhone(payload.phone || vendorPhone);
    setGooglePlaceId(payload.place_id);
  };

  const handleCreate = () => {
    onCreateVendor(vendor.vendor_name, vendor.vendor_category, vendor.all_rating_ids, {
      name: vendorName,
      phone: vendorPhone || null,
      community: vendorCommunity,
      google_place_id: googlePlaceId
    });
    setShowCreateForm(false);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <div className="font-semibold text-lg">{vendor.vendor_name}</div>
          <div className="text-sm text-muted-foreground">📂 {vendor.vendor_category} | 👥 {vendor.mention_count} mention(s)</div>
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
              onClick={() => onSearchVendors(vendor.vendor_category, vendor.all_rating_ids)}
            >
              Search Existing
            </Button>
          </div>
        ) : (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Google Places (Optional)</Label>
              <VendorNameInput
                placeholder="Search Google Places..."
                onSelected={handleGoogleSelect}
              />
            </div>

            <div className="space-y-2">
              <Label>Vendor Name</Label>
              <Input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
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
              <Select value={vendorCommunity} onValueChange={setVendorCommunity}>
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
      </CardContent>
    </Card>
  );
}
