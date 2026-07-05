// Type declarations for the plain-ESM build scripts the test suite exercises (the scripts are
// JavaScript by design — they run under Node before Vite/TS exist in the build). Signatures here
// mirror the exported contracts in scripts/*.mjs; keep both in sync.

declare module "*validate-apps.mjs" {
  export interface PngRule {
    width: number;
    height: number;
    maxBytes: number;
    requiredToList?: boolean;
    requiredToFeature?: boolean;
  }
  export interface FoundAssets {
    files: string[];
    screenshots: { desktop: string[]; mobile: string[] };
  }
  export interface ValidatedApp {
    dir: string;
    meta: Record<string, unknown>;
    assets: FoundAssets;
  }
  export const APPS_DIR: string;
  export const ASSET_RULES: Record<string, PngRule>;
  export const SCREENSHOT_RULES: Record<string, { width: number; height: number; maxBytes: number; max: number; minToFeature: number }>;
  export function readPngSize(buf: Uint8Array): { width: number; height: number } | null;
  export function validateApps(appsDir?: string): { apps: ValidatedApp[]; errors: string[] };
}

declare module "*build-catalog.mjs" {
  import type { ValidatedApp } from "*validate-apps.mjs";
  export interface CatalogLike {
    generatedAt: string;
    storeVersion: string;
    siteUrl: string;
    count: number;
    apps: Array<Record<string, unknown> & { slug: string; name: string; tagline: string; url: string; detailUrl: string; assets: Record<string, unknown> }>;
  }
  export function buildCatalog(
    apps: ValidatedApp[],
    opts: { generatedAt: string; storeVersion: string },
  ): CatalogLike;
  export function renderSitemap(catalog: CatalogLike): string;
  export function renderLlmsTxt(catalog: CatalogLike): string;
}

declare module "*prerender-apps.mjs" {
  export function appSeoBlock(app: Record<string, unknown>): string;
  export function appsPageSeoBlock(): string;
  export function homeItemListLd(catalog: { count: number; apps: Array<{ detailUrl: string; name: string }> }): {
    "@type": string;
    numberOfItems: number;
    itemListElement: Array<{ position: number; url: string; name: string }>;
  };
  export function swapSeoBlock(html: string, block: string): string;
}

declare module "*check-dist.mjs" {
  export const REQUIRED_DIST_FILES: readonly string[];
  export function auditHomeHead(html: string): string[];
  export function auditAppsPageHead(html: string): string[];
  export function auditAppHead(
    html: string,
    app: { slug: string; name?: string; assets: { og: string }; detailUrl: string },
  ): string[];
}

declare module "*resolve-app-version.mjs" {
  export function resolveAppVersion(): string;
}
