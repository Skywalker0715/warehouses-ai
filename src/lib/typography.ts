/**
 * A centralized object to manage typography styles using Tailwind CSS classes.
 * This ensures consistency for headings, body text, and labels across the application.
 *
 * @example
 * // Usage in a React component
 * <h1 className={typography.heading.h1}>Page Title</h1>
 */
export const typography = {
  heading: {
    h1: "text-4xl font-bold tracking-tight text-foreground",
    h2: "text-2xl font-bold tracking-tight text-foreground",
    h3: "text-xl font-semibold tracking-tight text-foreground",
  },
  body: {
    default: "text-base",
    sm: "text-sm",
    muted: "text-sm text-muted-foreground",
  },
  label: {
    default: "text-sm font-medium leading-none",
    sm: "text-xs font-medium leading-none",
  },
} as const;

/**
 * A union type representing all possible text style variants available
 * in the `typography` object. This is useful for creating component props
 * that accept a specific text style.
 *
 * @example
 * type TextProps = {
 *   variant: TextVariant;
 *   children: React.ReactNode;
 * }
 */
export type TextVariant =
  | "heading.h1" | "heading.h2" | "heading.h3"
  | "body.default" | "body.sm" | "body.muted"
  | "label.default" | "label.sm";