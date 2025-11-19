import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "destructive";
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend = "neutral",
  trendValue,
  variant = "default",
}: StatsCardProps) {
  const variantStyles = {
    default: "border-border",
    success: "border-success/50 bg-success/5",
    warning: "border-warning/50 bg-warning/5",
    destructive: "border-destructive/50 bg-destructive/5",
  };

  const trendStyles = {
    up: "text-success",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className={cn("transition-all hover:shadow-lg", variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {(description || trendValue) && (
          <div className="flex items-center gap-2 mt-1">
            {trendValue && <span className={cn("text-xs font-medium", trendStyles[trend])}>{trendValue}</span>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
