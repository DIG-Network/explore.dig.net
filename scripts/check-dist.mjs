// Build gate: verify the machine-facing SEO/agent files, the icon set, and the social-card
// contract are present and correct in the build output (dist/) so a deploy never ships without
// them (CLAUDE.md §6.6). Checks, and fails the build (non-zero exit) on any violation:
//   1. required files exist and are non-empty (agent files + the full favicon/OG icon set);
//   2. the HOME page head carries the complete social/OG set (title/description/canonical/OG/
//      Twitter/apple-touch-icon/manifest) — auditHomeHead;
//   3. EVERY prerendered app page's head carries that app's OWN card (its canonical + its own
//      og.png, never the generic store card) — auditAppHead;
//   4. every OG image in the output (store + per-app) is exactly 1200×630.
//
// The audit helpers are pure (string in → missing[] out) and exported for the unit suite.

import { statSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readPngSize } from "./validate-apps.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SITE_URL = "https://explore.dig.net";

/** Files every deploy MUST ship (agent files + the store's icon/OG set). */
export const REQUIRED_DIST_FILES = Object.freeze([
  "index.html",
  "llms.txt",
  "robots.txt",
  "sitemap.xml",
  "catalog.json",
  "favicon.svg",
  "og.png",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "site.webmanifest",
]);

/** The home head's mandatory tags: [label, matcher]. Substring matching over the built HTML is
 *  deliberate — the prerenderer emits these tags verbatim, so a full HTML parser adds nothing. */
const HOME_HEAD_TAGS = [
  ["<title>", /<title>[^<]{10,}<\/title>/],
  // \s+ between attributes: the source formats long tags across lines.
  ["meta description", /<meta\s+name="description"\s+content="[^"]{40,}"/],
  ["canonical", new RegExp(`<link rel="canonical" href="${SITE_URL}/"`)],
  ["og:type", /property="og:type"/],
  ["og:title", /property="og:title"/],
  ["og:description", /property="og:description"/],
  ["og:url", /property="og:url"/],
  ["og:image", /property="og:image" content="[^"]+og\.png"/],
  ["og:image:alt", /property="og:image:alt"/],
  ["twitter:card summary_large_image", /name="twitter:card" content="summary_large_image"/],
  ["twitter:title", /name="twitter:title"/],
  ["twitter:description", /name="twitter:description"/],
  ["twitter:image", /name="twitter:image"/],
  ["apple-touch-icon link", /rel="apple-touch-icon"/],
  ["manifest link", /rel="manifest"/],
];

/** Audit the built home page's head. Returns the missing tags' labels ([] when complete). */
export function auditHomeHead(html) {
  return HOME_HEAD_TAGS.filter(([, re]) => !re.test(html)).map(([label]) => `home: missing ${label}`);
}

/** The Apps home-screen tab's (#51) mandatory head tags — its own canonical + card, not home's. */
const APPS_PAGE_HEAD_TAGS = [
  ["<title>", /<title>[^<]{5,}<\/title>/],
  ["meta description", /<meta\s+name="description"\s+content="[^"]{20,}"/],
  ["canonical = /apps", new RegExp(`<link rel="canonical" href="${SITE_URL}/apps"`)],
  ["og:url = /apps", new RegExp(`property="og:url" content="${SITE_URL}/apps"`)],
  ["twitter:card summary_large_image", /name="twitter:card" content="summary_large_image"/],
];

/** Audit the built Apps tab's head (#51). Returns the missing tags' labels ([] when complete). */
export function auditAppsPageHead(html) {
  return APPS_PAGE_HEAD_TAGS.filter(([, re]) => !re.test(html)).map(([label]) => `apps: missing ${label}`);
}

/**
 * Audit one prerendered app page's head: it must carry the app's OWN social card — its canonical
 * detail URL and its own og image — plus a large-image Twitter card. Returns missing[] labels.
 */
export function auditAppHead(html, app) {
  const ogUrl = `${SITE_URL}${app.assets.og}`;
  const checks = [
    ["canonical = detailUrl", html.includes(`<link rel="canonical" href="${app.detailUrl}"`)],
    ["og:image = the app's own og.png", html.includes(`property="og:image" content="${ogUrl}"`)],
    ["og:url = detailUrl", html.includes(`property="og:url" content="${app.detailUrl}"`)],
    ["twitter:card summary_large_image", /name="twitter:card" content="summary_large_image"/.test(html)],
    ["twitter:image = the app's own og.png", html.includes(`name="twitter:image" content="${ogUrl}"`)],
  ];
  return checks.filter(([, ok]) => !ok).map(([label]) => `app/${app.slug}: missing ${label}`);
}

function checkOgDimensions(relPath, missing) {
  try {
    const size = readPngSize(readFileSync(join(DIST, relPath)));
    if (!size || size.width !== 1200 || size.height !== 630) {
      missing.push(`${relPath} (must be 1200×630, got ${size ? `${size.width}×${size.height}` : "non-PNG"})`);
    }
  } catch {
    missing.push(`${relPath} (missing)`);
  }
}

function main() {
  const missing = [];
  for (const rel of REQUIRED_DIST_FILES) {
    try {
      const s = statSync(join(DIST, rel));
      if (!s.isFile() || s.size === 0) missing.push(`${rel} (empty)`);
    } catch {
      missing.push(`${rel} (missing)`);
    }
  }

  // The store's own social card is a real 1200×630.
  checkOgDimensions("og.png", missing);

  // The home page head carries the complete social/OG set.
  try {
    missing.push(...auditHomeHead(readFileSync(join(DIST, "index.html"), "utf-8")));
  } catch {
    /* index.html already reported missing above */
  }

  // The Apps home-screen tab (#51): its own prerendered page + head carrying its own card.
  try {
    const s = statSync(join(DIST, "apps", "index.html"));
    if (!s.isFile() || s.size === 0) missing.push("apps/index.html (empty)");
    else missing.push(...auditAppsPageHead(readFileSync(join(DIST, "apps", "index.html"), "utf-8")));
  } catch {
    missing.push("apps/index.html (missing)");
  }

  // Every cataloged app: prerendered page with its OWN card + copied assets + a true-size og.
  let catalog = { apps: [] };
  try {
    catalog = JSON.parse(readFileSync(join(DIST, "catalog.json"), "utf-8"));
  } catch {
    missing.push("catalog.json (unreadable)");
  }
  for (const app of catalog.apps ?? []) {
    for (const rel of [`app/${app.slug}/index.html`, `catalog/${app.slug}/icon-512.png`, `catalog/${app.slug}/og.png`]) {
      try {
        const s = statSync(join(DIST, rel));
        if (!s.isFile() || s.size === 0) missing.push(`${rel} (empty)`);
      } catch {
        missing.push(`${rel} (missing)`);
      }
    }
    checkOgDimensions(`catalog/${app.slug}/og.png`, missing);
    try {
      missing.push(...auditAppHead(readFileSync(join(DIST, "app", app.slug, "index.html"), "utf-8"), app));
    } catch {
      /* page already reported missing above */
    }
  }

  if (missing.length) {
    console.error("[check-dist] build is missing required files/tags:\n  - " + missing.join("\n  - "));
    process.exit(1);
  }
  console.log(
    `[check-dist] OK — SEO/agent files, icon set, home OG set + ${catalog.apps?.length ?? 0} per-app cards all present in dist/.`,
  );
}

// ---- CLI entry ----
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
