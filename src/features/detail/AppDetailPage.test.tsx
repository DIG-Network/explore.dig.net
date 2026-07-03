import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { makeApp } from "@/test/fixtures";
import { AppDetailPage, NotFound } from "./AppDetailPage";

describe("<AppDetailPage>", () => {
  it("renders the listing: name, tagline, CTAs, description, meta panel", () => {
    const app = makeApp({ slug: "tip", name: "Tipper", url: "https://tip.example/", repo: "https://github.com/DIG-Network/tip" });
    renderWithIntl(<AppDetailPage apps={[app]} slug="tip" />);
    expect(screen.getByRole("heading", { level: 1, name: "Tipper" })).toBeInTheDocument();
    expect(screen.getByTestId("open-dapp")).toHaveAttribute("href", "https://tip.example/");
    expect(screen.getByRole("link", { name: "View source" })).toHaveAttribute("href", "https://github.com/DIG-Network/tip");
    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Details" })).toBeInTheDocument();
  });

  it("renders the hero banner only when the listing ships one", () => {
    const app = makeApp({
      slug: "h",
      assets: {
        icon: "/catalog/h/icon-512.png",
        og: "/catalog/h/og.png",
        hero: "/catalog/h/hero.png",
        screenshots: { desktop: [], mobile: [] },
      },
    });
    renderWithIntl(<AppDetailPage apps={[app]} slug="h" />);
    expect(document.querySelector(".detail-hero img")).toHaveAttribute("src", "/catalog/h/hero.png");
  });

  it("discloses placeholder artwork when the listing marks any", () => {
    const app = makeApp({ slug: "p", placeholderAssets: ["hero.png"] });
    renderWithIntl(<AppDetailPage apps={[app]} slug="p" />);
    expect(screen.getByTestId("placeholder-note")).toBeInTheDocument();
  });

  it("omits the placeholder note when all art is final", () => {
    renderWithIntl(<AppDetailPage apps={[makeApp({ slug: "f" })]} slug="f" />);
    expect(screen.queryByTestId("placeholder-note")).toBeNull();
  });

  it("renders the not-found state for an unknown slug", () => {
    renderWithIntl(<AppDetailPage apps={[makeApp()]} slug="ghost" />);
    expect(screen.getByTestId("not-found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse all apps" })).toHaveAttribute("href", "/");
  });
});

describe("<NotFound>", () => {
  it("offers the way back to the shelf", () => {
    renderWithIntl(<NotFound />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse all apps" })).toHaveAttribute("href", "/");
  });
});
