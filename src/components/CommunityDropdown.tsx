import { useNavigate, useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { communityNames } from "@/utils/communityNames";
import { Building2 } from "lucide-react";

interface CommunityDropdownProps {
  fullWidth?: boolean;
}

export function CommunityDropdown({ fullWidth }: CommunityDropdownProps) {
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
  };

  return (
    <Select
      value={currentSlug}
      onValueChange={handleCommunityChange}
    >
      <SelectTrigger className={fullWidth ? "w-full h-9 bg-background" : "w-[200px] h-9 bg-background"}>
        <Building2 className="mr-2 h-4 w-4" />
        <SelectValue placeholder={currentDisplayName}>
          {currentDisplayName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-background z-50">
        {communities.map(([slug, name]) => (
          <SelectItem key={slug} value={slug}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
