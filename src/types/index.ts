import type { ReactNode } from 'react';

/**
 * Appearance mode.
 *
 * - `"system"` follows `prefers-color-scheme`
 * - `resolvedMode` (from hooks/provider) is always `"light"` or `"dark"`
 *
 * @public
 */
export type Mode = "light" | "dark" | "system";

/**
 * Screen coordinates used for the optional view-transition ripple when toggling modes.
 *
 * @public
 */
export interface Coordinates {
  x: number;
  y: number;
}


/**
 * Props for `ThemeToggle`.
 *
 * @public
 */
export interface ThemeToggleProps {
  /** Additional class name(s) applied to the button element */
  className?: string;
  /** Styling hook exposed via `data-size` */
  size?: "sm" | "md" | "lg";
  /** Styling hook exposed via `data-variant` */
  variant?: "default" | "outline" | "ghost";
  /** Optional custom icon/content (overrides the default icon) */
  children?: ReactNode;
}
