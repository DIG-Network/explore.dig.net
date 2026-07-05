// ViewTabs — switches between the two top-level browse views: the curated Store shelf and the
// mobile-home-screen "Apps" launcher (#51). Real page navigations (<a>), consistent with the rest
// of the site's routing (every route is a real, prerenderable page) — no client router. The active
// view is marked with aria-current="page" so sighted users AND assistive tech agree on where they
// are (WCAG 2.4.8 / 4.1.2).

import { useT } from "@/i18n/useT";

export type ActiveView = "store" | "apps";

export interface ViewTabsProps {
  active: ActiveView;
  /**
   * Where the Store tab links. Defaults to `/`. On phones the landing (`/`) defaults to the Apps
   * launcher, so App passes an explicit `/?view=store` here to keep the store reachable from the
   * launcher (#51 follow-up); on desktop the bare `/` is already the store.
   */
  storeHref?: string;
}

export function ViewTabs({ active, storeHref = "/" }: ViewTabsProps) {
  const t = useT();
  return (
    <nav className="view-tabs" aria-label={t("viewTabsLabel")}>
      <a
        className="view-tab"
        href={storeHref}
        aria-current={active === "store" ? "page" : undefined}
        data-testid="view-tab-store"
      >
        {t("storeTabLabel")}
      </a>
      <a
        className="view-tab"
        href="/apps"
        aria-current={active === "apps" ? "page" : undefined}
        data-testid="view-tab-apps"
      >
        {t("appsTabLabel")}
      </a>
    </nav>
  );
}
