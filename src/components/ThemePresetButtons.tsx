"use client";

import type { CSSProperties } from "react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { clsx } from "clsx";
import type {
  ThemePresetButtonsProps,
  ThemePreset,
  AnimationConfig,
  LayoutConfig,
  CompleteThemeSchema
} from '../types/presets';
import { formatColor } from '../utils/colors';
import { useTheme } from '../providers/UnifiedThemeProvider';

// Import default configs (matching TweakCN defaults)
const DEFAULT_ANIMATION: AnimationConfig = {
  enabled: true,
  duration: 5, // baseDurationPerItem from TweakCN
  easing: "linear",
  rowCount: 3,
  scrollSpeed: 1,
  hoverPause: true,
  duplicationFactor: 4,
};

const DEFAULT_LAYOUT: LayoutConfig = {
  buttonWidth: 160, // Keep consistent with TweakCN
  buttonGap: 16, // space-x-4 -> 1rem = 16px
  rowGap: 16, // gap-y-4 -> 1rem = 16px
  showColorBoxes: true,
  colorBoxCount: 3,
  enableMask: true,
};

function getPresetButtonWidthPx(label: string, layout: LayoutConfig): number {
  const approxCharWidthPx = 7.25;
  const maxWidthPx = 360;

  const dotSizePx = 12;
  const dotGapPx = 4;
  const dotsWidthPx = layout.showColorBoxes
    ? layout.colorBoxCount * dotSizePx + Math.max(0, layout.colorBoxCount - 1) * dotGapPx
    : 0;

  const contentPaddingPx = 28; // matches CSS padding and spacing closely
  const estimatedTextWidthPx = Math.ceil(label.length * approxCharWidthPx);

  const estimatedWidthPx = contentPaddingPx + dotsWidthPx + estimatedTextWidthPx;
  return Math.min(maxWidthPx, Math.max(layout.buttonWidth, estimatedWidthPx));
}

/**
 * Color box component for displaying preset colors
 */
interface ColorBoxProps {
  color: string;
  className?: string;
}

const ColorBox = ({ color, className }: ColorBoxProps) => {
  return (
    <div
      className={clsx("theme-color-box", className)}
      style={{ backgroundColor: formatColor(color, "hex"), width: 12, height: 12 }}
    />
  );
};

/**
 * Individual preset button component
 */
interface PresetButtonProps {
  preset: ThemePreset;
  isSelected: boolean;
  onClick: () => void;
  mode: "light" | "dark";
  layout: LayoutConfig;
  renderPreset?: ThemePresetButtonsProps["renderPreset"];
  renderColorBox?: ThemePresetButtonsProps["renderColorBox"];
}

const PresetButton = ({
  preset,
  isSelected,
  onClick,
  mode,
  layout,
  renderPreset,
  renderColorBox,
}: PresetButtonProps) => {
  const colors = preset.colors[mode];
  const label = preset.name.replace(/-/g, " ");
  const buttonWidth = Math.max(layout.buttonWidth, Number((preset.metadata as any)?.buttonWidth ?? 0) || layout.buttonWidth);

  // Custom preset renderer
  if (renderPreset) {
    return (
      <div
        onClick={onClick}
        className="cursor-pointer"
        style={{ minWidth: layout.buttonWidth }}
      >
        {renderPreset(preset, isSelected)}
      </div>
    );
  }

  // Default preset renderer with clean styling
  return (
    <div className="flex-shrink-0" style={{ width: buttonWidth }}>
      <button
        type="button"
        className={clsx(
          "theme-preset-button",
          isSelected && "theme-preset-button--selected"
        )}
        onClick={onClick}
        aria-pressed={isSelected}
        title={label}
      >
        {layout.showColorBoxes && (
          <div className="theme-preset-button__colors">
            {[colors.primary, colors.secondary, colors.accent]
              .slice(0, layout.colorBoxCount)
              .map((color, index) =>
                renderColorBox ? (
                  <span key={index}>{renderColorBox(color, index)}</span>
                ) : (
                  <ColorBox key={index} color={color} />
                )
              )}
          </div>
        )}
        <div className="theme-preset-button__text">
          <span className="theme-preset-button__label">{label}</span>
        </div>
      </button>
    </div>
  );
};

/**
 * Animated row component for infinite scrolling
 */
interface AnimatedRowProps {
  presets: ThemePreset[];
  selectedPresetId?: string;
  onPresetSelect: (preset: ThemePreset) => void;
  mode: "light" | "dark";
  animation: AnimationConfig;
  layout: LayoutConfig;
  renderPreset?: ThemePresetButtonsProps["renderPreset"];
  renderColorBox?: ThemePresetButtonsProps["renderColorBox"];
}

const AnimatedRow = ({
  presets,
  selectedPresetId,
  onPresetSelect,
  mode,
  animation,
  layout,
  renderPreset,
  renderColorBox,
}: AnimatedRowProps) => {
  if (presets.length === 0) return null;

  // Duplicate presets for infinite scroll
  const duplicatedPresets = Array(animation.duplicationFactor)
    .fill(presets)
    .flat();

  const totalWidth =
    presets.reduce((sum, preset) => sum + (Number((preset.metadata as any)?.buttonWidth) || layout.buttonWidth), 0) +
    Math.max(0, presets.length - 1) * layout.buttonGap;
  const effectiveScrollSpeed = Math.max(0.1, animation.scrollSpeed || 1);
  const animationDuration = (presets.length * animation.duration) / effectiveScrollSpeed;

  return (
    <div
      className={clsx(
        "theme-preset-row flex",
        animation.enabled && "theme-preset-row--animated",
        animation.hoverPause && "theme-preset-row--hover-pause"
      )}
      style={
        {
          ["--theme-engine-scroll-distance" as any]: `${totalWidth}px`,
          ["--theme-engine-scroll-duration" as any]: `${animationDuration}s`,
          ["--theme-engine-scroll-easing" as any]: animation.easing,
        } as CSSProperties
      }
    >
      <div
        className="theme-preset-track flex flex-shrink-0"
        style={{ gap: `${layout.buttonGap}px` }}
      >
        {duplicatedPresets.map((preset, index) => (
          <PresetButton
            key={`${preset.id}-${index}`}
            preset={preset}
            isSelected={preset.id === selectedPresetId}
            onClick={() => onPresetSelect(preset)}
            mode={mode}
            layout={layout}
            renderPreset={renderPreset}
            renderColorBox={renderColorBox}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Main ThemePresetButtons component
 */
export const ThemePresetButtons = ({
  animation: animationOverrides = {},
  layout: layoutOverrides = {},
  renderPreset,
  renderColorBox,
  className,
  categories,
  maxPresets,
  showBuiltIn = true,
  showCustom = true,
}: ThemePresetButtonsProps) => {
  // Internal state management - zero-config with direct preset access!
  const { currentPreset, applyPreset, resolvedMode, availablePresets, builtInPresets, customPresets } = useTheme();
  const selectedPresetId = currentPreset?.presetId || undefined;
  const onPresetSelect = applyPreset;

  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Merge configs with defaults
  const animation = useMemo(
    () => ({ ...DEFAULT_ANIMATION, ...animationOverrides }),
    [animationOverrides]
  );
  const layout = useMemo(
    () => ({ ...DEFAULT_LAYOUT, ...layoutOverrides }),
    [layoutOverrides]
  );

  // Load presets directly from available presets
  const loadPresets = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert TweakCN format to component format with provider information
      const builtInPresetList: ThemePreset[] = [];
      const customPresetList: ThemePreset[] = [];
      
      // Add built-in presets if enabled
      if (showBuiltIn) {
        builtInPresetList.push(
          ...Object.entries(builtInPresets).map(([id, preset]) => ({
          id,
          name: preset.label,
          colors: {
            light: preset.styles.light as CompleteThemeSchema,
            dark: preset.styles.dark as CompleteThemeSchema,
          },
          metadata: {
            buttonWidth: getPresetButtonWidthPx(preset.label, layout),
            category: preset.label.toLowerCase().includes('minimal') ? 'minimal' :
                     preset.label.toLowerCase().includes('violet') || preset.label.toLowerCase().includes('purple') ? 'vibrant' :
                     'modern',
            tags: [preset.label.toLowerCase().replace(/\s+/g, '-')],
            createdAt: preset.createdAt,
            provider: 'built-in' as const,
          }
        }))
        );
      }
      
      // Add custom presets if enabled
      if (showCustom) {
        customPresetList.push(
          ...Object.entries(customPresets).map(([id, preset]) => ({
          id,
          name: preset.label,
          colors: {
            light: preset.styles.light as CompleteThemeSchema,
            dark: preset.styles.dark as CompleteThemeSchema,
          },
          metadata: {
            buttonWidth: getPresetButtonWidthPx(preset.label, layout),
            category: preset.label.toLowerCase().includes('minimal') ? 'minimal' :
                     preset.label.toLowerCase().includes('violet') || preset.label.toLowerCase().includes('purple') ? 'vibrant' :
                     'modern',
            tags: [preset.label.toLowerCase().replace(/\s+/g, '-')],
            createdAt: preset.createdAt,
            provider: 'custom' as const,
          }
        }))
        );
      }

      // Default ordering: show custom presets first so they are immediately visible.
      let allPresets: ThemePreset[] = [...customPresetList, ...builtInPresetList];

      // Filter by categories if specified
      if (categories && categories.length > 0) {
        allPresets = allPresets.filter((preset) =>
          categories.includes(preset.metadata?.category || "unknown")
        );
      }

      // Limit presets if specified
      if (maxPresets && maxPresets > 0) {
        allPresets = allPresets.slice(0, maxPresets);
      }

      setPresets(allPresets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load presets");
      console.error("Failed to load presets:", err);
    } finally {
      setLoading(false);
    }
  }, [availablePresets, builtInPresets, customPresets, categories, maxPresets, showBuiltIn, showCustom, layout]);

  // Initial load
  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  // Distribute presets across rows
  const presetsByRow = useMemo(() => {
    if (presets.length === 0) return [];

    const rows: ThemePreset[][] = Array.from(
      { length: animation.rowCount },
      () => []
    );
    presets.forEach((preset, index) => {
      rows[index % animation.rowCount].push(preset);
    });

    return rows.filter((row) => row.length > 0);
  }, [presets, animation.rowCount]);

  // IMPORTANT: All hooks must be called before early returns!
  const containerStyle = useMemo(
    () => ({
      gap: layout.rowGap,
      ...(layout.enableMask && {
        maskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      }),
    }),
    [layout.rowGap, layout.enableMask]
  );

  // Early returns after all hooks
  if (loading) {
    return (
      <div className={clsx("flex items-center justify-center py-8", className)}>
        <div className="animate-pulse text-sm text-muted-foreground">
          Loading presets...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx("flex items-center justify-center py-8", className)}>
        <div className="text-sm text-destructive">Error: {error}</div>
      </div>
    );
  }

  if (presets.length === 0) {
    return (
      <div className={clsx("flex items-center justify-center py-8", className)}>
        <div className="text-sm text-muted-foreground">No presets available</div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "theme-fade-in w-full overflow-hidden mb-8 flex flex-col py-2 -my-2",
        className
      )}
      style={containerStyle}
    >
      {presetsByRow.map((rowPresets, index) => (
        <AnimatedRow
          key={`row-${index}`}
          presets={rowPresets}
          selectedPresetId={selectedPresetId}
          onPresetSelect={onPresetSelect}
          mode={resolvedMode}
          animation={animation}
          layout={layout}
          renderPreset={renderPreset}
          renderColorBox={renderColorBox}
        />
      ))}
    </div>
  );
};
