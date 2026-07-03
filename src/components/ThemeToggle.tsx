// ThemeToggle — DIG brand light/dark switch (DEFAULT DARK, see src/lib/theme.ts). A single
// icon-button whose accessible name says what pressing it DOES (switch to the other theme).

import { useState } from "react";
import { applyTheme, initialTheme, otherTheme, persistTheme, type Theme } from "@/lib/theme";
import { useT } from "@/i18n/useT";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => initialTheme());
  const t = useT();
  const next = otherTheme(theme);

  const onToggle = () => {
    setTheme(next);
    applyTheme(next);
    persistTheme(next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={next === "light" ? t("themeToLight") : t("themeToDark")}
      data-testid="theme-toggle"
    >
      <span aria-hidden="true">{theme === "dark" ? "◐" : "◑"}</span>
    </button>
  );
}
