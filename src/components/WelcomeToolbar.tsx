import { useState, useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PartyPopper, X } from "lucide-react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

interface WelcomeToolbarProps {
  communitySlug: string;
}

export function WelcomeToolbar({ communitySlug }: WelcomeToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const hasWelcomeParam = searchParams.get("welcome") === "true";
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  const hasShownRef = useRef(false);

  const cleanupURL = () => {
    if (searchParams.has("welcome")) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("welcome");
      setSearchParams(newSearchParams, { replace: true });
    }
  };

  const handleDismiss = (isManual = true) => {
    // Clear any pending timeouts
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
    }
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }

    // Start fade out animation
    setIsExiting(true);
    
    // Clean URL immediately if manual dismiss, or after fade if auto
    if (isManual) {
      cleanupURL();
    } else {
      cleanupTimeoutRef.current = setTimeout(cleanupURL, 400);
    }
    
    // Hide after fade animation
    setTimeout(() => setIsVisible(false), 400);
  };

  useEffect(() => {
    // Show welcome toast when:
    // 1. User is authenticated AND
    // 2. URL has welcome=true parameter AND
    // 3. We haven't already shown it this session
    if (isAuthenticated && hasWelcomeParam && !hasShownRef.current) {
      hasShownRef.current = true;
      setIsVisible(true);
      
      // Scroll to top on mobile to ensure welcome message is visible
      if (isMobile) {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 500);
      }
      
      // Auto-hide after 6 seconds
      autoHideTimeoutRef.current = setTimeout(() => {
        handleDismiss(false);
      }, 6000);
    }

    // ESC key handler
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isVisible && !isExiting) {
        handleDismiss(true);
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
  }, [isAuthenticated, hasWelcomeParam, isVisible, isExiting, isMobile]);

  if (!isVisible) return null;

  return (
    <div 
      className={`mb-6 z-50 relative transition-all duration-400 ease-out ${
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
            <strong>Welcome aboard!</strong> Start rating providers to help neighbors and earn points! Climb the leaderboard and unlock new badges!
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDismiss(true)}
          className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-green-100 text-green-700 focus:ring-2 focus:ring-green-400"
          aria-label="Dismiss welcome message"
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  );
}