import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Phone, Mail, Clock, Award } from "lucide-react";
import { SubmitBabysitterForm } from "./SubmitBabysitterForm";

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
}

export function BabysittingBoard({ 
  communityName, 
  isAuthenticated 
}: { 
  communityName: string;
  isAuthenticated: boolean;
}) {
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState<BabysitterListing | null>(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["babysitter-listings", communityName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("babysitter_listings")
        .select("*")
        .eq("community", communityName)
        .eq("status", "approved")
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Babysitting Board</h2>
          <p className="text-muted-foreground mt-1">
            Community babysitters in {communityName}
          </p>
        </div>
        {isAuthenticated && (
          <Button onClick={() => setShowSubmitForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add to Board
          </Button>
        )}
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
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {listing.sitter_first_name}, {listing.sitter_age}
                    </CardTitle>
                    {listing.street_name && (
                      <CardDescription className="text-xs mt-1">
                        {listing.street_name}
                      </CardDescription>
                    )}
                  </div>
                  {listing.is_adult && (
                    <Badge variant="secondary">18+</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
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

                {/* Contact Button */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSelectedListing(listing)}
                >
                  Contact {listing.is_adult ? "Sitter" : "Parent"}
                </Button>
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
            
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a 
                href={`tel:${selectedListing?.contact_phone}`}
                className="text-primary hover:underline"
              >
                {selectedListing?.contact_phone}
              </a>
            </div>

            {selectedListing?.contact_email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`mailto:${selectedListing?.contact_email}`}
                  className="text-primary hover:underline"
                >
                  {selectedListing?.contact_email}
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Form Modal */}
      <Dialog open={showSubmitForm} onOpenChange={setShowSubmitForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Babysitter to Board</DialogTitle>
          </DialogHeader>
          <SubmitBabysitterForm 
            communityName={communityName}
            onSuccess={() => setShowSubmitForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
