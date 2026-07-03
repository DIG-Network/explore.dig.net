// capture-screenshots — maintainer tool: capture REAL screenshots of a listed dApp's LIVE site at
// the EXACT SPEC.md §4 screenshot dimensions (desktop 1280×800, mobile 1080×1920) with headless
// Chromium. Screenshots on explore.dig.net are ALWAYS real captures of the running dApp — this is
// the sanctioned way to (re)capture them.
//
// Usage:
//   node scripts/capture-screenshots.mjs <slug> [--desktop N] [--mobile N]
//     --desktop N   capture N desktop shots (default 2: top of page + one viewport down)
//     --mobile N    capture N mobile shots (default 1)
//
// Reads the app's live `url` from apps/<slug>/metadata.json; writes sequentially numbered files
// into apps/<slug>/assets/screenshots/ (desktop-01.png, …), replacing existing captures.

import { readFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// SPEC.md §4.2 exact dimensions. Mobile renders a 360×640 CSS viewport at 3× DPR → 1080×1920 px.
const DESKTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
const MOBILE = { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

function argN(args, flag, dflt) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? Math.max(0, parseInt(args[i + 1], 10)) : dflt;
}

async function settle(page) {
  await page.waitForLoadState("load");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(3500); // let wasm/wallet UIs finish their first paint
}

async function captureSeries(browser, url, contextOpts, kind, count, outDir) {
  if (count === 0) return;
  const ctx = await browser.newContext(contextOpts);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle(page);
  for (let i = 1; i <= count; i++) {
    if (i > 1) {
      // Subsequent shots scroll one viewport per shot to show more of the page; stop early if the
      // page has no more content to reveal.
      const advanced = await page.evaluate((step) => {
        const before = window.scrollY;
        window.scrollTo({ top: before + step, behavior: "instant" });
        return window.scrollY > before;
      }, contextOpts.viewport.height * 0.9);
      if (!advanced) break;
      await page.waitForTimeout(600);
    }
    const file = join(outDir, `${kind}-${String(i).padStart(2, "0")}.png`);
    await page.screenshot({ path: file, type: "png" });
    console.log(`  wrote ${file}`);
  }
  await ctx.close();
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args[0];
  if (!slug || slug.startsWith("--")) {
    console.error("usage: node scripts/capture-screenshots.mjs <slug> [--desktop N] [--mobile N]");
    process.exit(2);
  }
  const meta = JSON.parse(readFileSync(join(ROOT, "apps", slug, "metadata.json"), "utf-8"));
  const desktop = argN(args, "--desktop", 2);
  const mobile = argN(args, "--mobile", 1);
  const outDir = join(ROOT, "apps", slug, "assets", "screenshots");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  console.log(`[capture-screenshots] ${meta.name} — ${meta.url}`);
  const browser = await chromium.launch();
  try {
    await captureSeries(browser, meta.url, DESKTOP, "desktop", desktop, outDir);
    await captureSeries(browser, meta.url, MOBILE, "mobile", mobile, outDir);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
