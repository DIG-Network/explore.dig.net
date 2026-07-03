import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { makeApp } from "@/test/fixtures";
import { MetaPanel } from "./MetaPanel";

describe("<MetaPanel>", () => {
  it("renders the core facts: category, status, chain, date, author, tags", () => {
    const app = makeApp({ category: "payments", status: "live", tags: ["tips", "cat"] });
    renderWithIntl(<MetaPanel app={app} />);
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByTestId("status-live")).toBeInTheDocument();
    expect(screen.getByText("Chia")).toBeInTheDocument();
    expect(screen.getByText("July 1, 2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "DIG Network" })).toHaveAttribute("href", "https://dig.net");
    expect(screen.getByText("tips")).toBeInTheDocument();
  });

  it("renders license and app version only when present", () => {
    const { unmount } = renderWithIntl(<MetaPanel app={makeApp({ license: "MIT", version: "1.2.3" })} />);
    expect(screen.getByText("MIT")).toBeInTheDocument();
    expect(screen.getByText("1.2.3")).toBeInTheDocument();
    unmount();
    renderWithIntl(<MetaPanel app={makeApp()} />);
    expect(screen.queryByText("License")).toBeNull();
    expect(screen.queryByText("App version")).toBeNull();
  });

  it("renders the author as plain text when no author url exists", () => {
    renderWithIntl(<MetaPanel app={makeApp({ author: { name: "Solo Dev" } })} />);
    expect(screen.getByText("Solo Dev")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Solo Dev" })).toBeNull();
  });

  it("renders only the extra links the listing declares", () => {
    renderWithIntl(<MetaPanel app={makeApp({ links: { docs: "https://docs.example/", discord: "https://discord.gg/x" } })} />);
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "https://docs.example/");
    expect(screen.getByRole("link", { name: "Discord" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "YouTube" })).toBeNull();
    // Website + GitHub are always present.
    expect(screen.getByRole("link", { name: "Website" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toBeInTheDocument();
  });
});
