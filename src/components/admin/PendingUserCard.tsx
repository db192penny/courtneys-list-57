import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Calendar, CheckCircle, XCircle } from "lucide-react";

interface PendingUser {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string | null;
  address: string | null;
  formatted_address: string | null;
}

interface PendingUserCardProps {
  user: PendingUser;
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
  loadingAction?: "approve" | "reject";
}

export function PendingUserCard({
  user,
  onApprove,
  onReject,
  isLoading,
  loadingAction,
}: PendingUserCardProps) {
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* User Info */}
          <div>
            <h3 className="font-semibold text-base mb-1">
              {user.name || "No Name"}
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {(user.formatted_address || user.address) && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">{user.formatted_address || user.address}</span>
                </div>
              )}
              {user.created_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              disabled={isLoading}
              className="w-full"
            >
              <XCircle className="h-4 w-4 mr-1" />
              {loadingAction === "reject" ? "Rejecting..." : "Reject"}
            </Button>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isLoading}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              {loadingAction === "approve" ? "Approving..." : "Approve"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
