// ViewTabs — switches between the two top-level browse views: the curated Store shelf and the
// mobile-home-screen "Apps" icon grid (#51). Real page navigations (<a>), consistent with the rest
// of the site's routing (every route is a real, prerenderable page) — no client router. The active
// view is marked with aria-current="page" so sighted users AND assistive tech agree on where they
// are (WCAG 2.4.8 / 4.1.2).

import { useT } from "@/i18n/useT";

export type ActiveView = "store" | "apps";

export interface ViewTabsProps {
  active: ActiveView;
}

export function ViewTabs({ active }: ViewTabsProps) {
  const t = useT();
  return (
    <nav className="view-tabs" aria-label={t("viewTabsLabel")}>
      <a
        className="view-tab"
        href="/"
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
