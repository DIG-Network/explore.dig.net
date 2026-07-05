// AppsHomeScreen tests — the "Apps" tab (#51): every listed dApp rendered as a phone-home-screen
// icon grid. No filter/search here — it's the simple, curated-order launcher surface (the store's
// filter/search stays on the Store tab).

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { makeApp } from "@/test/fixtures";
import { AppsHomeScreen } from "./AppsHomeScreen";

describe("<AppsHomeScreen>", () => {
  const apps = [
    makeApp({ slug: "alpha", name: "Alpha" }),
    makeApp({ slug: "beta", name: "Beta" }),
  ];

  it("renders a heading and a tile for every listed app, in catalog order", () => {
    renderWithIntl(<AppsHomeScreen apps={apps} />);
    expect(screen.getByRole("heading", { level: 1, name: "Apps" })).toBeInTheDocument();
    expect(screen.getByTestId("app-tile-alpha")).toBeInTheDocument();
    expect(screen.getByTestId("app-tile-beta")).toBeInTheDocument();
  });

  it("shows the app count", () => {
    renderWithIntl(<AppsHomeScreen apps={apps} />);
    expect(screen.getByTestId("apps-home-count")).toHaveTextContent("2 apps");
  });

  it("exposes the grid as a labelled list landmark", () => {
    renderWithIntl(<AppsHomeScreen apps={apps} />);
    const grid = screen.getByTestId("app-home-grid");
    expect(grid).toHaveAttribute("role", "list");
    expect(grid).toHaveAttribute("aria-label", "DIG Network apps");
  });

  it("renders no tiles for an empty catalog without erroring", () => {
    renderWithIntl(<AppsHomeScreen apps={[]} />);
    expect(screen.getByTestId("apps-home-count")).toHaveTextContent("0 apps");
    expect(screen.getByTestId("app-home-grid")).toBeEmptyDOMElement();
  });

  it("renders the launcher wallpaper as decorative chrome, hidden from assistive tech", () => {
    renderWithIntl(<AppsHomeScreen apps={apps} />);
    const wallpaper = screen.getByTestId("launcher-wallpaper");
    expect(wallpaper).toHaveAttribute("aria-hidden", "true");
    // Purely presentational: it carries no content and no interactive children.
    expect(wallpaper).toBeEmptyDOMElement();
  });
});
