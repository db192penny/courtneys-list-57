import { useNavigate } from "react-router-dom";
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
  currentCommunity?: string;
  fullWidth?: boolean;
}

export function CommunityDropdown({ currentCommunity, fullWidth }: CommunityDropdownProps) {
  const navigate = useNavigate();

  const communities = Object.entries(communityNames);
  
  // Determine current value (display name, not slug)
  const currentValue = currentCommunity || "Boca Bridges";

  const handleCommunityChange = (communityName: string) => {
    // Store in localStorage
    localStorage.setItem('selected_community', communityName);
    
    // Navigate to community page
    const slug = communityName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/communities/${slug}`);
  };

  return (
    <Select
      value={currentValue}
      onValueChange={handleCommunityChange}
    >
      <SelectTrigger className={fullWidth ? "w-full h-9 bg-background" : "w-[200px] h-9 bg-background"}>
        <Building2 className="mr-2 h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {communities.map(([slug, name]) => (
          <SelectItem key={slug} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
