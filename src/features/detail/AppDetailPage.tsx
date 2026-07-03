// AppDetailPage — one listing's full page: hero banner (accent-lit), identity block with the
// primary CTA, real screenshots, the author's long description (safe markdown), and the meta
// panel. An unknown slug renders the not-found state (an invitation back to the shelf, §6.6 —
// every state is a real state).

import type { CSSProperties } from "react";
import type { CatalogApp } from "@/catalog/types";
import { accentGlow, appBySlug } from "@/catalog/catalog";
import { AppIcon } from "@/components/AppIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { Markdown } from "@/lib/markdown";
import { useT } from "@/i18n/useT";
import { categoryKey } from "@/features/store/categoryKeys";
import { ScreenshotGallery } from "./ScreenshotGallery";
import { MetaPanel } from "./MetaPanel";

export function NotFound() {
  const t = useT();
  return (
    <section className="not-found" data-testid="not-found">
      <h1>{t("notFoundHeading")}</h1>
      <p>{t("notFoundBody")}</p>
      <a className="btn btn-primary" href="/">
        {t("notFoundCta")}
      </a>
    </section>
  );
}

export interface AppDetailPageProps {
  apps: CatalogApp[];
  slug: string;
}

export function AppDetailPage({ apps, slug }: AppDetailPageProps) {
  const t = useT();
  const app = appBySlug(apps, slug);
  if (!app) return <NotFound />;

  const style = {
    "--halo": accentGlow(app.accentColor, 0.35),
    "--halo-border": accentGlow(app.accentColor, 0.45),
  } as CSSProperties;

  const hasPlaceholders = (app.placeholderAssets?.length ?? 0) > 0;

  return (
    <div className="detail" style={style} data-testid={`detail-${app.slug}`}>
      <nav className="crumb" aria-label={t("backToStore")}>
        <a href="/">← {t("backToStore")}</a>
      </nav>

      {app.assets.hero && (
        <div className="detail-hero">
          <img src={app.assets.hero} alt={t("heroAlt", { name: app.name })} />
        </div>
      )}

      <header className="detail-head">
        <AppIcon app={app} size={96} />
        <div className="detail-title">
          <h1>{app.name}</h1>
          <p className="detail-tagline">{app.tagline}</p>
          <div className="app-card-meta">
            <span className="chip">{t(categoryKey(app.category))}</span>
            <StatusBadge status={app.status} />
            {app.featured && <span className="chip chip-featured">{t("featuredBadge")}</span>}
          </div>
        </div>
        <div className="detail-actions">
          <a className="btn btn-primary" href={app.url} target="_blank" rel="noopener noreferrer" data-testid="open-dapp">
            {t("openApp")}
          </a>
          <a className="btn btn-ghost" href={app.repo} target="_blank" rel="noopener noreferrer">
            {t("viewSource")}
          </a>
        </div>
      </header>

      <div className="detail-body">
        <div className="detail-main">
          <ScreenshotGallery app={app} />
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="section-heading">
              {t("aboutHeading")}
            </h2>
            <Markdown source={app.description} />
          </section>
          {hasPlaceholders && (
            <p className="placeholder-note" data-testid="placeholder-note">
              {t("placeholderNote")}
            </p>
          )}
        </div>
        <MetaPanel app={app} />
      </div>
    </div>
  );
}
