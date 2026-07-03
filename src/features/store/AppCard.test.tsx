import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { makeApp } from "@/test/fixtures";
import { AppCard } from "./AppCard";

describe("<AppCard>", () => {
  it("links the card body to the detail page", () => {
    renderWithIntl(<AppCard app={makeApp({ slug: "tipper", name: "Tipper" })} />);
    expect(screen.getByTestId("app-card-link-tipper")).toHaveAttribute("href", "/app/tipper");
    expect(screen.getByRole("heading", { level: 3, name: "Tipper" })).toBeInTheDocument();
  });

  it("funnels straight into the dApp with a direct, named Open CTA", () => {
    renderWithIntl(<AppCard app={makeApp({ slug: "tipper", name: "Tipper", url: "https://tipper.example/" })} />);
    const open = screen.getByRole("link", { name: "Open Tipper" });
    expect(open).toHaveAttribute("href", "https://tipper.example/");
    expect(open).toHaveAttribute("target", "_blank");
    expect(open).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows tagline, category chip, and status badge", () => {
    renderWithIntl(<AppCard app={makeApp({ tagline: "Does a thing on-chain nicely.", category: "defi", status: "beta" })} />);
    expect(screen.getByText("Does a thing on-chain nicely.")).toBeInTheDocument();
    expect(screen.getByText("DeFi")).toBeInTheDocument();
    expect(screen.getByTestId("status-beta")).toBeInTheDocument();
  });

  it("shows the featured chip only for featured apps", () => {
    const { unmount } = renderWithIntl(<AppCard app={makeApp({ featured: true })} />);
    expect(screen.getByText("Featured")).toBeInTheDocument();
    unmount();
    renderWithIntl(<AppCard app={makeApp({ featured: false })} />);
    expect(screen.queryByText("Featured")).toBeNull();
  });

  it("sets the accent halo custom property from the app's accent color", () => {
    renderWithIntl(<AppCard app={makeApp({ slug: "glow", accentColor: "#ff0000" })} />);
    const card = screen.getByTestId("app-card-glow");
    expect(card.style.getPropertyValue("--halo")).toBe("rgba(255, 0, 0, 0.34)");
  });
});
