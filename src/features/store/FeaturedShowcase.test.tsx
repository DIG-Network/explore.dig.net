import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { makeApp } from "@/test/fixtures";
import { FeaturedShowcase } from "./FeaturedShowcase";

describe("<FeaturedShowcase>", () => {
  it("renders nothing when there are no featured apps", () => {
    const { container } = renderWithIntl(<FeaturedShowcase apps={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a capsule per featured app with the Open dApp CTA", () => {
    const app = makeApp({ slug: "star", name: "Star", featured: true, url: "https://star.example/" });
    renderWithIntl(<FeaturedShowcase apps={[app]} />);
    expect(screen.getByTestId("featured-star")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Open dApp" });
    expect(cta).toHaveAttribute("href", "https://star.example/");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows the hero art only when the listing ships one", () => {
    const withHero = makeApp({
      slug: "hero",
      featured: true,
      assets: {
        icon: "/catalog/hero/icon-512.png",
        og: "/catalog/hero/og.png",
        hero: "/catalog/hero/hero.png",
        screenshots: { desktop: [], mobile: [] },
      },
    });
    renderWithIntl(<FeaturedShowcase apps={[withHero]} />);
    expect(document.querySelector(".featured-art img")).toHaveAttribute("src", "/catalog/hero/hero.png");
  });
});
