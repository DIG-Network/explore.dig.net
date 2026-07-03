// HomePage — the store front: hero thesis, the featured shelf, then the filterable grid of every
// listed app. Filter state (category + free text) is owned here and MIRRORED into the URL query
// (?category=…&q=…) so a filtered view is shareable/bookmarkable; initial state comes from the URL.

import { useMemo, useState } from "react";
import type { CatalogApp } from "@/catalog/types";
import { CATEGORIES, type Category } from "@/catalog/types";
import {
  featuredApps,
  filterApps,
  presentCategories,
  type CategoryFilter,
} from "@/catalog/catalog";
import { useT } from "@/i18n/useT";
import { FeaturedShowcase } from "./FeaturedShowcase";
import { FilterBar } from "./FilterBar";
import { AppCard } from "./AppCard";

/** Parse the initial filter state from a URL search string (pure — unit-tested). */
export function filterFromSearch(search: string): { category: CategoryFilter; query: string } {
  const params = new URLSearchParams(search);
  const rawCategory = params.get("category") ?? "all";
  const category: CategoryFilter = (CATEGORIES as readonly string[]).includes(rawCategory)
    ? (rawCategory as Category)
    : "all";
  return { category, query: params.get("q") ?? "" };
}

/** Serialize a filter state back to a search string ("" when everything is default). */
export function searchFromFilter(category: CategoryFilter, query: string): string {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (query.trim() !== "") params.set("q", query);
  const s = params.toString();
  return s === "" ? "" : `?${s}`;
}

function reflectInUrl(category: CategoryFilter, query: string): void {
  if (typeof history === "undefined" || typeof location === "undefined") return;
  const next = `${location.pathname}${searchFromFilter(category, query)}`;
  history.replaceState(null, "", next);
}

export interface HomePageProps {
  apps: CatalogApp[];
  /** The URL search string (defaults to the live location; injectable for tests). */
  search?: string;
}

export function HomePage({ apps, search }: HomePageProps) {
  const t = useT();
  const initial = useMemo(
    () => filterFromSearch(search ?? (typeof window !== "undefined" ? window.location.search : "")),
    [search],
  );
  const [category, setCategory] = useState<CategoryFilter>(initial.category);
  const [query, setQuery] = useState(initial.query);

  const onCategoryChange = (c: CategoryFilter) => {
    setCategory(c);
    reflectInUrl(c, query);
  };
  const onQueryChange = (q: string) => {
    setQuery(q);
    reflectInUrl(category, q);
  };

  const featured = featuredApps(apps);
  const filtered = filterApps(apps, { category, query });
  const categories = presentCategories(apps);

  return (
    <>
      <section className="hero">
        <p className="hero-kicker">{t("heroKicker")}</p>
        <h1 className="hero-title">
          {t("heroTitleLead")} <em>{t("heroTitleAccent")}</em>
        </h1>
        <p className="hero-intro">{t("heroIntro")}</p>
      </section>

      <FeaturedShowcase apps={featured} />

      <section className="all-apps" aria-labelledby="all-apps-heading">
        <div className="section-head">
          <h2 id="all-apps-heading" className="section-heading">
            {t("allAppsHeading")}
          </h2>
          <span className="apps-count" data-testid="apps-count" aria-live="polite">
            {t("appsCount", { count: filtered.length })}
          </span>
        </div>

        <FilterBar
          categories={categories}
          category={category}
          query={query}
          onCategoryChange={onCategoryChange}
          onQueryChange={onQueryChange}
        />

        {filtered.length === 0 ? (
          <div className="empty-state" data-testid="empty-state">
            <h3>{t("emptyHeading")}</h3>
            <p>{t("emptyBody")}</p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                onCategoryChange("all");
                onQueryChange("");
              }}
            >
              {t("clearFilters")}
            </button>
          </div>
        ) : (
          <div className="app-grid" data-testid="app-grid">
            {filtered.map((app) => (
              <AppCard key={app.slug} app={app} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
