import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSurveyRatings } from "@/hooks/useSurveyAdmin";
import { Copy, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  respondentName: string;
  sessionToken: string;
  totalVendors: number;
  completedVendors: number;
}

export function ReviewsModal({
  open,
  onOpenChange,
  respondentName,
  sessionToken,
  totalVendors,
  completedVendors,
}: ReviewsModalProps) {
  const { toast } = useToast();
  const { data: ratings, isLoading } = useSurveyRatings(sessionToken);

  const handleCopyLink = () => {
    const link = `https://courtneys-list.com/bridges/rate-vendors?token=${sessionToken}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied!", description: link });
  };

  const handleExportCSV = () => {
    if (!ratings || ratings.length === 0) return;

    const csvHeaders = "vendor_name,category,rating,comments,cost,phone,display_name,current_vendor,submitted_at\n";
    const csvRows = ratings.map(r => {
      const cost = r.costAmount 
        ? `$${r.costAmount}${r.costPeriod ? `/${r.costPeriod}` : ''}`
        : 'Not provided';
      return [
        `"${r.vendorName}"`,
        `"${r.category}"`,
        r.rating,
        `"${r.comments.replace(/"/g, '""')}"`,
        `"${cost}"`,
        r.vendorContact || 'Not provided',
        r.showNameInReview ? 'Yes' : 'No',
        r.useForHome ? 'Yes' : 'No',
        format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      ].join(',');
    }).join('\n');

    const csv = csvHeaders + csvRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${respondentName.replace(/\s+/g, '_')}_reviews.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "CSV exported", description: "Reviews downloaded successfully" });
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            📝 {respondentName}'s Reviews
          </DialogTitle>
          {ratings?.[0]?.respondentEmail && (
            <p className="text-sm text-muted-foreground mt-1">
              📧 {ratings[0].respondentEmail}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pt-2">
            <Badge variant={completedVendors === totalVendors ? "default" : "secondary"} className="w-fit">
              {completedVendors === totalVendors ? "✅" : "⏳"} {completedVendors} of {totalVendors} vendors rated
            </Badge>
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !ratings || ratings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No reviews submitted yet
            </div>
          ) : (
            ratings.map((rating) => (
              <Card key={rating.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{rating.vendorName}</h3>
                      <p className="text-sm text-muted-foreground">Category: {rating.category}</p>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Rating</div>
                      <div className="text-xl">
                        {renderStars(rating.rating)} ({rating.rating}/5)
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Review</div>
                      <p className="text-sm bg-muted/50 p-3 rounded-md">{rating.comments}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">💰 Cost: </span>
                        {rating.costAmount ? (
                          <>
                            ${rating.costAmount}
                            {rating.costPeriod && `/${rating.costPeriod}`}
                            {rating.costKind && ` (${rating.costKind})`}
                            {rating.costNotes && (
                              <div className="text-xs text-muted-foreground mt-1">{rating.costNotes}</div>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Not provided</span>
                        )}
                      </div>

                      <div>
                        <span className="text-muted-foreground">📞 Phone: </span>
                        {rating.vendorContact || (
                          <span className="text-muted-foreground">Not provided</span>
                        )}
                      </div>

                      <div>
                        <span className="text-muted-foreground">👤 Display: </span>
                        {rating.showNameInReview ? "Show name in review ✓" : "Anonymous"}
                      </div>

                      <div>
                        <span className="text-muted-foreground">🏠 Current vendor: </span>
                        {rating.useForHome ? "Yes ✓" : "No"}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      📅 Submitted: {format(new Date(rating.createdAt), 'MMM dd, yyyy \'at\' h:mm a')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleExportCSV} disabled={!ratings || ratings.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export as CSV
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
