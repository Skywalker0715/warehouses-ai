import { typography } from "@/lib/typography";
import React from "react";

/**
 * Props for the PageHeader component.
 */
interface PageHeaderProps {
  /**
   * The main title of the page, displayed prominently.
   */
  title: string;
  /**
   * An optional subtitle or description displayed below the title in a muted color.
   */
  description?: string;
  /**
   * An optional React node, typically a button or group of buttons,
   * displayed on the right side on desktop and below on mobile.
   */
  action?: React.ReactNode;
}

/**
 * A responsive header component for dashboard pages. It displays a title,
 * an optional description, and an optional action control (like a button).
 * It stacks vertically on mobile and aligns horizontally on larger screens.
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col items-start justify-between gap-4 border-b pb-6 md:flex-row md:items-center">
      <div className="grid gap-1">
        <h1 className={typography.heading.h2}>{title}</h1>
        {description && <p className={typography.body.muted}>{description}</p>}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}