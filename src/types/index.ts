import type { ReactNode } from 'react';

export type Mode = "light" | "dark" | "system";

export interface Coordinates {
  x: number;
  y: number;
}


export interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
  children?: ReactNode;
}