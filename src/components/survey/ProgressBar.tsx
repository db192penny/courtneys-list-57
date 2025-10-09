import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className={className}>
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Step {current} of {total}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
