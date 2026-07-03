// App — the store shell: header (brand, language, theme), the routed page (home / app detail /
// not-found), the footer, and the shared floating bug-report widget (CLAUDE.md §6.7). Semantic
// landmarks (header/main/footer) + a skip link for accessibility (§6.6).

import { useEffect, useMemo } from "react";
import { BugReportButton } from "@dignetwork/components";
import { loadCatalog } from "@/catalog/catalog";
import { parseRoute } from "@/lib/route";
import { APP_VERSION } from "@/lib/version";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HomePage } from "@/features/store/HomePage";
import { AppDetailPage, NotFound } from "@/features/detail/AppDetailPage";
import { useT } from "@/i18n/useT";

// The GitHub repo bug reports file into — the shared widget's one required prop. `apiBase` and
// `position` keep their component defaults (api.bugreport.dig.net, bottom-right).
const BUG_REPORT_REPO = "explore.dig.net";

const SPEC_URL = "https://github.com/DIG-Network/explore.dig.net/blob/main/SPEC.md";
const REPO_URL = "https://github.com/DIG-Network/explore.dig.net";
const DISCORD_URL = "https://discord.gg/dignetwork";

export interface AppProps {
  /** The URL pathname (defaults to the live location; injectable for tests). */
  pathname?: string;
  /** The URL search string (defaults to the live location; injectable for tests). */
  search?: string;
}

export function App({ pathname, search }: AppProps) {
  const t = useT();
  const rawPath = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const route = useMemo(() => parseRoute(rawPath), [rawPath]);
  const catalog = useMemo(() => loadCatalog(), []);

  // Keep the tab title honest on the client too (prerendered pages already ship the right title;
  // this covers dev mode and any client-side entry).
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (route.kind === "app") {
      const app = catalog.apps.find((a) => a.slug === route.slug);
      if (app) document.title = `${app.name} — ${app.tagline} · explore.dig.net`;
    }
  }, [route, catalog]);

  return (
    <>
      <a href="#main" className="skip-link">
        {t("skipToContent")}
      </a>

      <header className="site-header">
        <div className="shell site-header-inner">
          <a className="brand" href="/">
            <svg viewBox="0 0 64 64" className="brand-mark" aria-hidden="true">
              <circle cx="32" cy="32" r="21" fill="none" stroke="url(#brand-g)" strokeWidth="4" />
              <defs>
                <linearGradient id="brand-g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#5800D6" />
                  <stop offset="1" stopColor="#FF00DE" />
                </linearGradient>
              </defs>
              <path d="M32 13 L39 32 L32 51 L25 32 Z" fill="url(#brand-g)" />
            </svg>
            <span className="brand-name">
              explore<span className="brand-tld">.dig.net</span>
            </span>
          </a>
          <span className="header-tag">{t("headerTagline")}</span>
          <div className="header-actions">
            <a className="btn btn-ghost btn-small" href={SPEC_URL} target="_blank" rel="noopener noreferrer">
              {t("submitCta")}
            </a>
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" className="shell site-main">
        {route.kind === "home" && <HomePage apps={catalog.apps} search={search} />}
        {route.kind === "app" && <AppDetailPage apps={catalog.apps} slug={route.slug} />}
        {route.kind === "not-found" && <NotFound />}
      </main>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <p className="footer-tagline">{t("footerTagline")}</p>
          <p className="footer-submit">
            {t("footerSubmitLead")}{" "}
            <a href={SPEC_URL} target="_blank" rel="noopener noreferrer">
              {t("footerSubmitLink")}
            </a>
          </p>
          <nav className="footer-links" aria-label="explore.dig.net">
            <a href="https://dig.net" target="_blank" rel="noopener noreferrer">
              {t("footerDignet")}
            </a>
            <a href="https://docs.dig.net" target="_blank" rel="noopener noreferrer">
              {t("footerDocs")}
            </a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              {t("footerGitHub")}
            </a>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
              {t("footerDiscord")}
            </a>
            <a href="/catalog.json">{t("footerCatalog")}</a>
          </nav>
          <p className="footer-version" data-testid="app-version">
            {t("versionLabel", { version: APP_VERSION })}
          </p>
        </div>
      </footer>

      <BugReportButton repo={BUG_REPORT_REPO} appVersion={APP_VERSION} />
    </>
  );
}
