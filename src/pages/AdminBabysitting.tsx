import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminBabysitting() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: pendingListings, isLoading } = useQuery({
    queryKey: ["admin-babysitting-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("babysitter_listings")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("babysitter_listings")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user?.id || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Approved", description: "Listing is now public" });
      queryClient.invalidateQueries({ queryKey: ["admin-babysitting-pending"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from("babysitter_listings")
        .update({ status: "declined" })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Declined", description: "Listing has been declined" });
      queryClient.invalidateQueries({ queryKey: ["admin-babysitting-pending"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-6 md:py-10 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>

        <header className="mb-6">
          <h1 className="text-3xl font-bold">Babysitting Board Management</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve babysitter listings
          </p>
        </header>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : !pendingListings || pendingListings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No pending listings</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingListings.map((listing: any) => (
              <Card key={listing.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>
                        {listing.sitter_first_name}, {listing.sitter_age}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{listing.community}</Badge>
                        {listing.is_adult && <Badge>18+</Badge>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listing.experience_description && (
                    <div>
                      <p className="text-sm font-medium mb-1">Experience:</p>
                      <p className="text-sm text-muted-foreground">
                        {listing.experience_description}
                      </p>
                    </div>
                  )}

                  {listing.age_groups && listing.age_groups.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Age Groups:</p>
                      <div className="flex flex-wrap gap-2">
                        {listing.age_groups.map((group: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{group}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {listing.certifications && listing.certifications.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Certifications:</p>
                      <div className="flex flex-wrap gap-2">
                        {listing.certifications.map((cert: string, idx: number) => (
                          <Badge key={idx} variant="outline">{cert}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Contact Information:</p>
                    <div className="text-sm space-y-1">
                      <p><strong>Name:</strong> {listing.contact_name}</p>
                      <p><strong>Phone:</strong> {listing.contact_phone}</p>
                      {listing.contact_email && (
                        <p><strong>Email:</strong> {listing.contact_email}</p>
                      )}
                      <p><strong>Relationship:</strong> {listing.contact_relationship}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleApprove(listing.id)}
                      disabled={processingId === listing.id}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDecline(listing.id)}
                      disabled={processingId === listing.id}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
