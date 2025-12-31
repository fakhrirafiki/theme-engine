# 🎨 Theme Engine

Theme system for **Next.js (App Router)**: mode (`light | dark | system`) + theme presets (semantic tokens via CSS variables).

> ✅ Opinionated defaults, minimal setup, and TypeScript autocomplete that “just works”.

![npm version](https://img.shields.io/npm/v/@fakhrirafiki/theme-engine)
![npm downloads](https://img.shields.io/npm/dm/@fakhrirafiki/theme-engine)
![license](https://img.shields.io/npm/l/@fakhrirafiki/theme-engine)

Live demo: https://theme-engine-example.vercel.app/

## ✨ Why use this?

- ⚡ **Fast setup**: 1 CSS import + 1 provider
- 🌓 **Mode support**: `light | dark | system` (with View Transition ripple when supported)
- 🎨 **Theme presets**: built-in presets + your own presets
- 🧠 **DX-first**: `useThemeEngine()` for everything
- 🧩 **Tailwind v4 friendly**: `@theme inline` tokens included (works with shadcn-style semantic tokens)

## 📚 Table of contents

- [Install](#-install)
- [Quick Start (Nextjs App Router)](#-quick-start-nextjs-app-router)
- [Usage](#-usage)
- [Custom presets](#-custom-presets-recommended)
- [Built-in presets](#-built-in-presets)
- [Tailwind tokens](#-tailwind-tokens-you-get)
- [Components](#-components)
- [Recipe: ThemePresetSelect](#-recipe-themepresetselect-simple-list)
- [API reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)

## Install

```bash
pnpm add @fakhrirafiki/theme-engine
```

> Using npm/yarn?
>
> - `npm i @fakhrirafiki/theme-engine`
> - `yarn add @fakhrirafiki/theme-engine`

## 🚀 Quick Start (Next.js App Router)

### 1) Import CSS once

In `src/app/globals.css`:

```css
@import '@fakhrirafiki/theme-engine/styles';
```

✅ Tailwind v4 (recommended order):

```css
@import 'tailwindcss';
@import '@fakhrirafiki/theme-engine/styles';

@custom-variant dark (&:is(.dark *));
```

ℹ️ Not using Tailwind v4?

```css
@import '@fakhrirafiki/theme-engine/styles/base.css';
@import '@fakhrirafiki/theme-engine/styles/animations.css';
@import '@fakhrirafiki/theme-engine/styles/components.css';
@import '@fakhrirafiki/theme-engine/styles/utilities.css';
```

### 2) Wrap your app with `ThemeProvider`

In `src/app/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { ThemeProvider } from '@fakhrirafiki/theme-engine';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultMode="system" defaultPreset="modern-minimal">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 3) Use it

## 🧑‍💻 Usage

Toggle mode:

```tsx
'use client';

import { useThemeEngine } from '@fakhrirafiki/theme-engine';

export function ModeButtons() {
  const { mode, setDarkMode, toggleDarkMode } = useThemeEngine();

  return (
    <div>
      <button onClick={() => setDarkMode('system')}>System</button>
      <button onClick={() => setDarkMode('light')}>Light</button>
      <button onClick={() => setDarkMode('dark')}>Dark</button>
      <button onClick={() => toggleDarkMode()}>Toggle</button>
      <div>Current: {mode}</div>
    </div>
  );
}
```

Pick a theme preset by ID:

```tsx
'use client';

import { useThemeEngine } from '@fakhrirafiki/theme-engine';

export function PresetButtons() {
  const { applyThemeById, clearTheme, currentTheme } = useThemeEngine();

  return (
    <div>
      <button onClick={() => applyThemeById('modern-minimal')}>Modern Minimal</button>
      <button onClick={() => clearTheme()}>Reset</button>
      <div>Active: {currentTheme?.presetName ?? 'Default'}</div>
    </div>
  );
}
```

💡 Want typed autocomplete (built-in IDs + your custom IDs)? Use a generic:

```tsx
'use client';

import { ThemePresets, useThemeEngine } from '@fakhrirafiki/theme-engine';
import { customPresets } from './custom-theme-presets';

export function TypedPresetButtons() {
  const { applyThemeById } = useThemeEngine<ThemePresets<typeof customPresets>>();

  return (
    <div>
      <button onClick={() => applyThemeById('my-brand')}>My Brand</button>
      <button onClick={() => applyThemeById('modern-minimal')}>Modern Minimal</button>
    </div>
  );
}
```

---

## Concepts

### Mode vs preset

- 🌓 **Mode** controls the `<html>` class (`.light` / `.dark`) and `color-scheme`.
- 🎨 **Preset** controls semantic design tokens (CSS variables like `--background`, `--primary`, etc).

### SSR & flashes

- `ThemeProvider` injects a small pre-hydration script to restore **preset colors** before hydration (reduces flashes).
- The pre-hydration script restores **preset colors only** (it does not set the `.dark` / `.light` class).
- `defaultPreset="..."` pre-hydration only works for **built-in presets**. Custom `defaultPreset` still works after hydration.

### Persistence

By default:

- Mode is stored in `localStorage['theme-engine-theme']`
- Preset is stored in `localStorage['theme-preset']`

If you run multiple apps on the same domain, override the keys:

```tsx
<ThemeProvider modeStorageKey="my-app:mode" presetStorageKey="my-app:preset">
  {children}
</ThemeProvider>
```

---

## 🧩 Custom presets (recommended)

Create presets in TweakCN-compatible format and pass them into `ThemeProvider`.

✅ Tip: use `satisfies` to preserve literal keys for TS autocomplete:

### 🎛️ Get a brand theme from TweakCN (recommended)

The fastest way to create a great-looking preset is to use the TweakCN editor:

- https://tweakcn.com/editor/theme

Pick a theme, tweak the colors, then copy the preset output and paste it into your `customPresets` object (it matches the `TweakCNThemePreset` shape).

```ts
import { type TweakCNThemePreset } from '@fakhrirafiki/theme-engine';

export const customPresets = {
  'my-brand': {
    label: 'My Brand',
    styles: {
      light: {
        background: '#ffffff',
        foreground: '#111827',
        primary: '#2563eb',
        'primary-foreground': '#ffffff',
        secondary: '#e5e7eb',
        'secondary-foreground': '#111827',
        card: '#ffffff',
        'card-foreground': '#111827',
      },
      dark: {
        background: '#0b1020',
        foreground: '#f9fafb',
        primary: '#60a5fa',
        'primary-foreground': '#0b1020',
        secondary: '#1f2937',
        'secondary-foreground': '#f9fafb',
        card: '#111827',
        'card-foreground': '#f9fafb',
      },
    },
  },
} satisfies Record<string, TweakCNThemePreset>;
```

Then in your providers/layout:

```tsx
import type { ReactNode } from 'react';
import { ThemeProvider } from '@fakhrirafiki/theme-engine';
import { customPresets } from './custom-theme-presets';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider customPresets={customPresets} defaultPreset="my-brand">
      {children}
    </ThemeProvider>
  );
}
```

Notes:

- Custom presets are validated in `ThemeProvider`.
- Invalid custom presets are skipped (warnings/errors are logged on `localhost`).
- Preset values can be `H S% L%`, `hsl(...)`, `#hex`, `rgb(...)`, and modern CSS colors like `oklch(...)` (they are normalized internally).

---

## 🎁 Built-in presets

The package ships with a built-in preset collection:

```ts
import { getPresetIds, getPresetById } from '@fakhrirafiki/theme-engine';

const ids = getPresetIds();
const modernMinimal = getPresetById('modern-minimal');
```

---

## 🎨 Tailwind tokens you get

After importing `@fakhrirafiki/theme-engine/styles`, you can use semantic tokens like:

| Category | Tailwind class examples | Backed by preset CSS variables | Notes |
| --- | --- | --- | --- |
| Surfaces | `bg-background`, `text-foreground` | `--background`, `--foreground` | Base app background + text |
| Cards | `bg-card`, `text-card-foreground` | `--card`, `--card-foreground` | Cards / panels |
| Popovers | `bg-popover`, `text-popover-foreground` | `--popover`, `--popover-foreground` | Popovers / dropdowns |
| Brand / actions | `bg-primary`, `text-primary-foreground` | `--primary`, `--primary-foreground` | Primary buttons / highlights |
| Secondary | `bg-secondary`, `text-secondary-foreground` | `--secondary`, `--secondary-foreground` | Secondary UI surfaces |
| Muted | `bg-muted`, `text-muted-foreground` | `--muted`, `--muted-foreground` | Subtle backgrounds / helper text |
| Accent | `bg-accent`, `text-accent-foreground` | `--accent`, `--accent-foreground` | Emphasis (not status colors) |
| Destructive | `bg-destructive`, `text-destructive-foreground` | `--destructive`, `--destructive-foreground` | Danger actions |
| Borders / focus | `border-border`, `border-input`, `ring-ring` | `--border`, `--input`, `--ring` | Used by `outline-ring/50` too |
| Charts | `bg-chart-1`, `text-chart-2` | `--chart-1` ... `--chart-5` | Data viz palettes |
| Sidebar | `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-primary`, `border-sidebar-border` | `--sidebar-*` | Handy for dashboard layouts |
| Status accents | `bg-accent-success`, `text-accent-danger-foreground` | `--accent-<name>`, `--accent-<name>-foreground` | Optional: only if preset defines `accent-*` |
| Radius scale | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl` | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` | Derived from `--radius` |
| Tracking scale | `tracking-tighter`, `tracking-wide` | `--tracking-*` | Derived from `--letter-spacing` |
| Fonts | `font-sans`, `font-serif`, `font-mono` | `--font-sans`, `--font-serif`, `--font-mono` | Defaults in `base.css` |
| Shadows | `shadow-sm`, `shadow-md`, `shadow-xl` | `--shadow-*` | Derived from `--shadow-*` knobs |

---

## 🧱 Components

### `ThemeToggle`

Ready-made mode toggle button (with View Transition ripple when supported).

```tsx
'use client';

import { ThemeToggle } from '@fakhrirafiki/theme-engine';

export function HeaderThemeToggle() {
  return <ThemeToggle size="md" variant="ghost" />;
}
```

### `ThemePresetButtons`

Animated preset picker (shows custom presets first, then built-ins):

```tsx
'use client';

import { ThemePresetButtons } from '@fakhrirafiki/theme-engine';

export function PresetPicker() {
  return <ThemePresetButtons />;
}
```

### 🧾 Recipe: `ThemePresetSelect` (simple list)

Want a simple, scrollable preset list (e.g. for a settings modal)? Copy-paste this component and style it however you like.

> Note: this snippet uses Tailwind utility classes. If you don’t use Tailwind, replace the classes with your own styles/UI components.

```tsx
'use client';

import { formatColor, useThemeEngine } from '@fakhrirafiki/theme-engine';

type ThemePresetSelectProps = {
  allowedPresetIds?: string[];
};

export function ThemePresetSelect({
  allowedPresetIds = [
    'modern-minimal',
    'violet-bloom',
    'vercel',
    'mono',
  ],
}: ThemePresetSelectProps) {
  const { currentTheme, applyThemeById, availablePresets, resolvedMode } = useThemeEngine();

  const presets = allowedPresetIds
    .map((id) => {
      const preset = availablePresets[id];
      if (!preset) return null;
      return { id, label: preset.label };
    })
    .filter((preset): preset is { id: string; label: string } => preset !== null);

  const getPreviewColors = (presetId: string): string[] => {
    const preset = availablePresets[presetId];
    if (!preset) return [];

    const scheme = resolvedMode === 'dark' ? preset.styles.dark : preset.styles.light;
    const primary = (scheme as any).primary as string | undefined;
    const secondary = (scheme as any).secondary as string | undefined;
    const accent = (scheme as any).accent as string | undefined;

    return [primary, secondary, accent].filter(Boolean) as string[];
  };

  return (
    <div className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto pr-1">
      {presets.map((preset) => {
        const isActive = currentTheme?.presetId === preset.id;
        const previewColors = getPreviewColors(preset.id).slice(0, 3);

        return (
          <button
            key={preset.id}
            type="button"
            className={`w-full rounded-full border px-3 py-2 text-xs transition-colors ${
              isActive
                ? 'border-primary/70 bg-primary/10 text-foreground'
                : 'border-border bg-muted/40 text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/60'
            }`}
            onClick={() => applyThemeById(preset.id)}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                {previewColors.length > 0 && (
                  <span className="flex gap-1">
                    {previewColors.map((color, index) => (
                      <span
                        key={index}
                        className="inline-block h-2.5 w-2.5 rounded-full border border-foreground/10 shadow-sm"
                        style={{ backgroundColor: formatColor(color, 'hex') }}
                      />
                    ))}
                  </span>
                )}

                <span className="text-xs font-medium text-foreground">{preset.label}</span>
              </span>

              {isActive && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-foreground">
                  Aktif
                </span>
              )}
            </span>
          </button>
        );
      })}

      {presets.length === 0 && <p className="text-xs text-muted-foreground">Belum ada tema yang tersedia.</p>}
    </div>
  );
}
```

---

## 🧾 API Reference

### `ThemeProvider`

```ts
<ThemeProvider
  defaultMode="system"
  defaultPreset="modern-minimal"
  modeStorageKey="theme-engine-theme"
  presetStorageKey="theme-preset"
  customPresets={customPresets}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | required | React subtree |
| `defaultMode` | `Mode` | `'system'` | Used when no persisted value |
| `defaultPreset` | `BuiltInPresetId \| keyof customPresets` | `undefined` | Default preset (see SSR note) |
| `modeStorageKey` | `string` | `'theme-engine-theme'` | `localStorage` key for mode |
| `presetStorageKey` | `string` | `'theme-preset'` | `localStorage` key for preset |
| `customPresets` | `Record<string, TweakCNThemePreset>` | `undefined` | Add your own presets (can override built-ins by ID) |
| `Pre-hydration script` | n/a | always on | `ThemeProvider` always injects a pre-hydration script for preset restoration |

### `useThemeEngine()`

Signature:

```ts
useThemeEngine<TCustomPresets = undefined>()
```

To get typed custom preset IDs:

```ts
useThemeEngine<ThemePresets<typeof customPresets>>()
```

Return fields:

| Field | Type | Description |
| --- | --- | --- |
| `darkMode` | `boolean` | `resolvedMode === 'dark'` |
| `mode` | `'light' \| 'dark' \| 'system'` | Current user preference |
| `resolvedMode` | `'light' \| 'dark'` | Resolved mode (never `system`) |
| `setDarkMode` | `(mode: Mode) => void` | Set `light \| dark \| system` |
| `toggleDarkMode` | `(coords?: { x: number; y: number }) => void` | Toggles light/dark (and exits `system`) |
| `applyThemeById` | `(id: ThemeId) => void` | Apply a preset by ID (alias: `applyPresetById`) |
| `clearTheme` | `() => void` | Clear preset and fall back to `defaultPreset` if provided (alias: `clearPreset`) |
| `currentTheme` | `{ presetId; presetName; colors; appliedAt } \| null` | Current preset (alias: `currentPreset`) |
| `isUsingDefaultPreset` | `boolean` | Whether current preset equals `defaultPreset` |
| `availablePresets` | `Record<string, TweakCNThemePreset>` | Built-in + custom |
| `builtInPresets` | `Record<string, TweakCNThemePreset>` | Built-in only |
| `customPresets` | `Record<string, TweakCNThemePreset>` | Custom only |

### Utilities

| Export | Description |
| --- | --- |
| `formatColor(color, format)` | Converts a color string into `hsl`/`rgb`/`hex` |
| `withAlpha(hslTriplet, alpha)` | Adds alpha to an HSL triplet |

---

## 🩹 Troubleshooting

### `useThemeEngine must be used within a ThemeProvider`

Wrap your component tree with `ThemeProvider` (and ensure the component is a client component).

Note: the thrown error string might mention `useTheme` because `useThemeEngine()` uses it internally.

### Preset doesn’t apply on refresh

`ThemeProvider` injects a pre-hydration script automatically. Avoid injecting another preset-restoration script manually (you may end up with duplicates).

### Styles don’t load / components look unstyled

Ensure your `globals.css` imports `@fakhrirafiki/theme-engine/styles` (and Tailwind v4 is configured if you rely on Tailwind utilities).

### Turbopack: “module factory is not available” (HMR) after upgrading

This is a Next.js Turbopack dev/HMR issue that can happen after updating dependencies in `node_modules` (or when using a locally linked package that rebuilds `dist/` while `next dev` is running).

- Restart `next dev` (often enough).
- If it persists: delete `.next/` and restart.
- Workaround: run dev server with webpack: `next dev --webpack`

---

## License

MIT
