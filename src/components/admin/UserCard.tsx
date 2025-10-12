import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, UserCheck, UserX, Trash2, Mail, MapPin, Calendar, Award } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  address: string | null;
  formatted_address: string | null;
  is_verified: boolean | null;
  signup_source: string | null;
  created_at: string;
  points: number | null;
  is_orphaned?: boolean;
  hoa_name?: string | null;
}

interface UserCardProps {
  user: User;
  onView: () => void;
  onVerify?: () => void;
  onUnverify?: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

export function UserCard({
  user,
  onView,
  onVerify,
  onUnverify,
  onDelete,
  isLoading,
}: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = () => {
    if (user.is_orphaned) {
      return <Badge variant="destructive">Orphaned</Badge>;
    }
    if (user.is_verified) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Verified</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getSignupSourceDisplay = (source: string | null) => {
    if (!source) return "Regular";
    if (source.startsWith("community:")) {
      const community = source.replace("community:", "");
      return `Community: ${community}`;
    }
    return source;
  };

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with prominent points */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base truncate">
                  {user.name || "No Name"}
                </h3>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
            
            {/* Prominent Points Badge */}
            <div className="flex-shrink-0">
              <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-3 py-2 min-w-[60px]">
                <Award className="h-4 w-4 text-primary mb-1" />
                <span className="text-lg font-bold text-primary">{user.points || 0}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Points</span>
              </div>
            </div>
          </div>

          {/* Collapsible Details */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full">
              <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              <span>{isExpanded ? 'Hide' : 'Show'} Details</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-2">
              {user.address && (
                <div className="flex items-start gap-2 text-xs">
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{user.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Source: </span>
                <span className="font-medium">{getSignupSourceDisplay(user.signup_source)}</span>
              </div>
              {user.hoa_name && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Community: </span>
                  <span className="font-medium">{user.hoa_name}</span>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            
            {user.is_orphaned ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                disabled={isLoading}
                className="w-full text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Cleanup
              </Button>
            ) : (
              <>
                {user.is_verified ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onUnverify}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Unverify
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onVerify}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Verify
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  disabled={isLoading}
                  className="w-full col-span-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete User
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
