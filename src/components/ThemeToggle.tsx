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

const SystemIcon = () => (
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
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);

export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(
  ({ className, size = "md", variant = "default", children, ...props }, ref) => {
    const { mode, resolvedMode, toggleMode } = useTheme();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Get click coordinates for ripple effect (exact same as TweakCN)
      const { clientX: x, clientY: y } = event;
      toggleMode({ x, y });
    };

    const baseClasses = clsx(
      // Base button styles
      "theme-toggle",
      className
    );

    // Render appropriate icon
    const renderIcon = () => {
      if (children) return children;

      switch (mode) {
        case "light":
          return <SunIcon />;
        case "dark":
          return <MoonIcon />;
        case "system":
          return <SystemIcon />;
        default:
          return resolvedMode === "dark" ? <MoonIcon /> : <SunIcon />;
      }
    };

    return (
      <button
        ref={ref}
        className={baseClasses}
        onClick={handleClick}
        data-size={size}
        data-variant={variant}
        data-mode={resolvedMode}
        data-theme={resolvedMode}
        aria-label={`Switch to ${resolvedMode === "light" ? "dark" : "light"} mode`}
        title={`Switch to ${resolvedMode === "light" ? "dark" : "light"} mode`}
        {...props}
      >
        {renderIcon()}
      </button>
    );
  }
);

ThemeToggle.displayName = "ThemeToggle";
