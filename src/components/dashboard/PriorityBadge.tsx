import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import React from "react";

type PriorityLevel = "critical" | "high" | "medium" | "low";

interface PriorityBadgeProps {
  /**
   * The urgency level of the insight.
   */
  priority: PriorityLevel;
  /**
   * Optional additional classes for styling.
   */
  className?: string;
}

const priorityConfig: Record<PriorityLevel, { label: string; style: string }> = {
  critical: {
    label: "Kritis",
    style: "bg-priority-critical text-priority-critical-foreground hover:bg-priority-critical hover:opacity-90 border-transparent",
  },
  high: {
    label: "Tinggi",
    style: "bg-priority-high text-priority-high-foreground hover:bg-priority-high hover:opacity-90 border-transparent",
  },
  medium: {
    label: "Sedang",
    style: "bg-priority-medium text-priority-medium-foreground hover:bg-priority-medium hover:opacity-90 border-transparent",
  },
  low: {
    label: "Rendah",
    style: "bg-priority-low text-priority-low-foreground hover:bg-priority-low hover:opacity-90 border-transparent",
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge className={cn("gap-1.5 shadow-none", config.style, className)}>
      {priority === "critical" && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
      )}
      {config.label}
    </Badge>
  );
}