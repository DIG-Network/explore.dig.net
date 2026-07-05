// AppTile tests — one dApp rendered as a phone-home-screen icon (#51). Two sibling links (same
// pattern as AppCard, App.tsx comment): the tile opens the dApp directly; a small "i" affordance
// opens the detail page. Neither is nested inside the other (invalid HTML + broken a11y tree).

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { makeApp } from "@/test/fixtures";
import { AppTile } from "./AppTile";

describe("<AppTile>", () => {
  it("renders the app's icon + name label", () => {
    const app = makeApp({ slug: "demo-app", name: "Demo App" });
    renderWithIntl(<AppTile app={app} />);
    expect(screen.getByTestId("app-tile-demo-app")).toBeInTheDocument();
    expect(screen.getByText("Demo App")).toBeInTheDocument();
  });

  it("tapping the tile opens the dApp directly, in a new tab", () => {
    const app = makeApp({ slug: "demo-app", name: "Demo App", url: "https://demo.example.com/" });
    renderWithIntl(<AppTile app={app} />);
    const link = screen.getByTestId("app-tile-link-demo-app");
    expect(link).toHaveAttribute("href", "https://demo.example.com/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("aria-label", "Open Demo App");
  });

  it("offers a distinguishable info affordance to the detail page (never nested inside the app link)", () => {
    const app = makeApp({ slug: "demo-app", name: "Demo App" });
    renderWithIntl(<AppTile app={app} />);
    const info = screen.getByTestId("app-tile-info-demo-app");
    expect(info.tagName).toBe("A");
    expect(info).toHaveAttribute("href", "/app/demo-app");
    expect(info).toHaveAttribute("aria-label", "View details for Demo App");
    // Sibling, not a descendant, of the app-opening link.
    const link = screen.getByTestId("app-tile-link-demo-app");
    expect(link.contains(info)).toBe(false);
    expect(info.contains(link)).toBe(false);
  });

  it("is announced as a list item for a coherent grid landmark", () => {
    const app = makeApp({ slug: "demo-app" });
    renderWithIntl(<AppTile app={app} />);
    expect(screen.getByTestId("app-tile-demo-app")).toHaveAttribute("role", "listitem");
  });
});
