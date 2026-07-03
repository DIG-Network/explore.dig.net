// AppCard — one dApp on the shelf. The card body links to the detail page (learn more); a distinct
// footer CTA opens the live dApp directly (the funnel action) — two sibling links, never nested.
// The store's signature device is the ambient under-glow in the app's own accent color (--halo),
// which intensifies on hover/focus.

import type { CatalogApp } from "@/catalog/types";
import { accentGlow } from "@/catalog/catalog";
import { AppIcon } from "@/components/AppIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { useT } from "@/i18n/useT";
import { categoryKey } from "./categoryKeys";
import type { CSSProperties } from "react";

export function AppCard({ app }: { app: CatalogApp }) {
  const t = useT();
  const style = {
    "--halo": accentGlow(app.accentColor, 0.34),
    "--halo-strong": accentGlow(app.accentColor, 0.55),
    "--halo-border": accentGlow(app.accentColor, 0.45),
  } as CSSProperties;

  return (
    <article className="app-card" style={style} data-testid={`app-card-${app.slug}`}>
      <a className="app-card-link" href={`/app/${app.slug}`} data-testid={`app-card-link-${app.slug}`}>
        <div className="app-card-head">
          <AppIcon app={app} size={56} />
          <div className="app-card-title">
            <h3>{app.name}</h3>
            <p className="app-card-tagline">{app.tagline}</p>
          </div>
        </div>
        <div className="app-card-meta">
          <span className="chip">{t(categoryKey(app.category))}</span>
          <StatusBadge status={app.status} />
          {app.featured && <span className="chip chip-featured">{t("featuredBadge")}</span>}
        </div>
      </a>
      <div className="app-card-foot">
        <a
          className="btn btn-primary btn-block"
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("openAppNamed", { name: app.name })}
        >
          {t("openApp")}
          <span aria-hidden="true" className="btn-arrow">
            →
          </span>
        </a>
      </div>
    </article>
  );
}
