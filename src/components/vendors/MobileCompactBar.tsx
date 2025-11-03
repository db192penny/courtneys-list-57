import { MapPin, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/data/categories";
import { getCategoryEmoji } from "@/utils/categoryEmojis";
import { useNavigate, useLocation } from "react-router-dom";
import { publicCommunities, communityNames } from "@/utils/communityNames";

interface MobileCompactBarProps {
  communityName: string;
  photoUrl: string;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortKey: string;
  onSortChange: (sort: string) => void;
  sortOptions: Array<{ key: string; label: string }>;
}

export function MobileCompactBar({
  communityName,
  photoUrl,
  selectedCategory,
  onCategoryChange,
  sortKey,
  onSortChange,
  sortOptions,
}: MobileCompactBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleCommunityChange = (slug: string) => {
    const searchParams = new URLSearchParams(location.search);
    const category = searchParams.get('category');
    const categoryParam = category ? `?category=${encodeURIComponent(category)}` : '';
    navigate(`/communities/${slug}${categoryParam}`);
    localStorage.setItem('selected_community', communityNames[slug] || slug);
  };

  return (
    <div className="bg-background/95 backdrop-blur-md border-b border-border shadow-sm py-2 px-4">
      <div className="flex items-center gap-2">
        {/* Community Logo & Name - Tappable */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex items-center gap-2 flex-shrink-0 min-w-0 hover:opacity-80 transition-opacity">
              <img
                src={photoUrl}
                alt={communityName}
                className="w-8 h-8 rounded-full object-cover border border-border"
              />
              <span className="text-sm font-semibold text-foreground truncate max-w-[100px]">
                {communityName}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh]">
            <SheetHeader>
              <SheetTitle>Switch Community</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-2">
              {Object.keys(publicCommunities).map((slug) => (
                <Button
                  key={slug}
                  variant={slug === location.pathname.split('/').pop()?.split('?')[0] ? "default" : "outline"}
                  className="w-full justify-start text-left"
                  onClick={() => handleCommunityChange(slug)}
                >
                  {communityNames[slug] || slug}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* Category Selector - Compact */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
            <SelectValue>
              <span className="truncate">
                {selectedCategory === "all" ? "All" : `${getCategoryEmoji(selectedCategory)} ${selectedCategory}`}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {getCategoryEmoji(cat)} {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Selector - Compact */}
        <Select value={sortKey} onValueChange={onSortChange}>
          <SelectTrigger className="h-8 text-xs w-[100px] flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((sort) => (
              <SelectItem key={sort.key} value={sort.key}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
