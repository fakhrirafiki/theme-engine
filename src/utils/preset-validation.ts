/**
 * Preset validation utilities for theme-engine
 * Provides validation and error handling for custom presets
 */

import type { TweakCNThemePreset } from '../data/tweakcn-presets';

/**
 * Validation result type.
 *
 * - `errors` should be treated as invalid input (preset should be rejected)
 * - `warnings` indicate potentially incomplete presets but may still be usable
 *
 * @public
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Required properties for a valid theme preset
 */
const REQUIRED_PROPERTIES = [
  'background',
  'foreground', 
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'card',
  'card-foreground'
] as const;

/**
 * Optional but recommended properties
 */
const RECOMMENDED_PROPERTIES = [
  'border',
  'input',
  'ring',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'popover',
  'popover-foreground'
] as const;

/**
 * Validate a single preset in the TweakCN-compatible shape.
 *
 * Intended usage:
 * - validating user-provided presets before passing them to `ThemeProvider`
 * - debugging preset issues in development
 *
 * Notes:
 * - This is a lightweight validator (it does not fully parse/compute CSS colors)
 *
 * @public
 */
export function validateTweakCNPreset(preset: any, presetId?: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = presetId ? `Preset "${presetId}":` : 'Preset:';

  // Check basic structure
  if (!preset || typeof preset !== 'object') {
    errors.push(`${prefix} Must be an object`);
    return { isValid: false, errors, warnings };
  }

  // Check label
  if (!preset.label || typeof preset.label !== 'string' || preset.label.trim() === '') {
    errors.push(`${prefix} Must have a non-empty label`);
  }

  // Check styles object
  if (!preset.styles || typeof preset.styles !== 'object') {
    errors.push(`${prefix} Must have a styles object`);
    return { isValid: false, errors, warnings };
  }

  // Check light and dark modes
  const modes = ['light', 'dark'] as const;
  for (const mode of modes) {
    const modeStyles = preset.styles[mode];
    
    if (!modeStyles || typeof modeStyles !== 'object') {
      errors.push(`${prefix} Must have ${mode} mode styles`);
      continue;
    }

    // Check required properties
    for (const prop of REQUIRED_PROPERTIES) {
      if (!modeStyles[prop] || typeof modeStyles[prop] !== 'string') {
        errors.push(`${prefix} Missing required ${mode} property: ${prop}`);
      }
    }

    // Check recommended properties
    for (const prop of RECOMMENDED_PROPERTIES) {
      if (!modeStyles[prop]) {
        warnings.push(`${prefix} Missing recommended ${mode} property: ${prop}`);
      }
    }

    // Validate color values (basic check)
    for (const [key, value] of Object.entries(modeStyles)) {
      if (typeof value === 'string' && value.trim() !== '') {
        if (!isValidColorValue(value)) {
          warnings.push(`${prefix} ${mode}.${key} may not be a valid color: "${value}"`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate a collection of custom presets (record keyed by preset ID).
 *
 * @public
 */
export function validateCustomPresets(customPresets: Record<string, TweakCNThemePreset>): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  if (!customPresets || typeof customPresets !== 'object') {
    return {
      isValid: false,
      errors: ['Custom presets must be an object'],
      warnings: []
    };
  }

  for (const [id, preset] of Object.entries(customPresets)) {
    // Validate preset ID
    if (!id || typeof id !== 'string' || id.trim() === '') {
      allErrors.push('Preset ID must be a non-empty string');
      continue;
    }

    if (!/^[a-z0-9-_]+$/.test(id)) {
      allWarnings.push(`Preset ID "${id}" should only contain lowercase letters, numbers, hyphens, and underscores`);
    }

    // Validate preset content
    const result = validateTweakCNPreset(preset, id);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Basic color value validation
 * Supports hex, hsl, rgb, and CSS color names
 */
function isValidColorValue(value: string): boolean {
  const trimmed = value.trim();
  
  // Hex colors
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) {
    return true;
  }
  
  // HSL colors
  if (/^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/i.test(trimmed)) {
    return true;
  }
  
  // RGB colors
  if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(trimmed)) {
    return true;
  }
  
  // CSS custom properties
  if (/^var\(--[\w-]+\)$/i.test(trimmed)) {
    return true;
  }

  // Common CSS color names (basic check)
  const cssColors = [
    'transparent', 'inherit', 'currentcolor',
    'black', 'white', 'red', 'green', 'blue',
    'yellow', 'orange', 'purple', 'pink', 'gray', 'grey'
  ];
  
  if (cssColors.includes(trimmed.toLowerCase())) {
    return true;
  }

  // If none of the above, it might still be valid (e.g., newer CSS features)
  // Return true but let the browser handle validation
  return true;
}

/**
 * Convenience logger for `ValidationResult`.
 *
 * This is primarily intended for local development diagnostics.
 *
 * @public
 */
export function logValidationResult(result: ValidationResult, context = 'Custom presets'): void {
  if (result.isValid) {
    console.log(`✅ ${context}: Validation passed`);
  } else {
    console.error(`❌ ${context}: Validation failed`);
    result.errors.forEach(error => console.error(`  Error: ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn(`⚠️ ${context}: Validation warnings`);
    result.warnings.forEach(warning => console.warn(`  Warning: ${warning}`));
  }
}
