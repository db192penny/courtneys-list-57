import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, RotateCcw, Calendar, User, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CostEntry {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_category: string;
  amount: number;
  unit: string;
  period: string;
  cost_kind: string;
  notes?: string;
  created_at: string;
  created_by: string;
  author_name?: string;
  author_street?: string;
  admin_modified: boolean;
  admin_modified_by?: string;
  admin_modified_at?: string;
  deleted_at?: string;
}

interface AdminCostCardProps {
  cost: CostEntry;
  onEdit: (cost: CostEntry) => void;
  onDelete: (costId: string) => void;
  onRestore: (costId: string) => void;
  showDeleted: boolean;
}

export function AdminCostCard({ cost, onEdit, onDelete, onRestore, showDeleted }: AdminCostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatAmount = (amount: number, unit: string, period?: string) => {
    const formattedAmount = `$${amount.toLocaleString()}`;
    let unitDisplay = unit;
    
    if (period && period !== 'one_time') {
      unitDisplay = `${unit} (${period})`;
    }
    
    return `${formattedAmount}/${unitDisplay}`;
  };

  const getAuthorLabel = (cost: CostEntry) => {
    if (!cost.author_name) return "Unknown";
    
    const firstName = cost.author_name.split(" ")[0];
    const lastName = cost.author_name.split(" ").slice(-1)[0];
    const lastInitial = lastName ? lastName.charAt(0) + "." : "";
    
    let label = firstName;
    if (lastInitial && lastInitial !== firstName.charAt(0) + ".") {
      label += ` ${lastInitial}`;
    }
    
    if (cost.author_street) {
      label += ` on ${cost.author_street}`;
    }
    
    return label;
  };

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header - Always Visible */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{cost.vendor_name}</h3>
              <Badge variant="secondary" className="mt-1 text-xs">{cost.vendor_category}</Badge>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-base">{formatAmount(cost.amount, cost.unit, cost.period)}</div>
              <Badge variant="outline" className="mt-1 text-xs">{cost.cost_kind?.replace('_', ' ')}</Badge>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 flex-wrap">
            {cost.admin_modified && (
              <Badge variant="outline" className="text-xs">Admin Modified</Badge>
            )}
            {cost.deleted_at && (
              <Badge variant="destructive" className="text-xs">Deleted</Badge>
            )}
            {!cost.admin_modified && !cost.deleted_at && (
              <Badge variant="default" className="text-xs">Original</Badge>
            )}
          </div>

          {/* Collapsible Details */}
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="text-sm text-muted-foreground">
                  {isExpanded ? "Hide Details" : "Show Details"}
                </span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Author:</span>
                <span>{getAuthorLabel(cost)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Submitted:</span>
                <span>{format(new Date(cost.created_at), "MMM d, yyyy")}</span>
              </div>
              {cost.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="mt-1 text-sm">{cost.notes}</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            {!showDeleted ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(cost)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(cost.id)}
                  className="flex-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRestore(cost.id)}
                className="w-full text-green-600 hover:text-green-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
