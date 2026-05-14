/**
 * Palette A — "Editorial Indigo"
 * Mirrors the CSS variables in app/globals.css.
 * To swap palettes, change values here and in globals.css together.
 */
export const palette = {
  light: {
    background: "#faf9f7",
    foreground: "#0b0f19",
    card: "#ffffff",
    border: "#e7e5e4",
    muted: "#f5f4f1",
    mutedForeground: "#6b7280",
    primary: "#4f46e5",
    primaryForeground: "#ffffff",
    accent: "#f59e0b",
    accentForeground: "#0b0f19",
    destructive: "#dc2626",
    success: "#059669",
    warning: "#d97706",
    info: "#2563eb",
  },
  dark: {
    background: "#0a0a0f",
    foreground: "#e4e4e7",
    card: "#131318",
    border: "#27272a",
    muted: "#1c1c22",
    mutedForeground: "#a1a1aa",
    primary: "#818cf8",
    primaryForeground: "#0a0a0f",
    accent: "#fbbf24",
    accentForeground: "#0a0a0f",
    destructive: "#f87171",
    success: "#34d399",
    warning: "#fbbf24",
    info: "#60a5fa",
  },
} as const;

export const themeMeta = {
  defaultMode: "system",
  storageKey: "bs.theme",
  paletteName: "Editorial Indigo",
} as const;
