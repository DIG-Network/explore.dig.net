// FeaturedShowcase — the curated top shelf: each featured app as a large "capsule" card pairing
// its hero banner with the pitch + CTAs, lit by the app's accent halo. Rendered only when the
// catalog has featured apps (the section disappears rather than showing an empty shell).

import type { CatalogApp } from "@/catalog/types";
import { accentGlow } from "@/catalog/catalog";
import { AppIcon } from "@/components/AppIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { useT } from "@/i18n/useT";
import { categoryKey } from "./categoryKeys";
import type { CSSProperties } from "react";

export function FeaturedShowcase({ apps }: { apps: CatalogApp[] }) {
  const t = useT();
  if (apps.length === 0) return null;

  return (
    <section className="featured" aria-labelledby="featured-heading">
      <h2 id="featured-heading" className="section-heading">
        {t("featuredHeading")}
      </h2>
      {apps.map((app) => {
        const style = {
          "--halo": accentGlow(app.accentColor, 0.4),
          "--halo-border": accentGlow(app.accentColor, 0.5),
        } as CSSProperties;
        return (
          <article className="featured-card" style={style} key={app.slug} data-testid={`featured-${app.slug}`}>
            <div className="featured-copy">
              <div className="featured-title">
                <AppIcon app={app} size={64} />
                <div>
                  <h3>{app.name}</h3>
                  <div className="app-card-meta">
                    <span className="chip">{t(categoryKey(app.category))}</span>
                    <StatusBadge status={app.status} />
                  </div>
                </div>
              </div>
              <p className="featured-tagline">{app.tagline}</p>
              <div className="featured-actions">
                <a className="btn btn-primary" href={app.url} target="_blank" rel="noopener noreferrer">
                  {t("openApp")}
                </a>
                <a className="btn btn-ghost" href={`/app/${app.slug}`}>
                  {t("detailsHeading")}
                </a>
              </div>
            </div>
            {app.assets.hero && (
              <a className="featured-art" href={`/app/${app.slug}`} tabIndex={-1} aria-hidden="true">
                <img src={app.assets.hero} alt="" loading="lazy" />
              </a>
            )}
          </article>
        );
      })}
    </section>
  );
}
