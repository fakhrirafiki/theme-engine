"use client";

import type { Coordinates, Mode } from "../types";
import type { BuiltInPresetId, TweakCNThemePreset } from "../data/tweakcn-presets";
import { useTheme } from "../providers/UnifiedThemeProvider";

type CustomPresetsRecord = Record<string, TweakCNThemePreset>;
type CustomPresetId<TCustomPresets> = TCustomPresets extends CustomPresetsRecord
  ? string extends keyof TCustomPresets
    ? never
    : Extract<keyof TCustomPresets, string>
  : never;
export type ThemePresetId<TCustomPresets extends CustomPresetsRecord | undefined = undefined> =
  | BuiltInPresetId
  | CustomPresetId<TCustomPresets>;

type LooseString = string & {};

/**
 * Type helper to "register" your presets for autocomplete.
 *
 * Usage:
 * `useThemeEngine<ThemePresets<typeof customPresets>>()`
 */
export type ThemePresets<T> = T extends CustomPresetsRecord ? T : never;

export type ThemeEnginePresetId<TCustomPresets extends CustomPresetsRecord | undefined = undefined> = ThemePresetId<TCustomPresets>;

export type ThemeId<TCustomPresets extends CustomPresetsRecord | undefined = undefined> =
  | ThemeEnginePresetId<TCustomPresets>
  | LooseString;

/**
 * DX-first hook for Theme Engine.
 *
 * Unifies:
 * - mode controls (`light` | `dark` | `system`)
 * - preset controls (apply/clear by ID)
 *
 * For typed preset ID autocomplete (built-in + your custom IDs):
 * `useThemeEngine<ThemePresets<typeof customPresets>>()`
 */
export function useThemeEngine<const TCustomPresets extends CustomPresetsRecord | undefined = undefined>() {
  const theme = useTheme();

  const darkMode = theme.resolvedMode === "dark";

  const setDarkMode = (mode: Mode) => theme.setMode(mode);
  const toggleDarkMode = (coordinates?: Coordinates) => theme.toggleMode(coordinates);

  const applyThemeById = (themeId: ThemeId<TCustomPresets>) => theme.setThemePresetById(themeId);
  const applyPresetById = applyThemeById;

  const clearTheme = () => theme.clearPreset();
  const clearPreset = clearTheme;

  const currentTheme = theme.currentPreset;
  const currentPreset = theme.currentPreset;

  return {
    // Mode
    darkMode,
    mode: theme.mode,
    resolvedMode: theme.resolvedMode,
    setDarkMode,
    setMode: theme.setMode,
    toggleDarkMode,
    toggleMode: theme.toggleMode,

    // Presets (theme naming)
    applyThemeById,
    applyPresetById,
    clearTheme,
    clearPreset,
    currentTheme,
    currentPreset,

    // Advanced / diagnostics
    isUsingDefaultPreset: theme.isUsingDefaultPreset,
    availablePresets: theme.availablePresets,
    builtInPresets: theme.builtInPresets,
    customPresets: theme.customPresets,
  };
}
