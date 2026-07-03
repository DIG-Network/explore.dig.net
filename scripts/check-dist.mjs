// Build gate: verify the machine-facing SEO/agent files and the catalog artifacts are present in
// the build output (dist/) so a deploy never ships without them (CLAUDE.md §6.6). Fails the build
// (non-zero exit) if any is missing or empty.

import { statSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

const REQUIRED = [
  "index.html",
  "llms.txt",
  "robots.txt",
  "sitemap.xml",
  "catalog.json",
  "favicon.svg",
  "og.png",
  "site.webmanifest",
];

function main() {
  const missing = [];
  for (const rel of REQUIRED) {
    try {
      const s = statSync(join(DIST, rel));
      if (!s.isFile() || s.size === 0) missing.push(`${rel} (empty)`);
    } catch {
      missing.push(`${rel} (missing)`);
    }
  }

  // Every cataloged app must have its prerendered page + copied assets in the output.
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
  }

  if (missing.length) {
    console.error("[check-dist] build is missing required files:\n  - " + missing.join("\n  - "));
    process.exit(1);
  }
  console.log("[check-dist] OK — SEO/agent files + catalog artifacts all present in dist/.");
}

main();
