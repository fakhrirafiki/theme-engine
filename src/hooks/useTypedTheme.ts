"use client";

import { useTheme } from "../providers/UnifiedThemeProvider";
import type { BuiltInPresetId, TweakCNThemePreset } from "../data/tweakcn-presets";

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
 * Typed convenience wrapper around `useTheme()` that provides IntelliSense for preset IDs.
 *
 * - Built-in IDs come from `BuiltInPresetId`
 * - Custom IDs are inferred from the keys of the `customPresets` argument
 *
 * The resulting `setThemePresetById()` still accepts any string, but VS Code will suggest known IDs first.
 */
export function useTypedTheme<const TCustomPresets extends CustomPresetsRecord | undefined = undefined>(
  customPresets?: TCustomPresets
) {
  void customPresets;

  const theme = useTheme();
  type PresetId = ThemePresetId<TCustomPresets> | LooseString;

  const setThemePresetById = (presetId: PresetId) => theme.setThemePresetById(presetId);

  return {
    ...theme,
    setThemePresetById,
  };
}
