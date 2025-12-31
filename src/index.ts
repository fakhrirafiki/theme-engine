// =======================================
// 🚀 THEME ENGINE API
// =======================================

// Main theming system - clean, professional naming
export {
  ThemeProvider,
  useTheme,
} from "./providers/UnifiedThemeProvider";
export { ThemeScript } from "./components/UnifiedThemeScript";

// Core components (universally useful)
export { ThemeToggle } from "./components/ThemeToggle";
export { ThemePresetButtons } from "./components/ThemePresetButtons";
export { useTypedTheme, type ThemePresetId } from "./hooks/useTypedTheme";
export { useThemeEngine, type ThemeEnginePresetId, type ThemeId, type ThemePresets } from "./hooks/useThemeEngine";

// Data exports
// Note: TweakCN presets are now directly accessible

// Essential Utilities (commonly used)
export { formatColor, withAlpha } from "./utils/colors";

// Preset validation utilities
export { 
  validateTweakCNPreset, 
  validateCustomPresets, 
  logValidationResult,
  type ValidationResult 
} from "./utils/preset-validation";

// TweakCN Integration (direct access)
export { 
  tweakcnPresets,
  builtInPresetIds,
  getPresetIds,
  getPresetById,
  getPresetLabels,
  searchPresets,
  getPresetsCount,
  getPresetEntries
} from "./data/tweakcn-presets";


// =======================================
// 🔧 TYPE EXPORTS
// =======================================

// Core types
export type {
  Mode,
  Coordinates,
  ThemeToggleProps,
} from "./types";

// Preset types (essential)
export type {
  ThemePreset,
  PresetProvider,
  ThemePresetButtonsProps,
  CompleteThemeSchema,
} from "./types/presets";

// TweakCN compatibility types
export type { BuiltInPresetId, TweakCNThemePreset } from "./data/tweakcn-presets";
