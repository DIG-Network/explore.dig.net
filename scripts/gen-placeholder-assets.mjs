// gen-placeholder-assets — maintainer tool: render clean, BRANDED placeholder art for a listing
// at the EXACT SPEC.md §4 dimensions (icon-512/1024, og 1200×630, hero 1600×900, tile 800×450)
// using headless Chromium (Playwright). Placeholders are honest brand art — app name + tagline on
// the DIG cosmic-navy gradient, lit by the app's accent — never fake screenshots (SPEC.md §4.4
// forbids placeholder screenshots; use capture-screenshots.mjs for real captures).
//
// Usage:
//   node scripts/gen-placeholder-assets.mjs <slug> [asset ...]
//     asset ∈ icon-512 | icon-1024 | og | hero | tile   (default: og hero tile icon-512)
//   node scripts/gen-placeholder-assets.mjs --store-og   (regenerate the store's own public/og.png)
//
// Reads apps/<slug>/metadata.json for name/tagline/accentColor; writes into apps/<slug>/assets/.
// Remember to record generated files in the listing's `placeholderAssets` (SPEC.md §4.4).

import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const SIZES = {
  "icon-512": { width: 512, height: 512, kind: "icon" },
  "icon-1024": { width: 1024, height: 1024, kind: "icon" },
  og: { width: 1200, height: 630, kind: "banner" },
  hero: { width: 1600, height: 900, kind: "banner" },
  tile: { width: 800, height: 450, kind: "banner" },
};

/** Shared page skeleton: DIG cosmic navy, Space Grotesk, no margins. */
function pageShell(body, extraCss = "") {
  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    @font-face { font-family: 'Space Grotesk'; src: local('Space Grotesk'); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    body { font-family: 'Space Grotesk', 'Segoe UI', system-ui, sans-serif; background: #0A0A20; }
    ${extraCss}
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=block" rel="stylesheet">
  </head><body>${body}</body></html>`;
}

/** Banner art (og / hero / tile): name + tagline on the accent-lit navy gradient. */
function bannerHtml({ name, tagline, accent, width, height, footerMark, kicker = "Chia dApp · DIG Network" }) {
  const scale = width / 1200; // design at 1200-wide, scale everything with the canvas
  return pageShell(
    `
    <div class="stage">
      <div class="glow glow-a"></div>
      <div class="glow glow-b"></div>
      <div class="grid"></div>
      <div class="copy">
        <div class="kicker">${escapeHtml(kicker)}</div>
        <h1>${escapeHtml(name)}</h1>
        <p>${escapeHtml(tagline)}</p>
      </div>
      ${footerMark ? `<div class="mark">explore<span>.dig.net</span></div>` : ""}
    </div>`,
    `
    .stage { position: relative; width: ${width}px; height: ${height}px;
      background: radial-gradient(120% 140% at 12% 0%, #131335 0%, #0A0A20 55%, #06061a 100%);
      display: flex; align-items: center; }
    .glow { position: absolute; border-radius: 50%; filter: blur(${90 * scale}px); opacity: .5; }
    .glow-a { width: ${640 * scale}px; height: ${640 * scale}px; right: ${-160 * scale}px; top: ${-220 * scale}px;
      background: ${accent}; opacity: .38; }
    .glow-b { width: ${520 * scale}px; height: ${520 * scale}px; left: ${-180 * scale}px; bottom: ${-260 * scale}px;
      background: #5800D6; opacity: .3; }
    .grid { position: absolute; inset: 0;
      background-image: linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
      background-size: ${64 * scale}px ${64 * scale}px;
      mask-image: radial-gradient(90% 90% at 30% 40%, black 0%, transparent 75%); }
    .copy { position: relative; padding: 0 ${96 * scale}px; max-width: ${1050 * scale}px; }
    .kicker { font-family: 'Space Mono', monospace; font-size: ${21 * scale}px; letter-spacing: .22em;
      text-transform: uppercase; color: ${accent}; margin-bottom: ${26 * scale}px; }
    h1 { font-size: ${104 * scale}px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.02;
      color: #F4F4FF; margin-bottom: ${28 * scale}px; }
    p { font-size: ${33 * scale}px; line-height: 1.42; color: rgba(226,226,245,.82); font-weight: 400; }
    .mark { position: absolute; right: ${56 * scale}px; bottom: ${44 * scale}px;
      font-weight: 600; font-size: ${27 * scale}px; color: #F4F4FF; }
    .mark span { color: rgba(226,226,245,.55); }
    `,
  );
}

/** Icon art: accent gradient rounded tile + bold monogram. */
function iconHtml({ name, accent, width }) {
  const initial = name.replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase() || "?";
  return pageShell(
    `
    <div class="tile">
      <div class="sheen"></div>
      <span>${escapeHtml(initial)}</span>
    </div>`,
    `
    body { background: transparent; }
    .tile { position: relative; width: ${width}px; height: ${width}px; overflow: hidden;
      background: linear-gradient(140deg, ${accent} 0%, #1A1A3E 78%, #0A0A20 100%);
      display: flex; align-items: center; justify-content: center; }
    .sheen { position: absolute; width: 130%; height: 130%; left: -40%; top: -55%; border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,.32) 0%, transparent 65%); }
    span { position: relative; font-size: ${width * 0.52}px; font-weight: 700; color: #FFFFFF;
      text-shadow: 0 ${width * 0.02}px ${width * 0.08}px rgba(0,0,0,.35); }
    `,
  );
}

/** The store's own OG card (public/og.png). */
function storeOgHtml() {
  return bannerHtml({
    name: "explore.dig.net",
    tagline: "The curated dApp store for the DIG Network — open source, on-chain, reviewed.",
    accent: "#FF00DE",
    width: 1200,
    height: 630,
    footerMark: false,
    kicker: "The dApp store · DIG Network",
  });
}

function escapeHtml(s) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function renderPng(browser, html, width, height, outPath) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: outPath, type: "png" });
  await page.close();
  console.log(`  wrote ${outPath} (${width}×${height})`);
}

async function main() {
  const args = process.argv.slice(2);
  const browser = await chromium.launch();
  try {
    if (args[0] === "--store-og") {
      await renderPng(browser, storeOgHtml(), 1200, 630, join(ROOT, "public", "og.png"));
      return;
    }
    const slug = args[0];
    if (!slug) {
      console.error("usage: node scripts/gen-placeholder-assets.mjs <slug> [asset ...] | --store-og");
      process.exit(2);
    }
    const meta = JSON.parse(readFileSync(join(ROOT, "apps", slug, "metadata.json"), "utf-8"));
    const which = args.length > 1 ? args.slice(1) : ["og", "hero", "tile", "icon-512"];
    const outDir = join(ROOT, "apps", slug, "assets");
    mkdirSync(outDir, { recursive: true });
    for (const key of which) {
      const spec = SIZES[key];
      if (!spec) {
        console.error(`unknown asset "${key}" (expected ${Object.keys(SIZES).join(" | ")})`);
        process.exit(2);
      }
      const html =
        spec.kind === "icon"
          ? iconHtml({ name: meta.name, accent: meta.accentColor, width: spec.width })
          : bannerHtml({
              name: meta.name,
              tagline: meta.tagline,
              accent: meta.accentColor,
              width: spec.width,
              height: spec.height,
              footerMark: true,
            });
      await renderPng(browser, html, spec.width, spec.height, join(outDir, `${key}.png`));
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
