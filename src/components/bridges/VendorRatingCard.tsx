import { useState } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import ReviewPreview from "@/components/ReviewPreview";
import { useToast } from "@/hooks/use-toast";
import CostInputs, { CostEntry } from "@/components/vendors/CostInputs";

interface VendorRatingCardProps {
  vendorName: string;
  category: string;
  currentIndex: number;
  totalVendors: number;
  userName: string;
  streetName: string;
  onSubmit: (data: VendorRatingData) => void;
  onSkip: () => void;
  onBack: () => void;
}

export interface VendorRatingData {
  rating: number;
  comments: string;
  vendorContact: string;
  useForHome: boolean;
  showName: boolean;
  costEntries: CostEntry[];
}

export function VendorRatingCard({
  vendorName,
  category,
  currentIndex,
  totalVendors,
  userName,
  streetName,
  onSubmit,
  onSkip,
  onBack
}: VendorRatingCardProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [useForHome, setUseForHome] = useState(true);
  const [showName, setShowName] = useState(true);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const getRatingPrompt = (rating: number): string => {
    switch(rating) {
      case 5: return "Tell neighbors why they'll love this vendor!";
      case 4: return "What made this service good but not perfect?";
      case 3: return "Help others understand your mixed experience";
      case 2: return "What went wrong? Your neighbors need to know";
      case 1: return "Warn your neighbors - what happened?";
      default: return "Share your experience";
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVendorContact(formatPhoneNumber(e.target.value));
  };

  const handleSubmit = () => {
    // Check rating
    if (!rating || rating < 1 || rating > 5) {
      toast({
        title: "Rating required",
        description: "Please select a rating from 1 to 5 stars",
        variant: "destructive"
      });
      return;
    }
    
    // Check comments - friendly message
    if (!comments || comments.trim().length === 0) {
      toast({
        title: "Comments help neighbors",
        description: "Please leave some words - good or bad - as comments are what really helps neighbors!",
      });
      return;
    }
    
    onSubmit({
      rating,
      comments,
      vendorContact,
      useForHome,
      showName,
      costEntries
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center border-b border-border pb-4">
        <div className="text-sm text-muted-foreground font-medium mb-2">
          VENDOR {currentIndex} OF {totalVendors}
        </div>
        <div className="flex items-start gap-2 justify-center">
          <span className="text-2xl">✓</span>
          <div className="text-left">
            <div className="text-xl font-semibold text-foreground">{vendorName}</div>
            <div className="text-sm text-muted-foreground">Category: {category}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-medium flex items-center gap-2">
          <span>⭐</span> Your Rating
        </Label>
        <div className="flex justify-center py-2">
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>
      </div>

      {rating > 0 && (
        <div className="space-y-3">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-start gap-2">
              <span className="text-lg">💬</span>
              <span className="text-blue-600 font-medium">{getRatingPrompt(rating)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-base font-medium">
              Comments
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share details about your experience..."
              className="min-h-[120px]"
            />
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <Checkbox
          id="use-for-home"
          checked={useForHome}
          onCheckedChange={(checked) => setUseForHome(checked as boolean)}
          className="mt-0.5"
        />
        <Label htmlFor="use-for-home" className="text-base cursor-pointer select-none font-normal">
          I currently use this vendor for my home
        </Label>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="show-name"
          checked={showName}
          onCheckedChange={(checked) => setShowName(checked as boolean)}
          className="mt-0.5"
        />
        <Label htmlFor="show-name" className="text-base cursor-pointer select-none font-normal">
          Show my name in review
        </Label>
      </div>

      <ReviewPreview
        rating={rating}
        showName={showName}
        userName={userName}
        streetName={streetName}
      />

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-base font-medium flex items-center gap-2">
          <span>📞</span> Vendor's Phone Number
        </Label>
        <Input
          id="phone"
          value={vendorContact}
          onChange={handlePhoneChange}
          placeholder="555-123-4567"
        />
      </div>

      <Collapsible open={isPricingOpen} onOpenChange={setIsPricingOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 bg-muted/20 rounded-lg border hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>💰</span>
                <Label className="text-base font-medium cursor-pointer">Pricing Details (Optional)</Label>
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-muted-foreground transition-transform ${isPricingOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="p-4 bg-muted/20 rounded-lg border space-y-3">
            <CostInputs
              category={category}
              value={costEntries}
              onChange={setCostEntries}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex flex-col gap-3 pt-4">
        <div className="flex gap-3">
          {currentIndex > 1 && (
            <Button
              variant="outline"
              size="lg"
              onClick={onBack}
              className="h-14 text-lg"
            >
              ← Back
            </Button>
          )}
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={rating === 0}
            className="flex-1 h-14 text-lg"
          >
            Save & Continue →
          </Button>
        </div>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
        >
          Skip this vendor
        </button>
      </div>
    </div>
  );
}
