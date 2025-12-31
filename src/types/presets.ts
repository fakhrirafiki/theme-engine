import type { ReactNode } from 'react';

/**
 * Complete shadcn/ui color system - all semantic color tokens
 * 
 * @public
 */
export interface ShadcnColorSystem {
  /** Base colors */
  background: string;
  foreground: string;
  
  /** Card colors */
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  
  /** Brand colors */
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  
  /** Supporting colors */
  muted: string;
  'muted-foreground': string;
  accent: string;
  'accent-foreground': string;
  
  /** System colors */
  destructive: string;
  'destructive-foreground': string;
  border: string;
  input: string;
  ring: string;
  
  /** Chart colors */
  'chart-1': string;
  'chart-2': string;
  'chart-3': string;
  'chart-4': string;
  'chart-5': string;
  
  /** Sidebar colors */
  sidebar: string;
  'sidebar-foreground': string;
  'sidebar-primary': string;
  'sidebar-primary-foreground': string;
  'sidebar-accent': string;
  'sidebar-accent-foreground': string;
  'sidebar-border': string;
  'sidebar-ring': string;
  
  /** Semantic accent colors for status and feedback */
  'accent-info': string;
  'accent-info-foreground': string;
  'accent-success': string;
  'accent-success-foreground': string;
  'accent-warning': string;
  'accent-warning-foreground': string;
  'accent-danger': string;
  'accent-danger-foreground': string;
  'accent-brand': string;
  'accent-brand-foreground': string;
  'accent-feature': string;
  'accent-feature-foreground': string;
  'accent-highlight': string;
  'accent-highlight-foreground': string;
}

/**
 * Typography system - font family definitions
 * 
 * @public
 */
export interface TypographySystem {
  'font-sans': string;
  'font-serif': string;
  'font-mono': string;
}

/**
 * Layout system - spacing and sizing
 * 
 * @public
 */
export interface LayoutSystem {
  /** Border radius for components */
  radius: string;
}

/**
 * Shadow system - complete shadow definition
 * 
 * @public  
 */
export interface ShadowSystem {
  'shadow-color': string;
  'shadow-opacity': string;
  'shadow-blur': string;
  'shadow-spread': string;
  'shadow-offset-x': string;
  'shadow-offset-y': string;
}

/**
 * Spacing system - text and layout spacing
 * 
 * @public
 */
export interface SpacingSystem {
  'letter-spacing': string;
  spacing: string;
}

/**
 * Complete shadcn/ui theme schema - all CSS custom properties
 * Supports the full shadcn/ui theming system with 36+ properties
 * 
 * @public
 */
export interface CompleteThemeSchema extends 
  ShadcnColorSystem,
  TypographySystem, 
  LayoutSystem,
  ShadowSystem,
  SpacingSystem {
  /** Allow additional custom properties */
  [key: string]: string;
}


/**
 * Theme preset interface with complete shadcn/ui support
 * 
 * @public
 */
export interface ThemePreset {
  /** Unique preset identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Color scheme for light and dark modes */
  colors: {
    light: CompleteThemeSchema;
    dark: CompleteThemeSchema;
  };
  /** Optional metadata for preset categorization */
  metadata?: {
    category?: string;
    tags?: string[];
    description?: string;
    author?: string;
    createdAt?: string;
    [key: string]: any;
  };
}

/**
 * Preset provider interface for data source abstraction
 * 
 * @public
 */
export interface PresetProvider {
  /** Get all available presets */
  getPresets(): ThemePreset[] | Promise<ThemePreset[]>;
  /** Get specific preset by ID */
  getPreset(id: string): ThemePreset | null | Promise<ThemePreset | null>;
  /** Optional: Subscribe to preset changes */
  onPresetChange?: (callback: (presets: ThemePreset[]) => void) => () => void;
  /** Optional: Search/filter presets */
  searchPresets?: (query: string) => ThemePreset[] | Promise<ThemePreset[]>;
}

/**
 * Animation configuration for preset buttons
 * 
 * @public
 */
export interface AnimationConfig {
  /** Enable/disable animations */
  enabled: boolean;
  /** Animation duration in seconds */
  duration: number;
  /** CSS easing function */
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | string;
  /** Number of preset rows */
  rowCount: number;
  /** Scroll speed multiplier */
  scrollSpeed: number;
  /** Pause animation on hover */
  hoverPause: boolean;
  /** Duplication factor for infinite scroll */
  duplicationFactor: number;
}

/**
 * Layout configuration for preset buttons
 * 
 * @public
 */
export interface LayoutConfig {
  /** Button width in pixels */
  buttonWidth: number;
  /** Gap between buttons in pixels */
  buttonGap: number;
  /** Gap between rows in pixels */
  rowGap: number;
  /** Show color preview boxes */
  showColorBoxes: boolean;
  /** Number of color boxes to show */
  colorBoxCount: number;
  /** Gradient mask for edge fading */
  enableMask: boolean;
}

/**
 * Theme preset buttons component props - Zero-config design
 * 
 * State management (preset provider, selection, and mode) is handled internally
 * via ThemeProvider context. Just configure appearance and behavior!
 * 
 * @public
 */
export interface ThemePresetButtonsProps {
  /** Animation configuration */
  animation?: Partial<AnimationConfig>;
  /** Layout configuration */
  layout?: Partial<LayoutConfig>;
  /** Custom preset renderer */
  renderPreset?: (preset: ThemePreset, isSelected: boolean) => ReactNode;
  /** Custom color box renderer */
  renderColorBox?: (color: string, index: number) => ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Filter presets by categories */
  categories?: string[];
  /** Maximum number of presets to show */
  maxPresets?: number;
  
  // ✨ New categorization and grouping features
  /** Show built-in presets (default: true) */
  showBuiltIn?: boolean;
  /** Show custom presets (default: true) */
  showCustom?: boolean;
  /** Group presets by category or provider (default: 'none') */
  groupBy?: 'none' | 'category' | 'provider';
  /** Custom section labels */
  labels?: {
    /** Label for built-in presets section (default: "Built-in Themes") */
    builtIn?: string;
    /** Label for custom presets section (default: "Custom Themes") */
    custom?: string;
  };
  /** Show section headers when grouping is enabled (default: true) */
  showSectionHeaders?: boolean;
}


/**
 * Default animation configuration
 * 
 * @public
 */
export const defaultAnimationConfig: AnimationConfig = {
  enabled: true,
  duration: 5,
  easing: 'linear',
  rowCount: 3,
  scrollSpeed: 1,
  hoverPause: true,
  duplicationFactor: 4,
};

/**
 * Default layout configuration
 * 
 * @public
 */
export const defaultLayoutConfig: LayoutConfig = {
  buttonWidth: 160,
  buttonGap: 16,
  rowGap: 16,
  showColorBoxes: true,
  colorBoxCount: 3,
  enableMask: true,
};

/**
 * CSS property categories for organized theming
 * 
 * @public
 */
export const CSS_PROPERTY_CATEGORIES = {
  colors: [
    'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 
    'muted', 'muted-foreground', 'accent', 'accent-foreground',
    'destructive', 'destructive-foreground', 'border', 'input', 'ring',
    'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
    'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
    'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
    // Semantic accent colors for status and feedback
    'accent-info', 'accent-info-foreground',
    'accent-success', 'accent-success-foreground',
    'accent-warning', 'accent-warning-foreground',
    'accent-danger', 'accent-danger-foreground',
    'accent-brand', 'accent-brand-foreground',
    'accent-feature', 'accent-feature-foreground',
    'accent-highlight', 'accent-highlight-foreground'
  ] as const,
  
  typography: [
    'font-sans', 'font-serif', 'font-mono'
  ] as const,
  
  layout: [
    'radius'
  ] as const,
  
  shadows: [
    'shadow-color', 'shadow-opacity', 'shadow-blur', 'shadow-spread', 
    'shadow-offset-x', 'shadow-offset-y'
  ] as const,
  
  spacing: [
    'letter-spacing', 'spacing'
  ] as const
} as const;

/**
 * All supported CSS properties as a flat array
 * 
 * @public
 */
export const ALL_CSS_PROPERTIES = [
  ...CSS_PROPERTY_CATEGORIES.colors,
  ...CSS_PROPERTY_CATEGORIES.typography,
  ...CSS_PROPERTY_CATEGORIES.layout,
  ...CSS_PROPERTY_CATEGORIES.shadows,
  ...CSS_PROPERTY_CATEGORIES.spacing
] as const;