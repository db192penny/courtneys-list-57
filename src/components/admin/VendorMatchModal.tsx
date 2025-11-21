import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle2, X, Search, Plus, Loader2 } from "lucide-react";

interface VendorMatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  respondentName: string | null;
  vendors: any[];
  onComplete: () => void;
}

export function VendorMatchModal({
  open,
  onOpenChange,
  sessionId,
  respondentName,
  vendors: initialVendors,
  onComplete
}: VendorMatchModalProps) {
  const [vendors, setVendors] = useState(initialVendors);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exactMatch, setExactMatch] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [community, setCommunity] = useState("The Bridges");
  
  const currentVendor = vendors[currentIndex];
  const remainingCount = vendors.length - currentIndex;
  
  // Get community from session
  useEffect(() => {
    if (sessionId) {
      fetchCommunity();
    }
  }, [sessionId]);
  
  const fetchCommunity = async () => {
    const { data } = await supabase
      .from('preview_sessions')
      .select('community')
      .eq('id', sessionId)
      .single();
    
    if (data?.community) {
      setCommunity(data.community);
    }
  };
  
  // Check for exact match when vendor changes
  useEffect(() => {
    if (currentVendor && open) {
      checkExactMatch();
    }
  }, [currentIndex, currentVendor, open]);
  
  // Reset search when changing vendors
  useEffect(() => {
    setShowSearch(false);
    setShowCreate(false);
    setSearchResults([]);
    if (currentVendor) {
      setNewVendorName(currentVendor.vendor_name);
      setNewVendorPhone("");
    }
  }, [currentIndex]);
  
  // Check if exact vendor match exists
  const checkExactMatch = async () => {
    if (!currentVendor) return;
    
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .eq('community', community)
      .eq('category', currentVendor.category)
      .ilike('name', currentVendor.vendor_name)
      .maybeSingle();
      
    setExactMatch(data);
    setShowSearch(!data);
  };
  
  // Match to exact vendor
  const handleExactMatch = async () => {
    if (!exactMatch) return;
    
    const { error } = await supabase
      .from('survey_pending_ratings')
      .update({ 
        vendor_id: exactMatch.id
      } as any)
      .eq('id', currentVendor.id);
      
    if (error) {
      toast({
        title: "Match Failed",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "✅ Matched",
      description: `${currentVendor.vendor_name} matched to ${exactMatch.name}`
    });
    
    moveToNext();
  };
  
  // Search for vendors
  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,contact_info.ilike.%${searchTerm}%`)
      .eq('category', currentVendor.category)
      .limit(10);
    
    setSearchResults(data || []);
    setSearching(false);
  };
  
  // Match to selected vendor from search
  const handleSelectVendor = async (vendor: any) => {
    if (vendor.community !== community) {
      // Copy vendor to current community
      const { data: newVendor, error: createError } = await supabase
        .from('vendors')
        .insert({
          name: vendor.name,
          category: vendor.category,
          community: community,
          contact_info: vendor.contact_info,
          website: vendor.website,
          description: vendor.description,
          google_place_id: vendor.google_place_id
        })
        .select()
        .single();
        
      if (createError || !newVendor) {
        toast({
          title: "Copy Failed",
          description: createError?.message || "Failed to copy vendor",
          variant: "destructive"
        });
        return;
      }
      
      await matchToVendor(newVendor.id);
      toast({
        title: "✅ Copied & Matched",
        description: `${vendor.name} copied from ${vendor.community}`
      });
    } else {
      await matchToVendor(vendor.id);
      toast({
        title: "✅ Matched",
        description: `Matched to ${vendor.name}`
      });
    }
    
    moveToNext();
  };
  
  // Create new vendor
  const handleCreateVendor = async () => {
    if (!newVendorName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a vendor name",
        variant: "destructive"
      });
      return;
    }
    
    const { data: newVendor, error: createError } = await supabase
      .from('vendors')
      .insert({
        name: newVendorName,
        category: currentVendor.category,
        community: community,
        contact_info: newVendorPhone || null,
        google_place_id: null
      })
      .select()
      .single();
      
    if (createError || !newVendor) {
      toast({
        title: "Create Failed",
        description: createError?.message || "Failed to create vendor",
        variant: "destructive"
      });
      return;
    }
    
    await matchToVendor(newVendor.id);
    toast({
      title: "✅ Created & Matched",
      description: `${newVendor.name} created and matched`
    });
    
    moveToNext();
  };
  
  // Match survey_pending_ratings to vendor
  const matchToVendor = async (vendorId: string) => {
    await supabase
      .from('survey_pending_ratings')
      .update({ 
        vendor_id: vendorId
      } as any)
      .eq('id', currentVendor.id);
  };
  
  // Skip this vendor
  const handleSkip = () => {
    moveToNext();
  };
  
  // Move to next vendor
  const moveToNext = () => {
    if (currentIndex < vendors.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setExactMatch(null);
    } else {
      toast({
        title: "✅ Complete",
        description: "All vendors reviewed"
      });
      onComplete();
    }
  };

  if (!currentVendor) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl font-semibold">All vendors reviewed!</p>
            <Button onClick={onComplete} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Vendor Matching - {respondentName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Reviewing {currentIndex + 1} of {vendors.length} ({remainingCount - 1} remaining)
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Vendor */}
          <Card className="border-2 border-primary">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold">{currentVendor.vendor_name}</h3>
              <p className="text-sm text-muted-foreground">{currentVendor.category}</p>
              <p className="text-sm text-muted-foreground mt-2">
                From survey response (not yet rated) - {community}
              </p>
            </CardContent>
          </Card>
          
          {/* Exact Match Section */}
          {exactMatch ? (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800 dark:text-green-200">Exact Match Found</span>
                </div>
                <div className="mb-4">
                  <p className="font-medium">{exactMatch.name}</p>
                  <p className="text-sm text-muted-foreground">{exactMatch.category} - {community}</p>
                  {exactMatch.contact_info && (
                    <p className="text-sm">📞 {exactMatch.contact_info}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleExactMatch} className="flex-1">
                    Yes - Match
                  </Button>
                  <Button onClick={handleSkip} variant="outline" className="flex-1">
                    Skip
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* No Exact Match - Show Search Options */
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="font-semibold">No Exact Match</span>
                </div>
                
                <div className="space-y-3">
                  {!showSearch && !showCreate && (
                    <>
                      <Button 
                        onClick={() => setShowSearch(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Search Existing Vendors
                      </Button>
                      
                      <Button 
                        onClick={() => setShowCreate(true)}
                        variant="default"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Provider
                      </Button>
                      
                      <Button 
                        onClick={handleSkip}
                        variant="ghost"
                        className="w-full"
                      >
                        Skip for Now
                      </Button>
                    </>
                  )}
                  
                  {/* Search Section */}
                  {showSearch && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search vendors..."
                          defaultValue={currentVendor.vendor_name}
                          onChange={(e) => handleSearch(e.target.value)}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowSearch(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                      
                      {searching && (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      )}
                      
                      {searchResults.length > 0 && (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {searchResults.map((vendor) => (
                            <Card 
                              key={vendor.id}
                              className="cursor-pointer hover:bg-accent"
                              onClick={() => handleSelectVendor(vendor)}
                            >
                              <CardContent className="p-3">
                                <p className="font-medium">{vendor.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {vendor.community} - {vendor.category}
                                </p>
                                {vendor.contact_info && (
                                  <p className="text-sm">📞 {vendor.contact_info}</p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Create Section */}
                  {showCreate && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Provider Name</Label>
                        <Input
                          value={newVendorName}
                          onChange={(e) => setNewVendorName(e.target.value)}
                          placeholder="Provider name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Phone (Optional)</Label>
                        <Input
                          value={newVendorPhone}
                          onChange={(e) => setNewVendorPhone(e.target.value)}
                          placeholder="Phone number"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={handleCreateVendor} className="flex-1">
                          Create & Match
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreate(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}