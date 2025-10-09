import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BridgesHeader } from "@/components/bridges/BridgesHeader";
import { VendorRatingCard, VendorRatingData } from "@/components/bridges/VendorRatingCard";
import { ProgressBar } from "@/components/survey/ProgressBar";
import { useSurveyRating } from "@/hooks/useSurveyRating";

type PageType = "email" | "rating" | "thankyou" | "error" | "completed";

export default function RateVendors() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const { loading, error, surveyResponse, pendingVendors, updateEmail, submitRating, skipVendor } = useSurveyRating(token);
  
  const [currentPage, setCurrentPage] = useState<PageType>("email");
  const [currentVendorIndex, setCurrentVendorIndex] = useState(0);
  const [emailInput, setEmailInput] = useState("");
  const [totalVendors, setTotalVendors] = useState(0);

  useEffect(() => {
    if (!loading && surveyResponse && pendingVendors) {
      setTotalVendors(pendingVendors.length);
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
  }, [loading, error, surveyResponse, pendingVendors]);

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
      if (currentVendorIndex >= pendingVendors.length - 1) {
        setCurrentPage("thankyou");
      } else {
        setCurrentVendorIndex(prev => prev + 1);
      }
    }
  };

  const handleSkip = async () => {
    const vendor = pendingVendors[currentVendorIndex];
    if (!vendor) return;

    const success = await skipVendor(vendor.id);
    if (success) {
      if (currentVendorIndex >= pendingVendors.length - 1) {
        setCurrentPage("thankyou");
      } else {
        setCurrentVendorIndex(prev => prev + 1);
      }
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
          <BridgesHeader />
          <div className="bg-card rounded-lg shadow-lg p-8 text-center space-y-4">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-foreground">Invalid Link</h2>
            <p className="text-muted-foreground">{error || "Please check your email for the correct link."}</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background p-6">
        <div className="max-w-2xl mx-auto pt-12">
          <BridgesHeader />
          <div className="bg-card rounded-lg shadow-lg p-8 text-center space-y-4">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-foreground">Already Completed</h2>
            <p className="text-muted-foreground">You've already rated all vendors. Thank you!</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "thankyou" && surveyResponse) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background p-6">
        <div className="max-w-2xl mx-auto pt-12">
          <BridgesHeader />
          <div className="bg-card rounded-lg shadow-lg p-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Thank You {surveyResponse.respondent_name.split(" ")[0]}!
              </h2>
              <p className="text-lg text-muted-foreground">
                Your {totalVendors} rating{totalVendors !== 1 ? "s have" : " has"} been saved and will help Boca Bridges neighbors find trusted service providers!
              </p>
            </div>

            <div className="bg-secondary/20 rounded-lg p-6 space-y-3">
              <div className="text-lg font-medium flex items-center gap-2">
                <span>📧</span>
                <span>Check your email for your $10 Starbucks card within 24 hours</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">What's Next:</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• The Bridges Directory launches next week</li>
                <li>• Your reviews will go live</li>
                <li>• We'll email you when it launches!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "rating" && surveyResponse && pendingVendors.length > 0) {
    const currentVendor = pendingVendors[currentVendorIndex];
    const streetName = "Lewis River Rd";

    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background p-6">
        <div className="max-w-2xl mx-auto pt-12">
          <ProgressBar
            current={currentVendorIndex + 1}
            total={totalVendors}
            className="mb-8"
          />

          <div className="bg-card rounded-lg shadow-lg p-6 md:p-8">
            <VendorRatingCard
              key={currentVendor.id}
              vendorName={currentVendor.vendor_name}
              category={currentVendor.category}
              currentIndex={currentVendorIndex + 1}
              totalVendors={totalVendors}
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
        <BridgesHeader />
        
        <div className="bg-card rounded-lg shadow-lg p-8 space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Thanks for Helping Build The Bridges Directory! 🏡
            </h2>
            <p className="text-lg text-muted-foreground">
              We'll send your $10 Starbucks card to this email
            </p>
          </div>

          {surveyResponse && (
            <>
              <div className="text-center text-xl font-medium text-foreground">
                Hi {surveyResponse.respondent_name}!
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">
                  Your Email (for gift card delivery)
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

              <div className="bg-secondary/20 rounded-lg p-4 text-center">
                <p className="text-lg text-foreground">
                  You mentioned <span className="font-bold">{totalVendors}</span> vendor{totalVendors !== 1 ? "s" : ""}. Let's rate them!
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
