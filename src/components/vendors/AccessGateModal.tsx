import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

type AccessGateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: "reviews" | "costs" | "rate" | "add_vendor";
  communityName: string;
  vendorName?: string;
  category?: string;
};

const getContent = (type: "reviews" | "costs" | "rate" | "add_vendor", communityName: string) => {
  switch (type) {
    case "reviews":
      return {
        title: communityName,
        subtitle: "Full Reviews",
        message: `Join ${communityName} to see full neighbor reviews`,
      };
    case "costs":
      return {
        title: communityName,
        subtitle: "Cost Details",
        message: "Find out who got the deal and who got... the other thing",
      };
    case "rate":
      return {
        title: communityName,
        subtitle: "Rate This Vendor",
        message: `Rating fun will be a click away once you join ${communityName}`,
      };
    case "add_vendor":
      return {
        title: "Ready to help your neighbors?",
        subtitle: "Add a Provider",
        message: `Share a great vendor with your ${communityName} neighbors. Sign up to add your recommendation.`,
      };
  }
};

export function AccessGateModal({ open, onOpenChange, contentType, communityName, category }: AccessGateModalProps) {
  const navigate = useNavigate();
  const content = getContent(contentType, communityName);
  const [modalOpenTime, setModalOpenTime] = useState<number>(0);

  // Track when modal is shown
  useEffect(() => {
    if (open && typeof window !== 'undefined' && window.mixpanel) {
      const openTime = Date.now();
      setModalOpenTime(openTime);
      
      try {
        window.mixpanel.track('Auth Modal Shown', {
          trigger: contentType,
          community: communityName,
        });
        console.log('📊 Tracked auth modal shown:', contentType);
      } catch (error) {
        console.error('Mixpanel tracking error:', error);
      }
    }
  }, [open, contentType, communityName]);

  const handleSignIn = () => {
    // Store current path before navigating
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem("auth_return_path", currentPath);
    console.log("[AccessGateModal] Stored path before signin:", currentPath);

    onOpenChange(false);

    // FIXED: Pass community parameter to signin
    const communitySlug = communityName.toLowerCase().replace(/\s+/g, "-");
    
    // Handle add_vendor flow with category
    if (contentType === 'add_vendor' && category) {
      navigate(`/signin?community=${communitySlug}&returnPath=/submit&category=${category}`);
    } else {
      navigate(`/signin?community=${communitySlug}`);
    }
  };

  const handleRequestAccess = () => {
    // Store current path before navigating
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem("auth_return_path", currentPath);
    console.log("[AccessGateModal] Stored path before signup:", currentPath);

    onOpenChange(false);
    const communitySlug = communityName.toLowerCase().replace(/\s+/g, "-");
    
    // Handle add_vendor flow with category
    if (contentType === 'add_vendor' && category) {
      navigate(`/auth?community=${communitySlug}&returnPath=/submit&category=${category}`);
    } else {
      navigate(`/auth?community=${communitySlug}`);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && typeof window !== 'undefined' && window.mixpanel && modalOpenTime > 0) {
      try {
        const timeOnModal = Math.round((Date.now() - modalOpenTime) / 1000);
        window.mixpanel.track('Auth Modal Dismissed', {
          trigger: contentType,
          community: communityName,
          time_on_modal_seconds: timeOnModal,
        });
        console.log('📊 Tracked auth modal dismissed');
      } catch (error) {
        console.error('Mixpanel tracking error:', error);
      }
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center">{content.title}</DialogTitle>
          <p className="text-sm text-muted-foreground text-center pt-1">{content.subtitle}</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-base text-foreground leading-relaxed">{content.message}</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSignIn} className="flex-1">
              Log In
            </Button>
            <Button variant="cta" onClick={handleRequestAccess} className="flex-1">
              Sign Up
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
