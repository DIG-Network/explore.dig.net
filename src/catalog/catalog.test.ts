// Unit tests for the catalog read-side helpers (filter/search/lookup/accent) — the pure logic the
// whole store UI is built on.

import { describe, expect, it } from "vitest";
import {
  accentGlow,
  appBySlug,
  featuredApps,
  filterApps,
  hexToRgb,
  loadCatalog,
  matchesQuery,
  normalizeQuery,
  presentCategories,
} from "./catalog";
import { CATEGORIES } from "./types";
import { makeApp } from "@/test/fixtures";

describe("loadCatalog", () => {
  it("returns the build-generated catalog with at least the three seed apps", () => {
    const catalog = loadCatalog();
    expect(catalog.count).toBeGreaterThanOrEqual(3);
    expect(catalog.apps.map((a) => a.slug)).toEqual(
      expect.arrayContaining(["xchtip", "xchannuity", "cxch"]),
    );
    expect(catalog.siteUrl).toBe("https://explore.dig.net");
  });

  it("orders featured apps before non-featured ones", () => {
    const { apps } = loadCatalog();
    const firstNonFeatured = apps.findIndex((a) => !a.featured);
    if (firstNonFeatured !== -1) {
      for (const later of apps.slice(firstNonFeatured)) {
        expect(later.featured).toBe(false);
      }
    }
  });
});

describe("normalizeQuery", () => {
  it("trims and lowercases", () => {
    expect(normalizeQuery("  TIPs  ")).toBe("tips");
  });
  it("keeps the empty query empty", () => {
    expect(normalizeQuery("   ")).toBe("");
  });
});

describe("matchesQuery", () => {
  const app = makeApp({ name: "Tipper", tagline: "Send tips on Chia", tags: ["tips", "payments"] });

  it("matches everything on the empty query", () => {
    expect(matchesQuery(app, "")).toBe(true);
  });
  it("matches name, tagline, and tags case-insensitively", () => {
    expect(matchesQuery(app, "tipper")).toBe(true);
    expect(matchesQuery(app, "chia")).toBe(true);
    expect(matchesQuery(app, "payments")).toBe(true);
  });
  it("requires EVERY term to match (AND semantics)", () => {
    expect(matchesQuery(app, "tips chia")).toBe(true);
    expect(matchesQuery(app, "tips zebra")).toBe(false);
  });
  it("rejects a non-matching query", () => {
    expect(matchesQuery(app, "annuity")).toBe(false);
  });
});

describe("filterApps", () => {
  const apps = [
    makeApp({ slug: "a", name: "Alpha Pay", category: "payments", tags: ["pay"] }),
    makeApp({ slug: "b", name: "Beta Vault", category: "defi", tags: ["vault"] }),
    makeApp({ slug: "c", name: "Gamma Pay", category: "payments", tags: ["tips"] }),
  ];

  it("returns all apps for the default filter", () => {
    expect(filterApps(apps, { category: "all", query: "" })).toHaveLength(3);
  });
  it("filters by category", () => {
    expect(filterApps(apps, { category: "defi", query: "" }).map((a) => a.slug)).toEqual(["b"]);
  });
  it("combines category and query", () => {
    expect(filterApps(apps, { category: "payments", query: "gamma" }).map((a) => a.slug)).toEqual(["c"]);
  });
  it("preserves input order", () => {
    expect(filterApps(apps, { category: "payments", query: "" }).map((a) => a.slug)).toEqual(["a", "c"]);
  });
});

describe("featuredApps / appBySlug", () => {
  const apps = [
    makeApp({ slug: "plain" }),
    makeApp({ slug: "star", featured: true }),
  ];

  it("returns only featured apps", () => {
    expect(featuredApps(apps).map((a) => a.slug)).toEqual(["star"]);
  });
  it("finds an app by slug", () => {
    expect(appBySlug(apps, "plain")?.slug).toBe("plain");
  });
  it("returns undefined for an unknown slug", () => {
    expect(appBySlug(apps, "nope")).toBeUndefined();
  });
});

describe("presentCategories", () => {
  it("returns the distinct categories present, in CATEGORIES (schema) order", () => {
    const apps = [
      makeApp({ slug: "a", category: "tools" }),
      makeApp({ slug: "b", category: "payments" }),
      makeApp({ slug: "c", category: "defi" }),
      makeApp({ slug: "d", category: "defi" }),
    ];
    // CATEGORIES order is payments → defi → … → tools (NOT alphabetical: defi would sort first).
    expect(presentCategories(apps)).toEqual(["payments", "defi", "tools"]);
    expect(CATEGORIES.indexOf("payments")).toBeLessThan(CATEGORIES.indexOf("defi"));
  });
  it("is empty for an empty catalog", () => {
    expect(presentCategories([])).toEqual([]);
  });
});

describe("hexToRgb / accentGlow", () => {
  it("parses a 6-digit hex color", () => {
    expect(hexToRgb("#3fb950")).toEqual({ r: 0x3f, g: 0xb9, b: 0x50 });
  });
  it("returns null on malformed input", () => {
    expect(hexToRgb("#fff")).toBeNull();
    expect(hexToRgb("3fb950")).toBeNull();
    expect(hexToRgb("#zzzzzz")).toBeNull();
  });
  it("renders an rgba() glow from the accent", () => {
    expect(accentGlow("#ff0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)");
  });
  it("falls back to DIG violet on a malformed accent", () => {
    expect(accentGlow("nope", 0.3)).toBe("rgba(88, 0, 214, 0.3)");
  });
});
