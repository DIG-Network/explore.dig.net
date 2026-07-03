// AppIcon — an app's icon medallion. Renders the listing's real icon-512 with a localized alt; if
// the image fails to load (a broken deploy, an offline agent snapshot) it falls back to a branded
// monogram tile tinted by the app's accent so the card never shows a broken-image glyph.

import { useState } from "react";
import type { CatalogApp } from "@/catalog/types";
import { accentGlow } from "@/catalog/catalog";
import { useT } from "@/i18n/useT";

export interface AppIconProps {
  app: CatalogApp;
  /** Rendered pixel size (the source is 512×512). */
  size?: number;
}

export function AppIcon({ app, size = 56 }: AppIconProps) {
  const [failed, setFailed] = useState(false);
  const t = useT();

  if (failed) {
    return (
      <span
        className="app-icon app-icon-fallback"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${accentGlow(app.accentColor, 0.9)}, ${accentGlow(app.accentColor, 0.5)})`,
        }}
        role="img"
        aria-label={t("iconAlt", { name: app.name })}
        data-testid="app-icon-fallback"
      >
        {app.name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      className="app-icon"
      src={app.assets.icon}
      alt={t("iconAlt", { name: app.name })}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
