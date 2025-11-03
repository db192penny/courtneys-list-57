import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/data/categories";
import { getCategoryEmoji } from "@/utils/categoryEmojis";

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
  return (
    <div className="bg-background/95 backdrop-blur-md border-b border-border shadow-sm py-2 px-4">
      <div className="flex items-center gap-2">
        {/* Community Logo & Name */}
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
          <img
            src={photoUrl}
            alt={communityName}
            className="w-8 h-8 rounded-full object-cover border border-border"
          />
          <span className="text-sm font-semibold text-foreground truncate max-w-[100px]">
            {communityName}
          </span>
        </div>

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
