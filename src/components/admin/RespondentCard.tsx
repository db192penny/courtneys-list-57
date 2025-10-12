import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Copy, RotateCcw, Trash2, Mail, Phone } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RespondentCardProps {
  respondent: {
    id: string;
    name: string;
    contact: string;
    contactMethod: string;
    sessionToken: string;
    totalVendors: number;
    completedVendors: number;
    status: string;
    createdAt: string;
  };
  onViewReviews: () => void;
  onCopyLink: () => void;
  onReset: () => void;
  onDelete: () => void;
}

export function RespondentCard({
  respondent,
  onViewReviews,
  onCopyLink,
  onReset,
  onDelete,
}: RespondentCardProps) {
  const getStatusBadge = (status: string, completed: number, total: number) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">✅ Complete</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">⏳ {completed} of {total}</Badge>;
      case "not_started":
        return <Badge variant="destructive">❌ Not Started</Badge>;
      default:
        return null;
    }
  };

  const progressPercentage = respondent.totalVendors > 0 
    ? (respondent.completedVendors / respondent.totalVendors) * 100 
    : 0;

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{respondent.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                {respondent.contactMethod === "Email" ? (
                  <Mail className="h-3 w-3" />
                ) : (
                  <Phone className="h-3 w-3" />
                )}
                <span className="truncate">{respondent.contact}</span>
              </div>
            </div>
            {getStatusBadge(respondent.status, respondent.completedVendors, respondent.totalVendors)}
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{respondent.completedVendors} / {respondent.totalVendors} vendors</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewReviews}
              disabled={respondent.completedVendors === 0}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCopyLink}
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-1" />
              Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={respondent.completedVendors === 0}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="w-full text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
