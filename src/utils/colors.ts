/**
 * Lightweight color utilities for theme-engine
 * Provides basic color manipulation without heavy dependencies
 */

export type ColorFormat = 'hsl' | 'rgb' | 'hex';

/**
 * HSL color representation
 */
export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * RGB color representation
 */
export interface RGBColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * Parse HSL color string to HSL object
 * Supports: "hsl(240 100% 50%)", "hsl(240, 100%, 50%)", "240 100% 50%"
 */
export function parseHSL(hslString: string): HSLColor | null {
  try {
    // Remove hsl() wrapper and clean up
    const cleaned = hslString
      .replace(/hsl\(|\)/g, '')
      .replace(/[,%]/g, ' ')
      .trim();
    
    const parts = cleaned.split(/\s+/).filter(Boolean);
    
    if (parts.length !== 3) return null;
    
    const h = parseFloat(parts[0]) || 0;
    const s = parseFloat(parts[1]) || 0;
    const l = parseFloat(parts[2]) || 0;
    
    return {
      h: Math.max(0, Math.min(360, h)),
      s: Math.max(0, Math.min(100, s)),
      l: Math.max(0, Math.min(100, l)),
    };
  } catch {
    return null;
  }
}

/**
 * Parse hex color to RGB
 * Supports: "#ff0000", "#f00", "ff0000", "f00"
 */
export function parseHex(hexString: string): RGBColor | null {
  try {
    let hex = hexString.replace('#', '');
    
    // Convert 3-digit to 6-digit
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    if (hex.length !== 6) return null;
    
    const r = parseInt(hex.substring(0, 2), 16);
    const s = parseInt(hex.substring(2, 4), 16);
    const l = parseInt(hex.substring(4, 6), 16);
    
    if (isNaN(r) || isNaN(s) || isNaN(l)) return null;
    
    return { r, g: s, b: l };
  } catch {
    return null;
  }
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSLColor): RGBColor {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  
  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }
  
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
  
  return { r, g, b };
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGBColor): HSLColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Format HSL color as CSS string
 */
export function formatHSL(hsl: HSLColor, includeHslWrapper = true): string {
  const values = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
  return includeHslWrapper ? `hsl(${values})` : values;
}

/**
 * Format RGB color as CSS string
 */
export function formatRGB(rgb: RGBColor): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * Format RGB color as hex string
 */
export function formatHex(rgb: RGBColor): string {
  const toHex = (n: number): string => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Universal color formatter
 * Attempts to parse any color format and output in specified format
 */
export function formatColor(
  colorInput: string, 
  outputFormat: ColorFormat = 'hsl',
  includeFunctionWrapper = true
): string {
  // Try to parse as HSL first
  let hsl = parseHSL(colorInput);
  
  // If HSL parsing failed, try hex
  if (!hsl) {
    const rgb = parseHex(colorInput);
    if (rgb) {
      hsl = rgbToHsl(rgb);
    }
  }
  
  // If still no valid color, return original
  if (!hsl) {
    return colorInput;
  }
  
  switch (outputFormat) {
    case 'hsl':
      return formatHSL(hsl, includeFunctionWrapper);
    case 'rgb':
      return formatRGB(hslToRgb(hsl));
    case 'hex':
      return formatHex(hslToRgb(hsl));
    default:
      return colorInput;
  }
}

/**
 * Create a color with alpha transparency.
 *
 * Notes:
 * - This helper only supports HSL-like inputs that `parseHSL()` can parse
 *   (e.g. `"hsl(210 40% 98%)"` or `"210 40% 98%"`).
 * - For hex/rgb inputs, convert first with `formatColor(color, "hsl")`.
 *
 * @public
 */
export function withAlpha(colorInput: string, alpha: number): string {
  const hsl = parseHSL(colorInput);
  if (!hsl) return colorInput;
  
  const rgb = hslToRgb(hsl);
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampedAlpha})`;
}

/**
 * TweakCN compatible color formatter
 * Formats color to HSL/HSLA with proper spacing and alpha support
 */
export function colorFormatter(
  colorInput: string, 
  outputFormat: 'hsl' | 'hsla' = 'hsl',
  _precision: string = '4'
): string {
  const hsl = parseHSL(colorInput);
  if (!hsl) return colorInput;
  
  const h = hsl.h.toFixed(0);
  const s = hsl.s.toFixed(0);
  const l = hsl.l.toFixed(0);
  
  if (outputFormat === 'hsla') {
    return `hsla(${h}, ${s}%, ${l}%, var(--alpha, 1))`;
  }
  
  return `hsl(${h} ${s}% ${l}%)`;
}

/**
 * Create HSLA color with specific alpha value (TweakCN style)
 */
export function createHslaWithAlpha(colorInput: string, alpha: number): string {
  const hsl = parseHSL(colorInput);
  if (!hsl) return colorInput;
  
  const h = hsl.h.toFixed(0);
  const s = hsl.s.toFixed(0);
  const l = hsl.l.toFixed(0);
  const clampedAlpha = Math.max(0, Math.min(1, alpha)).toFixed(2);
  
  return `hsla(${h}, ${s}%, ${l}%, ${clampedAlpha})`;
}

