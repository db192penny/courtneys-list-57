import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { communityNames, publicCommunities } from "@/utils/communityNames";
import { useIsMobile } from "@/hooks/use-mobile";

interface CommunityDropdownProps {
  fullWidth?: boolean;
  onClose?: () => void;
  photoUrl?: string;
  bannerStyle?: boolean;
}

export function CommunityDropdown({ fullWidth, onClose, photoUrl, bannerStyle }: CommunityDropdownProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const communities = Object.entries(publicCommunities);
  
  // Extract slug from URL or default to boca-bridges
  const communityMatch = location.pathname.match(/\/communities\/([^\/]+)/);
  const currentSlug = communityMatch ? communityMatch[1] : 'boca-bridges';
  
  // Get display name from slug
  const currentDisplayName = communityNames[currentSlug] || "Boca Bridges";

  const handleCommunityChange = (slug: string) => {
    // Get current category from URL if it exists
    const currentParams = new URLSearchParams(window.location.search);
    const currentCategory = currentParams.get('category');
    
    // Build new URL with preserved category
    let targetPath = `/communities/${slug}`;
    if (currentCategory && currentCategory !== 'all') {
      targetPath += `?category=${encodeURIComponent(currentCategory)}`;
    }
    
    // Store slug in localStorage
    localStorage.setItem('selected_community', communityNames[slug]);
    
    // Navigate to community page with preserved category
    navigate(targetPath);
    
    // Close mobile menu if callback provided
    onClose?.();
  };

  // Banner style for mobile
  if (bannerStyle && isMobile && photoUrl) {
    return (
      <Select
        value={currentSlug}
        onValueChange={handleCommunityChange}
      >
        <SelectTrigger className="w-full h-auto border-2 border-border bg-background/80 backdrop-blur-sm p-4 rounded-xl hover:bg-background hover:border-primary/30 transition-all focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 shadow-sm [&>svg]:hidden">
          <div className="flex items-center gap-3 w-full">
            {/* Community Photo */}
            <div className="flex-shrink-0">
              <img
                src={photoUrl}
                alt={`${currentDisplayName} logo`}
                className="w-10 h-10 rounded-full object-cover border border-primary/20 shadow-sm"
              />
            </div>
            
            {/* Community Name Section */}
            <div className="flex-1 text-left">
              <div className="text-xs font-bold text-primary uppercase tracking-wide">CHOOSE COMMUNITY</div>
              <div className="text-base font-bold text-foreground">{currentDisplayName}</div>
            </div>
            
            {/* Chevron Icon */}
            <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-background z-50 border-accent/20">
          {communities.map(([slug, name]) => (
            <SelectItem 
              key={slug} 
              value={slug}
              className="font-medium"
            >
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Standard dropdown style
  return (
    <Select
      value={currentSlug}
      onValueChange={handleCommunityChange}
    >
      <SelectTrigger className={fullWidth 
        ? "w-full h-12 bg-gradient-to-r from-background to-accent/5 border-accent/20 shadow-sm hover:shadow-md hover:border-accent/30 transition-all font-semibold" 
        : "w-[200px] h-12 bg-gradient-to-r from-background to-accent/5 border-accent/20 shadow-sm hover:shadow-md hover:border-accent/30 transition-all font-semibold"
      }>
        <SelectValue placeholder={currentDisplayName}>
          {currentDisplayName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-background z-50 border-accent/20">
        {communities.map(([slug, name]) => (
          <SelectItem 
            key={slug} 
            value={slug}
            className="font-medium"
          >
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
