import { clsx, type ClassValue } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

// Local utility to merge class names safely
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PageContainerProps {
  /**
   * The content to be rendered inside the container.
   */
  children: React.ReactNode;
  /**
   * Optional additional class names to override or extend styles.
   */
  className?: string;
}

/**
 * A responsive wrapper component that centers content and applies consistent padding.
 * Handles responsive spacing (smaller on mobile, larger on desktop).
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("container mx-auto min-h-full p-4 md:p-6 lg:p-8", className)}>
      {children}
    </div>
  );
}
