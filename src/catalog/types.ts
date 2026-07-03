// types.ts — the typed shape of the build-generated catalog (scripts/build-catalog.mjs). These
// mirror apps/app.schema.json (the normative source, SPEC.md §3) plus the resolved asset URLs the
// build adds. The catalog is validated at build time, so the SPA can trust these shapes.

/** The category enum — MUST stay in sync with apps/app.schema.json `category.enum`. */
export const CATEGORIES = [
  "payments",
  "defi",
  "nft",
  "gaming",
  "social",
  "storage",
  "identity",
  "infrastructure",
  "tools",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type AppStatus = "live" | "beta" | "draft";

export interface AppAuthor {
  name: string;
  url?: string;
}

export interface AppLinks {
  docs?: string;
  discord?: string;
  x?: string;
  youtube?: string;
  blog?: string;
}

/** Resolved public URLs for one app's assets (paths under /catalog/<slug>/). */
export interface AppAssets {
  icon: string;
  og: string;
  icon1024?: string;
  hero?: string;
  tile?: string;
  screenshots: {
    desktop: string[];
    mobile: string[];
  };
}

/** One listed dApp: the metadata contract + build-resolved asset URLs. */
export interface CatalogApp {
  slug: string;
  name: string;
  tagline: string;
  /** Markdown (the SPEC.md §3 subset) rendered by src/lib/markdown.tsx. */
  description: string;
  category: Category;
  tags: string[];
  url: string;
  repo: string;
  author: AppAuthor;
  chain: "chia";
  status: AppStatus;
  featured: boolean;
  accentColor: string;
  addedDate: string;
  version?: string;
  license?: string;
  links?: AppLinks;
  /** Assets that are branded placeholders pending final art (SPEC.md §4.4). */
  placeholderAssets?: string[];
  assets: AppAssets;
  detailUrl: string;
}

export interface Catalog {
  generatedAt: string;
  storeVersion: string;
  siteUrl: string;
  count: number;
  apps: CatalogApp[];
}
