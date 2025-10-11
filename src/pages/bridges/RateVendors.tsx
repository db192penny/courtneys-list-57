import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VendorRatingCard, VendorRatingData } from "@/components/bridges/VendorRatingCard";
import { ProgressBar } from "@/components/survey/ProgressBar";
import { useSurveyRating } from "@/hooks/useSurveyRating";
import { ArrowLeft } from "lucide-react";

type PageType = "email" | "rating" | "thankyou" | "error" | "completed";

export default function RateVendors() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const { loading, error, surveyResponse, pendingVendors, updateEmail, submitRating, skipVendor } = useSurveyRating(token);
  
  const [currentPage, setCurrentPage] = useState<PageType>("email");
  const [currentVendorIndex, setCurrentVendorIndex] = useState(0);
  const [emailInput, setEmailInput] = useState("");
  const [totalVendors, setTotalVendors] = useState(0);
  const [initialVendorCount, setInitialVendorCount] = useState(0);

  useEffect(() => {
    if (!loading && surveyResponse && pendingVendors) {
      // Capture initial count only once
      if (initialVendorCount === 0 && pendingVendors.length > 0) {
        setInitialVendorCount(pendingVendors.length);
        setTotalVendors(pendingVendors.length);
      }
      
      setEmailInput(surveyResponse.respondent_email || "");
      
      if (error === "already_completed") {
        setCurrentPage("completed");
      } else if (pendingVendors.length === 0) {
        setCurrentPage("thankyou");
      }
    }
    
    if (error && error !== "already_completed") {
      setCurrentPage("error");
    }
  }, [loading, error, surveyResponse, pendingVendors, initialVendorCount]);

  const handleEmailSubmit = async () => {
    if (!emailInput || !emailInput.includes("@")) return;
    
    const success = await updateEmail(emailInput);
    if (success) {
      setCurrentPage("rating");
    }
  };

  const handleRatingSubmit = async (data: VendorRatingData) => {
    const vendor = pendingVendors[currentVendorIndex];
    if (!vendor) return;

    const success = await submitRating(vendor.id, data);
    if (success) {
      // Delay scroll to ensure new content renders first, then instant scroll to top
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
      
      // Don't increment - pendingVendors will be shorter after rating
      // Always show the first unrated vendor (index 0)
      if (pendingVendors.length <= 1) {
        setCurrentPage("thankyou");
      }
      // Don't change index - stay at 0
    }
  };

  const handleSkip = async () => {
    const vendor = pendingVendors[currentVendorIndex];
    if (!vendor) return;

    const success = await skipVendor(vendor.id);
    if (success) {
      // Delay scroll to ensure new content renders first, then instant scroll to top
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
      
      // Don't increment - pendingVendors will be shorter after skipping
      if (pendingVendors.length <= 1) {
        setCurrentPage("thankyou");
      }
      // Don't change index
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (currentPage === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background p-6">
        <div className="max-w-2xl mx-auto pt-12">
          <div className="bg-card rounded-lg shadow-lg p-8 text-center space-y-4">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-foreground">Invalid Link</h2>
            <p className="text-muted-foreground">{error || "Please check your email for the correct link."}</p>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background p-6">
        <div className="max-w-2xl mx-auto pt-12">
          <div className="bg-card rounded-lg shadow-lg p-8 text-center space-y-4">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-foreground">Already Completed</h2>
            <p className="text-muted-foreground">You've already rated all service providers. Thank you!</p>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "thankyou" && surveyResponse) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background p-6">
        <div className="max-w-2xl mx-auto pt-12">
          <div className="bg-card rounded-lg shadow-lg p-8 space-y-6">
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-4">
                <img 
                  src="/bridges-logo.jpg" 
                  alt="The Bridges" 
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
              <div className="text-6xl">🎉</div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                You're Awesome!
              </h2>
              <p className="text-lg text-muted-foreground">
                Thanks so much {surveyResponse.respondent_name.split(" ")[0]}! Will send you a little gift over email shortly as a thank you for helping get this off the ground! ❤️ Lindsay
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "rating" && surveyResponse && pendingVendors.length > 0) {
    const currentVendor = pendingVendors[currentVendorIndex];
    const streetName = "Lewis River Rd (just an example)";

    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background p-6">
        <div className="max-w-2xl mx-auto pt-12">
          <ProgressBar
            current={initialVendorCount - pendingVendors.length + 1}
            total={initialVendorCount}
            className="mb-8"
          />

          <div className="bg-card rounded-lg shadow-lg p-6 md:p-8">
            <VendorRatingCard
              key={currentVendor.id}
              vendorName={currentVendor.vendor_name}
              category={currentVendor.category}
              currentIndex={initialVendorCount - pendingVendors.length + 1}
              totalVendors={initialVendorCount}
              userName={surveyResponse.respondent_name}
              streetName={streetName}
              onSubmit={handleRatingSubmit}
              onSkip={handleSkip}
            />
          </div>
        </div>
      </div>
    );
  }

  // Email verification page (default)
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background p-6">
      <div className="max-w-2xl mx-auto pt-12">
        <div className="bg-card rounded-lg shadow-lg p-8 space-y-8">
          {surveyResponse && (
            <>
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <img 
                    src="/bridges-logo.jpg" 
                    alt="The Bridges" 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  Hi {surveyResponse.respondent_name.split(" ")[0]}!
                </h1>

                <p className="text-xl md:text-2xl text-foreground">
                  Thanks for Helping Build The Bridges Directory! 🏡
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">
                  Your Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="john@example.com"
                  className="h-14 text-base"
                />
              </div>

              <div className="bg-secondary/20 rounded-lg p-4 space-y-3">
                <p className="text-lg text-foreground text-center">
                  You mentioned <span className="font-bold">{totalVendors}</span> service provider{totalVendors !== 1 ? "s" : ""}—would be amazing and super helpful if you rate them.
                </p>
                {pendingVendors && pendingVendors.length > 0 && (
                  <div className="text-sm text-muted-foreground text-center">
                    {pendingVendors.map((v, i) => (
                      <span key={v.id}>
                        <span className="font-medium">{v.vendor_name}</span>
                        {i < pendingVendors.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center space-y-2">
                <p className="text-lg font-medium text-foreground flex items-center justify-center gap-2">
                  You do this and coffee on me! ☕
                </p>
                <p className="text-sm text-muted-foreground">
                  $10 Starbucks gift card
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleEmailSubmit}
                disabled={!emailInput || !emailInput.includes("@")}
                className="w-full h-14 text-lg"
              >
                Start Rating
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
