// Test fixtures — a minimal, fully-typed CatalogApp factory so component tests exercise real
// shapes without depending on the build-generated catalog's contents.

import type { CatalogApp } from "@/catalog/types";

export function makeApp(overrides: Partial<CatalogApp> = {}): CatalogApp {
  const slug = overrides.slug ?? "demo-app";
  return {
    slug,
    name: "Demo App",
    tagline: "A demo dApp for tests — does demo things on-chain.",
    description:
      "A **demo** dApp used by the unit tests. It exists to exercise the store's rendering " +
      "paths, including `code`, [links](https://example.com), and lists.\n\n## Section\n\n- one\n- two",
    category: "tools",
    tags: ["demo", "test"],
    url: "https://demo.example.com/",
    repo: "https://github.com/DIG-Network/demo",
    author: { name: "DIG Network", url: "https://dig.net" },
    chain: "chia",
    status: "live",
    featured: false,
    accentColor: "#5800d6",
    addedDate: "2026-07-01",
    assets: {
      icon: `/catalog/${slug}/icon-512.png`,
      og: `/catalog/${slug}/og.png`,
      screenshots: { desktop: [], mobile: [] },
    },
    detailUrl: `https://explore.dig.net/app/${slug}`,
    ...overrides,
  };
}
