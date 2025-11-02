import { useNavigate, useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { communityNames } from "@/utils/communityNames";

interface CommunityDropdownProps {
  fullWidth?: boolean;
  onClose?: () => void;
}

export function CommunityDropdown({ fullWidth, onClose }: CommunityDropdownProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const communities = Object.entries(communityNames);
  
  // Extract slug from URL or default to boca-bridges
  const communityMatch = location.pathname.match(/\/communities\/([^\/]+)/);
  const currentSlug = communityMatch ? communityMatch[1] : 'boca-bridges';
  
  // Get display name from slug
  const currentDisplayName = communityNames[currentSlug] || "Boca Bridges";

  const handleCommunityChange = (slug: string) => {
    // Store slug in localStorage
    localStorage.setItem('selected_community', communityNames[slug]);
    
    // Navigate to community page
    navigate(`/communities/${slug}`);
    
    // Close mobile menu if callback provided
    onClose?.();
  };

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
