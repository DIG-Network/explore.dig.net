// AppCard — one dApp on the shelf. The WHOLE card is a link to the detail page; the store's
// signature device is the ambient under-glow in the app's own accent color (--halo), which
// intensifies on hover/focus. Presentational: takes the app, renders, no data calls.

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
      <a className="app-card-link" href={`/app/${app.slug}`}>
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
    </article>
  );
}
