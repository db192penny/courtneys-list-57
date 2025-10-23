import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { extractStreetName } from "@/utils/address";
import SEO from "@/components/SEO";
import { toSlug } from "@/utils/slug";
import AddressInput, { AddressSelectedPayload } from "@/components/AddressInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info, Crown, PartyPopper, ArrowLeft, Mail, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { handleSignupInvite } from "@/lib/handle-signup-invite";
import { MagicLinkLoader } from "@/components/MagicLinkLoader";
import { WelcomeBackModal } from "@/components/WelcomeBackModal";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAnalyticsTracking } from "@/contexts/AnalyticsContext";

const Auth = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [resident, setResident] = useState<"yes" | "no">("yes");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: boolean; email?: boolean; address?: boolean; resident?: boolean; terms?: boolean }>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMagicLinkModal, setShowMagicLinkModal] = useState(false);
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  const [detectedCommunity, setDetectedCommunity] = useState<string>("");
  const [justSignedUp, setJustSignedUp] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { trackSignUpClick, trackEmailSubmit } = useAnalyticsTracking();

  const hasMagicLink = window.location.hash.includes("access_token=");

  const communityName = useMemo(() => {
    const urlCommunity = params.get("community") || "";
    return urlCommunity;
  }, [params]);

  const isVerifiedMagicLink = useMemo(() => {
    return params.get("verified") === "true";
  }, [params]);

  useEffect(() => {
    // Redirect to default community page if no community in URL and not processing magic link
    if (!communityName && !hasMagicLink) {
      // Try to detect community from referrer
      const referrer = document.referrer;
      if (referrer.includes("/communities/the-bridges")) {
        navigate("/auth?community=the-bridges", { replace: true });
      } else if (referrer.includes("/communities/boca-bridges")) {
        navigate("/auth?community=boca-bridges", { replace: true });
      } else {
        // Default to The Bridges
        console.log("⚠️ No community parameter in URL, defaulting to The Bridges");
        navigate("/communities/the-bridges", { replace: true });
      }
    }
  }, [communityName, hasMagicLink, navigate]);

  const handleBack = () => {
    if (communityName) {
      const fallbackUrl = `/communities/${toSlug(communityName)}`;
      navigate(fallbackUrl, { replace: true });
    } else {
      navigate("/communities/the-bridges", { replace: true });
    }
  };

  useEffect(() => {
    const addrParam = (params.get("address") || "").trim();
    if (!address && addrParam) {
      setAddress(addrParam);
    }
  }, [email, address, params]);

  const finalizeOnboarding = useCallback(
    async (userId: string, userEmail: string | null) => {
      console.log("🎯 [finalizeOnboarding] CALLED with userId:", userId, "userEmail:", userEmail);
      let destination = "/communities/boca-bridges?welcome=true";

      // Handle signup invite processing
      if (userId) {
        console.log("🎯 [finalizeOnboarding] About to call handleSignupInvite");
        try {
          await handleSignupInvite(userId);
          console.log("🎯 [finalizeOnboarding] Invite processing completed");
        } catch (error) {
          console.error("🎯 [finalizeOnboarding] Error processing invite:", error);
        }
      }

      try {
        // Check for returnPath with category
        const returnPath = params.get("returnPath");
        const category = params.get("category");

        if (returnPath) {
          let finalDestination = returnPath;
          if (category) {
            const hasQuery = finalDestination.includes("?");
            finalDestination += `${hasQuery ? "&" : "?"}category=${category}`;
          }
          const communitySlug = communityName || "boca-bridges";
          if (!finalDestination.includes("community=")) {
            finalDestination += `${finalDestination.includes("?") ? "&" : "?"}community=${communitySlug}`;
          }
          navigate(finalDestination, { replace: true });
          return;
        }

        // CRITICAL FIX: First check if we have a community from the URL
        if (communityName) {
          // User signed up via a specific community page - respect that choice!
          destination = `/communities/${toSlug(communityName)}?welcome=true`;
          console.log("🎯 [finalizeOnboarding] Using community from URL:", communityName);
        } else {
          // No community in URL, check the database
          const { data: userData, error: userErr } = await supabase
            .from("users")
            .select("address, signup_source")
            .eq("id", userId)
            .maybeSingle();

          if (!userErr && userData) {
            // PRIORITY 1: Check signup_source from database
            if (userData?.signup_source && userData.signup_source.startsWith("community:")) {
              const communityFromSignup = userData.signup_source.replace("community:", "");
              destination = `/communities/${toSlug(communityFromSignup)}?welcome=true`;
              console.log("🎯 [finalizeOnboarding] Using community from signup_source:", communityFromSignup);
            }
            // ONLY use address mapping as a last resort if no community was specified
            else if (userData?.address && userData.address !== "Address Not Provided") {
              console.log("⚠️ [finalizeOnboarding] No community specified, falling back to address mapping");
              const { data: normalizedAddr } = await supabase.rpc("normalize_address", { _addr: userData.address });

              const { data: mapping } = await supabase
                .from("household_hoa")
                .select("hoa_name, created_at, household_address")
                .eq("household_address", normalizedAddr)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              const hoaName = mapping?.hoa_name || "";
              if (hoaName) {
                destination = `/communities/${toSlug(hoaName)}?welcome=true`;
                console.log("🎯 [finalizeOnboarding] Using community from address mapping:", hoaName);
              } else {
                try {
                  const { data: hoaRes } = await supabase.rpc("get_my_hoa");
                  const rpcHoa = (hoaRes?.[0]?.hoa_name as string | undefined) || "";
                  if (rpcHoa) {
                    destination = `/communities/${toSlug(rpcHoa)}?welcome=true`;
                    console.log("🎯 [finalizeOnboarding] Using community from RPC:", rpcHoa);
                  }
                } catch (e) {
                  console.log("🎯 [finalizeOnboarding] No community found, using default");
                }
              }
            }
          }
        }

        const cleanDestination = destination.split("#")[0];

        if (destination !== "/communities/boca-bridges?welcome=true") {
          const communityMatch = destination.match(/\/communities\/(.+?)(\?|$)/);
          const communityForDisplay = communityMatch
            ? communityMatch[1].replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
            : communityName || "your community";

          setDetectedCommunity(communityForDisplay);
          // setShowSuccessModal(true); // Commented out - blocks WelcomeToolbar

          setTimeout(() => {
            navigate(cleanDestination, { replace: true });
          }, 100);
          return;
        }

        navigate(cleanDestination, { replace: true });
      } catch (e) {
        toast({
          title: "Navigation Issue",
          description: "We're completing your signup. Please wait a moment.",
          variant: "destructive",
        });

        navigate("/communities/boca-bridges?welcome=true", { replace: true });
      }
    },
    [navigate, toast, communityName, params],
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 [Auth State Change] Event:", event, "Session:", session?.user?.email);

      // Check localStorage invite data
      console.log("📦 [Auth] Current localStorage:", {
        invite_code: localStorage.getItem("pending_invite_code"),
        inviter_id: localStorage.getItem("pending_inviter_id"),
      });

      if (event === "SIGNED_IN" && session?.user?.id) {
        console.log("✅ [Auth] SIGNED_IN event detected - calling finalizeOnboarding");
        // This is what was missing - call finalizeOnboarding after signup
        await finalizeOnboarding(session.user.id, session.user.email);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("🔄 [Auth Debug] Initial session check:", !!session, "User:", session?.user?.email);
      if (session?.user && isVerifiedMagicLink) {
        console.log("🔄 [Auth Debug] Calling finalizeOnboarding from initial session check (verified magic link)");
        finalizeOnboarding(session.user.id, session.user.email ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, [finalizeOnboarding, isVerifiedMagicLink, justSignedUp]);

  // Auto-scroll to top when component mounts to ensure users see the page header
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);

      // Get community context
      const communityContext = communityName || "boca-bridges";

      // Allow Google OAuth for all Bridges communities
      if (!communityContext.toLowerCase().includes("bridges")) {
        toast({
          title: "Feature not available",
          description: "Google sign-up is currently only available for Bridges communities.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?context=${communityContext}&intent=signup`,
          queryParams: {
            access_type: "offline",
            prompt: "consent select_account",
          },
        },
      });

      if (error) {
        console.error("Google signup error:", error);
        toast({
          title: "Sign up failed",
          description: error.message || "Could not sign up with Google. Please try email instead.",
          variant: "destructive",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Google signup error:", error);
      toast({
        title: "Sign up failed",
        description: "Could not sign up with Google. Please try email instead.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Track sign-up click
    await trackSignUpClick();

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
      email: !email.trim(),
      address: !address.trim(),
      resident: !resident,
      terms: !termsAccepted,
    };
    const missingKeys = (Object.keys(fieldErrors) as Array<keyof typeof fieldErrors>).filter((k) => fieldErrors[k]);
    if (missingKeys.length > 0) {
      setErrors(fieldErrors);
      
      // Show friendly, specific message based on what's missing
      if (fieldErrors.address) {
        toast({
          title: "Incomplete",
          description: "Please put in a few numbers and use the dropdown to select your address",
          variant: "default",
        });
      } else {
        const labelMap: Record<string, string> = {
          name: "Name",
          email: "Email",
          address: "Full Address",
          resident: "Resident status",
          terms: "Terms of Service",
        };
        const missingLabels = missingKeys.map((k) => labelMap[k as string]);
        toast({
          title: "Incomplete",
          description: `Please complete ${missingLabels.join(", ")}`,
          variant: "default",
        });
      }
      
      const firstId = missingKeys[0] === "resident" ? "resident" : (missingKeys[0] as string);
      setTimeout(() => document.getElementById(firstId)?.focus(), 0);
      return;
    } else {
      setErrors({});
    }

    localStorage.removeItem("prefill_address");
    localStorage.removeItem("selected_community");

    const targetEmail = email.trim().toLowerCase();
    
    // Track email submission
    await trackEmailSubmit(targetEmail);

    try {
      const { data: emailStatus, error: statusError } = await supabase.rpc("get_email_status", {
        _email: targetEmail,
      });

      if (statusError) {
        toast({
          title: "Account check failed",
          description: "Unable to verify email status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (emailStatus === "approved") {
        // Send magic link automatically for existing user
        const communitySlug = communityName ? toSlug(communityName) : "boca-bridges";
        const redirectUrl = `${window.location.origin}/communities/${communitySlug}?welcome=true`;

        const { error: signInError } = await supabase.auth.signInWithOtp({
          email: targetEmail,
          options: { emailRedirectTo: redirectUrl },
        });

        if (signInError) {
          console.error("[Auth] Welcome back magic link error", signInError);
          toast({
            title: "Error sending magic link",
            description: signInError.message,
            variant: "destructive",
          });
        } else {
          // Show welcome back modal instead of toast + redirect
          setShowWelcomeBackModal(true);
        }
        return;
      } else if (emailStatus === "pending") {
        toast({
          title: "Account pending approval",
          description: "Your account is already registered but still under review. Please check back later.",
          variant: "destructive",
        });
        return;
      }
    } catch (emailCheckError) {
      // Continue with signup attempt if email check fails
    }

    // CRITICAL FIX: Ensure signup_source is set correctly with the community from URL
    const metaData = {
      name: name.trim(),
      address: address.trim(),
      street_name: extractStreetName(address.trim()),
      signup_source: communityName ? `community:${communityName}` : null, // Use exact community from URL, not toSlug
    };

    const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const redirectUrl = `${window.location.origin}/auth`;
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: targetEmail,
      password: tempPassword,
      options: {
        emailRedirectTo: redirectUrl,
        data: metaData,
      },
    });

    // ========================================
    // ORPHANED USER RECOVERY - NEW CODE STARTS HERE
    // ========================================
    if (signUpError) {
      let errorTitle = "Could not create account";
      let errorDescription = signUpError.message;

      if (
        signUpError.message.includes("User already registered") ||
        signUpError.message.includes("already been taken") ||
        signUpError.message.includes("already exists") ||
        signUpError.message.includes("duplicate key") ||
        signUpError.message.includes("unique constraint")
      ) {
        console.log("Email already exists in auth, checking if orphaned...");

        // Check if this is an orphaned account (auth.users exists but public.users doesn't)
        try {
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", targetEmail)
            .maybeSingle();

          if (!existingUser) {
            // ORPHANED ACCOUNT DETECTED!
            console.log("Orphaned account detected for:", targetEmail);
            
            // Try to delete if it's a recent Google OAuth orphan
            const { data: wasDeleted } = await supabase.rpc("delete_orphaned_google_auth" as any, {
              _email: targetEmail,
            });
            
            if (wasDeleted) {
              // Successfully deleted orphaned Google OAuth record
              // Now retry the signup automatically
              console.log("Deleted orphaned Google OAuth record, retrying signup...");
              
              // Retry signup with same data
              const { data: retryAuthData, error: retryError } = await supabase.auth.signUp({
                email: targetEmail,
                password: tempPassword,
                options: {
                  emailRedirectTo: redirectUrl,
                  data: metaData,
                },
              });
              
              if (retryError) {
                toast({
                  title: "Signup failed",
                  description: retryError.message,
                  variant: "destructive",
                });
                setLoading(false);
                return;
              }
              
              const retryUserId = retryAuthData.user?.id;
              if (!retryUserId) {
                toast({ title: "Signup failed", description: "Could not create user account", variant: "destructive" });
                setLoading(false);
                return;
              }
              
              // Send admin notification
              try {
                await supabase.functions.invoke("send-admin-notification", {
                  body: {
                    userEmail: targetEmail,
                    userName: name.trim(),
                    userAddress: address.trim(),
                    community: communityName || "Direct Signup",
                    signupSource: communityName ? `community:${communityName}` : "direct",
                  },
                });
              } catch (adminNotificationError) {
                // Don't fail the signup
              }
              
              // User is now signed in automatically - redirect to community
              const communitySlug = communityName ? toSlug(communityName) : 'the-bridges';
              navigate(`/communities/${communitySlug}?welcome=true`, { replace: true });
              setLoading(false);
              return;
            }
            
            // If not deleted, it's an older orphaned account - try to fix it
            const { data: fixResult, error: fixError } = await supabase.rpc("fix_specific_orphaned_user", {
              _email: targetEmail,
              _name: name.trim(),
              _address: address.trim(),
            });

            if (!fixError && fixResult && fixResult.length > 0 && fixResult[0].created_record) {
              console.log("Orphaned account fixed, sending magic link...");

              const { error: magicLinkError } = await supabase.auth.signInWithOtp({
                email: targetEmail,
                options: { emailRedirectTo: redirectUrl },
              });

              if (!magicLinkError) {
                toast({
                  title: "Account Recovered! ✅",
                  description: "We found your account and fixed it. Check your email for a magic link to sign in.",
                  duration: 8000,
                });
                setLoading(false);
                return;
              }
            }

            // If fix failed, show helpful error
            errorTitle = "Account Issue Detected";
            errorDescription =
              "There's an issue with your account. Please try signing in with Google or contact support.";
          } else {
            // User actually exists in both tables - direct them to sign in
            errorTitle = "Email already registered";
            errorDescription = "This email is already registered. Please sign in instead.";

            setTimeout(() => {
              const signInUrl = communityName ? `/signin?community=${toSlug(communityName)}` : "/signin";
              navigate(signInUrl);
            }, 2000);
          }
        } catch (checkError) {
          console.error("Error checking for orphaned account:", checkError);
          errorTitle = "Email already registered";
          errorDescription = "This email is already registered. Please sign in instead or contact support.";
        }
      } else if (signUpError.message.includes("invalid email")) {
        errorTitle = "Invalid email";
        errorDescription = "Please enter a valid email address.";
      } else if (signUpError.message.includes("password")) {
        errorTitle = "Password issue";
        errorDescription = "There was an issue with the password. Please try again.";
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    // ========================================
    // ORPHANED USER RECOVERY - NEW CODE ENDS HERE
    // ========================================

    const userId = authData.user?.id;
    if (!userId) {
      toast({ title: "Signup failed", description: "Could not create user account", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      await supabase.functions.invoke("send-admin-notification", {
        body: {
          userEmail: targetEmail,
          userName: name.trim(),
          userAddress: address.trim(),
          community: communityName || "Direct Signup",
          signupSource: communityName ? `community:${communityName}` : "direct", // Use exact community from URL
        },
      });
    } catch (adminNotificationError) {
      // Don't fail the signup process if admin notification fails
    }

    setShowMagicLinkModal(true);
    setLoading(false);
  };

  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  return hasMagicLink ? (
    <MagicLinkLoader />
  ) : (
    <main className="min-h-screen bg-background">
      <SEO
        title={
          communityName
            ? `Join ${communityName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}`
            : "Join Boca Bridges"
        }
        description="Join the invite only test family - automatically verified access to exclusive vendor info."
        canonical={canonical}
      />

      <section className="container max-w-xl py-4 sm:py-6 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-3xl font-semibold">
            {communityName
              ? `Join ${communityName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}`
              : "Join Boca Bridges"}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <GoogleSignInButton
                onClick={handleGoogleSignUp}
                loading={loading}
                label="Sign up with Google"
                community={communityName}
              />

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
                <Label htmlFor="email">
                  Email{" "}
                  <span className="text-foreground" aria-hidden>
                    *
                  </span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  required
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : undefined}
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

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className={errors.terms ? "border-destructive" : undefined}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary hover:text-primary/80"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary hover:text-primary/80"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Join Now
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">* Required fields</p>

              <div className="pt-2 text-center">
                <Link
                  to={communityName ? `/signin?community=${toSlug(communityName)}` : "/signin"}
                  className="underline underline-offset-4 text-sm text-muted-foreground hover:text-foreground"
                >
                  Already have an account? Sign In
                </Link>
              </div>
            </form>
          </CardContent>

          {resident === "no" && (
            <CardFooter className="pt-0">
              <p className="text-sm text-muted-foreground">
                Currently, access is restricted to residents only. We may expand to other users in the future.
              </p>
            </CardFooter>
          )}
        </Card>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Enter your details, and once approved by your community admin, you'll get full access to your neighborhood's
          trusted providers.
        </div>
      </section>

      <Dialog
        open={showMagicLinkModal}
        onOpenChange={(open) => {
          setShowMagicLinkModal(open);
          if (!open) {
            setJustSignedUp(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-green-600" />
              Magic Link Sent!
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              We've sent a magic link to <strong>{email}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Don't forget to check your spam folder!
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Magic links sometimes end up in spam or junk mail folders.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  setShowMagicLinkModal(false);
                  setJustSignedUp(false);
                }}
                className="w-full"
              >
                Got It!
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowMagicLinkModal(false);
                  setJustSignedUp(false);
                  onSubmit(new Event("submit") as any);
                }}
                className="w-full"
              >
                Resend Magic Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success modal removed - WelcomeToolbar now shows the Starbucks incentive */}

      <WelcomeBackModal
        open={showWelcomeBackModal}
        onOpenChange={setShowWelcomeBackModal}
        email={email}
        communityName={communityName}
      />
    </main>
  );
};

export default Auth;
