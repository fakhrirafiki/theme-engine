"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";
import { useTheme } from "../providers/UnifiedThemeProvider";
import type { ThemeToggleProps } from "../types";

// SVG Icons
const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="theme-toggle-icon"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="m12 2 0 2" />
    <path d="m12 20 0 2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="m2 12 2 0" />
    <path d="m20 12 2 0" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="theme-toggle-icon"
  >
    <path d="m12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(
  ({ className, size = "md", variant = "default", children, ...props }, ref) => {
    const { mode, resolvedMode, toggleMode } = useTheme();
    const nextResolvedMode = resolvedMode === "light" ? "dark" : "light";

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Get click coordinates for ripple effect (exact same as TweakCN)
      const { clientX: x, clientY: y } = event;
      toggleMode({ x, y });
    };

    const sizeClasses = {
      sm: "h-8 w-8 p-1.5",
      md: "h-9 w-9 p-2",
      lg: "h-10 w-10 p-2.5",
    };

    const variantClasses = {
      default: "bg-background border border-input hover:bg-accent hover:text-accent-foreground",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    };

    const baseClasses = clsx(
      // Base button styles
      "theme-toggle",
      "inline-flex items-center justify-center",
      "rounded-md text-sm font-medium",
      "ring-offset-background transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // Size and variant
      sizeClasses[size],
      variantClasses[variant],
      className
    );

    // Render appropriate icon
    const renderIcon = () => {
      if (children) return children;

      // Show the target icon (action): in dark mode show Sun (switch to light), and vice versa.
      return nextResolvedMode === "dark" ? <MoonIcon /> : <SunIcon />;
    };

    return (
      <button
        ref={ref}
        className={baseClasses}
        onClick={handleClick}
        data-mode={mode}
        data-theme={resolvedMode}
        aria-label={`Switch to ${nextResolvedMode} mode`}
        title={`Switch to ${nextResolvedMode} mode`}
        {...props}
      >
        {renderIcon()}
      </button>
    );
  }
);

ThemeToggle.displayName = "ThemeToggle";
