import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import { makeApp } from "@/test/fixtures";
import { filterFromSearch, HomePage, searchFromFilter } from "./HomePage";

const APPS = [
  makeApp({ slug: "tip", name: "Tipper", category: "payments", tags: ["tips"], featured: true }),
  makeApp({ slug: "vault", name: "Vault", category: "defi", tags: ["vault"] }),
  makeApp({ slug: "mint", name: "Minty", category: "nft", tags: ["mint"] }),
];

describe("filterFromSearch", () => {
  it("parses category and q from the URL", () => {
    expect(filterFromSearch("?category=defi&q=vault")).toEqual({ category: "defi", query: "vault" });
  });
  it("falls back to all on a bogus category", () => {
    expect(filterFromSearch("?category=bogus")).toEqual({ category: "all", query: "" });
  });
  it("defaults cleanly on an empty search", () => {
    expect(filterFromSearch("")).toEqual({ category: "all", query: "" });
  });
});

describe("searchFromFilter", () => {
  it("serializes non-default state", () => {
    expect(searchFromFilter("defi", "va")).toBe("?category=defi&q=va");
  });
  it("returns the empty string for the default state", () => {
    expect(searchFromFilter("all", " ")).toBe("");
  });
});

describe("<HomePage>", () => {
  it("renders the hero, the featured shelf, and every app with a live count", () => {
    renderWithIntl(<HomePage apps={APPS} search="" />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("featured-tip")).toBeInTheDocument();
    expect(screen.getByTestId("app-grid").querySelectorAll(".app-card")).toHaveLength(3);
    expect(screen.getByTestId("apps-count")).toHaveTextContent("3 apps");
  });

  it("filters by category chip", async () => {
    const user = userEvent.setup();
    renderWithIntl(<HomePage apps={APPS} search="" />);
    await user.click(screen.getByTestId("category-defi"));
    expect(screen.getByTestId("apps-count")).toHaveTextContent("1 app");
    expect(screen.getByTestId("app-card-vault")).toBeInTheDocument();
    expect(screen.queryByTestId("app-card-tip")).toBeNull();
  });

  it("filters by search text and mirrors the filter into the URL", async () => {
    const user = userEvent.setup();
    renderWithIntl(<HomePage apps={APPS} search="" />);
    await user.type(screen.getByTestId("search-input"), "minty");
    expect(screen.getByTestId("apps-count")).toHaveTextContent("1 app");
    expect(window.location.search).toBe("?q=minty");
  });

  it("initializes the filter from the URL search string", () => {
    renderWithIntl(<HomePage apps={APPS} search="?category=nft" />);
    expect(screen.getByTestId("apps-count")).toHaveTextContent("1 app");
    expect(screen.getByTestId("app-card-mint")).toBeInTheDocument();
  });

  it("shows a real empty state with a working reset", async () => {
    const user = userEvent.setup();
    renderWithIntl(<HomePage apps={APPS} search="" />);
    await user.type(screen.getByTestId("search-input"), "zzz-no-match");
    const empty = screen.getByTestId("empty-state");
    await user.click(within(empty).getByRole("button", { name: "Clear filters" }));
    expect(screen.getByTestId("apps-count")).toHaveTextContent("3 apps");
  });
});
