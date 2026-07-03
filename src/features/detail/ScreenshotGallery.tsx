// ScreenshotGallery — the detail page's screenshot strip: a horizontal scroll-snap row mixing
// desktop (16:10) and mobile (9:16) captures at a common height. Screenshots are ALWAYS real
// captures of the running dApp (SPEC.md §4.4 forbids placeholder screenshots), so the section
// renders only when the listing ships at least one.

import type { CatalogApp } from "@/catalog/types";
import { useT } from "@/i18n/useT";

export function ScreenshotGallery({ app }: { app: CatalogApp }) {
  const t = useT();
  const { desktop, mobile } = app.assets.screenshots;
  if (desktop.length === 0 && mobile.length === 0) return null;

  return (
    <section className="gallery" aria-labelledby="screenshots-heading">
      <h2 id="screenshots-heading" className="section-heading">
        {t("screenshotsHeading")}
      </h2>
      <div className="gallery-strip" data-testid="screenshot-gallery" tabIndex={0}>
        {desktop.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={t("screenshotDesktopAlt", { name: app.name, n: i + 1 })}
            className="shot shot-desktop"
            loading="lazy"
          />
        ))}
        {mobile.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={t("screenshotMobileAlt", { name: app.name, n: i + 1 })}
            className="shot shot-mobile"
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
}
