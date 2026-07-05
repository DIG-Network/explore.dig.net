// Tests for the build pipeline's pure functions + the SPEC listing gate (scripts/*.mjs). These are
// the store's CI content contract: if a listing or the catalog build regresses, this suite is the
// first red light. The REAL apps/ tree is validated here too, so `vitest` alone catches a
// non-conforming listing without waiting for the build.

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { readPngSize, validateApps, ASSET_RULES, SCREENSHOT_RULES } from "../../scripts/validate-apps.mjs";
import { buildCatalog, renderLlmsTxt, renderSitemap, renderStoreJson } from "../../scripts/build-catalog.mjs";
import {
  appSeoBlock,
  appsPageSeoBlock,
  homeItemListLd,
  swapSeoBlock,
} from "../../scripts/prerender-apps.mjs";
import {
  auditAppHead,
  auditAppsPageHead,
  auditHomeHead,
  auditStoreJson,
  REQUIRED_DIST_FILES,
} from "../../scripts/check-dist.mjs";
import { resolveAppVersion } from "../../scripts/resolve-app-version.mjs";

// ---------------------------------------------------------------- readPngSize

function pngHeader(width: number, height: number): Buffer {
  const buf = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
  buf.write("IHDR", 12, "ascii");
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

describe("readPngSize", () => {
  it("reads IHDR dimensions from a PNG header", () => {
    expect(readPngSize(pngHeader(512, 512))).toEqual({ width: 512, height: 512 });
  });
  it("returns null for non-PNG data", () => {
    expect(readPngSize(Buffer.from("not a png at all, sorry"))).toBeNull();
    expect(readPngSize(Buffer.alloc(4))).toBeNull();
  });
});

// ------------------------------------------------------------ the SPEC gate

describe("validateApps on the real apps/ tree", () => {
  it("every committed listing conforms to SPEC.md (schema + assets)", () => {
    const { apps, errors } = validateApps();
    expect(errors).toEqual([]);
    expect(apps.length).toBeGreaterThanOrEqual(3);
    expect(apps.map((a) => a.meta.slug).sort()).toEqual(
      expect.arrayContaining(["cxch", "xchannuity", "xchtip"]),
    );
  });

  it("the normative asset rules match SPEC.md §4 exactly", () => {
    expect(ASSET_RULES["icon-512.png"]).toMatchObject({ width: 512, height: 512, requiredToList: true });
    expect(ASSET_RULES["og.png"]).toMatchObject({ width: 1200, height: 630, requiredToList: true });
    expect(ASSET_RULES["hero.png"]).toMatchObject({ width: 1600, height: 900, requiredToFeature: true });
    expect(ASSET_RULES["tile.png"]).toMatchObject({ width: 800, height: 450 });
    expect(ASSET_RULES["icon-1024.png"]).toMatchObject({ width: 1024, height: 1024 });
    expect(SCREENSHOT_RULES.desktop).toMatchObject({ width: 1280, height: 800, minToFeature: 2 });
    expect(SCREENSHOT_RULES.mobile).toMatchObject({ width: 1080, height: 1920 });
  });
});

describe("validateApps on fixture violations", () => {
  const fixtures = mkdtempSync(join(tmpdir(), "explore-fixtures-"));
  afterAll(() => rmSync(fixtures, { recursive: true, force: true }));

  function writeApp(folder: string, meta: Record<string, unknown>) {
    const dir = join(fixtures, folder);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "metadata.json"), JSON.stringify(meta));
    return dir;
  }

  const validMeta = {
    slug: "fixture-app",
    name: "Fixture",
    tagline: "A fixture listing used by the unit tests.",
    description: "x".repeat(100),
    category: "tools",
    tags: ["fixture"],
    url: "https://fixture.example/",
    repo: "https://github.com/DIG-Network/fixture",
    author: { name: "DIG Network" },
    chain: "chia",
    status: "draft",
    featured: false,
    accentColor: "#123456",
    addedDate: "2026-07-01",
  };

  it("flags a folder whose name differs from the metadata slug", () => {
    writeApp("wrong-folder", validMeta);
    const { errors } = validateApps(fixtures);
    expect(errors.some((e) => e.includes('folder name must equal metadata slug'))).toBe(true);
    rmSync(join(fixtures, "wrong-folder"), { recursive: true, force: true });
  });

  it("flags a missing assets/ directory and schema violations", () => {
    writeApp("fixture-app", { ...validMeta, category: "not-a-category" });
    const { errors } = validateApps(fixtures);
    expect(errors.some((e) => e.includes("missing assets/ directory"))).toBe(true);
    expect(errors.some((e) => e.includes("category"))).toBe(true);
    rmSync(join(fixtures, "fixture-app"), { recursive: true, force: true });
  });

  it("flags a featured listing that is draft or missing the featured asset set", () => {
    const dir = writeApp("fixture-app", { ...validMeta, featured: true, status: "draft" });
    mkdirSync(join(dir, "assets"), { recursive: true });
    writeFileSync(join(dir, "assets", "icon-512.png"), pngHeader(512, 512));
    writeFileSync(join(dir, "assets", "og.png"), pngHeader(1200, 630));
    const { errors } = validateApps(fixtures);
    expect(errors.some((e) => e.includes('must not be status "draft"'))).toBe(true);
    expect(errors.some((e) => e.includes("hero.png: REQUIRED to feature"))).toBe(true);
    expect(errors.some((e) => e.includes("featured apps need ≥2 desktop screenshots"))).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  it("accepts a listing without a repo (repo is optional — not every dApp is open source)", () => {
    const noRepo: Record<string, unknown> = { ...validMeta };
    delete noRepo.repo;
    const dir = writeApp("fixture-app", noRepo);
    mkdirSync(join(dir, "assets"), { recursive: true });
    writeFileSync(join(dir, "assets", "icon-512.png"), pngHeader(512, 512));
    writeFileSync(join(dir, "assets", "og.png"), pngHeader(1200, 630));
    const { errors } = validateApps(fixtures);
    expect(errors).toEqual([]);
    rmSync(dir, { recursive: true, force: true });
  });

  it("flags wrong pixel dimensions and bad screenshot numbering", () => {
    const dir = writeApp("fixture-app", validMeta);
    mkdirSync(join(dir, "assets", "screenshots"), { recursive: true });
    writeFileSync(join(dir, "assets", "icon-512.png"), pngHeader(500, 500)); // wrong size
    writeFileSync(join(dir, "assets", "og.png"), pngHeader(1200, 630));
    writeFileSync(join(dir, "assets", "screenshots", "desktop-02.png"), pngHeader(1280, 800)); // gap
    const { errors } = validateApps(fixtures);
    expect(errors.some((e) => e.includes("must be exactly 512×512"))).toBe(true);
    expect(errors.some((e) => e.includes("expected desktop-01.png"))).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });
});

// ------------------------------------------------------------- buildCatalog

function fakeValidated(slug: string, extra: Record<string, unknown> = {}) {
  return {
    dir: `/x/${slug}`,
    meta: {
      slug,
      name: slug,
      tagline: `The ${slug} app.`,
      url: `https://${slug}.example/`,
      featured: false,
      addedDate: "2026-07-01",
      ...extra,
    },
    assets: { files: ["icon-512.png", "og.png"], screenshots: { desktop: [], mobile: [] } },
  };
}

describe("buildCatalog", () => {
  const opts = { generatedAt: "2026-07-03T00:00:00.000Z", storeVersion: "0.1.0" };

  it("resolves asset URLs under /catalog/<slug>/ and the site detail URL", () => {
    const catalog = buildCatalog([fakeValidated("demo")], opts);
    const app = catalog.apps[0];
    expect(app.assets).toMatchObject({ icon: "/catalog/demo/icon-512.png", og: "/catalog/demo/og.png" });
    expect(app.detailUrl).toBe("https://explore.dig.net/app/demo");
    expect(catalog.count).toBe(1);
  });

  it("sorts featured first, then newest, then by name", () => {
    const catalog = buildCatalog(
      [
        fakeValidated("older", { addedDate: "2026-01-01" }),
        fakeValidated("bfeat", { featured: true }),
        fakeValidated("newer", { addedDate: "2026-06-01" }),
        fakeValidated("afeat", { featured: true }),
      ],
      opts,
    );
    expect(catalog.apps.map((a) => a.slug)).toEqual(["afeat", "bfeat", "newer", "older"]);
  });

  it("includes optional assets only when the files exist", () => {
    const withHero = fakeValidated("h");
    withHero.assets.files.push("hero.png", "tile.png", "icon-1024.png");
    const catalog = buildCatalog([withHero, fakeValidated("plain")], opts);
    const h = catalog.apps.find((a) => a.slug === "h")!;
    const plain = catalog.apps.find((a) => a.slug === "plain")!;
    expect(h.assets).toMatchObject({ hero: "/catalog/h/hero.png", tile: "/catalog/h/tile.png", icon1024: "/catalog/h/icon-1024.png" });
    expect(plain.assets).not.toHaveProperty("hero");
  });
});

describe("renderSitemap / renderLlmsTxt", () => {
  const catalog = buildCatalog([fakeValidated("demo")], {
    generatedAt: "2026-07-03T12:00:00.000Z",
    storeVersion: "0.1.0",
  });

  it("sitemap lists home + the Apps tab + every detail page with the build date", () => {
    const xml = renderSitemap(catalog);
    expect(xml).toContain("<loc>https://explore.dig.net/</loc>");
    expect(xml).toContain("<loc>https://explore.dig.net/apps</loc>");
    expect(xml).toContain("<loc>https://explore.dig.net/app/demo</loc>");
    expect(xml).toContain("<lastmod>2026-07-03</lastmod>");
  });

  it("llms.txt maps the store for agents: catalog.json, store.json, SPEC, the Apps tab, every app", () => {
    const txt = renderLlmsTxt(catalog);
    expect(txt).toContain("https://explore.dig.net/catalog.json");
    expect(txt).toContain("https://explore.dig.net/store.json");
    expect(txt).toContain("SPEC.md");
    expect(txt).toContain("[Apps](https://explore.dig.net/apps)");
    expect(txt).toContain("[demo](https://explore.dig.net/app/demo)");
    expect(txt).toContain("Open the dApp: https://demo.example/");
  });
});

// ------------------------------------------------------------ renderStoreJson

describe("renderStoreJson (the launcher manifest)", () => {
  const catalog = buildCatalog(
    [
      fakeValidated("chia-offer", {
        name: "Chia-Offer",
        category: "tools",
        featured: true,
        accentColor: "#3aaa35",
        url: "https://chia-offer.on.dig.net/",
      }),
      fakeValidated("plain", { name: "Plain" }),
    ],
    { generatedAt: "2026-07-05T00:00:00.000Z", storeVersion: "0.5.0" },
  );

  it("carries generatedAt + version and one lean entry per catalog app (count matches)", () => {
    const store = renderStoreJson(catalog);
    expect(store.generatedAt).toBe("2026-07-05T00:00:00.000Z");
    expect(store.version).toBe("0.5.0");
    expect(store.apps).toHaveLength(catalog.apps.length);
  });

  it("every app carries a name + ABSOLUTE icon url + ABSOLUTE link", () => {
    const store = renderStoreJson(catalog);
    for (const a of store.apps) {
      expect(a.name).toBeTruthy();
      expect(a.icon).toMatch(/^https:\/\/explore\.dig\.net\/catalog\/[a-z0-9-]+\/icon-512\.png$/);
      expect(a.link).toMatch(/^https?:\/\//);
    }
  });

  it("carries category + featured, and accentColor only when present", () => {
    const store = renderStoreJson(catalog);
    const co = store.apps.find((a) => a.slug === "chia-offer")!;
    expect(co).toMatchObject({
      category: "tools",
      featured: true,
      accentColor: "#3aaa35",
      link: "https://chia-offer.on.dig.net/",
      icon: "https://explore.dig.net/catalog/chia-offer/icon-512.png",
    });
    const plain = store.apps.find((a) => a.slug === "plain")!;
    expect(plain).not.toHaveProperty("accentColor");
  });

  it("serializes to valid JSON", () => {
    const json = JSON.stringify(renderStoreJson(catalog));
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("stays in sync with catalog.json (same slugs, same order)", () => {
    const store = renderStoreJson(catalog);
    expect(store.apps.map((a) => a.slug)).toEqual(catalog.apps.map((a) => a.slug));
  });
});

// ----------------------------------------------------------- prerender-apps

describe("appSeoBlock / homeItemListLd / swapSeoBlock", () => {
  const app = {
    slug: "demo",
    name: "Demo & Co",
    tagline: 'The "demo" dApp.',
    url: "https://demo.example/",
    author: { name: "DIG Network", url: "https://dig.net" },
    assets: { og: "/catalog/demo/og.png" },
  };

  it("emits per-app title, canonical, OG image, and SoftwareApplication JSON-LD, escaped", () => {
    const block = appSeoBlock(app);
    expect(block).toContain("<title>Demo &amp; Co —");
    expect(block).toContain('<link rel="canonical" href="https://explore.dig.net/app/demo" />');
    expect(block).toContain('content="https://explore.dig.net/catalog/demo/og.png"');
    expect(block).toContain('"@type":"SoftwareApplication"');
    expect(block).toContain("&quot;demo&quot;");
    // The card is described for assistive tech + validators (og:image:alt mirrors the card copy).
    expect(block).toContain('property="og:image:alt"');
  });

  it("appsPageSeoBlock emits its own title, canonical /apps, and OG/Twitter cards (#51)", () => {
    const block = appsPageSeoBlock();
    expect(block).toContain("<title>Apps — explore.dig.net</title>");
    expect(block).toContain('<link rel="canonical" href="https://explore.dig.net/apps" />');
    expect(block).toContain('property="og:url" content="https://explore.dig.net/apps"');
    expect(block).toContain('property="og:image" content="https://explore.dig.net/og.png"');
    expect(block).toContain('name="twitter:card" content="summary_large_image"');
  });

  it("home ItemList JSON-LD enumerates the catalog in order", () => {
    const ld = homeItemListLd({ count: 2, apps: [
      { detailUrl: "https://explore.dig.net/app/a", name: "A" },
      { detailUrl: "https://explore.dig.net/app/b", name: "B" },
    ]});
    expect(ld["@type"]).toBe("ItemList");
    expect(ld.numberOfItems).toBe(2);
    expect(ld.itemListElement[1]).toMatchObject({ position: 2, url: "https://explore.dig.net/app/b" });
  });

  it("swapSeoBlock replaces exactly the marked block and throws without markers", () => {
    const html = "<head><!-- SEO:BEGIN -->OLD<!-- SEO:END --></head>";
    const out = swapSeoBlock(html, "NEW");
    expect(out).toContain("NEW");
    expect(out).not.toContain("OLD");
    expect(() => swapSeoBlock("<head></head>", "NEW")).toThrow(/SEO markers/);
  });
});

// ------------------------------------------------------------- check-dist

describe("auditHomeHead / auditAppHead (the social-card build gate)", () => {
  const homeHtml = [
    "<title>explore.dig.net — the curated dApp store for the DIG Network</title>",
    '<meta name="description" content="Discover curated decentralized apps on the DIG Network and Chia." />',
    '<link rel="canonical" href="https://explore.dig.net/" />',
    '<meta property="og:type" content="website" />',
    '<meta property="og:title" content="explore.dig.net" />',
    '<meta property="og:description" content="Discover." />',
    '<meta property="og:url" content="https://explore.dig.net/" />',
    '<meta property="og:image" content="https://explore.dig.net/og.png" />',
    '<meta property="og:image:alt" content="explore.dig.net card" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta name="twitter:title" content="explore.dig.net" />',
    '<meta name="twitter:description" content="Discover." />',
    '<meta name="twitter:image" content="https://explore.dig.net/og.png" />',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
    '<link rel="manifest" href="/site.webmanifest" />',
  ].join("\n");

  it("passes a complete home head", () => {
    expect(auditHomeHead(homeHtml)).toEqual([]);
  });

  it("reports every missing home tag by name", () => {
    const gutted = homeHtml
      .split("\n")
      .filter((l) => !l.includes("og:image") && !l.includes("twitter:card") && !l.includes("apple-touch-icon"))
      .join("\n");
    const missing = auditHomeHead(gutted);
    expect(missing.some((m) => m.includes("og:image"))).toBe(true);
    expect(missing.some((m) => m.includes("twitter:card"))).toBe(true);
    expect(missing.some((m) => m.includes("apple-touch-icon"))).toBe(true);
  });

  const app = {
    slug: "demo",
    name: "Demo",
    assets: { og: "/catalog/demo/og.png" },
    detailUrl: "https://explore.dig.net/app/demo",
  };

  it("passes an app page whose head carries the app's OWN card", () => {
    const html = [
      "<title>Demo — the demo dApp · explore.dig.net</title>",
      '<link rel="canonical" href="https://explore.dig.net/app/demo" />',
      '<meta property="og:title" content="Demo — the demo dApp" />',
      '<meta property="og:image" content="https://explore.dig.net/catalog/demo/og.png" />',
      '<meta property="og:url" content="https://explore.dig.net/app/demo" />',
      '<meta name="twitter:card" content="summary_large_image" />',
      '<meta name="twitter:image" content="https://explore.dig.net/catalog/demo/og.png" />',
    ].join("\n");
    expect(auditAppHead(html, app)).toEqual([]);
  });

  it("flags an app page that still carries the generic store card", () => {
    const html = [
      "<title>explore.dig.net</title>",
      '<link rel="canonical" href="https://explore.dig.net/" />',
      '<meta property="og:image" content="https://explore.dig.net/og.png" />',
      '<meta name="twitter:card" content="summary_large_image" />',
    ].join("\n");
    const missing = auditAppHead(html, app);
    expect(missing.some((m) => m.includes("og:image"))).toBe(true);
    expect(missing.some((m) => m.includes("canonical"))).toBe(true);
  });

  it("passes a complete Apps-tab head with its own canonical + card (#51)", () => {
    const html = [
      "<title>Apps — explore.dig.net</title>",
      '<meta name="description" content="Every DIG Network dApp, one tap away." />',
      '<link rel="canonical" href="https://explore.dig.net/apps" />',
      '<meta property="og:url" content="https://explore.dig.net/apps" />',
      '<meta name="twitter:card" content="summary_large_image" />',
    ].join("\n");
    expect(auditAppsPageHead(html)).toEqual([]);
  });

  it("flags an Apps-tab page missing its own canonical", () => {
    const missing = auditAppsPageHead("<title>Apps — explore.dig.net</title>");
    expect(missing.some((m) => m.includes("canonical"))).toBe(true);
  });

  it("the dist gate requires the full icon set + agent files (incl. store.json)", () => {
    for (const f of ["og.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "llms.txt", "sitemap.xml", "site.webmanifest", "catalog.json", "store.json"]) {
      expect(REQUIRED_DIST_FILES).toContain(f);
    }
  });
});

describe("auditStoreJson (the launcher-manifest build gate)", () => {
  const catalog = { apps: [{ slug: "a" }, { slug: "b" }] };

  it("passes a manifest with matching count + a name + absolute icon/link per app", () => {
    const store = {
      apps: [
        { slug: "a", name: "A", icon: "https://explore.dig.net/catalog/a/icon-512.png", link: "https://a.example/" },
        { slug: "b", name: "B", icon: "https://explore.dig.net/catalog/b/icon-512.png", link: "https://b.example/" },
      ],
    };
    expect(auditStoreJson(store, catalog)).toEqual([]);
  });

  it("flags a relative icon, a missing name, and a count mismatch", () => {
    const store = { apps: [{ slug: "a", icon: "/catalog/a/icon-512.png", link: "https://a.example/" }] };
    const missing = auditStoreJson(store, catalog);
    expect(missing.some((m) => m.includes("count"))).toBe(true);
    expect(missing.some((m) => m.includes("icon must be an absolute URL"))).toBe(true);
    expect(missing.some((m) => m.includes("missing name"))).toBe(true);
  });

  it("flags a relative link", () => {
    const store = {
      apps: [
        { slug: "a", name: "A", icon: "https://explore.dig.net/catalog/a/icon-512.png", link: "/open/a" },
        { slug: "b", name: "B", icon: "https://explore.dig.net/catalog/b/icon-512.png", link: "https://b.example/" },
      ],
    };
    const missing = auditStoreJson(store, catalog);
    expect(missing.some((m) => m.includes("link must be an absolute URL"))).toBe(true);
  });

  it("flags a manifest with no apps[] array", () => {
    expect(auditStoreJson({}, catalog).some((m) => m.includes("apps[]"))).toBe(true);
  });
});

// ------------------------------------------------------- resolve-app-version

describe("resolveAppVersion", () => {
  it("returns the package.json semver, optionally +git-short-sha", () => {
    expect(resolveAppVersion()).toMatch(/^\d+\.\d+\.\d+(\+[0-9a-f]+)?$/);
  });
});
