"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { ThemePreset, CompleteThemeSchema } from "../types/presets";
import { CSS_PROPERTY_CATEGORIES } from "../types/presets";
import type { Mode, Coordinates } from "../types";
import { tweakcnPresets, type BuiltInPresetId, type TweakCNThemePreset } from "../data/tweakcn-presets";
import { validateCustomPresets, logValidationResult } from "../utils/preset-validation";
import { ThemeScript } from "../components/UnifiedThemeScript";
import { formatHSL, parseHex, parseHSL, rgbToHsl } from "../utils/colors";

/**
 * Context value for the unified theming system.
 * Provides access to both appearance mode (light/dark) and color presets.
 *
 * @public
 */
interface UnifiedThemeContextValue {
  /** Current appearance mode setting */
  mode: Mode;
  /** Resolved appearance mode (never 'system') */
  resolvedMode: "light" | "dark";
  /** Change the appearance mode */
  setMode: (mode: Mode) => void;
  /** Toggle between light and dark modes with optional animation */
  toggleMode: (coordinates?: Coordinates) => void;

  /** Currently applied preset (null if using default colors) */
  currentPreset: {
    /** Unique identifier for the preset */
    presetId: string;
    /** Human-readable preset name */
    presetName: string;
    /** Color values for light and dark modes */
    colors: ThemePreset["colors"];
    /** Timestamp when preset was applied */
    appliedAt: number;
  } | null;
  /** Apply a new color preset */
  applyPreset: (preset: ThemePreset) => void;
  /** Apply a preset by its ID from the available preset collection */
  setThemePresetById: (presetId: string) => void;
  /** Clear the current preset and revert to default colors */
  clearPreset: () => void;
  /** Whether the currently active preset matches the defaultPreset prop */
  isUsingDefaultPreset: boolean;

  /** Available presets (merged built-in + custom) */
  availablePresets: Record<string, TweakCNThemePreset>;
  /** Built-in presets only */
  builtInPresets: Record<string, TweakCNThemePreset>;
  /** Custom presets only */
  customPresets: Record<string, TweakCNThemePreset>;
}

const UnifiedThemeContext = createContext<UnifiedThemeContextValue | undefined>(undefined);

type CustomPresetsRecord = Record<string, TweakCNThemePreset>;
type CustomPresetId<TCustomPresets> = TCustomPresets extends CustomPresetsRecord
  ? string extends keyof TCustomPresets
    ? never
    : Extract<keyof TCustomPresets, string>
  : never;
type PresetId<TCustomPresets> = BuiltInPresetId | CustomPresetId<TCustomPresets>;

// Utility functions for mode management
const THEME_STORAGE_KEY = "theme-engine-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredMode(storageKey: string): Mode | null {
  if (typeof window === "undefined") return null;
  try {
    return (localStorage.getItem(storageKey) as Mode) || null;
  } catch {
    return null;
  }
}

function setStoredMode(mode: Mode, storageKey: string): void {
  try {
    localStorage.setItem(storageKey, mode);
  } catch {
    // Silently fail in environments where localStorage is not available
  }
}

function normalizeColorValueToHslTriplet(value: string): string {
  const trimmed = value.trim();

  const parsedHsl = parseHSL(trimmed);
  if (parsedHsl) return formatHSL(parsedHsl, false);

  const parsedRgb = parseHex(trimmed);
  if (parsedRgb) return formatHSL(rgbToHsl(parsedRgb), false);

  // Try to resolve any other valid CSS color (e.g. oklch(...), named colors) via computed styles.
  if (typeof document !== "undefined") {
    try {
      // Quick accept: already a CSS var reference (we assume it resolves to a triplet).
      if (trimmed.startsWith("var(")) return trimmed;

      const probe = document.createElement("span");
      probe.style.color = trimmed;
      probe.style.position = "absolute";
      probe.style.left = "-9999px";
      probe.style.top = "-9999px";
      probe.style.visibility = "hidden";
      document.documentElement.appendChild(probe);

      const computed = getComputedStyle(probe).color; // rgb(...) or rgba(...)
      probe.remove();

      const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (match) {
        const r = Number(match[1]);
        const g = Number(match[2]);
        const b = Number(match[3]);
        if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
          return formatHSL(rgbToHsl({ r, g, b }), false);
        }
      }
    } catch {
      // ignore and fall through
    }
  }

  return trimmed;
}

/**
 * Props for the UnifiedThemeProvider component.
 *
 * @public
 */
interface UnifiedThemeProviderProps<TCustomPresets extends CustomPresetsRecord | undefined = undefined> {
  /** React children to wrap with theming context */
  children: React.ReactNode;
  /**
   * Default appearance mode when no stored preference exists.
   *
   * Notes for SSR/App Router:
   * - The initial render must be deterministic between server and client to avoid hydration mismatches.
   * - Persisted mode is restored after hydration (and also pre-hydration via the injected `ThemeScript`).
   */
  defaultMode?: Mode;
  /**
   * Default preset ID to use when no stored preset exists or when resetting.
   *
   * If provided, the preset will be applied when:
   * - there is no persisted preset in `localStorage`, or
   * - `clearPreset()` is called.
   */
  defaultPreset?: PresetId<TCustomPresets>;
  /**
   * `localStorage` key for appearance mode persistence.
   *
   * Stored value is one of: `"light" | "dark" | "system"`.
   */
  modeStorageKey?: string;
  /**
   * `localStorage` key for color preset persistence.
   *
   * Stored value is a JSON blob written by this provider and restored on subsequent loads.
   */
  presetStorageKey?: string;
  /** Custom presets to add to the available collection */
  customPresets?: TCustomPresets;
}

/**
 * Theme Provider - The heart of the elegant theming system.
 *
 * Coordinates two theming concerns seamlessly:
 * 1. **Appearance Mode** (light/dark/system) - Controls the base color scheme
 * 2. **Color Presets** - Customizes the actual colors within that scheme
 *
 * ## Key Features
 * - 🤝 **Perfect coordination** between appearance modes and presets
 * - 💾 **Reliable persistence** with separate localStorage keys
 * - ⚡ **SSR-safe** with pre-hydration script support
 * - 🎨 **CSS `!important`** ensures presets override mode defaults
 * - 👀 **MutationObserver** automatically reapplies presets on mode changes
 *
 * ## SSR / hydration behavior
 * This provider is designed for Next.js App Router where Client Components are still SSR-ed.
 * To avoid hydration mismatches:
 * - The initial render does not read `localStorage`.
 * - A pre-hydration `ThemeScript` is injected to apply the correct `html` mode class (`light`/`dark`)
 *   and restore preset CSS variables as early as possible.
 * - Persisted mode and preset are then reconciled after hydration.
 *
 * @example
 * ```tsx
 * <ThemeProvider
 *   defaultMode="system"
 *   modeStorageKey="app-mode"
 *   presetStorageKey="app-preset"
 * >
 *   <App />
 * </ThemeProvider>
 * ```
 *
 * @public
 */
export function ThemeProvider<const TCustomPresets extends CustomPresetsRecord | undefined = undefined>({
  children,
  defaultMode = "system",
  defaultPreset,
  modeStorageKey = THEME_STORAGE_KEY,
  presetStorageKey = "theme-preset",
  customPresets,
}: UnifiedThemeProviderProps<TCustomPresets>) {
  const normalizedCustomPresets = useMemo(() => (customPresets ?? {}) as CustomPresetsRecord, [customPresets]);

  // Mode state management
  const [mode, setMode] = useState<Mode>(() => {
    // IMPORTANT:
    // Do not read localStorage in the initial render path.
    // Next.js will SSR Client Components, and reading client-only values here
    // can cause hydration mismatches (e.g. server renders light, client hydrates dark).
    return defaultMode;
  });

  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">(() => {
    // Keep this deterministic between SSR + first client render.
    // If defaultMode === "system", we default to "light" until the effect runs.
    if (defaultMode === "dark") return "dark";
    return "light";
  });

  // Load persisted mode after hydration (SSR-safe)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = getStoredMode(modeStorageKey);
    if (stored) setMode(stored);
  }, [modeStorageKey]);

  // Preset collection management - merge built-in and custom presets
  const availablePresets = useMemo(() => {
    const merged: Record<string, TweakCNThemePreset> = {};

    // Built-in presets are always included
    Object.assign(merged, tweakcnPresets);

    // Validate and add custom presets (they can override built-in presets with same ID)
    if (Object.keys(normalizedCustomPresets).length > 0) {
      const validationResult = validateCustomPresets(normalizedCustomPresets);

      // Log validation results (development mode detection)
      const isDevelopment = typeof window !== "undefined" && window.location?.hostname === "localhost";
      if (isDevelopment) {
        logValidationResult(validationResult, "Custom presets");
      }

      // Still add presets even if there are warnings, but skip invalid ones
      if (validationResult.isValid || validationResult.errors.length === 0) {
        Object.assign(merged, normalizedCustomPresets);
      } else {
        // In production, silently skip invalid presets
        // In development, log errors but continue
        if (isDevelopment) {
          console.error("🎨 ThemeProvider: Skipping invalid custom presets");
        }
      }
    }

    return merged;
  }, [normalizedCustomPresets]);

  const builtInPresets = tweakcnPresets;

  // Helper function to get preset from available presets
  const getAvailablePresetById = useCallback(
    (id: string) => {
      return availablePresets[id] || null;
    },
    [availablePresets]
  );

  // Preset state management
  const [currentPreset, setCurrentPreset] = useState<UnifiedThemeContextValue["currentPreset"]>(null);

  // Load persisted preset on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(presetStorageKey);
      const isDevelopment = typeof window !== "undefined" && window.location?.hostname === "localhost";

      const applyDefaultPreset = () => {
        if (!defaultPreset) return;
        const preset = getAvailablePresetById(defaultPreset);
        if (preset) {
          const presetData = {
            presetId: defaultPreset,
            presetName: preset.label,
            colors: {
              light: preset.styles.light as CompleteThemeSchema,
              dark: preset.styles.dark as CompleteThemeSchema,
            },
            appliedAt: Date.now(),
          };
          setCurrentPreset(presetData);
          // console.log('🎨 UnifiedTheme: Applied default preset:', preset.label);
        } else {
          console.warn("🎨 UnifiedTheme: Default preset not found:", defaultPreset);
        }
      };

      if (stored) {
        try {
          const parsed = JSON.parse(stored);

          const isValidObject = parsed && typeof parsed === "object";
          const hasColors =
            isValidObject &&
            "colors" in parsed &&
            parsed.colors &&
            typeof (parsed as any).colors === "object" &&
            (parsed as any).colors.light &&
            (parsed as any).colors.dark;

          if (hasColors) {
            setCurrentPreset(parsed as UnifiedThemeContextValue["currentPreset"]);
            if (isDevelopment) {
              // console.log('🎨 UnifiedTheme: Loaded persisted preset:', (parsed as any).presetName);
            }
          } else {
            if (isDevelopment) {
              console.warn("🎨 UnifiedTheme: Invalid persisted preset shape. Clearing and falling back.");
            }
            localStorage.removeItem(presetStorageKey);
            applyDefaultPreset();
          }
        } catch (error) {
          if (isDevelopment) {
            console.warn("🎨 UnifiedTheme: Failed to parse persisted preset. Clearing key.", error);
          }
          localStorage.removeItem(presetStorageKey);
          applyDefaultPreset();
        }
      } else {
        // No stored preset – fall back to default if provided
        applyDefaultPreset();
      }
    } catch (error) {
      const isDevelopment = typeof window !== "undefined" && window.location?.hostname === "localhost";
      if (isDevelopment) {
        console.warn("🎨 UnifiedTheme: Failed to load preset from storage:", error);
      }
    }
  }, [presetStorageKey, defaultPreset, getAvailablePresetById]);

  // Update resolved mode when mode or system preference changes
  useEffect(() => {
    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const updateResolvedMode = () => setResolvedMode(getSystemTheme());

      updateResolvedMode();
      mediaQuery.addEventListener("change", updateResolvedMode);

      return () => mediaQuery.removeEventListener("change", updateResolvedMode);
    } else {
      setResolvedMode(mode as "light" | "dark");
      return;
    }
  }, [mode]);

  // Apply mode to document
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Remove existing mode classes
    root.classList.remove("light", "dark");

    // Add new mode class
    root.classList.add(resolvedMode);

    // Update color-scheme
    root.style.colorScheme = resolvedMode;
  }, [resolvedMode]);

  // Apply preset colors to DOM - with proper clearing and defaults
  const applyPresetColors = useCallback((preset: ThemePreset["colors"] | undefined, mode: "light" | "dark") => {
    if (!preset) return;

    const root = document.documentElement;
    const colors = preset[mode];

    if (!colors) return;

    // Default values for essential properties that might be missing
    const defaultValues = {
      spacing: "0.25rem",
      "letter-spacing": "normal",
    };

    // Get all possible CSS properties
    const allCategories = [
      ...CSS_PROPERTY_CATEGORIES.colors,
      ...CSS_PROPERTY_CATEGORIES.typography,
      ...CSS_PROPERTY_CATEGORIES.layout,
      ...CSS_PROPERTY_CATEGORIES.shadows,
      ...CSS_PROPERTY_CATEGORIES.spacing,
    ];

    // First, clear all properties to prevent leftover values
    let clearedCount = 0;
    allCategories.forEach((prop) => {
      const cssVar = `--${prop}`;
      root.style.removeProperty(cssVar);
      clearedCount++;
    });
    // console.log(`🎨 UnifiedTheme: Cleared ${clearedCount} CSS properties before applying new theme`);

    // Font inheritance logic: inherit missing fonts from other mode
    const fontProperties = ["font-sans", "font-serif", "font-mono"];
    const otherMode = mode === "light" ? "dark" : "light";
    const otherModeColors = preset[otherMode];

    if (otherModeColors) {
      fontProperties.forEach((fontProp) => {
        if (!(fontProp in colors) && fontProp in otherModeColors) {
          (colors as any)[fontProp] = (otherModeColors as any)[fontProp];
          // console.log(`🎨 Inherited ${fontProp}: "${(otherModeColors as any)[fontProp]}" from ${otherMode} mode`);
        }
      });
    }

    // Apply all CSS properties with defaults for missing ones
    let appliedCount = 0;

    allCategories.forEach((prop) => {
      let value = (colors as any)[prop];

      // Apply default value if property is missing and we have a default
      if (!value && (defaultValues as any)[prop]) {
        value = (defaultValues as any)[prop];
        // console.log(`🎨 Using default value for ${prop}: ${value}`);
      }

      if (value) {
        if (CSS_PROPERTY_CATEGORIES.colors.includes(prop as any) || prop === "shadow-color") {
          value = normalizeColorValueToHslTriplet(String(value));
        }

        const cssVar = `--${prop}`;
        // Apply directly like TweakCN - no conversion, no !important
        root.style.setProperty(cssVar, value);
        appliedCount++;
        // console.log(`🎨 Applied ${cssVar}: ${value}`);
      }
    });

    // console.log(`🎨 UnifiedTheme: Applied ${appliedCount} CSS properties for ${mode} mode`);
  }, []);

  // Mode change handlers
  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      setStoredMode(newMode, modeStorageKey);
    },
    [modeStorageKey]
  );

  const handleModeToggle = useCallback(
    (coordinates?: Coordinates) => {
      const newMode = resolvedMode === "light" ? "dark" : "light";

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Use View Transition API if available and transitions are enabled
      if (
        !prefersReducedMotion &&
        typeof document !== "undefined" &&
        "startViewTransition" in document
      ) {
        const root = document.documentElement;

        // Set coordinates for ripple effect FIRST
        if (coordinates) {
          root.style.setProperty("--x", `${coordinates.x}px`);
          root.style.setProperty("--y", `${coordinates.y}px`);
        }

        // Start view transition
        (document as any).startViewTransition(() => {
          handleModeChange(newMode);
        });
      } else {
        // Fallback: instant mode change
        handleModeChange(newMode);
      }
    },
    [resolvedMode, handleModeChange]
  );

  // Apply preset when current preset or resolved mode changes
  useEffect(() => {
    if (!currentPreset || typeof window === "undefined") return;
    applyPresetColors(currentPreset.colors, resolvedMode);
  }, [currentPreset, resolvedMode, applyPresetColors]);

  const applyPreset = useCallback(
    (preset: ThemePreset) => {
      const presetData = {
        presetId: preset.id,
        presetName: preset.name,
        colors: preset.colors,
        appliedAt: Date.now(),
      };

      setCurrentPreset(presetData);

      // Save to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(presetStorageKey, JSON.stringify(presetData));
          // console.log('🎨 UnifiedTheme: Saved preset:', preset.name);
        } catch (error) {
          console.error("🎨 UnifiedTheme: Failed to save preset:", error);
        }
      }

      // Apply immediately for current mode
      if (typeof window !== "undefined") {
        applyPresetColors(preset.colors, resolvedMode);
      }
    },
    [presetStorageKey, applyPresetColors, resolvedMode]
  );

  const setThemePresetById = useCallback(
    (presetId: string) => {
      const preset = getAvailablePresetById(presetId);

      if (!preset) {
        if (typeof window !== "undefined") {
          console.warn("🎨 UnifiedTheme: Preset not found for id:", presetId);
        }
        return;
      }

      const presetData: ThemePreset = {
        id: presetId,
        name: preset.label,
        colors: {
          light: preset.styles.light as CompleteThemeSchema,
          dark: preset.styles.dark as CompleteThemeSchema,
        },
      };

      applyPreset(presetData);
    },
    [getAvailablePresetById, applyPreset]
  );

  const clearPreset = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(presetStorageKey);
        // console.log('🎨 UnifiedTheme: Cleared preset');
      } catch (error) {
        console.error("🎨 UnifiedTheme: Failed to clear preset:", error);
      }
    }

    if (defaultPreset) {
      // Apply default preset instead of removing all properties
      const preset = getAvailablePresetById(defaultPreset);
      if (preset) {
        const presetData = {
          presetId: defaultPreset,
          presetName: preset.label,
          colors: {
            light: preset.styles.light as CompleteThemeSchema,
            dark: preset.styles.dark as CompleteThemeSchema,
          },
          appliedAt: Date.now(),
        };
        setCurrentPreset(presetData);
        applyPresetColors(presetData.colors, resolvedMode);
        // console.log('🎨 UnifiedTheme: Reset to default preset:', preset.label);
      } else {
        console.warn("🎨 UnifiedTheme: Default preset not found:", defaultPreset);
        setCurrentPreset(null);
      }
    } else {
      // No default preset: remove all properties (original behavior)
      setCurrentPreset(null);
      const root = document.documentElement;
      const allProperties = [
        ...CSS_PROPERTY_CATEGORIES.colors,
        ...CSS_PROPERTY_CATEGORIES.typography,
        ...CSS_PROPERTY_CATEGORIES.layout,
        ...CSS_PROPERTY_CATEGORIES.shadows,
        ...CSS_PROPERTY_CATEGORIES.spacing,
      ];

      let clearedCount = 0;
      allProperties.forEach((prop) => {
        const cssVar = `--${prop}`;
        root.style.removeProperty(cssVar);
        clearedCount++;
      });

      // console.log(`🎨 UnifiedTheme: Cleared ${clearedCount} CSS properties`);
    }
  }, [presetStorageKey, defaultPreset, getAvailablePresetById, applyPresetColors, resolvedMode]);

  // Always inject ThemeScript for pre-hydration preset restoration
  const scriptElement = (
    <ThemeScript
      presetStorageKey={presetStorageKey}
      modeStorageKey={modeStorageKey}
      defaultMode={defaultMode}
      defaultPreset={defaultPreset}
    />
  );

  const isUsingDefaultPreset = !!defaultPreset && currentPreset?.presetId === defaultPreset;

  const contextValue: UnifiedThemeContextValue = {
    mode,
    resolvedMode,
    setMode: handleModeChange,
    toggleMode: handleModeToggle,
    currentPreset,
    applyPreset,
    setThemePresetById,
    clearPreset,
    isUsingDefaultPreset,
    availablePresets,
    builtInPresets,
    customPresets: normalizedCustomPresets,
  };

  return (
    <>
      {scriptElement}
      <UnifiedThemeContext.Provider value={contextValue}>{children}</UnifiedThemeContext.Provider>
    </>
  );
}

/**
 * Hook for accessing the unified theming system.
 *
 * Provides access to both appearance mode controls and preset management
 * in a single, coordinated interface.
 *
 * Prefer `useThemeEngine()` for a DX-first API with aliases and typed preset IDs.
 *
 * @example
 * ```tsx
 * // Mode controls
 * function ModeControls() {
 *   const { mode, setMode } = useTheme()
 *
 *   return (
 *     <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
 *       Toggle Mode
 *     </button>
 *   )
 * }
 *
 * // Preset management
 * function PresetSelector() {
 *   const {
 *     currentPreset,  // Active color preset
 *     applyPreset,    // Apply new preset
 *     clearPreset     // Reset to defaults
 *   } = useTheme()
 *
 *   return (
 *     <div>
 *       <p>Active: {currentPreset?.presetName || 'Default'}</p>
 *       <ThemePresetButtons
 *         selectedPresetId={currentPreset?.presetId || null}
 *         onPresetSelect={applyPreset}
 *       />
 *       {currentPreset && (
 *         <button onClick={clearPreset}>Reset</button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @throws Error if used outside of ThemeProvider
 * @returns The theme context value
 *
 * @public
 */
export function useTheme() {
  const context = useContext(UnifiedThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
