// theme.ts — DIG brand light + dark, DEFAULT DARK (the store is a marketing surface; the dark
// cosmic-navy gallery is the brand's primary look). An explicit user choice is persisted and wins
// on every future visit; without one the store stays dark regardless of OS preference.
//
// The active theme lives on <html data-theme="dark|light">; styles.css swaps token values on it.

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "explore.theme";
export const DEFAULT_THEME: Theme = "dark";

/** Is `value` a valid theme name? */
export function isTheme(value: string | null | undefined): value is Theme {
  return value === "dark" || value === "light";
}

/** The persisted explicit choice (if valid), else the dark default. */
export function initialTheme(): Theme {
  try {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(THEME_STORAGE_KEY) : null;
    if (isTheme(stored)) return stored;
  } catch {
    /* localStorage blocked — fall through to the default */
  }
  return DEFAULT_THEME;
}

/** Persist an explicit theme choice (no-throw). */
export function persistTheme(theme: Theme): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** Apply a theme to the document root (and keep theme-color in sync for mobile chrome). */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  const meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0A0A20" : "#FFFFFF");
}

export function otherTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}
