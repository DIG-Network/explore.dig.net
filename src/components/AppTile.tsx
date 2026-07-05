// AppTile — one dApp rendered as a phone-home-screen icon: a rounded icon + a short name label
// beneath it (the "Apps" tab's signature layout, #51). Reuses AppIcon as-is (its fan-out across
// Store/Detail is high — CLAUDE.md §2.0 blast-radius — so this only re-styles it via CSS descendant
// selectors, never edits it). Two sibling links, same pattern as AppCard: the tile itself opens the
// dApp directly (the primary phone-home-screen action — tap an icon, the app opens); a small corner
// "i" affordance is a SEPARATE link to the detail page for anyone who wants more before committing.

import type { CatalogApp } from "@/catalog/types";
import { AppIcon } from "@/components/AppIcon";
import { useT } from "@/i18n/useT";

export interface AppTileProps {
  app: CatalogApp;
}

export function AppTile({ app }: AppTileProps) {
  const t = useT();
  return (
    <div className="app-tile" role="listitem" data-testid={`app-tile-${app.slug}`}>
      <a
        className="app-tile-link"
        href={app.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("openAppNamed", { name: app.name })}
        data-testid={`app-tile-link-${app.slug}`}
      >
        <span className="app-tile-icon-frame">
          <AppIcon app={app} size={72} />
        </span>
        <span className="app-tile-name">{app.name}</span>
      </a>
      <a
        className="app-tile-info"
        href={`/app/${app.slug}`}
        aria-label={t("viewDetailsFor", { name: app.name })}
        data-testid={`app-tile-info-${app.slug}`}
      >
        <span aria-hidden="true">i</span>
      </a>
    </div>
  );
}
