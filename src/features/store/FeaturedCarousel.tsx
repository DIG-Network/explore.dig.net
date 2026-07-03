// FeaturedCarousel — the curated top shelf as a rotating spotlight so EVERY featured dApp gets
// equal airtime (a fair, deterministic daily-rotating start index + auto-advance), not a fixed
// pecking order. Each slide is a hero-quality capsule (the app's art + pitch + a prominent
// "Open dApp" CTA) that funnels visitors straight into the app.
//
// Accessibility (WCAG 2.2 AA, §6.6, ARIA APG carousel pattern):
//   • region with aria-roledescription="carousel"; each slide a group with roledescription="slide";
//   • prev/next + a slide-picker (dots) + a play/pause rotation control, all keyboard-operable;
//   • arrow keys step slides; visible focus (styles.css);
//   • auto-advance PAUSES on hover, on focus-within, and under prefers-reduced-motion;
//   • a polite live region announces the current slide when rotation is not running.

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { CatalogApp } from "@/catalog/types";
import { accentGlow } from "@/catalog/catalog";
import { AppIcon } from "@/components/AppIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useT } from "@/i18n/useT";
import { categoryKey } from "./categoryKeys";
import { dailySeed, initialFeaturedIndex, nextIndex, prevIndex, wrapIndex } from "./carousel";

const DEFAULT_INTERVAL_MS = 7000;

export interface FeaturedCarouselProps {
  apps: CatalogApp[];
  /** Deterministic start slide (tests). Defaults to a daily-rotating fair index. */
  initialIndex?: number;
  /** Auto-advance interval, ms (default 7000). */
  intervalMs?: number;
}

/** The inner capsule for one featured app — shared by the single-slide and carousel layouts. */
function FeaturedSlide({
  app,
  index,
  total,
}: {
  app: CatalogApp;
  index: number;
  total: number;
}) {
  const t = useT();
  const style = {
    "--halo": accentGlow(app.accentColor, 0.42),
    "--halo-border": accentGlow(app.accentColor, 0.55),
  } as CSSProperties;

  return (
    <article
      className="featured-card"
      style={style}
      key={app.slug}
      data-testid={`featured-${app.slug}`}
      role="group"
      aria-roledescription={t("slideRoleDescription")}
      aria-label={t("carouselSlideLabel", { n: index + 1, total, name: app.name })}
    >
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
          <a
            className="btn btn-primary btn-lg"
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
          <a className="btn btn-ghost" href={`/app/${app.slug}`}>
            {t("viewDetails")}
          </a>
        </div>
      </div>
      {app.assets.hero && (
        <a className="featured-art" href={`/app/${app.slug}`} tabIndex={-1} aria-hidden="true">
          <img src={app.assets.hero} alt="" loading="eager" />
        </a>
      )}
    </article>
  );
}

export function FeaturedCarousel({ apps, initialIndex, intervalMs = DEFAULT_INTERVAL_MS }: FeaturedCarouselProps) {
  const t = useT();
  const count = apps.length;
  const reduced = useReducedMotion();

  const [index, setIndex] = useState(() =>
    wrapIndex(initialIndex ?? initialFeaturedIndex(count, dailySeed()), count),
  );
  const [playing, setPlaying] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const go = useCallback((to: number) => setIndex(() => wrapIndex(to, count)), [count]);
  const goNext = useCallback(() => setIndex((i) => nextIndex(i, count)), [count]);
  const goPrev = useCallback(() => setIndex((i) => prevIndex(i, count)), [count]);

  const interacting = hovering || focusWithin;
  const autoRotating = playing && !reduced; // policy: is auto-rotation "on"?
  const effectivePlaying = autoRotating && !interacting && count > 1; // is the timer actually running?

  useEffect(() => {
    if (!effectivePlaying) return;
    const id = window.setInterval(() => setIndex((i) => nextIndex(i, count)), intervalMs);
    return () => window.clearInterval(id);
  }, [effectivePlaying, intervalMs, count]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    }
  };

  if (count === 0) return null;

  const active = apps[wrapIndex(index, count)];

  // A single featured app has nothing to rotate — render the capsule on its own (no controls).
  if (count === 1) {
    return (
      <section className="featured" aria-labelledby="featured-heading">
        <div className="featured-head">
          <h2 id="featured-heading" className="section-heading">
            {t("featuredHeading")}
          </h2>
          <p className="featured-intro">{t("featuredIntro")}</p>
        </div>
        <FeaturedSlide app={active} index={0} total={1} />
      </section>
    );
  }

  return (
    <section className="featured" aria-labelledby="featured-heading">
      <div className="featured-head">
        <h2 id="featured-heading" className="section-heading">
          {t("featuredHeading")}
        </h2>
        <p className="featured-intro">{t("featuredIntro")}</p>
      </div>

      <div
        className="carousel"
        ref={regionRef}
        role="region"
        aria-roledescription={t("carouselRoleDescription")}
        aria-label={t("carouselLabel")}
        data-testid="featured-carousel"
        data-playing={String(effectivePlaying)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setFocusWithin(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
        }}
        onKeyDown={onKeyDown}
      >
        <div className="carousel-viewport">
          <FeaturedSlide app={active} index={wrapIndex(index, count)} total={count} />
        </div>

        <div className="carousel-controls">
          <div className="carousel-dots" role="group" aria-label={t("carouselLabel")}>
            {apps.map((a, i) => (
              <button
                key={a.slug}
                type="button"
                className="carousel-dot"
                aria-current={i === wrapIndex(index, count)}
                aria-label={t("carouselGoTo", { n: i + 1 })}
                data-testid={`carousel-dot-${i}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <div className="carousel-nav">
            <button
              type="button"
              className="carousel-btn carousel-playpause"
              onClick={() => setPlaying((p) => !p)}
              aria-label={autoRotating ? t("carouselPause") : t("carouselPlay")}
              data-testid="carousel-playpause"
            >
              <span aria-hidden="true">{autoRotating ? "❚❚" : "▶"}</span>
            </button>
            <button
              type="button"
              className="carousel-btn carousel-prev"
              onClick={goPrev}
              aria-label={t("carouselPrev")}
              data-testid="carousel-prev"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="carousel-btn carousel-next"
              onClick={goNext}
              aria-label={t("carouselNext")}
              data-testid="carousel-next"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>

        <div className="visually-hidden" aria-live={effectivePlaying ? "off" : "polite"} data-testid="carousel-status">
          {t("carouselSlideLabel", { n: wrapIndex(index, count) + 1, total: count, name: active.name })}
        </div>
      </div>
    </section>
  );
}
