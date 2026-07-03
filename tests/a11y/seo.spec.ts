// SEO + machine-consumption contract over the BUILT output (§6.6): per-page head tags, JSON-LD,
// the agent files (llms.txt / sitemap.xml / robots.txt / catalog.json), and the §6.7 version
// exposure (meta tag + window global + on-page display).

import { expect, test } from "@playwright/test";

test.describe("home page head", () => {
  test("title, description, canonical, OG/Twitter, WebSite + ItemList JSON-LD", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/explore\.dig\.net/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{40,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://explore.dig.net/");
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /og\.png$/);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    // The icon set: SVG favicon + apple-touch-icon + manifest (PNG icons for home screens).
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/apple-touch-icon.png");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/site.webmanifest");
    const ldBlocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = ldBlocks.map((s) => (JSON.parse(s) as { "@type": string })["@type"]);
    expect(types).toContain("WebSite");
    expect(types).toContain("ItemList");
  });
});

test.describe("app detail head (prerendered)", () => {
  test("per-app title, canonical, OG image, SoftwareApplication JSON-LD", async ({ page }) => {
    // The trailing-slash form maps straight to dist/app/xchtip/index.html under `vite preview`;
    // in production a CloudFront function rewrites the extensionless /app/xchtip to the same
    // prerendered object (verified against the live site, see runbooks/deploy.md).
    await page.goto("/app/xchtip/");
    await expect(page).toHaveTitle(/xchtip\.app/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://explore.dig.net/app/xchtip",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://explore.dig.net/catalog/xchtip/og.png",
    );
    const ld = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').first().textContent()) ?? "{}",
    ) as { "@type": string; name: string };
    expect(ld["@type"]).toBe("SoftwareApplication");
    expect(ld.name).toBe("xchtip.app");
  });

  test("each app page unfurls its OWN card, never the generic store card", async ({ page }) => {
    await page.goto("/app/chia-offer/");
    await expect(page).toHaveTitle(/Chia-Offer/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://explore.dig.net/catalog/chia-offer/og.png",
    );
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", /Chia-Offer/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://explore.dig.net/app/chia-offer",
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  });
});

test.describe("agent files", () => {
  test("llms.txt maps the store and lists every app", async ({ request }) => {
    const res = await request.get("/llms.txt");
    expect(res.ok()).toBe(true);
    const txt = await res.text();
    expect(txt).toContain("# explore.dig.net");
    expect(txt).toContain("/catalog.json");
    expect(txt).toContain("/app/xchtip");
    expect(txt).toContain("/app/xchannuity");
    expect(txt).toContain("/app/cxch");
    expect(txt).toContain("/app/chia-offer");
  });

  test("catalog.json is the full machine catalog", async ({ request }) => {
    const res = await request.get("/catalog.json");
    expect(res.ok()).toBe(true);
    const catalog = (await res.json()) as { count: number; apps: Array<{ slug: string; assets: { icon: string } }> };
    expect(catalog.count).toBeGreaterThanOrEqual(4);
    for (const app of catalog.apps) {
      const icon = await request.get(app.assets.icon);
      expect(icon.ok(), `${app.slug} icon missing`).toBe(true);
    }
  });

  test("sitemap.xml + robots.txt are present and coherent", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).toContain("https://explore.dig.net/app/xchtip");
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBe(true);
    expect(await robots.text()).toContain("Sitemap: https://explore.dig.net/sitemap.xml");
  });
});

test.describe("version exposure (§6.7)", () => {
  test("meta tag + window global + on-page display all carry the build semver", async ({ page }) => {
    await page.goto("/");
    const meta = page.locator('meta[name="app-version"]');
    await expect(meta).toHaveAttribute("content", /^\d+\.\d+\.\d+/);
    const globalVersion = await page.evaluate(
      () => (window as typeof window & { __APP_VERSION__?: string }).__APP_VERSION__,
    );
    expect(globalVersion).toMatch(/^\d+\.\d+\.\d+/);
    await expect(page.getByTestId("app-version")).toContainText(/v\d+\.\d+\.\d+/);
  });
});
