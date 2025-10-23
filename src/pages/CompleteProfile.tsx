import { FormEvent, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { extractStreetName } from "@/utils/address";
import SEO from "@/components/SEO";
import { toSlug } from "@/utils/slug";
import AddressInput, { AddressSelectedPayload } from "@/components/AddressInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { TermsModal } from "@/components/TermsModal";
import { PrivacyModal } from "@/components/PrivacyModal";
import { Checkbox } from "@/components/ui/checkbox";

const CompleteProfile = () => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [resident, setResident] = useState<"yes" | "no">("yes");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<{ name?: boolean; address?: boolean; resident?: boolean; terms?: boolean }>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsModalVariant, setTermsModalVariant] = useState<"full" | "plain-english">("plain-english");
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  const getCommunityDisplayName = (slug: string): string => {
    const normalized = slug.toLowerCase();
    if (normalized === "the-bridges" || normalized === "bridges") {
      return "The Bridges";
    }
    if (normalized === "boca-bridges") {
      return "Boca Bridges";
    }
    // Default formatting for other communities
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const communitySlug = searchParams.get("community") || "the-bridges";
  const communityName = getCommunityDisplayName(communitySlug);
  const fromSignIn = searchParams.get("from") === "signin";

  // ========================================
  // ENHANCED GOOGLE USER HANDLING - NEW CODE
  // ========================================
  useEffect(() => {
    const checkAuthAndPrefill = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }

      // Check if this is a Google OAuth user
      const isGoogleUser = session.user.app_metadata?.provider === "google";

      // Pre-fill name from Google metadata
      const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "";
      if (googleName) {
        setName(googleName);
      }

      // Check if user already has a complete profile
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, name, address, is_verified")
        .eq("id", session.user.id)
        .maybeSingle();

      if (existingUser) {
        // User already has a profile
        if (
          existingUser.address &&
          existingUser.address !== "Address Pending" &&
          existingUser.address !== "Address Not Provided"
        ) {
          // Profile is complete, redirect to their community
          console.log("Profile already complete, redirecting...");
          const community = searchParams.get("community") || "boca-bridges";
          navigate(`/communities/${community}?welcome=true`, { replace: true });
          return;
        }
      }

      // Show helpful message if coming from failed sign-in attempt
      // if (fromSignIn && isGoogleUser) {
      //   toast({
      //     title: "Almost There!",
      //     description: "We just need your address to complete your account.",
      //     duration: 6000,
      //   });
      // }
    };

    checkAuthAndPrefill();
  }, [navigate, fromSignIn, searchParams, toast]);
  // ========================================
  // ENHANCED GOOGLE USER HANDLING - END
  // ========================================

  // Prevent back navigation while completing profile
  useEffect(() => {
    const preventBack = () => window.history.forward();
    window.addEventListener('popstate', preventBack);
    return () => window.removeEventListener('popstate', preventBack);
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (resident === "no") {
      toast({
        title: "Residents only",
        description: "Currently, access is restricted to residents only.",
        variant: "destructive",
      });
      return;
    }

    const fieldErrors = {
      name: !name.trim(),
      address: !address.trim() || !/^\d+/.test(address.trim()),
      resident: !resident,
      terms: !termsAccepted,
    };

    const missingKeys = (Object.keys(fieldErrors) as Array<keyof typeof fieldErrors>).filter((k) => fieldErrors[k]);
    if (missingKeys.length > 0) {
      setErrors(fieldErrors);

      // Show specific error for missing terms acceptance
      if (!termsAccepted) {
        toast({
          title: "Agreement required",
          description: "Please accept the Terms of Service and Privacy Policy to continue",
          variant: "destructive",
        });
        return;
      }

      // Show specific error for missing street number
      if (!address.trim()) {
        toast({
          title: "Incomplete form",
          description: "Please enter your address",
          variant: "destructive",
        });
      } else if (!/^\d+/.test(address.trim())) {
        toast({
          title: "Invalid address",
          description: "Your address must include a house or unit number",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Incomplete form",
          description: "Please complete all required fields",
          variant: "destructive",
        });
      }
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not authenticated", description: "Please sign in again", variant: "destructive" });
        navigate("/auth");
        return;
      }

      const streetName = extractStreetName(address.trim());

      // UPSERT user profile - creates record for Google OAuth users or updates existing
      const { error: upsertError } = await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email,
          name: name.trim(),
          address: address.trim(),
          street_name: streetName,
          is_verified: true, // Auto-approve Google sign-ups
          signup_source: `community:${communitySlug}`,
          points: 5,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      );

      if (upsertError) {
        console.error("Profile upsert error:", upsertError);
        toast({
          title: "Update failed",
          description: "Could not update your profile. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Log the signup bonus points to history
      // This is needed because Google OAuth bypasses the normal trigger
      const { error: pointHistoryError } = await supabase.from("user_point_history").insert({
        user_id: user.id,
        activity_type: "join_site",
        points_earned: 5,
        description: "Welcome bonus for joining Courtney's List",
      });

      if (pointHistoryError) {
        console.error("Failed to log signup points:", pointHistoryError);
        // Don't block the flow - user creation was successful
      }

      // Create household-HOA mapping
      try {
        const { data: normalizedAddr } = await supabase.rpc("normalize_address", {
          _addr: address.trim(),
        });

        await supabase.from("household_hoa").insert({
          household_address: address.trim(),
          normalized_address: normalizedAddr || address.trim(),
          hoa_name: communityName,
          created_by: user.id,
          mapping_source: "google_oauth",
        });
      } catch (mappingError) {
        console.error("Mapping creation error:", mappingError);
        // Don't fail the whole process if mapping fails
      }

      // Send admin notification for Google OAuth signup
      try {
        const displayCommunity = communityName === "The Bridges" ? "The Bridges" : communityName;

        await supabase.functions.invoke("send-admin-notification", {
          body: {
            userEmail: user.email,
            userName: name.trim(),
            userAddress: address.trim(),
            community: displayCommunity,
            signupSource: `google_oauth:${communitySlug}`,
          },
        });

        console.log("Admin notification sent for Google OAuth signup");
      } catch (notificationError) {
        console.error("Failed to send admin notification:", notificationError);
        // Don't fail the signup if notification fails
      }

      // toast({
      //   title: "Profile completed!",
      //   description: `Welcome to ${communityName}`,
      // });

      // Redirect to their community
      navigate(`/communities/${toSlug(communityName)}?welcome=true`, { replace: true });
    } catch (error) {
      console.error("Complete profile error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={`Complete Your Profile - ${communityName}`}
        description="Complete your profile to access exclusive vendor information"
      />

      <section className="container max-w-xl py-4 sm:py-6 px-4 sm:px-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🏘️</span>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Courtney's List
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Complete your profile to continue
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to {communityName}!</CardTitle>
            <CardDescription>
              {fromSignIn
                ? "We just need your address to complete your account."
                : "We just need a bit more information to get you started."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name{" "}
                  <span className="text-foreground" aria-hidden>
                    *
                  </span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.currentTarget.value)}
                  placeholder="Your full name"
                  required
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : undefined}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="address">
                    Full Address{" "}
                    <span className="text-foreground" aria-hidden>
                      *
                    </span>
                  </Label>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Why we need your address" className="text-muted-foreground">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Your address helps us link you with your community's exclusive vendor info</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Please put in a few numbers and use the dropdown
                </p>
                <AddressInput
                  id="address"
                  defaultValue={address}
                  placeholder="Full home address"
                  className={errors.address ? "border-destructive focus-visible:ring-destructive" : undefined}
                  onSelected={(addr: AddressSelectedPayload) => {
                    setAddress(addr.formatted_address);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resident">
                  Are you a resident?{" "}
                  <span className="text-foreground" aria-hidden>
                    *
                  </span>
                </Label>
                <Select required value={resident} onValueChange={(v) => setResident(v as "yes" | "no")}>
                  <SelectTrigger id="resident" className={errors.resident ? "border-destructive" : undefined}>
                    <SelectValue placeholder="Select yes or no" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes, I live here</SelectItem>
                    <SelectItem value="no">No, I'm not a resident</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className={errors.terms ? "border-destructive" : undefined}
                />
                <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setTermsModalVariant("plain-english");
                      setTermsModalOpen(true);
                    }}
                    className="underline text-primary hover:text-primary/80"
                  >
                    Terms of Service
                  </button>
                  {" "}and{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setPrivacyModalOpen(true);
                    }}
                    className="underline text-primary hover:text-primary/80"
                  >
                    Privacy Policy
                  </button>
                </Label>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Completing..." : "Complete Profile"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">* Required fields</p>
            </form>
          </CardContent>
        </Card>
      </section>

      <TermsModal
        open={termsModalOpen}
        onOpenChange={setTermsModalOpen}
        variant={termsModalVariant}
      />
      <PrivacyModal
        open={privacyModalOpen}
        onOpenChange={setPrivacyModalOpen}
      />
    </main>
  );
};

export default CompleteProfile;
