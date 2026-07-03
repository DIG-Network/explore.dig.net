// build-catalog — turns the apps/ content tree into the store's build inputs. Runs BEFORE vite
// (both `npm run dev` and `npm run build`) and always re-validates first (the SPEC gate).
//
// Outputs (all git-ignored, regenerated every build):
//   • public/catalog/<slug>/…        — each app's assets, copied verbatim (served at /catalog/…)
//   • public/catalog.json            — the machine-consumable store catalog (agents/clients)
//   • src/catalog/catalog.gen.json   — the same catalog, imported statically by the SPA
//   • public/sitemap.xml             — home + every /app/<slug> page
//   • public/llms.txt                — the LLM/agent map of the store (kept current per build)

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateApps } from "./validate-apps.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://explore.dig.net";

/** Build the catalog object from validated apps (pure — unit-testable). */
export function buildCatalog(apps, { generatedAt, storeVersion }) {
  const entries = apps.map(({ meta, assets }) => {
    const base = `/catalog/${meta.slug}`;
    const a = {
      icon: `${base}/icon-512.png`,
      og: `${base}/og.png`,
      screenshots: {
        desktop: assets.screenshots.desktop.map((f) => `${base}/screenshots/${f}`),
        mobile: assets.screenshots.mobile.map((f) => `${base}/screenshots/${f}`),
      },
    };
    if (assets.files.includes("icon-1024.png")) a.icon1024 = `${base}/icon-1024.png`;
    if (assets.files.includes("hero.png")) a.hero = `${base}/hero.png`;
    if (assets.files.includes("tile.png")) a.tile = `${base}/tile.png`;
    return { ...meta, assets: a, detailUrl: `${SITE_URL}/app/${meta.slug}` };
  });

  // Store order: featured first, then newest, then name — the curated shelf reads left→right.
  entries.sort((x, y) => {
    if (x.featured !== y.featured) return x.featured ? -1 : 1;
    if (x.addedDate !== y.addedDate) return x.addedDate < y.addedDate ? 1 : -1;
    return x.name.localeCompare(y.name);
  });

  return { generatedAt, storeVersion, siteUrl: SITE_URL, count: entries.length, apps: entries };
}

/** Render sitemap.xml — home + one entry per app detail page (pure). */
export function renderSitemap(catalog) {
  const lastmod = catalog.generatedAt.slice(0, 10);
  const urls = [
    { loc: `${SITE_URL}/`, priority: "1.0" },
    ...catalog.apps.map((a) => ({ loc: a.detailUrl, priority: "0.8" })),
  ];
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/** Render llms.txt — the agent-facing map of the store (pure). */
export function renderLlmsTxt(catalog) {
  const apps = catalog.apps
    .map((a) => `- [${a.name}](${a.detailUrl}) — ${a.tagline} Open the dApp: ${a.url}`)
    .join("\n");
  return `# explore.dig.net

> The curated dApp store for the DIG Network / Chia ecosystem. Every listing is a folder in the
> public repo (https://github.com/DIG-Network/explore.dig.net) — metadata.json + assets — validated
> against a normative submission spec (SPEC.md) in CI.

## Key pages

- [Store home](${SITE_URL}/) — featured + all apps, category filter, search
- [Machine catalog (JSON)](${SITE_URL}/catalog.json) — every listing's full metadata + asset URLs; consume this instead of scraping HTML
- [Submission spec](https://github.com/DIG-Network/explore.dig.net/blob/main/SPEC.md) — the exact metadata schema + asset checklist to get listed
- [Metadata JSON Schema](https://github.com/DIG-Network/explore.dig.net/blob/main/apps/app.schema.json)

## Listed apps (${catalog.count})

${apps}

## Notes for agents

- Per-app detail pages live at ${SITE_URL}/app/<slug> (prerendered HTML with per-app OG tags + JSON-LD SoftwareApplication).
- catalog.json is regenerated on every deploy; \`generatedAt\` records the build time.
- All chain settlement is on Chia mainnet; the store itself holds no keys and performs no spends.
`;
}

// ---- CLI entry ----
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { apps, errors } = validateApps();
  if (errors.length) {
    console.error(`[build-catalog] SPEC violations:\n  - ` + errors.join("\n  - "));
    process.exit(1);
  }

  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
  const catalog = buildCatalog(apps, {
    generatedAt: new Date().toISOString(),
    storeVersion: pkg.version,
  });

  // Copy each app's assets under public/catalog/<slug>/ (clean rebuild — no stale assets).
  const pubCatalog = join(ROOT, "public", "catalog");
  rmSync(pubCatalog, { recursive: true, force: true });
  for (const { dir, meta } of apps) {
    cpSync(join(dir, "assets"), join(pubCatalog, meta.slug), { recursive: true });
  }

  writeFileSync(join(ROOT, "public", "catalog.json"), JSON.stringify(catalog, null, 2));
  const genDir = join(ROOT, "src", "catalog");
  if (!existsSync(genDir)) mkdirSync(genDir, { recursive: true });
  writeFileSync(join(genDir, "catalog.gen.json"), JSON.stringify(catalog, null, 2));
  writeFileSync(join(ROOT, "public", "sitemap.xml"), renderSitemap(catalog));
  writeFileSync(join(ROOT, "public", "llms.txt"), renderLlmsTxt(catalog));

  console.log(`[build-catalog] OK — ${catalog.count} app(s) → catalog.json, sitemap.xml, llms.txt.`);
}
