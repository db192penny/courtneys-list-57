import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Phone, Mail, Clock, Award, MessageSquare, Copy, Pencil } from "lucide-react";
import { SubmitBabysitterForm } from "./SubmitBabysitterForm";
import { HorizontalCategoryPills } from "@/components/vendors/HorizontalCategoryPills";
import { CATEGORIES } from "@/data/categories";
import { useToast } from "@/hooks/use-toast";
import { formatUSPhoneDisplay } from "@/utils/phone";

interface BabysitterListing {
  id: string;
  sitter_first_name: string;
  sitter_age: number;
  is_adult: boolean;
  experience_description: string | null;
  age_groups: string[] | null;
  availability: string | null;
  certifications: string[] | null;
  hourly_rate_range: string | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  contact_relationship: string;
  community: string;
  street_name: string | null;
  posted_by: string | null;
}

export function BabysittingBoard({ 
  communityName, 
  isAuthenticated 
}: { 
  communityName: string;
  isAuthenticated: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState<BabysitterListing | null>(null);
  const [editingListing, setEditingListing] = useState<BabysitterListing | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: { user } = {} } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data;
    },
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ["babysitter-listings", communityName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("babysitter_listings")
        .select("*")
        .eq("community", communityName)
        .neq("status", "removed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BabysitterListing[];
    },
  });

  const ageGroupEmojis: Record<string, string> = {
    infants: "👶",
    toddlers: "🧒",
    "school-age": "🎒",
    teens: "🧑",
  };

  const handleCategoryChange = (newCategory: string) => {
    setSearchParams({ category: newCategory });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCall = (listing: BabysitterListing) => {
    if (typeof window !== "undefined" && window.mixpanel) {
      try {
        window.mixpanel.track(`Called Babysitter: ${listing.sitter_first_name}`, {
          listing_id: listing.id,
          sitter_name: listing.sitter_first_name,
          phone: listing.contact_phone,
          action: "call",
          community: listing.community,
        });
        window.mixpanel.people.increment("babysitters_called", 1);
        console.log("📊 Tracked babysitter call:", listing.sitter_first_name);
      } catch (error) {
        console.error("Mixpanel tracking error:", error);
      }
    }
    window.location.href = `tel:${listing.contact_phone}`;
  };

  const handleText = (listing: BabysitterListing) => {
    if (typeof window !== "undefined" && window.mixpanel) {
      try {
        window.mixpanel.track(`Texted Babysitter: ${listing.sitter_first_name}`, {
          listing_id: listing.id,
          sitter_name: listing.sitter_first_name,
          phone: listing.contact_phone,
          action: "text",
          community: listing.community,
        });
        window.mixpanel.people.increment("babysitters_texted", 1);
        console.log("📊 Tracked babysitter text:", listing.sitter_first_name);
      } catch (error) {
        console.error("Mixpanel tracking error:", error);
      }
    }
    window.location.href = `sms:${listing.contact_phone}`;
  };

  const handleCopyNumber = async (listing: BabysitterListing) => {
    if (typeof window !== "undefined" && window.mixpanel) {
      try {
        window.mixpanel.track(`Copied Babysitter Number: ${listing.sitter_first_name}`, {
          listing_id: listing.id,
          sitter_name: listing.sitter_first_name,
          phone: listing.contact_phone,
          action: "copy",
          community: listing.community,
        });
        window.mixpanel.people.increment("babysitter_numbers_copied", 1);
        console.log("📊 Tracked number copy:", listing.sitter_first_name);
      } catch (error) {
        console.error("Mixpanel tracking error:", error);
      }
    }

    try {
      await navigator.clipboard.writeText(listing.contact_phone || "");
      toast({
        title: "Number copied",
        description: "Phone number copied to clipboard",
      });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = listing.contact_phone || "";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast({
        title: "Number copied",
        description: "Phone number copied to clipboard",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Navigation - ALWAYS VISIBLE */}
      <div className="mb-4">
        <HorizontalCategoryPills
          selectedCategory="Babysitting"
          onCategoryChange={handleCategoryChange}
          categories={[...CATEGORIES]}
          isBannerVisible={false}
        />
      </div>

      {/* Conditional Content Based on Authentication */}
      {!isAuthenticated ? (
        // Unauthenticated view
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Babysitters</h2>
              <p className="text-muted-foreground mt-1">
                Community babysitters in {communityName}
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="text-center py-12">
              <p className="text-lg font-semibold mb-2">Sign In Required</p>
              <p className="text-muted-foreground mb-4">
                To protect our community's children, you must be a verified neighbor to view babysitter listings.
              </p>
              <Button onClick={() => window.location.href = '/signin'}>
                Sign In to View Babysitters
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        // Authenticated view
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Babysitters</h2>
              <p className="text-muted-foreground mt-1">
                Community babysitters in {communityName}
              </p>
            </div>
            <Button onClick={() => setShowSubmitForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add a Babysitter
            </Button>
          </div>

          {/* Listings Grid */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : !listings || listings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No babysitters listed yet. Be the first to add one!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    {/* Category Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">👶</span>
                      <span className="text-xs font-medium text-muted-foreground">
                        Babysitting
                      </span>
                    </div>

                    {/* Name, Age, and Street */}
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold">
                          {listing.sitter_first_name}, {listing.sitter_age}
                        </h3>
                        {listing.is_adult && (
                          <Badge variant="secondary" className="ml-2">18+</Badge>
                        )}
                      </div>
                      {listing.street_name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {listing.street_name}
                        </p>
                      )}
                    </div>

                    {/* Certifications */}
                    {listing.certifications && listing.certifications.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {listing.certifications.map((cert, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Experience */}
                    {listing.experience_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {listing.experience_description}
                      </p>
                    )}

                    {/* Age Groups */}
                    {listing.age_groups && listing.age_groups.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {listing.age_groups.map((group, idx) => (
                          <span key={idx} className="text-sm">
                            {ageGroupEmojis[group] || "👤"} {group}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Availability */}
                    {listing.availability && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{listing.availability}</span>
                      </div>
                    )}

                    {/* Rate */}
                    {listing.hourly_rate_range && (
                      <p className="text-sm font-medium">{listing.hourly_rate_range}</p>
                    )}

                    {/* Contact Buttons */}
                    <div className="pt-3 border-t flex items-center justify-between gap-2">
                      <div className="flex gap-2 flex-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCall(listing)}
                          className="flex-1"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleText(listing)}
                          className="flex-1"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Text
                        </Button>
                      </div>
                      {listing.posted_by === user?.id && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingListing(listing)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Contact Modal */}
          <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Contact for {selectedListing?.sitter_first_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedListing?.contact_relationship === "parent" 
                      ? "Parent Contact:" 
                      : "Contact:"}
                  </p>
                  <p className="font-medium">{selectedListing?.contact_name}</p>
                </div>
                
                {/* Phone number display */}
                <div className="text-sm font-medium text-center bg-blue-50 py-2 px-3 rounded border border-blue-200">
                  {formatUSPhoneDisplay(selectedListing?.contact_phone || "")}
                </div>

                {/* Call, Text, Copy buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => selectedListing && handleCall(selectedListing)}
                    className="flex-1"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => selectedListing && handleText(selectedListing)}
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => selectedListing && handleCopyNumber(selectedListing)}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>

                {selectedListing?.contact_email && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 justify-center">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${selectedListing?.contact_email}`}
                        className="text-primary hover:underline text-sm"
                      >
                        {selectedListing?.contact_email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Submit Form Modal */}
          <Dialog open={showSubmitForm} onOpenChange={setShowSubmitForm}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add a Babysitter</DialogTitle>
              </DialogHeader>
              <SubmitBabysitterForm 
                communityName={communityName}
                onSuccess={() => {
                  setShowSubmitForm(false);
                  queryClient.invalidateQueries({ queryKey: ["babysitter-listings", communityName] });
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Form Modal */}
          <Dialog open={!!editingListing} onOpenChange={() => setEditingListing(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Babysitter Listing</DialogTitle>
              </DialogHeader>
              <SubmitBabysitterForm 
                communityName={communityName}
                editMode={editingListing || undefined}
                onSuccess={() => {
                  setEditingListing(null);
                  queryClient.invalidateQueries({ queryKey: ["babysitter-listings", communityName] });
                }}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}