// catalog.ts — the SPA's read side of the store catalog: the static import of the build-generated
// catalog + the pure filtering/search/lookup helpers the store UI is built on. All helpers are
// side-effect free and exhaustively unit-tested.

import catalogJson from "./catalog.gen.json";
import { CATEGORIES, type Catalog, type CatalogApp, type Category } from "./types";

/** The build-time catalog (validated by scripts/validate-apps.mjs before it is generated). */
export function loadCatalog(): Catalog {
  return catalogJson as Catalog;
}

/** A category filter value: a concrete category or the "all" sentinel. */
export type CategoryFilter = Category | "all";

export interface StoreFilter {
  category: CategoryFilter;
  query: string;
}

/** Case/whitespace-normalize a search query. */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

/** Does `app` match the free-text query? Searches name, tagline, description, slug, and tags. */
export function matchesQuery(app: CatalogApp, normalizedQuery: string): boolean {
  if (normalizedQuery === "") return true;
  const haystack = [app.name, app.tagline, app.description, app.slug, app.category, ...app.tags]
    .join("\n")
    .toLowerCase();
  return normalizedQuery.split(/\s+/).every((term) => haystack.includes(term));
}

/** Apply the store filter (category + free text) preserving catalog order. */
export function filterApps(apps: readonly CatalogApp[], filter: StoreFilter): CatalogApp[] {
  const q = normalizeQuery(filter.query);
  return apps.filter(
    (app) => (filter.category === "all" || app.category === filter.category) && matchesQuery(app, q),
  );
}

/** The curated featured shelf (catalog order — featured apps sort first at build). */
export function featuredApps(apps: readonly CatalogApp[]): CatalogApp[] {
  return apps.filter((app) => app.featured);
}

/** Look an app up by slug (undefined when not listed). */
export function appBySlug(apps: readonly CatalogApp[], slug: string): CatalogApp | undefined {
  return apps.find((app) => app.slug === slug);
}

/** The distinct categories present in the catalog, in CATEGORIES order — drives the filter rail. */
export function presentCategories(apps: readonly CatalogApp[]): Category[] {
  const present = new Set(apps.map((app) => app.category));
  return CATEGORIES.filter((c) => present.has(c));
}

/** Parse "#rrggbb" to RGB components (null when malformed — defensive at the style boundary). */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/**
 * The app's accent as an rgba() string for the card's ambient glow (the store's signature device:
 * each card is lit by its own brand color on the dark gallery).
 */
export function accentGlow(accentColor: string, alpha: number): string {
  const rgb = hexToRgb(accentColor) ?? { r: 88, g: 0, b: 214 }; // fall back to DIG violet
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
