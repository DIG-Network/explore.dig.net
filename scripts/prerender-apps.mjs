// prerender-apps — post-vite SEO pass (runs inside `npm run build`, after `vite build`).
//
// S3+CloudFront serves a static SPA, but crawlers and link unfurlers read the INITIAL HTML — so
// every public page needs its own head. This script:
//   1. writes dist/app/<slug>/index.html for every listed app — the built SPA shell with the SEO
//      block (title/description/canonical/OG/Twitter/JSON-LD) swapped for that app's own; a
//      CloudFront function rewrites the extensionless /app/<slug> request to this object;
//   2. writes dist/apps/index.html — the Apps home-screen tab's own SEO head (#51); a CloudFront
//      function rewrites the extensionless /apps request to this object;
//   3. injects the store-wide ItemList JSON-LD into dist/index.html so the home page's structured
//      data enumerates the catalog.
//
// index.html carries `<!-- SEO:BEGIN -->…<!-- SEO:END -->` markers around the swappable block.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://explore.dig.net";

const esc = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/** The per-app SEO head block (pure — unit-testable). */
export function appSeoBlock(app) {
  const title = `${app.name} — ${app.tagline}`;
  const pageUrl = `${SITE_URL}/app/${app.slug}`;
  const ogImage = `${SITE_URL}${app.assets.og}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    url: app.url,
    applicationCategory: "WebApplication",
    operatingSystem: "Web",
    description: app.tagline,
    image: ogImage,
    author: { "@type": "Organization", name: app.author.name, ...(app.author.url ? { url: app.author.url } : {}) },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  return [
    `<title>${esc(title)} · explore.dig.net</title>`,
    `<meta name="description" content="${esc(app.tagline)}" />`,
    `<link rel="canonical" href="${pageUrl}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="explore.dig.net" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(app.tagline)}" />`,
    `<meta property="og:url" content="${pageUrl}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(app.tagline)}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    `<meta name="twitter:image:alt" content="${esc(title)}" />`,
    `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
  ].join("\n    ");
}

/**
 * The Apps home-screen tab's SEO head block (#51, pure — unit-testable). It carries its own
 * title/canonical rather than the generic store card, so sharing /apps unfurls the right page.
 */
export function appsPageSeoBlock() {
  const title = "Apps — explore.dig.net";
  const description =
    "Every DIG Network dApp, one tap away — a phone-home-screen icon grid for browsing and " +
    "launching dApps built on DIG Network and Chia.";
  const pageUrl = `${SITE_URL}/apps`;
  const ogImage = `${SITE_URL}/og.png`;
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${pageUrl}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="explore.dig.net" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${pageUrl}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    `<meta name="twitter:image:alt" content="${esc(title)}" />`,
  ].join("\n    ");
}

/** The home page's ItemList JSON-LD (pure — unit-testable). */
export function homeItemListLd(catalog) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "explore.dig.net — DIG Network dApp store",
    numberOfItems: catalog.count,
    itemListElement: catalog.apps.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: a.detailUrl,
      name: a.name,
    })),
  };
}

export function swapSeoBlock(html, block) {
  const begin = "<!-- SEO:BEGIN -->";
  const end = "<!-- SEO:END -->";
  const i = html.indexOf(begin);
  const j = html.indexOf(end);
  if (i === -1 || j === -1) throw new Error("SEO markers missing from built index.html");
  return html.slice(0, i + begin.length) + "\n    " + block + "\n    " + html.slice(j);
}

// ---- CLI entry ----
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const catalog = JSON.parse(readFileSync(join(ROOT, "public", "catalog.json"), "utf-8"));
  const shell = readFileSync(join(ROOT, "dist", "index.html"), "utf-8");

  for (const app of catalog.apps) {
    const outDir = join(ROOT, "dist", "app", app.slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), swapSeoBlock(shell, appSeoBlock(app)));
  }

  // The Apps home-screen tab (#51) gets its own prerendered page + card, same as a per-app page.
  const appsOutDir = join(ROOT, "dist", "apps");
  mkdirSync(appsOutDir, { recursive: true });
  writeFileSync(join(appsOutDir, "index.html"), swapSeoBlock(shell, appsPageSeoBlock()));

  // Home: append the ItemList JSON-LD alongside the static WebSite block.
  const itemList = `<script type="application/ld+json">${JSON.stringify(homeItemListLd(catalog))}</script>`;
  writeFileSync(join(ROOT, "dist", "index.html"), shell.replace("</head>", `    ${itemList}\n  </head>`));

  console.log(`[prerender-apps] OK — ${catalog.count} app page(s) + the Apps tab + home ItemList JSON-LD.`);
}
