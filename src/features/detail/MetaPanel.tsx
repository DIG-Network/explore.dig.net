// MetaPanel — the detail page's machine-facts sidebar: category, tags, chain, status, listed
// date, author, license, app version, and the listing's extra links. Definition-list semantics;
// labels in Space Mono via CSS. Dates render through the i18n layer (FormattedDate → CLDR).

import { FormattedDate } from "react-intl";
import type { CatalogApp } from "@/catalog/types";
import { StatusBadge } from "@/components/StatusBadge";
import { useT } from "@/i18n/useT";
import { categoryKey } from "@/features/store/categoryKeys";

const LINK_KEYS = [
  ["docs", "linkDocs"],
  ["discord", "linkDiscord"],
  ["x", "linkX"],
  ["youtube", "linkYouTube"],
  ["blog", "linkBlog"],
] as const;

export function MetaPanel({ app }: { app: CatalogApp }) {
  const t = useT();
  const links = LINK_KEYS.filter(([key]) => app.links?.[key]);

  return (
    <aside className="meta-panel" aria-labelledby="details-heading">
      <h2 id="details-heading" className="section-heading">
        {t("detailsHeading")}
      </h2>
      <dl className="meta-list">
        <dt>{t("categoryLabel")}</dt>
        <dd>{t(categoryKey(app.category))}</dd>

        <dt>{t("statusLabel")}</dt>
        <dd>
          <StatusBadge status={app.status} />
        </dd>

        <dt>{t("chainLabel")}</dt>
        <dd className="mono">Chia</dd>

        <dt>{t("addedLabel")}</dt>
        <dd>
          {/* addedDate is a calendar date (YYYY-MM-DD); pin UTC so it never shifts a day with
              the viewer's timezone. */}
          <FormattedDate value={app.addedDate} year="numeric" month="long" day="numeric" timeZone="UTC" />
        </dd>

        <dt>{t("authorLabel")}</dt>
        <dd>
          {app.author.url ? (
            <a href={app.author.url} target="_blank" rel="noopener noreferrer">
              {app.author.name}
            </a>
          ) : (
            app.author.name
          )}
        </dd>

        {app.license && (
          <>
            <dt>{t("licenseLabel")}</dt>
            <dd className="mono">{app.license}</dd>
          </>
        )}

        {app.version && (
          <>
            <dt>{t("appVersionLabel")}</dt>
            <dd className="mono">{app.version}</dd>
          </>
        )}

        <dt>{t("tagsLabel")}</dt>
        <dd>
          <span className="tag-row">
            {app.tags.map((tag) => (
              <span className="chip" key={tag}>
                {tag}
              </span>
            ))}
          </span>
        </dd>
      </dl>

      {(links.length > 0 || app.url || app.repo) && (
        <>
          <h2 className="section-heading">{t("linksHeading")}</h2>
          <ul className="link-list">
            <li>
              <a href={app.url} target="_blank" rel="noopener noreferrer">
                {t("linkWebsite")}
              </a>
            </li>
            {app.repo && (
              <li>
                <a href={app.repo} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </li>
            )}
            {links.map(([key, labelKey]) => (
              <li key={key}>
                <a href={app.links![key]} target="_blank" rel="noopener noreferrer">
                  {t(labelKey)}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
