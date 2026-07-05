// ViewTabs tests — the Store/Apps switcher (#51). Real navigations (<a>), the active view is
// marked via aria-current="page" so both sighted and assistive-tech users can tell which view
// they're in.

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { ViewTabs } from "./ViewTabs";

describe("<ViewTabs>", () => {
  it("renders a Store tab linking home and an Apps tab linking /apps", () => {
    renderWithIntl(<ViewTabs active="store" />);
    expect(screen.getByTestId("view-tab-store")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("view-tab-apps")).toHaveAttribute("href", "/apps");
  });

  it("honors a custom storeHref so the store stays reachable from the phone launcher", () => {
    // On phones `/` defaults to the launcher, so the Store tab must carry an explicit override
    // (?view=store) to remain reachable — App passes it through at launcher widths (#51 follow-up).
    renderWithIntl(<ViewTabs active="apps" storeHref="/?view=store" />);
    expect(screen.getByTestId("view-tab-store")).toHaveAttribute("href", "/?view=store");
    expect(screen.getByTestId("view-tab-apps")).toHaveAttribute("href", "/apps");
  });

  it("marks the Store tab current when active=store", () => {
    renderWithIntl(<ViewTabs active="store" />);
    expect(screen.getByTestId("view-tab-store")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("view-tab-apps")).not.toHaveAttribute("aria-current");
  });

  it("marks the Apps tab current when active=apps", () => {
    renderWithIntl(<ViewTabs active="apps" />);
    expect(screen.getByTestId("view-tab-apps")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("view-tab-store")).not.toHaveAttribute("aria-current");
  });

  it("is a labelled navigation landmark", () => {
    renderWithIntl(<ViewTabs active="apps" />);
    expect(screen.getByRole("navigation", { name: "Browse view" })).toBeInTheDocument();
  });
});
