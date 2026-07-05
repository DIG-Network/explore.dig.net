// AppsHomeScreen — the "Apps" tab (#51): every listed dApp rendered as a phone-home-screen icon —
// tap an icon, the app opens, exactly like a phone's home screen. Reuses the SAME catalog data +
// icons as the store grid (no duplicated metadata model); this is purely an alternate, mobile-first
// presentation for phone users, and what the dig-chrome-extension's "Explore DIG Network" surfaces.
// Deliberately has no search/filter — that stays on the Store tab; this is the simple launcher.
//
// Below the launcher breakpoint (600px, useLauncherViewport / styles.css) this reads as a genuine
// Android home screen: a full-bleed violet→magenta ambient WALLPAPER (the fixed `.launcher-wallpaper`
// layer), big rounded app icons floating with soft shadows, labels beneath, and a decorative bottom
// home-indicator pill. Above the breakpoint it is the tidy centered desktop icon grid. Both the
// wallpaper and the indicator are decorative launcher chrome (`aria-hidden`) and are display:none on
// desktop — they never enter the accessibility tree and never affect the store view.

import type { CatalogApp } from "@/catalog/types";
import { useT } from "@/i18n/useT";
import { AppTile } from "@/components/AppTile";

export interface AppsHomeScreenProps {
  apps: CatalogApp[];
}

export function AppsHomeScreen({ apps }: AppsHomeScreenProps) {
  const t = useT();
  return (
    <section className="apps-home" aria-labelledby="apps-home-heading">
      {/* Ambient home-screen wallpaper — fixed behind the icons on phones only (decorative). */}
      <div className="launcher-wallpaper" data-testid="launcher-wallpaper" aria-hidden="true" />

      <div className="apps-home-head">
        <h1 id="apps-home-heading" className="apps-home-heading">
          {t("appsPageHeading")}
        </h1>
        <span className="apps-count" data-testid="apps-home-count" aria-live="polite">
          {t("appsCount", { count: apps.length })}
        </span>
      </div>
      <p className="apps-home-intro">{t("appsPageIntro")}</p>

      <div
        className="app-home-grid"
        role="list"
        aria-label={t("appsGridLabel")}
        data-testid="app-home-grid"
      >
        {apps.map((app) => (
          <AppTile key={app.slug} app={app} />
        ))}
      </div>

      {/* Bottom home-indicator pill — a recognizable phone-screen cue on the launcher (decorative). */}
      <div className="launcher-home-indicator" aria-hidden="true" />
    </section>
  );
}
