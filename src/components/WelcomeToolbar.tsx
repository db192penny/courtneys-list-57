import { useState, useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper, X } from "lucide-react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface WelcomeToolbarProps {
  communitySlug: string;
}

export function WelcomeToolbar({ communitySlug }: WelcomeToolbarProps) {
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const welcome = searchParams.get("welcome");
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  // Convert slug to display name
  const communityDisplayName = communitySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const cleanupURL = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("welcome");
    navigate({ 
      pathname: location.pathname,
      search: newSearchParams.toString() 
    }, { replace: true });
  };

  const handleModalChange = (open: boolean) => {
    setShowModal(open);
    
    // When modal closes (by any method), show the banner
    if (!open) {
      setShowBanner(true);
      cleanupURL();
      
      // Auto-hide banner after 15 seconds
      autoHideTimeoutRef.current = setTimeout(() => {
        handleBannerDismiss(false);
      }, 15000);
    }
  };

  const handleBannerDismiss = (isManual = true) => {
    const storageKey = `welcome_dismissed_${communitySlug}`;
    localStorage.setItem(storageKey, "1");
    
    // Clear any pending timeouts
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
    }
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }

    // Start fade out animation
    setIsExiting(true);
    
    // Clean URL if not already cleaned
    if (welcome === "true") {
      if (isManual) {
        cleanupURL();
      } else {
        cleanupTimeoutRef.current = setTimeout(cleanupURL, 400);
      }
    }
    
    // Hide after fade animation
    setTimeout(() => setShowBanner(false), 400);
  };

  useEffect(() => {
    // Check if welcome parameter is present and user hasn't dismissed it before
    const storageKey = `welcome_dismissed_${communitySlug}`;
    const dismissed = localStorage.getItem(storageKey);
    
    if (welcome === "true" && dismissed !== "1") {
      // Show the celebration modal
      setShowModal(true);
      
      // Scroll to top on mobile to ensure content is visible
      if (isMobile) {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }

    // ESC key handler for banner
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showBanner && !isExiting) {
        handleBannerDismiss(true);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    
    return () => {
      document.removeEventListener("keydown", handleEscKey);
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, [welcome, communitySlug, showBanner, isExiting, isMobile]);

  return (
    <>
      {/* Celebration Modal - Shows First */}
      <AlertDialog open={showModal} onOpenChange={handleModalChange}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <PartyPopper className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-green-700 dark:text-green-400">
              Welcome to {communityDisplayName}! 🎉
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base space-y-2">
              <p className="font-semibold">You've successfully joined your community!</p>
              <p className="text-muted-foreground">
                Explore trusted service providers recommended by your neighbors. Rate vendors you've used to help others and earn points toward rewards!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction 
            onClick={() => handleModalChange(false)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Start Exploring
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Banner - Shows After Modal Dismissed */}
      {showBanner && (
        <div 
          className={`mb-6 transition-all duration-400 ease-out ${
            isExiting 
              ? "opacity-0 transform translate-y-[-10px]" 
              : "opacity-100 transform translate-y-0 animate-fade-in"
          }`}
          role="status"
          aria-live="polite"
        >
          <Alert className="border-green-500 bg-green-50 relative shadow-md">
            <PartyPopper className="h-5 w-5 text-green-600" />
            <div className="pr-8">
              <AlertDescription className="text-sm leading-relaxed text-green-900">
                <strong>Welcome aboard!</strong> Start rating providers to help neighbors and earn points! Just 3 ratings gets you a $10 Starbucks gift card - coffee on us! ☕
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBannerDismiss(true)}
              className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-green-100 text-green-700 focus:ring-2 focus:ring-green-400"
              aria-label="Dismiss welcome message"
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        </div>
      )}
    </>
  );
}
