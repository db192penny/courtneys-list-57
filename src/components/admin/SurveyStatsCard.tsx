import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSurveyStats } from "@/hooks/useSurveyAdmin";
import { Loader2 } from "lucide-react";

export function SurveyStatsCard() {
  const { data: stats, isLoading } = useSurveyStats();

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const completionRate = stats.totalVendors > 0 
    ? Math.round((stats.vendorsRated / stats.totalVendors) * 100) 
    : 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📊</span> Overview
        </CardTitle>
        <CardDescription>Survey progress and statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Total People</div>
            <div className="text-3xl font-bold">{stats.totalPeople}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground mb-1">Completed</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.completedPeople}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({stats.totalPeople > 0 ? Math.round((stats.completedPeople / stats.totalPeople) * 100) : 0}%)
              </span>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground mb-1">In Progress</div>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.inProgressPeople}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({stats.totalPeople > 0 ? Math.round((stats.inProgressPeople / stats.totalPeople) * 100) : 0}%)
              </span>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground mb-1">Not Started</div>
            <div className="text-3xl font-bold text-red-600">
              {stats.notStartedPeople}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({stats.totalPeople > 0 ? Math.round((stats.notStartedPeople / stats.totalPeople) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Total Vendors</div>
            <div className="text-2xl font-bold">{stats.totalVendors}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground mb-1">Ratings Collected</div>
            <div className="text-2xl font-bold text-primary">
              {stats.vendorsRated}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({completionRate}%)
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{completionRate}% complete</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
