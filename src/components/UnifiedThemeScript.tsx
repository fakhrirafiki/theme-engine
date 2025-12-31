"use client";

import { useMemo } from "react";
import { getPresetById } from "../data/tweakcn-presets";
import type { Mode } from "../types";

interface ThemeScriptProps {
  /**
   * Storage key for theme preset persistence
   * @default 'theme-preset'
   */
  presetStorageKey?: string;
  /**
   * Storage key for appearance mode persistence
   * @default 'theme-engine-theme'
   */
  modeStorageKey?: string;
  /**
   * Default appearance mode when no stored preference exists
   * @default 'system'
   */
  defaultMode?: Mode;
  /**
   * Default preset ID to apply when no stored preset exists
   */
  defaultPreset?: string;
}

/**
 * Pre-hydration theme script.
 * - Restores appearance mode (light/dark/system) to avoid hydration mismatch + FOUC.
 * - Restores preset CSS variables early so Tailwind/shadcn tokens render correctly on first paint.
 */
export function ThemeScript({
  presetStorageKey = "theme-preset",
  modeStorageKey = "theme-engine-theme",
  defaultMode = "system",
  defaultPreset,
}: ThemeScriptProps) {
  // Get default preset data if specified
  const defaultPresetData = useMemo(() => {
    if (!defaultPreset) return null;
    const preset = getPresetById(defaultPreset);
    return preset
      ? {
          presetId: defaultPreset,
          presetName: preset.label,
          colors: preset.styles,
        }
      : null;
  }, [defaultPreset]);

  const scriptContent = useMemo(
    () => `
    // Unified Theme Engine: Restore mode + preset colors before hydration
    (function() {
      try {
        const presetStorageKey = "${presetStorageKey}";
        const modeStorageKey = "${modeStorageKey}";
        const defaultMode = "${defaultMode}";
        const isDev = (function() {
          try {
            return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
          } catch {
            return false;
          }
        })();

        // ---- Mode restoration (pre-hydration) ----
        (function() {
          try {
            const root = document.documentElement;
            let storedMode = null;
            try {
              storedMode = localStorage.getItem(modeStorageKey);
            } catch {}

            const isValidMode = storedMode === 'light' || storedMode === 'dark' || storedMode === 'system';
            const mode = isValidMode ? storedMode : defaultMode;

            let systemMode = 'light';
            try {
              systemMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            } catch {}

            const resolvedMode = mode === 'system' ? systemMode : mode;

            root.classList.remove('light', 'dark');
            root.classList.add(resolvedMode);
            root.style.colorScheme = resolvedMode;

            // Expose for runtime consumers (optional)
            try {
              root.dataset.themeEngineMode = mode;
              root.dataset.themeEngineResolvedMode = resolvedMode;
            } catch {}
          } catch (error) {
            if (isDev) console.warn('🎨 UnifiedThemeScript: Mode restoration failed:', error);
          }
        })();
        
        // CSS property categories (inline for script)
        const CSS_CATEGORIES = {
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
          ],
          typography: ['font-sans', 'font-serif', 'font-mono'],
          layout: ['radius'],
          shadows: ['shadow-color', 'shadow-opacity', 'shadow-blur', 'shadow-spread', 'shadow-offset-x', 'shadow-offset-y'],
          spacing: ['letter-spacing', 'spacing']
        };

        // Normalize hex/rgb/hsl() colors into "H S% L%" for hsl(var(--token)) usage.
        function normalizeColorValueToHslTriplet(value) {
          if (!value) return value;
          const trimmed = String(value).trim();
          if (!trimmed) return value;
          if (trimmed.startsWith('var(')) return trimmed;

          // Already a triplet: "210 40% 98%"
          if (/^\\d+(?:\\.\\d+)?\\s+\\d+(?:\\.\\d+)?%\\s+\\d+(?:\\.\\d+)?%$/.test(trimmed)) {
            return trimmed;
          }

          function clamp(n, min, max) {
            return Math.min(max, Math.max(min, n));
          }

          function rgbToHsl(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;
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

          function hexToRgb(hex) {
            let clean = hex.replace('#', '').trim();
            if (clean.length === 3) clean = clean.split('').map(function(c) { return c + c; }).join('');
            if (clean.length === 8) clean = clean.substring(0, 6); // ignore alpha
            if (clean.length !== 6) return null;

            const r = parseInt(clean.substring(0, 2), 16);
            const g = parseInt(clean.substring(2, 4), 16);
            const b = parseInt(clean.substring(4, 6), 16);
            if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
            return { r: r, g: g, b: b };
          }

          function toTriplet(hsl) {
            return String(clamp(hsl.h, 0, 360)) + ' ' + String(clamp(hsl.s, 0, 100)) + '% ' + String(clamp(hsl.l, 0, 100)) + '%';
          }

          // hsl(...) or raw "H S% L%"
          if (/^hsl\\(/i.test(trimmed)) {
            const cleaned = trimmed.replace(/hsl\\(|\\)/gi, '').replace(/[,%]/g, ' ').trim();
            const parts = cleaned.split(/\\s+/).filter(Boolean);
            if (parts.length === 3) {
              const h = parseFloat(parts[0]) || 0;
              const s = parseFloat(parts[1]) || 0;
              const l = parseFloat(parts[2]) || 0;
              return toTriplet({ h: h, s: s, l: l });
            }
          }

          // rgb(...)
          if (/^rgb\\(/i.test(trimmed)) {
            const cleaned = trimmed.replace(/rgb\\(|\\)/gi, '').trim();
            const parts = cleaned.split(',').map(function(p) { return p.trim(); });
            if (parts.length === 3) {
              const r = clamp(parseFloat(parts[0]) || 0, 0, 255);
              const g = clamp(parseFloat(parts[1]) || 0, 0, 255);
              const b = clamp(parseFloat(parts[2]) || 0, 0, 255);
              return toTriplet(rgbToHsl(r, g, b));
            }
          }

          // hex
          if (trimmed[0] === '#') {
            const rgb = hexToRgb(trimmed);
            if (rgb) return toTriplet(rgbToHsl(rgb.r, rgb.g, rgb.b));
          }

          // Any other CSS color (e.g. oklch(...), named colors) -> resolve via computed styles.
          try {
            const probe = document.createElement('span');
            probe.style.color = trimmed;
            probe.style.position = 'absolute';
            probe.style.left = '-9999px';
            probe.style.top = '-9999px';
            probe.style.visibility = 'hidden';
            document.documentElement.appendChild(probe);
            const computed = getComputedStyle(probe).color; // rgb(...) or rgba(...)
            probe.remove();

            const match = computed && computed.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/i);
            if (match) {
              const r = clamp(parseFloat(match[1]) || 0, 0, 255);
              const g = clamp(parseFloat(match[2]) || 0, 0, 255);
              const b = clamp(parseFloat(match[3]) || 0, 0, 255);
              return toTriplet(rgbToHsl(r, g, b));
            }
          } catch (e) {
            // ignore and fall through
          }

          return value;
        }

        // Function to apply all preset properties - with proper clearing and defaults
        function applyPresetProperties(colors) {
          if (!colors) return;
          
          const root = document.documentElement;
          
          // Default values for essential properties that might be missing
          const defaultValues = {
            'spacing': '0.25rem',
            'letter-spacing': 'normal'
          };
          
          // Get all possible CSS properties  
          const allCategories = ['colors', 'typography', 'layout', 'shadows', 'spacing'];
          const allProperties = [];
          allCategories.forEach(function(category) {
            CSS_CATEGORIES[category].forEach(function(prop) {
              allProperties.push(prop);
            });
          });
          
          // First, clear all properties to prevent leftover values
          let clearedCount = 0;
          allProperties.forEach(function(prop) {
            const cssVar = '--' + prop;
            root.style.removeProperty(cssVar);
            clearedCount++;
          });
          
          // Apply all properties with defaults for missing ones
          let appliedCount = 0;
          const colorProps = {};
          CSS_CATEGORIES.colors.forEach(function(prop) { colorProps[prop] = true; });
          colorProps['shadow-color'] = true;

          allProperties.forEach(function(prop) {
            let value = colors[prop];
            
            // Apply default value if property is missing and we have a default
            if (!value && defaultValues[prop]) {
              value = defaultValues[prop];
            }
            
            if (value) {
              if (colorProps[prop]) {
                value = normalizeColorValueToHslTriplet(value);
              }

              const cssVar = '--' + prop;
              // Apply directly like TweakCN does - no conversion, no !important
              root.style.setProperty(cssVar, value);
              appliedCount++;
            }
          });
          
        }
        
        // ---- Preset restoration (pre-hydration) ----
        const storedPreset = localStorage.getItem(presetStorageKey);
        let presetToApply = null;
        
        if (storedPreset) {
          try {
            presetToApply = JSON.parse(storedPreset);
          } catch (error) {
            if (isDev) console.warn('🎨 UnifiedThemeScript: Failed to parse stored preset:', error);
          }
        }
        
        // Use default preset if no stored preset
        if (!presetToApply && ${JSON.stringify(defaultPresetData)}) {
          presetToApply = ${JSON.stringify(defaultPresetData)};
        }
        
        if (presetToApply) {
          const root = document.documentElement;
          const resolved = (root.dataset && root.dataset.themeEngineResolvedMode) || (root.classList.contains('dark') ? 'dark' : 'light');
          const mode = resolved === 'dark' ? 'dark' : 'light';
          const colors = presetToApply.colors && presetToApply.colors[mode];
          
          if (colors) {
            // Font inheritance logic: inherit missing fonts from other mode
            const fontProperties = ['font-sans', 'font-serif', 'font-mono'];
            const otherMode = mode === 'light' ? 'dark' : 'light';
            const otherModeColors = presetToApply.colors && presetToApply.colors[otherMode];
            
            if (otherModeColors) {
              fontProperties.forEach(function(fontProp) {
                if (!colors[fontProp] && otherModeColors[fontProp]) {
                  colors[fontProp] = otherModeColors[fontProp];
                }
              });
            }
            
            applyPresetProperties(colors);
          }
        }
        
      } catch (error) {
        if (isDev) console.error('🎨 UnifiedThemeScript: Initialization failed:', error);
      }
    })();
  `,
    [presetStorageKey, defaultPresetData]
  );

  return <script dangerouslySetInnerHTML={{ __html: scriptContent }} suppressHydrationWarning />;
}
