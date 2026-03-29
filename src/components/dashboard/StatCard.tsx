import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";
import React from "react";

/**
 * Props for the StatCard component.
 */
interface StatCardProps {
  /**
   * The title of the statistic, displayed at the top of the card.
   */
  title: string;
  /**
   * The main value of the statistic, displayed prominently.
   */
  value: string | number;
  /**
   * An optional description or context for the value, displayed in a muted color.
   */
  description?: string;
  /**
   * An optional icon to be displayed in the header.
   */
  icon?: React.ReactNode;
  /**
   * An optional trend indicator, showing percentage change.
   * The badge color changes based on whether the trend is positive or negative.
   */
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

/**
 * A card component for displaying a key statistic with an optional icon,
 * description, and trend indicator. It uses Shadcn Card components and
 * applies a subtle hover effect.
 */
export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
}: StatCardProps) {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={typography.heading.h2}>{value}</div>
        <div className="flex items-center gap-2 pt-1">
          {description && <p className={typography.body.muted}>{description}</p>}
          {trend && (
            <div
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                trend.isPositive
                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}